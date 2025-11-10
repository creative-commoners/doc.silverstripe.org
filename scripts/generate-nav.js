/**
 * Generate navigation JSON files for each version
 * Creates static JSON files used by Sidebar component
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir, writeFile } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const contentDir = path.join(projectRoot, 'src', 'content', 'docs');
const versions = ['3', '4', '5', '6'];

/**
 * Build navigation hierarchy from markdown files
 */
function buildNavFromFiles(baseDir) {
  const items = {};

  try {
    if (!fs.existsSync(baseDir)) {
      console.warn(`Warning: Content directory not found at ${baseDir}`);
      return [];
    }

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Extract frontmatter
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
          const frontmatter = {};
          
          if (fmMatch) {
            const lines = fmMatch[1].split('\n');
            lines.forEach((line) => {
              const colonIdx = line.indexOf(':');
              if (colonIdx > -1) {
                const key = line.substring(0, colonIdx).trim();
                const value = line.substring(colonIdx + 1).trim();
                if (key && value) {
                  frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
                }
              }
            });
          }

          // Build path structure
          const relativePath = path.relative(baseDir, filePath);
          const parts = relativePath
            .replace(/\.(md|mdx)$/, '')
            .split(path.sep)
            .filter(p => p && p !== 'index');

          if (parts.length === 0) return; // Skip root index.md

          // Build nested structure
          let current = items;
          parts.forEach((part, idx) => {
            const displayName = frontmatter.title || 
              part
                .replace(/^\d+_/, '')
                .replace(/_/g, ' ')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            const isLast = idx === parts.length - 1;
            const key = `__item_${part}`;

            if (!current[key]) {
              current[key] = {
                title: displayName,
                path: '/en/6/' + parts.slice(0, idx + 1).join('/') + '/',
                children: {},
                order: frontmatter.order ? parseInt(frontmatter.order) : 999,
              };
            }

            if (isLast) {
              current[key].title = frontmatter.title || displayName;
              current[key].order = frontmatter.order ? parseInt(frontmatter.order) : 999;
            } else {
              current = current[key].children;
            }
          });
        }
      });
    };

    walkDir(baseDir);
  } catch (err) {
    console.error(`Error reading files from ${baseDir}:`, err.message);
    return [];
  }

  // Convert to array and sort
  const convertToArray = (obj) => {
    return Object.values(obj)
      .map(item => ({
        ...item,
        children: item.children && Object.keys(item.children).length > 0 
          ? convertToArray(item.children)
          : undefined
      }))
      .filter(item => item.children !== undefined || item.title)
      .sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
  };

  return convertToArray(items);
}

/**
 * Generate navigation data for all versions
 */
async function generateNavData() {
  console.log('Generating navigation data...');
  
  // For now, generate the same nav for all versions
  const navTree = buildNavFromFiles(contentDir);
  
  const outputDir = path.join(projectRoot, 'public', 'api', 'nav');
  await mkdir(outputDir, { recursive: true });
  
  for (const version of versions) {
    try {
      const outputPath = path.join(outputDir, `${version}.json`);
      await writeFile(outputPath, JSON.stringify(navTree, null, 2), 'utf-8');
      console.log(`✓ Generated navigation for v${version}`);
    } catch (err) {
      console.error(`✗ Failed to generate nav for v${version}:`, err.message);
    }
  }
}

generateNavData().catch(console.error);
