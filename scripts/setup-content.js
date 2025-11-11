#!/usr/bin/env node

/**
 * Setup multi-version content for Astro content collections
 * Creates version-prefixed structure in src/content/docs
 * Includes both docs and optional_features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const cacheDir = path.join(projectRoot, '.cache', 'content', 'docs');
const contentDir = path.join(projectRoot, 'src', 'content', 'docs');
const versions = ['3', '4', '5', '6'];

async function setupContent() {
  console.log('Setting up multi-version content...');
  
  // Ensure content directory exists
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }
  
  for (const version of versions) {
    const versionCacheDir = path.join(cacheDir, `v${version}`);
    const versionContentDir = path.join(contentDir, `v${version}`);
    
    if (!fs.existsSync(versionCacheDir)) {
      console.warn(`⚠ Version directory not found: ${versionCacheDir}`);
      continue;
    }
    
    try {
      // Copy content
      if (fs.existsSync(versionContentDir)) {
        fs.rmSync(versionContentDir, { recursive: true });
      }
      
      fs.mkdirSync(versionContentDir, { recursive: true });
      
      // Copy docs/en content
      const docsDir = path.join(versionCacheDir, 'docs', 'en');
      if (fs.existsSync(docsDir)) {
        copyDirRecursive(docsDir, versionContentDir);
      }
      
      // Copy optional_features if they exist
      const optionalFeaturesDir = path.join(versionCacheDir, 'optional_features');
      if (fs.existsSync(optionalFeaturesDir)) {
        const optFeatDestDir = path.join(versionContentDir, 'optional_features');
        copyDirRecursive(optionalFeaturesDir, optFeatDestDir);
      }
      
      console.log(`✓ Set up content for v${version}`);
    } catch (err) {
      console.error(`✗ Failed to setup v${version}:`, err.message);
    }
  }
  
  console.log('✓ Content setup complete');
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      // Copy markdown and fix image paths to be absolute
      let content = fs.readFileSync(srcPath, 'utf-8');
      
      // Convert relative image paths like ../../_images/ to absolute paths
      // This prevents Astro's Vite resolver from looking for files that don't exist
      content = content.replace(/!\[(.*?)\]\((\.\.\/)+_images\//g, '![$1](/_images/');
      
      fs.writeFileSync(destPath, content, 'utf-8');
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

setupContent().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
