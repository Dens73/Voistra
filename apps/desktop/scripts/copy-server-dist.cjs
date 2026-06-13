const fs = require('node:fs');
const path = require('node:path');

const desktopRoot = path.resolve(__dirname, '..');
const sourceDir = path.resolve(desktopRoot, '..', 'server', 'dist');
const targetDir = path.resolve(desktopRoot, 'dist-electron', 'server');

function removeDirRecursive(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function copyDirRecursive(fromDir, toDir) {
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const fromEntry = path.join(fromDir, entry.name);
    const toEntry = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(fromEntry, toEntry);
      continue;
    }
    fs.copyFileSync(fromEntry, toEntry);
  }
}

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Server dist not found: ${sourceDir}`);
}

removeDirRecursive(targetDir);
copyDirRecursive(sourceDir, targetDir);
console.log(`Copied server dist: ${sourceDir} -> ${targetDir}`);
