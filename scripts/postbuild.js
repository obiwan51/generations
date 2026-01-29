import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy assets
console.log('Copying assets...');
const assetsSrc = path.join(rootDir, 'assets');
const assetsDest = path.join(distDir, 'assets');
if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, assetsDest);
}

// Copy server data
console.log('Copying server/data...');
const dataSrc = path.join(rootDir, 'server', 'data');
const dataDest = path.join(distDir, 'server', 'data');
if (fs.existsSync(dataSrc)) {
    copyDir(dataSrc, dataDest);
}

// Ensure dist/client exists (vite should have created it, but just in case)
if (!fs.existsSync(path.join(distDir, 'client'))) {
    console.warn('Warning: dist/client does not exist. Did you run vite build?');
}

console.log('Build preparation complete.');
