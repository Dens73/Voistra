const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = process.env.DIPLOM_ROOT ? path.resolve(process.env.DIPLOM_ROOT) : process.cwd();
const node = process.execPath;

const targets = {
  server: {
    command: node,
    args: ['dist/main.js'],
    cwd: path.join(root, 'apps/server'),
    log: 'server-run.log',
    err: 'server-run.err.log',
  },
  renderer: {
    command: node,
    args: [path.join(root, 'scripts/vite-dev.cjs')],
    cwd: root,
    log: 'renderer-run.log',
    err: 'renderer-run.err.log',
  },
  electron: {
    command: node,
    args: [path.join(root, 'node_modules/electron/cli.js'), 'dist-electron/main.js'],
    cwd: path.join(root, 'apps/desktop'),
    env: {
      VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173',
    },
    log: 'electron-run.log',
    err: 'electron-run.err.log',
  },
};

const name = process.argv[2];
const target = targets[name];

if (!target) {
  console.error(`Unknown target: ${name}`);
  process.exit(1);
}

const out = fs.openSync(path.join(root, target.log), 'a');
const err = fs.openSync(path.join(root, target.err), 'a');
const child = spawn(target.command, target.args, {
  cwd: target.cwd,
  detached: true,
  stdio: ['ignore', out, err],
  env: {
    ...process.env,
    ...(target.env ?? {}),
  },
});

child.unref();
console.log(`${name}:${child.pid}`);
