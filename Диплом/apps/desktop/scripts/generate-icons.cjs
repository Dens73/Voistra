const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

async function main() {
  const appRoot = path.resolve(__dirname, '..');
  const sourceSvg = path.join(appRoot, 'public', 'voistra-mark.svg');
  const outputDir = path.join(appRoot, 'build-assets');
  const pngPath = path.join(outputDir, 'voistra-icon-512.png');
  const icoPath = path.join(outputDir, 'voistra-icon.ico');

  fs.mkdirSync(outputDir, { recursive: true });

  const pngBuffer = await sharp(sourceSvg)
    .resize(512, 512)
    .png()
    .toBuffer();

  await fs.promises.writeFile(pngPath, pngBuffer);

  const icoBuffer = await pngToIco([
    await sharp(sourceSvg).resize(16, 16).png().toBuffer(),
    await sharp(sourceSvg).resize(24, 24).png().toBuffer(),
    await sharp(sourceSvg).resize(32, 32).png().toBuffer(),
    await sharp(sourceSvg).resize(48, 48).png().toBuffer(),
    await sharp(sourceSvg).resize(64, 64).png().toBuffer(),
    await sharp(sourceSvg).resize(128, 128).png().toBuffer(),
    await sharp(sourceSvg).resize(256, 256).png().toBuffer(),
  ]);

  await fs.promises.writeFile(icoPath, icoBuffer);

  console.log(JSON.stringify({ pngPath, icoPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
