#!/usr/bin/env node

/**
 * Generate a JSON index of all documentation for client-side access
 * This parses markdown frontmatter directly without external dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const frontmatter = {};
  const lines = match[1].split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Simple key: value parsing (handles basic YAML)
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Convert to appropriate type
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(value) && value !== '') value = Number(value);
    
    frontmatter[key] = value;
  }
  
  return frontmatter;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      callback(filePath);
    }
  }
}

async function generateDocsIndex() {
  try {
    const contentDir = path.join(__dirname, '..', 'src', 'content', 'docs');
    const docsIndex = [];
    
    walkDir(contentDir, (filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseFrontmatter(content);
      
      // Get the relative path from content root
      const relativePath = path.relative(contentDir, filePath);
      const id = relativePath
        .replace(/\\/g, '/')  // Normalize path separators
        .replace(/\.mdx?$/, ''); // Remove extension
      
      docsIndex.push({
        id,
        title: frontmatter.title || null,
        summary: frontmatter.summary || null,
        icon: frontmatter.icon || null,
        iconBrand: frontmatter.iconBrand || null,
        order: typeof frontmatter.order === 'number' ? frontmatter.order : null,
      });
    });
    
    // Create public directory if it doesn't exist
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write the JSON file
    const outputPath = path.join(publicDir, 'docs-index.json');
    fs.writeFileSync(outputPath, JSON.stringify(docsIndex, null, 2));
    
    console.log(`✓ Generated docs index with ${docsIndex.length} entries`);
  } catch (err) {
    console.error('✗ Failed to generate docs index:', err.message);
    process.exit(1);
  }
}

generateDocsIndex();
