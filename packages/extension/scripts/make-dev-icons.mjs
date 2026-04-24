import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

mkdirSync(join(root, "public/icons/dev"), { recursive: true });

for (const size of [16, 48, 128]) {
  const stroke = Math.max(2, Math.round(size / 8));
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect x="${stroke / 2}" y="${stroke / 2}"
            width="${size - stroke}" height="${size - stroke}"
            fill="none" stroke="#f97316" stroke-width="${stroke}"/>
    </svg>`
  );

  await sharp(join(root, `public/icons/icon${size}.png`))
    .composite([{ input: overlay, blend: "over" }])
    .toFile(join(root, `public/icons/dev/icon${size}.png`));

  console.log(`  ✓ icon${size}.png`);
}
