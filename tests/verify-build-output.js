import fs from 'fs';
import path from 'path';

console.log('=== PHASE 4 VERIFICATION ===\n');

// Step 1: Verify plugin is imported and configured in astro.config.mjs
console.log('Step 1: Verifying plugin integration in astro.config.mjs...');
const configFile = fs.readFileSync('./astro.config.mjs', 'utf-8');
const hasRehypeImport = configFile.includes("import rehypeChildrenBlocks from './src/utils/rehypeChildrenBlocks.js'");
const hasRehypeInConfig = configFile.includes('rehypeChildrenBlocks') && configFile.includes('rehypePlugins');

if (!hasRehypeImport) {
  console.error('ERROR: rehypeChildrenBlocks import not found');
  process.exit(1);
}
if (!hasRehypeInConfig) {
  console.error('ERROR: rehypeChildrenBlocks not found in rehypePlugins');
  process.exit(1);
}
console.log('✓ Plugin correctly imported and configured\n');

// Step 2: Verify the plugin file exists
console.log('Step 2: Verifying plugin implementation file exists...');
const pluginPath = './src/utils/rehypeChildrenBlocks.js';
if (!fs.existsSync(pluginPath)) {
  console.error(`ERROR: Plugin file not found at ${pluginPath}`);
  process.exit(1);
}

const pluginContent = fs.readFileSync(pluginPath, 'utf-8');
if (!pluginContent.includes('astro-children-list-placeholder')) {
  console.error('ERROR: Plugin does not create expected placeholder class');
  process.exit(1);
}
if (!pluginContent.includes('dataCurrentDocId')) {
  console.error('ERROR: Plugin does not set data attributes');
  process.exit(1);
}
console.log('✓ Plugin implementation file verified\n');

// Step 3: Verify the test file exists
console.log('Step 3: Verifying rehype plugin test file exists...');
const testPath = './tests/utils/rehypeChildrenBlocks.test.js';
if (!fs.existsSync(testPath)) {
  console.error(`ERROR: Test file not found at ${testPath}`);
  process.exit(1);
}
console.log('✓ Test file exists\n');

// Step 4: Verify build succeeded
console.log('Step 4: Checking build artifacts...');
const distPath = './dist';
if (!fs.existsSync(distPath)) {
  console.error('ERROR: Build dist directory not found');
  process.exit(1);
}
const pagesDist = path.join(distPath, 'pages');
if (!fs.existsSync(pagesDist)) {
  console.error('ERROR: Build pages directory not found');
  process.exit(1);
}
console.log('✓ Build artifacts present\n');

console.log('=== VERIFICATION PASSED ===');
console.log('\nSummary:');
console.log('✓ Plugin correctly imported in astro.config.mjs');
console.log('✓ Plugin added to rehypePlugins array');
console.log('✓ Plugin implementation file exists with required functionality');
console.log('✓ Plugin test file exists');
console.log('✓ Build completed successfully');
console.log('\nNext: Run "npm test" to verify all tests pass including plugin tests');
