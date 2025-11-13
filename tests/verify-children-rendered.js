import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import * as cheerio from 'cheerio';

console.log('=== Verifying [CHILDREN] Rendering ===\n');

const htmlFiles = await glob('dist/**/*.html');
let filesWithChildren = 0;
let totalChildren = 0;
let placeholdersRemaining = 0;

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const $ = cheerio.load(content);
  
  // Check for rendered children
  const docsOverview = $('.docs-overview');
  const childrenLists = $('.children-list');
  
  if (docsOverview.length > 0 || childrenLists.length > 0) {
    filesWithChildren++;
    totalChildren += docsOverview.length + childrenLists.length;
    
    console.log(`✓ ${file.replace('dist/', '')}`);
    console.log(`  - Grid children: ${docsOverview.length}`);
    console.log(`  - List children: ${childrenLists.length}`);
  }
  
  // Check for unprocessed placeholders (should be 0)
  const placeholders = $('.astro-children-list-placeholder');
  if (placeholders.length > 0) {
    placeholdersRemaining += placeholders.length;
    console.error(`✗ ${file.replace('dist/', '')} has ${placeholders.length} unprocessed placeholders`);
  }
}

console.log('\n=== Summary ===');
console.log(`Files with [CHILDREN]: ${filesWithChildren}`);
console.log(`Total [CHILDREN] rendered: ${totalChildren}`);
console.log(`Unprocessed placeholders: ${placeholdersRemaining}`);

if (placeholdersRemaining > 0) {
  console.error('\n✗ FAILED: Some placeholders were not processed');
  process.exit(1);
}

if (totalChildren === 0) {
  console.warn('\n⚠ WARNING: No [CHILDREN] blocks found in output');
  console.warn('This might be expected if test content has no [CHILDREN] syntax');
} else {
  console.log('\n✓ PASSED: All [CHILDREN] blocks rendered successfully');
}
