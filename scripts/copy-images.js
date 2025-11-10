#!/usr/bin/env node

import { cpSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '../src/content/docs');
const publicDir = resolve(__dirname, '../public');
const publicImagesDir = resolve(publicDir, '_images');

// First, copy the root _images folder
const rootImagesDir = resolve(srcDir, '_images');
try {
  cpSync(rootImagesDir, publicImagesDir, { recursive: true, force: true });
  console.log('✓ Copied root _images to public/');
} catch (err) {
  console.error('Error copying images:', err.message);
}

// Now flatten nested _images folders into the root public/_images
function flattenNestedImages(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== '_images' && !entry.name.startsWith('.')) {
      // Check if this directory has an _images subdirectory
      const nestedImagesPath = resolve(fullPath, '_images');
      try {
        const nestedStat = statSync(nestedImagesPath);
        if (nestedStat.isDirectory()) {
          // Copy files from nested _images to public/_images
          const nestedEntries = readdirSync(nestedImagesPath, { withFileTypes: true });
          for (const nestedEntry of nestedEntries) {
            const nestedFullPath = resolve(nestedImagesPath, nestedEntry.name);
            const targetPath = resolve(publicImagesDir, nestedEntry.name);
            if (nestedEntry.isFile()) {
              cpSync(nestedFullPath, targetPath, { force: true });
            } else if (nestedEntry.isDirectory()) {
              cpSync(nestedFullPath, resolve(publicImagesDir, nestedEntry.name), { recursive: true, force: true });
            }
          }
          console.log(`✓ Flattened images from ${entry.name}/_images/`);
        }
      } catch (e) {
        // Directory doesn't exist, skip
      }
      
      // Recurse into subdirectories
      flattenNestedImages(fullPath);
    }
  }
}

flattenNestedImages(srcDir);
console.log('Image copy complete!');
