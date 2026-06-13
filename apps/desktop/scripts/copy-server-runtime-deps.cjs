const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const desktopRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(desktopRoot, '..', '..');
const sourceNodeModules = path.join(repoRoot, 'node_modules');
const targetNodeModules = path.join(desktopRoot, '.runtime', 'server-node_modules');

function removeDirRecursive(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function sleepSync(delayMs) {
  const sharedBuffer = new SharedArrayBuffer(4);
  const int32 = new Int32Array(sharedBuffer);
  Atomics.wait(int32, 0, 0, delayMs);
}

function copyFileWithRetry(fromFile, toFile) {
  const retryDelays = [80, 150, 250, 400, 600];
  let lastError = null;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      fs.copyFileSync(fromFile, toFile);
      return;
    } catch (error) {
      lastError = error;
      if (!error || typeof error !== 'object' || error.code !== 'EBUSY' || attempt === retryDelays.length) {
        throw error;
      }

      sleepSync(retryDelays[attempt]);
    }
  }

  throw lastError;
}

function copyDirRecursive(fromDir, toDir) {
  const stat = fs.lstatSync(fromDir);
  if (stat.isSymbolicLink()) {
    const linkTarget = fs.readlinkSync(fromDir);
    fs.symlinkSync(linkTarget, toDir, stat.isDirectory() ? 'junction' : 'file');
    return;
  }

  ensureDir(toDir);
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const fromEntry = path.join(fromDir, entry.name);
    const toEntry = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(fromEntry, toEntry);
    } else {
      ensureDir(path.dirname(toEntry));
      copyFileWithRetry(fromEntry, toEntry);
    }
  }
}

function pruneRuntimeArtifacts(targetDir) {
  const removableNamePatterns = [/\.map$/i, /\.d\.ts$/i, /\.d\.mts$/i, /^README/i, /^CHANGELOG/i, /^LICENSE/i, /^license/i];
  const removablePathFragments = [`${path.sep}typeorm${path.sep}browser${path.sep}`, `${path.sep}socket.io${path.sep}client-dist${path.sep}`];

  const stack = [targetDir];
  while (stack.length > 0) {
    const currentDir = stack.pop();
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      const shouldRemoveByName = removableNamePatterns.some((pattern) => pattern.test(entry.name));
      const shouldRemoveByPath = removablePathFragments.some((fragment) => entryPath.includes(fragment));
      if (shouldRemoveByName || shouldRemoveByPath) {
        fs.rmSync(entryPath, { force: true });
      }
    }
  }

  const removableDirectories = [path.join(targetDir, '@types')];

  for (const removableDir of removableDirectories) {
    if (fs.existsSync(removableDir)) {
      fs.rmSync(removableDir, { recursive: true, force: true });
    }
  }

  const sqlJsDistDir = path.join(targetDir, 'sql.js', 'dist');
  if (fs.existsSync(sqlJsDistDir)) {
    const sourceSqlJsDistDir = path.join(sourceNodeModules, 'sql.js', 'dist');
    const sqlJsKeep = ['sql-wasm.js', 'sql-wasm.wasm'];
    const preservedFiles = sqlJsKeep
      .map((fileName) => ({
        fileName,
        sourcePath: path.join(sourceSqlJsDistDir, fileName),
      }))
      .filter(({ sourcePath }) => fs.existsSync(sourcePath));

    fs.rmSync(sqlJsDistDir, { recursive: true, force: true });
    ensureDir(sqlJsDistDir);

    for (const { fileName, sourcePath } of preservedFiles) {
      fs.copyFileSync(sourcePath, path.join(sqlJsDistDir, fileName));
    }
  }

  const heavyRuntimeFiles = [path.join(targetDir, 'socket.io', 'client-dist'), path.join(targetDir, 'typeorm', 'browser')];

  for (const heavyRuntimeFile of heavyRuntimeFiles) {
    if (fs.existsSync(heavyRuntimeFile)) {
      fs.rmSync(heavyRuntimeFile, { recursive: true, force: true });
    }
  }
}

function normalizeRelativeNodeModulesPath(fullPath) {
  return path.relative(sourceNodeModules, fullPath);
}

const result =
  process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm ls --omit=dev --parseable --all --workspace @diplom/server'], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      })
    : spawnSync('npm', ['ls', '--omit=dev', '--parseable', '--all', '--workspace', '@diplom/server'], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      });

if (!result.stdout || !result.stdout.trim()) {
  throw new Error(result.stderr || result.stdout || 'Failed to resolve server production dependencies');
}

const dependencyPaths = result.stdout
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((fullPath) => fullPath.startsWith(sourceNodeModules))
  .filter((fullPath) => !fullPath.includes(`${path.sep}@diplom${path.sep}server`));

removeDirRecursive(targetNodeModules);
ensureDir(targetNodeModules);

const copied = new Set();
for (const dependencyPath of dependencyPaths) {
  const relativePath = normalizeRelativeNodeModulesPath(dependencyPath);
  if (!relativePath || copied.has(relativePath)) {
    continue;
  }

  copied.add(relativePath);
  copyDirRecursive(dependencyPath, path.join(targetNodeModules, relativePath));
}

pruneRuntimeArtifacts(targetNodeModules);

console.log(`Copied ${copied.size} server production dependencies to ${targetNodeModules}`);
