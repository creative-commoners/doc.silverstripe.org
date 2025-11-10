import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '../src/content/docs');
const outputFile = path.join(__dirname, '../public/slug-map.json');

const slugMap = {};
const allSlugs = [];

function normalizePathPart(name) {
  return name
    .replace(/^\d+_/, '')
    .toLowerCase();
}

function walkDir(dir, parentPath = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('_')) {
      const dirSlug = parentPath ? parentPath + '/' + file : file;
      walkDir(fullPath, dirSlug);
    } else if (file.endsWith('.md') && !file.startsWith('_')) {
      // Build slug from file
      const fileSlug = file.replace(/\.md$/, '').replace(/^index$/, '');
      const fullSlug = parentPath ? (fileSlug ? parentPath + '/' + fileSlug : parentPath) : fileSlug;
      
      // Track all slugs for reverse lookups
      allSlugs.push({
        slug: fullSlug,
        normalized: fullSlug.split('/').map(normalizePathPart).join('/')
      });
      
      // Create mapping: normalized name → full slug
      const normalized = file
        .replace(/\.md$/, '')
        .replace(/^index$/, '')
        .replace(/^\d+_/, '')
        .toLowerCase();
      
      if (normalized && parentPath) {
        const key = `${parentPath}|${normalized}`;
        slugMap[key] = fullSlug;
      }
    }
  });
}

walkDir(docsDir);

// Add reverse mappings: normalized paths → full slug (for root-relative links)
for (const { slug, normalized } of allSlugs) {
  // Add the normalized path as a direct mapping
  slugMap[normalized] = slug;
}

// Ensure public directory exists
if (!fs.existsSync(path.dirname(outputFile))) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(slugMap, null, 2));
console.log(`✓ Generated slug map with ${Object.keys(slugMap).length} entries (${allSlugs.length} unique slugs)`);

