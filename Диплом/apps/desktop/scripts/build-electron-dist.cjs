const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
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

  process.exit(code ?? 1);
});
