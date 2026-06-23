const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(appRoot, '..', '..');
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const cacheRoot = process.env.VOISTRA_BUILDER_ROOT
  ? path.resolve(process.env.VOISTRA_BUILDER_ROOT)
  : path.join(appRoot, '.cache');
const electronCache = path.join(cacheRoot, 'electron');
const builderCache = path.join(cacheRoot, 'electron-builder');
const runCacheRoot = path.join(cacheRoot, 'electron-builder-runs', runId);
const stagingOutputRoot = path.join(runCacheRoot, 'artifacts');
const finalOutputRoot = path.join(workspaceRoot, 'release', 'voistra');

fs.mkdirSync(electronCache, { recursive: true });
fs.mkdirSync(builderCache, { recursive: true });
fs.mkdirSync(runCacheRoot, { recursive: true });
fs.mkdirSync(stagingOutputRoot, { recursive: true });

const cliPath = require.resolve('electron-builder/out/cli/cli.js', { paths: [appRoot] });
const args = [cliPath, ...process.argv.slice(2), `--config.directories.output=${stagingOutputRoot}`];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function copyFileWithRetry(sourcePath, destinationPath, attempts = 20, delayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      if (fs.existsSync(destinationPath)) {
        fs.rmSync(destinationPath, { force: true });
      }
      fs.copyFileSync(sourcePath, destinationPath);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }
      console.warn(
        `[build-electron-dist] copy retry ${attempt}/${attempts - 1}: ${sourcePath} -> ${destinationPath}`,
        error,
      );
      sleep(delayMs);
    }
  }

  throw lastError;
}

function copyDirectory(sourceDir, destinationDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  fs.mkdirSync(destinationDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      continue;
    }

    copyFileWithRetry(sourcePath, destinationPath);
  }
}

function syncArtifactsToRelease() {
  fs.rmSync(finalOutputRoot, { recursive: true, force: true });
  fs.mkdirSync(finalOutputRoot, { recursive: true });
  copyDirectory(stagingOutputRoot, finalOutputRoot);
}

function copyRuntimeConfig() {
  const sourceConfigPath = path.join(workspaceRoot, 'voistra.config.json');
  if (!fs.existsSync(sourceConfigPath)) {
    console.warn('[build-electron-dist] voistra.config.json not found at workspace root');
    return;
  }

  const destinationPaths = [
    path.join(finalOutputRoot, 'voistra.config.json'),
    path.join(finalOutputRoot, 'win-unpacked', 'voistra.config.json'),
    path.join(finalOutputRoot, 'win-unpacked', 'resources', 'voistra.config.json'),
    path.join(finalOutputRoot, 'ready-for-friend', 'voistra.config.json'),
  ];

  for (const destinationPath of destinationPaths) {
    copyFileWithRetry(sourceConfigPath, destinationPath);
    console.log(`[build-electron-dist] copied config -> ${destinationPath}`);
  }
}

function copyReleaseBundle() {
  const readyForFriendRoot = path.join(finalOutputRoot, 'ready-for-friend');
  fs.mkdirSync(readyForFriendRoot, { recursive: true });

  const releaseFiles = [
    'Voistra Setup 0.1.0.exe',
    'Voistra Setup 0.1.0.exe.blockmap',
    'README.txt',
  ];

  for (const fileName of releaseFiles) {
    const sourcePath = path.join(finalOutputRoot, fileName);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const destinationPath = path.join(readyForFriendRoot, fileName);
    copyFileWithRetry(sourcePath, destinationPath);
    console.log(`[build-electron-dist] copied release file -> ${destinationPath}`);
  }
}

const child = spawn(process.execPath, args, {
  cwd: appRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_CACHE: electronCache,
    ELECTRON_BUILDER_CACHE: builderCache,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  if ((code ?? 1) === 0) {
    syncArtifactsToRelease();
    copyRuntimeConfig();
    copyReleaseBundle();
  }

  process.exit(code ?? 1);
});
