const fs = require('node:fs');
const path = require('node:path');

const desktopRoot = path.resolve(__dirname, '..');
const targetDir = path.resolve(desktopRoot, '.runtime', 'node');
const targetExe = path.join(targetDir, 'node.exe');
const candidates = [
  process.execPath,
  'C:\\Program Files\\nodejs\\node.exe',
].filter(Boolean);

const sourceExe = candidates.find((candidate) => fs.existsSync(candidate));

if (!sourceExe) {
  throw new Error('node.exe was not found. Install Node.js or set process.execPath to node.exe before packaging.');
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourceExe, targetExe);
console.log(`Copied Node runtime: ${sourceExe} -> ${targetExe}`);
