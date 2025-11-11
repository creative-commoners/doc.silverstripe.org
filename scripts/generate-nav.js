/**
 * Generate navigation JSON files for each version
 * Creates static JSON files used by Sidebar component
 * Reads from src/content/docs for multi-version support
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
 * Extract frontmatter from file
 */
function extractFrontmatter(content) {
  const frontmatter = {};
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
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
  
  return frontmatter;
}

/**
 * Build navigation hierarchy from markdown files in a version directory
 */
function buildNavFromVersion(versionDir, version) {
  const items = {};
  const folderTitles = {}; // Store titles from index.md files

  try {
    if (!fs.existsSync(versionDir)) {
      console.warn(`Warning: Version directory not found at ${versionDir}`);
      return [];
    }

    // First pass: collect folder titles from index.md files
    const collectFolderTitles = (dir, prefix = '') => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('_')) {
          const nextPrefix = prefix ? `${prefix}/${file}` : file;
          if (file === 'index.md') {
            // This shouldn't happen in this loop
          }
          collectFolderTitles(filePath, nextPrefix);
        } else if (file === 'index.md') {
          const content = fs.readFileSync(filePath, 'utf-8');
          const fm = extractFrontmatter(content);
          const folderPath = prefix || (file === 'index.md' ? '.' : prefix);
          if (fm.title) {
            folderTitles[folderPath] = fm.title;
          }
        }
      });
    };

    collectFolderTitles(versionDir);

    // Second pass: build navigation hierarchy
    const walkDir = (dir, prefix = '') => {
      const files = fs.readdirSync(dir).sort();
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('_')) {
          const nextPrefix = prefix ? `${prefix}/${file}` : file;
          walkDir(filePath, nextPrefix);
        } else if ((file.endsWith('.md') || file.endsWith('.mdx')) && file !== 'index.md') {
          const content = fs.readFileSync(filePath, 'utf-8');
          const frontmatter = extractFrontmatter(content);

          // Build path structure
          const relativePath = path.relative(versionDir, filePath);
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
                path: `/en/${version}/` + parts.slice(0, idx + 1).join('/') + '/',
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

    walkDir(versionDir);

    // Update folder titles from index.md files
    const updateFolderTitles = (obj, pathPrefix = '') => {
      Object.keys(obj).forEach(key => {
        const item = obj[key];
        if (key.startsWith('__item_')) {
          const folderKey = key.substring(7); // Remove __item_ prefix
          const fullPath = pathPrefix ? `${pathPrefix}/${folderKey}` : folderKey;
          
          if (folderTitles[fullPath]) {
            item.title = folderTitles[fullPath];
          }
          
          if (item.children && Object.keys(item.children).length > 0) {
            updateFolderTitles(item.children, fullPath);
          }
        }
      });
    };

    updateFolderTitles(items);

  } catch (err) {
    console.error(`Error reading files from ${versionDir}:`, err.message);
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
  console.log('Generating navigation data for all versions...');
  
  const outputDir = path.join(projectRoot, 'public', 'api', 'nav');
  await mkdir(outputDir, { recursive: true });
  
  for (const version of versions) {
    try {
      const versionDir = path.join(contentDir, `v${version}`);
      const navTree = buildNavFromVersion(versionDir, version);
      
      const outputPath = path.join(outputDir, `${version}.json`);
      await writeFile(outputPath, JSON.stringify(navTree, null, 2), 'utf-8');
      console.log(`✓ Generated navigation for v${version}`);
    } catch (err) {
      console.error(`✗ Failed to generate nav for v${version}:`, err.message);
    }
  }
}

generateNavData().catch(console.error);
