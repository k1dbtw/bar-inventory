import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const mark = (scale = 1) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <path d="M150 148 H362 L266 288 V372 H322 a12 12 0 0 1 0 24 H190 a12 12 0 0 1 0-24 H246 V288 Z"
      fill="#ffffff" stroke="#ffffff" stroke-width="10" stroke-linejoin="round"/>
    <path d="M186 186 H326 L256 288 Z" fill="#b06f28" opacity="0.35"/>
  </g>
`;

const icon = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e0a45f"/>
      <stop offset="100%" stop-color="#a5651f"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${mark(scale)}
</svg>`;

await mkdir("public/icons", { recursive: true });

const targets = [
  { file: "public/icons/icon-192.png", size: 192, scale: 1 },
  { file: "public/icons/icon-512.png", size: 512, scale: 1 },
  { file: "public/icons/maskable-512.png", size: 512, scale: 0.72 },
  { file: "public/apple-touch-icon.png", size: 180, scale: 1 },
];

for (const { file, size, scale } of targets) {
  await sharp(Buffer.from(icon(scale))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}

await writeFile("public/icon.svg", icon(1));
console.log("wrote public/icon.svg");
