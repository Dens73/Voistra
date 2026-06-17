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
const builderCache = path.join(cacheRoot, 'electron-builder-runs', runId);

fs.mkdirSync(electronCache, { recursive: true });
fs.mkdirSync(builderCache, { recursive: true });

const cliPath = require.resolve('electron-builder/out/cli/cli.js', { paths: [appRoot] });
const args = [cliPath, ...process.argv.slice(2)];

function copyRuntimeConfig() {
  const sourceConfigPath = path.join(workspaceRoot, 'voistra.config.json');
  if (!fs.existsSync(sourceConfigPath)) {
    console.warn('[build-electron-dist] voistra.config.json not found at workspace root');
    return;
  }

  const outputRoot = path.join(workspaceRoot, 'release', 'voistra');
  const destinationPaths = [
    path.join(outputRoot, 'voistra.config.json'),
    path.join(outputRoot, 'win-unpacked', 'voistra.config.json'),
    path.join(outputRoot, 'win-unpacked', 'resources', 'voistra.config.json'),
    path.join(outputRoot, 'ready-for-friend', 'voistra.config.json'),
  ];

  for (const destinationPath of destinationPaths) {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourceConfigPath, destinationPath);
    console.log(`[build-electron-dist] copied config -> ${destinationPath}`);
  }
}

function copyReleaseBundle() {
  const outputRoot = path.join(workspaceRoot, 'release', 'voistra');
  const readyForFriendRoot = path.join(outputRoot, 'ready-for-friend');
  fs.mkdirSync(readyForFriendRoot, { recursive: true });

  const releaseFiles = [
    'Voistra Setup 0.1.0.exe',
    'Voistra Setup 0.1.0.exe.blockmap',
    'README.txt',
  ];

  for (const fileName of releaseFiles) {
    const sourcePath = path.join(outputRoot, fileName);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const destinationPath = path.join(readyForFriendRoot, fileName);
    fs.copyFileSync(sourcePath, destinationPath);
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
    copyRuntimeConfig();
    copyReleaseBundle();
  }

  process.exit(code ?? 1);
});
