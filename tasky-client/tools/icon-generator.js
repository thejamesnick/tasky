import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_PATH = path.resolve(__dirname, '../../Subtract.svg');
const PUBLIC_DIR = path.resolve(__dirname, '../public');

async function generateIcons() {
    if (!fs.existsSync(SVG_PATH)) {
        console.error(`Error: SVG file not found at ${SVG_PATH}`);
        process.exit(1);
    }

    console.log('Generating icons from:', SVG_PATH);

    const sizes = [
        { name: 'pwa-192x192.png', size: 192 },
        { name: 'pwa-512x512.png', size: 512 },
        { name: 'favicon.ico', size: 64 }, // saving as png, browser handles it
        { name: 'apple-touch-icon.png', size: 180 }
    ];

    for (const icon of sizes) {
        const outputPath = path.join(PUBLIC_DIR, icon.name);
        try {
            const instance = sharp(SVG_PATH).resize(icon.size, icon.size);

            // Force PNG format for .ico extension to avoid Sharp error "Unsupported output format"
            // Browsers are happy with a PNG inside a .ico file (or just named .ico)
            if (icon.name.endsWith('.ico')) {
                instance.png();
            }

            await instance.toFile(outputPath);
            console.log(`Generated: ${icon.name}`);
        } catch (err) {
            console.error(`Error generating ${icon.name}:`, err);
        }
    }
}

generateIcons();
