import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, relative, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(__dirname, '../src/content/docs');

function fixImagePaths(dir, baseDir = contentDir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      fixImagePaths(fullPath, baseDir);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      let content = readFileSync(fullPath, 'utf-8');
      const originalContent = content;
      
      // Find the depth of this file relative to content root
      const relativeDir = relative(baseDir, dir);
      const depth = relativeDir.split('/').filter(p => p && p !== '.').length;
      
      // Replace all patterns of ../ followed by _images/ with the correct number of ../
      // Calculate: we need to go up 'depth' levels to get to content root, then no more steps to _images
      const correctDots = depth;
      const newPrefix = `](${Array(correctDots).fill('..').join('/')}\/_images/`;
      
      // Replace all image references
      content = content.replace(/\]\(\.\.\/+(_images\/)/g, newPrefix);
      
      if (content !== originalContent) {
        writeFileSync(fullPath, content, 'utf-8');
        console.log(`Fixed image paths in: ${relative(baseDir, fullPath)}`);
      }
    }
  }
}

fixImagePaths(contentDir);
console.log('Image paths fixed!');
