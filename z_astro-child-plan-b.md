================================================================================
OPTION B IMPLEMENTATION PLAN: REMARK + REHYPE PLUGIN ENHANCEMENT (WITH TESTING)
================================================================================
Date: 2025-11-13
Objective: Implement server-side rendering of [CHILDREN] blocks using enhanced
           remark and rehype plugins with post-build HTML injection
Status: Enhanced with testing phases to prevent drift and ensure correctness

OVERVIEW
================================================================================
Option B implements [CHILDREN] block rendering through:
1. Enhanced remark plugin outputting special markers/syntax
2. Rehype plugin detecting and converting markers to HTML comments
3. Post-processing during Astro build to render ChildrenList and inject HTML

This approach keeps rendering server-side while maintaining architecture purity.

CRITICAL CHANGE: Testing phases are now integrated into EVERY phase to ensure
the LLM validates work before proceeding. This prevents drift and catches
issues early.

IMPLEMENTATION PHASES (WITH INTEGRATED TESTING)
================================================================================

PHASE 0: ESTABLISH BASELINE & TESTING INFRASTRUCTURE
================================================================================
Objective: Ensure we have a working baseline and test framework before changes

Tasks:
  1. Run existing tests to establish baseline:
     ```bash
     npm test
     ```
     Expected: All existing tests pass
     
  2. Create test fixtures for [CHILDREN] rendering:
     - Create test/fixtures/markdown-with-children.md
     - Contains sample [CHILDREN] blocks with various attributes
     - Example content:
       ```markdown
       # Test Page
       
       [CHILDREN]
       
       ## With Folder
       [CHILDREN Folder="test-folder"]
       
       ## As List
       [CHILDREN asList]
       ```
  
  3. Run a full build and capture output:
     ```bash
     npm run build
     ```
     Expected: Build succeeds (even if [CHILDREN] doesn't render)
     
  4. Document current behavior:
     - Note which files are generated in dist/
     - Check if placeholder divs appear in HTML output
     - Record build time as baseline
  
  5. Create test helper utility:
     File: tests/utils/remarkChildrenBlocks.test.js
     Purpose: Test remark plugin in isolation
     Initial test: Verify plugin loads without errors

VALIDATION:
  ✓ All existing tests pass
  ✓ Build completes successfully
  ✓ Test fixtures created
  ✓ Baseline metrics documented
  ✓ Ready to proceed with changes

PHASE 1: MARKER SYSTEM DESIGN
================================================================================
Objective: Define how remark plugin will mark [CHILDREN] locations for rehype

Current State:
  - remarkChildrenBlocks.js creates: <div class="children-list-placeholder" ...>
  - These divs are inert - no conversion happens

New Approach:
  - Output HTML comments with structured data as markers
  - Preserve all metadata in comment syntax
  - Make markers easy for rehype to detect and transform

Implementation:
  1. Create utility function file first:
     File: src/utils/childrenMarkersUtils.js
     
     Functions to implement:
     ```javascript
     // Serialize metadata to JSON string for HTML comment
     export function serializeChildrenData(attributes) {
       return JSON.stringify(attributes);
     }
     
     // Deserialize metadata from HTML comment
     export function deserializeChildrenData(commentText) {
       const match = commentText.match(/CHILDREN_BLOCK:(.+)/);
       if (!match) return null;
       try {
         return JSON.parse(match[1]);
       } catch (e) {
         console.error('Failed to parse CHILDREN_BLOCK metadata:', e);
         return null;
       }
     }
     
     // Create marker comment text
     export function createChildrenMarker(attributes) {
       return `<!-- CHILDREN_BLOCK:${serializeChildrenData(attributes)} -->`;
     }
     
     // Validate marker format
     export function isChildrenMarker(commentText) {
       return /^CHILDREN_BLOCK:/.test(commentText);
     }
     ```

  2. Write unit tests BEFORE modifying remark plugin:
     File: tests/utils/childrenMarkersUtils.test.js
     
     Tests to write:
     ```javascript
     describe('childrenMarkersUtils', () => {
       test('serializeChildrenData creates valid JSON', () => {
         const data = { currentDocId: 'v6/test', folder: 'guides' };
         const result = serializeChildrenData(data);
         expect(result).toBe('{"currentDocId":"v6/test","folder":"guides"}');
       });
       
       test('deserializeChildrenData parses marker correctly', () => {
         const comment = 'CHILDREN_BLOCK:{"currentDocId":"v6/test"}';
         const result = deserializeChildrenData(comment);
         expect(result).toEqual({ currentDocId: 'v6/test' });
       });
       
       test('createChildrenMarker creates valid HTML comment', () => {
         const data = { currentDocId: 'v6/test' };
         const result = createChildrenMarker(data);
         expect(result).toContain('<!-- CHILDREN_BLOCK:');
         expect(result).toContain('-->');
       });
       
       test('isChildrenMarker identifies valid markers', () => {
         expect(isChildrenMarker('CHILDREN_BLOCK:{}')).toBe(true);
         expect(isChildrenMarker('OTHER_COMMENT')).toBe(false);
       });
       
       test('deserializeChildrenData handles malformed JSON', () => {
         const comment = 'CHILDREN_BLOCK:{invalid}';
         const result = deserializeChildrenData(comment);
         expect(result).toBeNull();
       });
     });
     ```

TESTING PHASE 1:
  Run tests immediately after creating utilities:
  ```bash
  npm test
  ```
  
  Expected results:
  ✓ All serializeChildrenData tests pass
  ✓ All deserializeChildrenData tests pass
  ✓ All createChildrenMarker tests pass
  ✓ All isChildrenMarker tests pass
  ✓ Error handling tests pass
  
  DO NOT PROCEED to Phase 2 until all tests pass - this means everythign in `npm test` passes, not just the thing that was just implemented.

PHASE 2: UPDATE REMARK PLUGIN TO USE MARKERS
================================================================================
Objective: Modify remarkChildrenBlocks.js to output markers instead of divs

File: src/utils/remarkChildrenBlocks.js

Changes:
  1. Import the new utilities at top:
     ```javascript
     import { createChildrenMarker } from './childrenMarkersUtils.js';
     ```
  
  2. Find where placeholder div is created (look for node.type = 'element')
  
  3. Replace div creation with HTML comment marker:
     FROM:
     ```javascript
     node.type = 'element';
     node.tagName = 'div';
     node.properties = { 
       className: ['children-list-placeholder'],
       dataCurrentDocId: currentDocId,
       dataFolder: parsedData.folder,
       // ... other data attributes
     };
     ```
     
     TO:
     ```javascript
     node.type = 'html';
     node.value = createChildrenMarker({
       currentDocId: currentDocId,
       folder: parsedData.folder,
       category: parsedData.category,
       only: parsedData.only,
       exclude: parsedData.exclude,
       asList: parsedData.asList,
       includeFolders: parsedData.includeFolders,
       reverse: parsedData.reverse
     });
     ```
  
  4. Ensure all parsed attributes are included in metadata

TESTING PHASE 2A - Unit Tests:
  File: tests/utils/remarkChildrenBlocks.test.js (enhance existing or create)
  
  Add new tests:
  ```javascript
  describe('remarkChildrenBlocks with markers', () => {
    test('outputs HTML comment marker for [CHILDREN]', async () => {
      const markdown = '[CHILDREN]';
      const result = await processMarkdown(markdown);
      expect(result).toContain('<!-- CHILDREN_BLOCK:');
      expect(result).toContain('-->');
    });
    
    test('includes currentDocId in marker', async () => {
      const markdown = '[CHILDREN]';
      const result = await processMarkdownWithContext(markdown, { 
        currentDocId: 'v6/test' 
      });
      expect(result).toContain('"currentDocId":"v6/test"');
    });
    
    test('includes folder attribute in marker', async () => {
      const markdown = '[CHILDREN Folder="guides"]';
      const result = await processMarkdown(markdown);
      expect(result).toContain('"folder":"guides"');
    });
    
    test('includes multiple attributes in marker', async () => {
      const markdown = '[CHILDREN Folder="guides" asList]';
      const result = await processMarkdown(markdown);
      expect(result).toContain('"folder":"guides"');
      expect(result).toContain('"asList":true');
    });
    
    test('does not output div elements anymore', async () => {
      const markdown = '[CHILDREN]';
      const result = await processMarkdown(markdown);
      expect(result).not.toContain('children-list-placeholder');
      expect(result).not.toContain('<div');
    });
  });
  ```

  Run tests:
  ```bash
  npm test -- remarkChildrenBlocks
  ```
  
  Expected:
  ✓ All marker output tests pass
  ✓ No div elements created
  ✓ All attributes preserved in markers
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.

TESTING PHASE 2B - Integration Test:
  Create a test markdown file to verify end-to-end:
  
  File: tests/fixtures/test-children-markers.md
  ```markdown
  # Test Page
  
  [CHILDREN]
  
  [CHILDREN Folder="test"]
  
  [CHILDREN asList reverse]
  ```
  
  Manual verification script:
  File: tests/verify-remark-output.js
  ```javascript
  import { unified } from 'unified';
  import remarkParse from 'remark-parse';
  import remarkChildrenBlocks from '../src/utils/remarkChildrenBlocks.js';
  import remarkRehype from 'remark-rehype';
  import rehypeStringify from 'rehype-stringify';
  import fs from 'fs';
  
  const markdown = fs.readFileSync('tests/fixtures/test-children-markers.md', 'utf-8');
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkChildrenBlocks, { currentDocId: 'v6/test' })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });
  
  const result = await processor.process(markdown);
  console.log(result.toString());
  ```
  
  Run verification:
  ```bash
  node tests/verify-remark-output.js
  ```
  
  Manually inspect output - should see:
  ✓ HTML comments like <!-- CHILDREN_BLOCK:{...} -->
  ✓ Valid JSON in comments
  ✓ All attributes preserved
  ✓ No div elements
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.

  DO NOT PROCEED to Phase 3 until verification passes.

PHASE 3: CREATE REHYPE PLUGIN
================================================================================
Objective: Transform HTML comment markers into renderable placeholders

File: src/utils/rehypeChildrenBlocks.js (create new)

Implementation:
  ```javascript
  import { visit } from 'unist-util-visit';
  import { deserializeChildrenData, isChildrenMarker } from './childrenMarkersUtils.js';
  
  /**
   * Rehype plugin to transform CHILDREN_BLOCK comment markers
   * into placeholder div elements that can be replaced during build
   */
  export default function rehypeChildrenBlocks() {
    return (tree) => {
      visit(tree, 'comment', (node, index, parent) => {
        if (!node.value || !isChildrenMarker(node.value)) {
          return;
        }
        
        const metadata = deserializeChildrenData(node.value);
        if (!metadata) {
          console.warn('Failed to parse CHILDREN_BLOCK metadata:', node.value);
          return;
        }
        
        // Create placeholder div with data attributes
        const placeholder = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['astro-children-list-placeholder'],
            dataCurrentDocId: metadata.currentDocId || '',
            dataFolder: metadata.folder || '',
            dataCategory: metadata.category || '',
            dataOnly: metadata.only ? metadata.only.join(',') : '',
            dataExclude: metadata.exclude ? metadata.exclude.join(',') : '',
            dataAsList: metadata.asList ? 'true' : 'false',
            dataIncludeFolders: metadata.includeFolders ? 'true' : 'false',
            dataReverse: metadata.reverse ? 'true' : 'false'
          },
          children: []
        };
        
        // Replace comment with placeholder
        parent.children[index] = placeholder;
      });
    };
  }
  ```

TESTING PHASE 3A - Unit Tests:
  File: tests/utils/rehypeChildrenBlocks.test.js (create new)
  
  ```javascript
  import { unified } from 'unified';
  import rehypeParse from 'rehype-parse';
  import rehypeChildrenBlocks from '../../src/utils/rehypeChildrenBlocks.js';
  import rehypeStringify from 'rehype-stringify';
  
  describe('rehypeChildrenBlocks', () => {
    async function processHtml(html) {
      const processor = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeChildrenBlocks)
        .use(rehypeStringify);
      
      const result = await processor.process(html);
      return result.toString();
    }
    
    test('converts CHILDREN_BLOCK comment to placeholder div', async () => {
      const html = '<!-- CHILDREN_BLOCK:{"currentDocId":"v6/test"} -->';
      const result = await processHtml(html);
      
      expect(result).toContain('<div class="astro-children-list-placeholder"');
      expect(result).toContain('data-current-doc-id="v6/test"');
    });
    
    test('preserves all metadata in data attributes', async () => {
      const html = '<!-- CHILDREN_BLOCK:{"currentDocId":"v6/test","folder":"guides","asList":true} -->';
      const result = await processHtml(html);
      
      expect(result).toContain('data-current-doc-id="v6/test"');
      expect(result).toContain('data-folder="guides"');
      expect(result).toContain('data-as-list="true"');
    });
    
    test('handles multiple CHILDREN_BLOCK comments', async () => {
      const html = `
        <p>Text</p>
        <!-- CHILDREN_BLOCK:{"currentDocId":"v6/test1"} -->
        <p>More text</p>
        <!-- CHILDREN_BLOCK:{"currentDocId":"v6/test2"} -->
      `;
      const result = await processHtml(html);
      
      const matches = result.match(/astro-children-list-placeholder/g);
      expect(matches).toHaveLength(2);
    });
    
    test('ignores non-CHILDREN comments', async () => {
      const html = '<!-- Regular comment -->';
      const result = await processHtml(html);
      
      expect(result).toContain('<!-- Regular comment -->');
      expect(result).not.toContain('astro-children-list-placeholder');
    });
    
    test('handles malformed CHILDREN_BLOCK gracefully', async () => {
      const html = '<!-- CHILDREN_BLOCK:invalid json -->';
      const result = await processHtml(html);
      
      // Should keep comment as-is or remove it, not crash
      expect(result).toBeDefined();
    });
  });
  ```
  
  Run tests:
  ```bash
  npm test -- rehypeChildrenBlocks
  ```
  
  Expected:
  ✓ Comment to div conversion works
  ✓ All metadata preserved
  ✓ Multiple markers handled
  ✓ Non-CHILDREN comments ignored
  ✓ Error handling works
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.

TESTING PHASE 3B - Integration with Remark:
  File: tests/verify-remark-rehype-pipeline.js
  ```javascript
  import { unified } from 'unified';
  import remarkParse from 'remark-parse';
  import remarkChildrenBlocks from '../src/utils/remarkChildrenBlocks.js';
  import remarkRehype from 'remark-rehype';
  import rehypeChildrenBlocks from '../src/utils/rehypeChildrenBlocks.js';
  import rehypeStringify from 'rehype-stringify';
  
  const markdown = `
  # Test Page
  
  [CHILDREN]
  
  [CHILDREN Folder="guides"]
  `;
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkChildrenBlocks, { currentDocId: 'v6/test' })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeChildrenBlocks)
    .use(rehypeStringify);
  
  const result = await processor.process(markdown);
  console.log('=== Full Pipeline Output ===');
  console.log(result.toString());
  
  const output = result.toString();
  const hasPlaceholders = output.includes('astro-children-list-placeholder');
  const hasCorrectData = output.includes('data-current-doc-id');
  
  console.log('\n=== Validation ===');
  console.log('Has placeholders:', hasPlaceholders);
  console.log('Has data attributes:', hasCorrectData);
  
  if (!hasPlaceholders || !hasCorrectData) {
    console.error('Pipeline validation FAILED');
    process.exit(1);
  }
  
  console.log('Pipeline validation PASSED');
  ```
  
  Run verification:
  ```bash
  node tests/verify-remark-rehype-pipeline.js
  ```
  
  Expected output:
  ✓ Shows placeholder divs with class="astro-children-list-placeholder"
  ✓ Shows data-current-doc-id attributes
  ✓ Shows data-folder attributes where applicable
  ✓ No HTML comments in final output
  ✓ Validation PASSED message
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.

  DO NOT PROCEED to Phase 4 until pipeline verification passes.

PHASE 4: INTEGRATE REHYPE PLUGIN INTO ASTRO
================================================================================
Objective: Add rehype plugin to astro.config.mjs pipeline

File: astro.config.mjs

Changes:
  1. Import the new plugin:
     ```javascript
     import rehypeChildrenBlocks from './src/utils/rehypeChildrenBlocks.js';
     ```
  
  2. Add to markdown configuration:
     ```javascript
     markdown: {
       // ... existing config
       rehypePlugins: [
         rehypeChildrenBlocks,
         // ... other plugins if any
       ],
     },
     ```
  
  3. Ensure plugin order is correct (rehype runs after remark)

TESTING PHASE 4A - Build Test:
  Run a development build to test integration:
  ```bash
  npm run dev
  ```
  
  Expected:
  ✓ Dev server starts without errors
  ✓ No plugin loading errors in console
  ✓ Site accessible at localhost

TESTING PHASE 4B - Build Output Inspection:
  Create inspection script:
  File: tests/verify-build-output.js
  ```javascript
  import fs from 'fs';
  import path from 'path';
  import { glob } from 'glob';
  
  console.log('Building site...');
  // Build first
  import { execSync } from 'child_process';
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (e) {
    console.error('Build failed');
    process.exit(1);
  }
  
  console.log('\nInspecting build output...');
  
  // Find all HTML files
  const htmlFiles = await glob('dist/**/*.html');
  console.log(`Found ${htmlFiles.length} HTML files`);
  
  let placeholderCount = 0;
  let filesWithPlaceholders = [];
  
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/astro-children-list-placeholder/g);
    
    if (matches) {
      placeholderCount += matches.length;
      filesWithPlaceholders.push({
        file: file.replace('dist/', ''),
        count: matches.length
      });
    }
  }
  
  console.log('\n=== Results ===');
  console.log(`Total placeholders found: ${placeholderCount}`);
  console.log(`Files with placeholders: ${filesWithPlaceholders.length}`);
  
  if (filesWithPlaceholders.length > 0) {
    console.log('\nFiles containing placeholders:');
    filesWithPlaceholders.forEach(({ file, count }) => {
      console.log(`  - ${file} (${count} placeholder${count > 1 ? 's' : ''})`);
    });
  }
  
  // Validate that placeholders have data attributes
  if (filesWithPlaceholders.length > 0) {
    const sampleFile = fs.readFileSync(path.join('dist', filesWithPlaceholders[0].file), 'utf-8');
    const hasDataAttrs = sampleFile.includes('data-current-doc-id');
    
    console.log('\nData attributes present:', hasDataAttrs);
    
    if (!hasDataAttrs) {
      console.error('ERROR: Placeholders missing data attributes');
      process.exit(1);
    }
  }
  
  console.log('\n✓ Build output verification PASSED');
  ```
  
  Run verification:
  ```bash
  node tests/verify-build-output.js
  ```
  
  Expected:
  ✓ Build succeeds
  ✓ Placeholders found in HTML files
  ✓ Data attributes present on placeholders
  ✓ Verification PASSED
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.
  ✓ VERY IMPORTANT: There must be no warnings about console statements in the output. If there are, then remove the console statements from the code and re-run the test.

  DO NOT PROCEED to Phase 5 until build output is verified.

PHASE 5: CREATE STATIC RENDERING UTILITY
================================================================================
Objective: Create server-side rendering function for ChildrenList HTML

File: src/utils/renderChildren.js (create new)

Implementation:
  ```javascript
  import { getCollection } from 'astro:content';
  import { getChildren, sortDocs, buildSlug } from './childrenHelpers.js';
  import { parseDocId } from './childrenHelpers.js';
  
  /**
   * Render ChildrenList as static HTML string
   * This runs at build time during the astro:build:done hook
   */
  export async function renderChildrenListStatic(options) {
    const {
      currentDocId,
      folder = '',
      only = [],
      exclude = [],
      asList = false,
      includeFolders = false,
      reverse = false
    } = options;
    
    if (!currentDocId) {
      console.warn('renderChildrenListStatic: currentDocId is required');
      return '<!-- CHILDREN: Missing currentDocId -->';
    }
    
    try {
      const parsed = parseDocId(currentDocId);
      if (!parsed) {
        return '<!-- CHILDREN: Invalid currentDocId -->';
      }
      
      // Get all docs for this version
      const allDocs = await getCollection('docs', ({ id }) => 
        id.startsWith(`${parsed.version}/`)
      );
      
      // Get children of current doc
      let children = getChildren(allDocs, currentDocId, includeFolders);
      
      // Apply filters
      if (folder) {
        children = children.filter(doc => {
          const docFolder = doc.id.split('/').slice(-2, -1)[0];
          return docFolder === folder;
        });
      }
      
      if (only.length > 0) {
        children = children.filter(doc => 
          only.some(term => doc.id.includes(term))
        );
      }
      
      if (exclude.length > 0) {
        children = children.filter(doc => 
          !exclude.some(term => doc.id.includes(term))
        );
      }
      
      // Sort
      children = sortDocs(children);
      if (reverse) {
        children = children.reverse();
      }
      
      if (children.length === 0) {
        return '<!-- CHILDREN: No children found -->';
      }
      
      // Render as HTML
      if (asList) {
        return renderAsList(children);
      } else {
        return renderAsGrid(children);
      }
      
    } catch (error) {
      console.error('Error rendering children list:', error);
      return `<!-- CHILDREN: Error - ${error.message} -->`;
    }
  }
  
  function renderAsGrid(children) {
    const cards = children.map(child => {
      const slug = buildSlug(child.id);
      const title = child.data.title || 'Untitled';
      const summary = child.data.summary || '';
      const icon = child.data.icon || 'file-alt';
      
      return `
        <div class="docs-overview__item card">
          <div class="card-body">
            <h3 class="card-title">
              <i class="fas fa-${icon}"></i>
              <a href="${slug}">${escapeHtml(title)}</a>
            </h3>
            ${summary ? `<p class="card-text">${escapeHtml(summary)}</p>` : ''}
          </div>
        </div>
      `.trim();
    }).join('\n');
    
    return `<div class="docs-overview">\n${cards}\n</div>`;
  }
  
  function renderAsList(children) {
    const items = children.map(child => {
      const slug = buildSlug(child.id);
      const title = child.data.title || 'Untitled';
      
      return `<li><a href="${slug}">${escapeHtml(title)}</a></li>`;
    }).join('\n');
    
    return `<ul class="children-list">\n${items}\n</ul>`;
  }
  
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  ```

TESTING PHASE 5A - Unit Tests:
  File: tests/utils/renderChildren.test.js (create new)
  
  ```javascript
  import { renderChildrenListStatic } from '../../src/utils/renderChildren.js';
  
  // Mock getCollection
  jest.mock('astro:content', () => ({
    getCollection: jest.fn()
  }));
  
  import { getCollection } from 'astro:content';
  
  describe('renderChildrenListStatic', () => {
    const mockDocs = [
      {
        id: 'v6/getting-started/installation/index.md',
        slug: 'v6/getting-started/installation',
        data: {
          title: 'Installation',
          summary: 'How to install',
          icon: 'download'
        }
      },
      {
        id: 'v6/getting-started/configuration/index.md',
        slug: 'v6/getting-started/configuration',
        data: {
          title: 'Configuration',
          summary: 'How to configure',
          icon: 'cog'
        }
      }
    ];
    
    beforeEach(() => {
      getCollection.mockResolvedValue(mockDocs);
    });
    
    afterEach(() => {
      jest.clearAllMocks();
    });
    
    test('renders grid by default', async () => {
      const html = await renderChildrenListStatic({
        currentDocId: 'v6/getting-started/index'
      });
      
      expect(html).toContain('docs-overview');
      expect(html).toContain('card');
      expect(html).toContain('Installation');
      expect(html).toContain('Configuration');
    });
    
    test('renders list when asList=true', async () => {
      const html = await renderChildrenListStatic({
        currentDocId: 'v6/getting-started/index',
        asList: true
      });
      
      expect(html).toContain('<ul');
      expect(html).toContain('<li>');
      expect(html).toContain('Installation');
    });
    
    test('includes links with correct hrefs', async () => {
      const html = await renderChildrenListStatic({
        currentDocId: 'v6/getting-started/index'
      });
      
      expect(html).toMatch(/href="[^"]*\/installation"/);
      expect(html).toMatch(/href="[^"]*\/configuration"/);
    });
    
    test('escapes HTML in titles and summaries', async () => {
      getCollection.mockResolvedValue([{
        id: 'v6/test/xss/index.md',
        data: {
          title: '<script>alert("xss")</script>',
          summary: '<img src=x onerror=alert(1)>'
        }
      }]);
      
      const html = await renderChildrenListStatic({
        currentDocId: 'v6/test/index'
      });
      
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
    
    test('returns comment when currentDocId missing', async () => {
      const html = await renderChildrenListStatic({});
      
      expect(html).toContain('<!-- CHILDREN:');
      expect(html).toContain('Missing currentDocId');
    });
    
    test('handles errors gracefully', async () => {
      getCollection.mockRejectedValue(new Error('Collection error'));
      
      const html = await renderChildrenListStatic({
        currentDocId: 'v6/test/index'
      });
      
      expect(html).toContain('<!-- CHILDREN: Error');
    });
  });
  ```
  
  Run tests:
  ```bash
  npm test -- renderChildren
  ```
  
  Expected:
  ✓ Grid rendering works
  ✓ List rendering works
  ✓ Links generated correctly
  ✓ HTML escaping works
  ✓ Error handling works
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.
  ✓ VERY IMPORTANT: There must be no warnings about console statements in the output. If there are, then remove the console statements from the code and re-run the test.

TESTING PHASE 5B - Manual Rendering Test:
  File: tests/verify-render-children.js
  ```javascript
  import { renderChildrenListStatic } from '../src/utils/renderChildren.js';
  
  console.log('=== Testing renderChildrenListStatic ===\n');
  
  // This will fail if not run in Astro context, so we'll test the logic
  // by mocking or running in a real build
  
  const testCases = [
    {
      name: 'Basic grid',
      options: { currentDocId: 'v6/getting-started/index' }
    },
    {
      name: 'As list',
      options: { currentDocId: 'v6/getting-started/index', asList: true }
    },
    {
      name: 'With folder filter',
      options: { currentDocId: 'v6/index', folder: 'getting-started' }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.name}`);
    try {
      const html = await renderChildrenListStatic(testCase.options);
      console.log('✓ Rendered successfully');
      console.log(`Length: ${html.length} characters`);
      console.log('Preview:', html.substring(0, 200) + '...');
    } catch (error) {
      console.error('✗ Error:', error.message);
    }
  }
  ```
  
  Note: This may need to be run during actual build to have access to
  content collection. Alternative: Create integration test in Phase 6.

  DO NOT PROCEED to Phase 6 until rendering utility is tested.

PHASE 6: BUILD HOOK FOR PLACEHOLDER REPLACEMENT
================================================================================
Objective: Create Astro integration to replace placeholders during build

File: astro.config.mjs (add integration)

Implementation:
  1. Create integration function in astro.config.mjs:
     ```javascript
     import { renderChildrenListStatic } from './src/utils/renderChildren.js';
     import fs from 'fs';
     import path from 'path';
     import { glob } from 'glob';
     import * as cheerio from 'cheerio'; // May need to install: npm install cheerio
     
     function childrenBlocksIntegration() {
       return {
         name: 'children-blocks-integration',
         hooks: {
           'astro:build:done': async ({ dir }) => {
             console.log('\n🔧 Processing [CHILDREN] placeholders...');
             
             // Find all HTML files
             const htmlFiles = await glob(path.join(dir.pathname, '**/*.html'));
             let totalPlaceholders = 0;
             let filesProcessed = 0;
             
             for (const file of htmlFiles) {
               const content = fs.readFileSync(file, 'utf-8');
               const $ = cheerio.load(content);
               const placeholders = $('.astro-children-list-placeholder');
               
               if (placeholders.length === 0) continue;
               
               filesProcessed++;
               
               for (let i = 0; i < placeholders.length; i++) {
                 const $placeholder = $(placeholders[i]);
                 const options = {
                   currentDocId: $placeholder.attr('data-current-doc-id') || '',
                   folder: $placeholder.attr('data-folder') || '',
                   only: $placeholder.attr('data-only')?.split(',').filter(Boolean) || [],
                   exclude: $placeholder.attr('data-exclude')?.split(',').filter(Boolean) || [],
                   asList: $placeholder.attr('data-as-list') === 'true',
                   includeFolders: $placeholder.attr('data-include-folders') === 'true',
                   reverse: $placeholder.attr('data-reverse') === 'true'
                 };
                 
                 const html = await renderChildrenListStatic(options);
                 $placeholder.replaceWith(html);
                 totalPlaceholders++;
               }
               
               // Write modified file
               fs.writeFileSync(file, $.html(), 'utf-8');
             }
             
             console.log(`✓ Processed ${totalPlaceholders} [CHILDREN] blocks in ${filesProcessed} files`);
           }
         }
       };
     }
     ```
  
  2. Add integration to config:
     ```javascript
     export default defineConfig({
       integrations: [
         // ... other integrations
         childrenBlocksIntegration(),
       ],
       // ... rest of config
     });
     ```
  
  3. Install cheerio if needed:
     ```bash
     npm install cheerio
     ```

TESTING PHASE 6A - Integration Test:
  Run full build with integration:
  ```bash
  npm run build
  ```
  
  Expected console output:
  ✓ Shows "🔧 Processing [CHILDREN] placeholders..."
  ✓ Shows "✓ Processed N [CHILDREN] blocks in M files"
  ✓ No errors during processing
  ✓ Build completes successfully

TESTING PHASE 6B - Build Output Validation:
  File: tests/verify-children-rendered.js
  ```javascript
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
  ```
  
  Run verification:
  ```bash
  node tests/verify-children-rendered.js
  ```
  
  Expected:
  ✓ Shows files with rendered children
  ✓ No unprocessed placeholders
  ✓ PASSED message
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.
  ✓ VERY IMPORTANT: There must be no warnings about console statements in the output. If there are, then remove the console statements from the code and re-run the test.

TESTING PHASE 6C - Visual Inspection:
  Manual steps:
  1. Start preview server:
     ```bash
     npm run preview
     ```
  
  2. Navigate to a page that should have [CHILDREN] blocks
     (you'll need to know which pages have this)
  
  3. Verify:
     ✓ Children cards/lists appear
     ✓ Links work correctly
     ✓ Styling is correct
     ✓ No JavaScript errors in console
     ✓ No broken images
  
  4. Test multiple pages across versions (v3, v4, v5, v6)
  
  Document results in console before proceeding.

  DO NOT PROCEED to Phase 7 until visual inspection passes.

PHASE 7: END-TO-END TESTING
================================================================================
Objective: Comprehensive testing of complete implementation

TESTING PHASE 7A - Full Build Cycle Test:
  Script to test complete workflow:
  File: tests/e2e-children-blocks.test.js
  ```javascript
  import { execSync } from 'child_process';
  import fs from 'fs';
  import path from 'path';
  import { glob } from 'glob';
  import * as cheerio from 'cheerio';
  
  describe('E2E: [CHILDREN] Blocks', () => {
    beforeAll(() => {
      console.log('Running full build...');
      execSync('npm run build', { stdio: 'inherit' });
    });
    
    test('build completes without errors', () => {
      expect(fs.existsSync('dist')).toBe(true);
    });
    
    test('HTML files are generated', async () => {
      const htmlFiles = await glob('dist/**/*.html');
      expect(htmlFiles.length).toBeGreaterThan(0);
    });
    
    test('no unprocessed placeholders remain', async () => {
      const htmlFiles = await glob('dist/**/*.html');
      let placeholderCount = 0;
      
      for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const $ = cheerio.load(content);
        placeholderCount += $('.astro-children-list-placeholder').length;
      }
      
      expect(placeholderCount).toBe(0);
    });
    
    test('[CHILDREN] blocks are rendered as docs-overview', async () => {
      const htmlFiles = await glob('dist/**/*.html');
      let foundChildren = false;
      
      for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('docs-overview') || content.includes('children-list')) {
          foundChildren = true;
          break;
        }
      }
      
      // This might be false if test content doesn't have [CHILDREN]
      // Adjust expectation based on your content
      expect(foundChildren).toBe(true);
    });
    
    test('rendered children have valid links', async () => {
      const htmlFiles = await glob('dist/**/*.html');
      let invalidLinks = [];
      
      for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const $ = cheerio.load(content);
        
        $('.docs-overview a, .children-list a').each((i, el) => {
          const href = $(el).attr('href');
          if (!href || href === '#' || href.startsWith('javascript:')) {
            invalidLinks.push({ file, href });
          }
        });
      }
      
      expect(invalidLinks).toEqual([]);
    });
  });
  ```
  
  Run E2E tests:
  ```bash
  npm test -- e2e-children-blocks
  ```
  
  Expected:
  ✓ Build completes
  ✓ HTML files generated
  ✓ No placeholders remain
  ✓ Children blocks rendered
  ✓ Links are valid
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.
  ✓ VERY IMPORTANT: There must be no warnings about console statements in the output. If there are, then remove the console statements from the code and re-run the test.

TESTING PHASE 7B - Cross-Version Testing:
  Test that all versions work correctly:
  ```javascript
  describe('Cross-version [CHILDREN] rendering', () => {
    const versions = ['3', '4', '5', '6'];
    
    for (const version of versions) {
      test(`version ${version} [CHILDREN] blocks render`, async () => {
        const versionFiles = await glob(`dist/en/${version}/**/*.html`);
        
        if (versionFiles.length === 0) {
          console.warn(`No files found for version ${version}`);
          return;
        }
        
        let hasChildren = false;
        for (const file of versionFiles) {
          const content = fs.readFileSync(file, 'utf-8');
          if (content.includes('docs-overview') || content.includes('children-list')) {
            hasChildren = true;
            break;
          }
        }
        
        // Adjust expectation based on whether version has [CHILDREN]
        console.log(`Version ${version}: ${hasChildren ? 'has' : 'no'} [CHILDREN] blocks`);
      });
    }
  });
  ```

TESTING PHASE 7C - Performance Testing:
  Measure build time impact:
  File: tests/measure-build-time.js
  ```javascript
  import { execSync } from 'child_process';
  
  console.log('=== Build Time Measurement ===\n');
  
  const runs = 3;
  const times = [];
  
  for (let i = 0; i < runs; i++) {
    console.log(`Run ${i + 1}/${runs}...`);
    
    // Clean first
    execSync('npm run clean', { stdio: 'pipe' });
    
    const start = Date.now();
    execSync('npm run build', { stdio: 'pipe' });
    const duration = Date.now() - start;
    
    times.push(duration);
    console.log(`  Duration: ${(duration / 1000).toFixed(2)}s`);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log('\n=== Results ===');
  console.log(`Average: ${(avg / 1000).toFixed(2)}s`);
  console.log(`Min: ${(min / 1000).toFixed(2)}s`);
  console.log(`Max: ${(max / 1000).toFixed(2)}s`);
  
  // Document baseline for future comparison
  console.log('\nDocument this baseline for future performance comparison');
  ```

  DO NOT PROCEED to Phase 8 until all E2E tests pass.

PHASE 8: REGRESSION TESTING
================================================================================
Objective: Ensure no existing functionality is broken

TESTING PHASE 8A - Existing Test Suite:
  Run all existing tests:
  ```bash
  npm test
  ```
  
  Expected:
  ✓ All previous tests still pass
  ✓ No new failures introduced
  ✓ childrenHelpers tests pass
  ✓ sidebarHelpers tests pass
  ✓ imageHelpers tests pass
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.
  ✓ VERY IMPORTANT: There must be no warnings about console statements in the output. If there are, then remove the console statements from the code and re-run the test.

TESTING PHASE 8B - Feature Verification:
  Manually verify these features still work:
  
  1. Navigation sidebar:
     - Expands/collapses correctly
     - Highlights current page
     - Persists state in localStorage
  
  2. Search functionality:
     - SearchBox loads
     - Search results appear
     - Links work
  
  3. Version switcher:
     - Shows all versions
     - Switches between versions
     - Maintains page context
  
  4. Content rendering:
     - Markdown renders correctly
     - Code blocks have syntax highlighting
     - Images load correctly
     - Links work
  
  5. Styling:
     - Bootstrap styles applied
     - Custom styles work
     - Responsive design works
  
  Document any issues found.

TESTING PHASE 8C - Link Checking:
  If project has link checker:
  ```bash
  npm run test:links
  ```
  
  Or create simple checker:
  ```javascript
  // Check that [CHILDREN] doesn't introduce broken links
  import { glob } from 'glob';
  import fs from 'fs';
  import * as cheerio from 'cheerio';
  
  const htmlFiles = await glob('dist/**/*.html');
  const brokenLinks = [];
  
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const $ = cheerio.load(content);
    
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        const targetFile = path.join('dist', href.replace(/\/$/, '/index.html'));
        if (!fs.existsSync(targetFile)) {
          brokenLinks.push({ file, href });
        }
      }
    });
  }
  
  console.log(`Checked ${htmlFiles.length} files`);
  console.log(`Broken links: ${brokenLinks.length}`);
  
  if (brokenLinks.length > 0) {
    console.error('Broken links found:');
    brokenLinks.forEach(({ file, href }) => {
      console.error(`  ${file}: ${href}`);
    });
  }
  ```

  DO NOT PROCEED to Phase 9 until regression testing passes.
  ✓ VERY IMPORTANT: All tests in `npm test` pass, not just the thing that was just implemented.
  ✓ VERY IMPORTANT: There must be no warnings about console statements in the output. If there are, then remove the console statements from the code and re-run the test.

PHASE 9: DOCUMENTATION & CLEANUP
================================================================================
Objective: Document implementation and clean up test files

Tasks:
  1. Update README or technical docs with:
     - How [CHILDREN] blocks work
     - Syntax reference
     - Examples
     - Troubleshooting guide
  
  2. Add JSDoc comments to new functions:
     - childrenMarkersUtils.js
     - rehypeChildrenBlocks.js
     - renderChildren.js
  
  3. Clean up temporary test files:
     - Keep: Unit tests in tests/ directory
     - Remove: verify-*.js scripts (or move to tests/)
     - Keep: E2E tests
  
  4. Update package.json scripts if needed:
     - Add test:e2e script
     - Add test:children script
  
  5. Create CHANGELOG entry documenting:
     - Feature: [CHILDREN] blocks now render
     - Implementation: Server-side rendering via build hook
     - Performance: Document any build time impact

PHASE 10: SUCCESS CRITERIA VALIDATION
================================================================================
Objective: Final validation against all success criteria

Checklist (from original plan, enhanced with testing):
  
  ✓ 1. npm run build completes successfully
       Test: Run build, check exit code
  
  ✓ 2. HTML comment markers appear in intermediate MDX processing
       Test: Manual inspection or debug logging
  
  ✓ 3. Rehype plugin transforms markers to placeholders
       Test: Unit tests in Phase 3
  
  ✓ 4. Build hook detects all placeholders
       Test: Build output shows processing message
  
  ✓ 5. renderChildrenListStatic() produces valid HTML
       Test: Unit tests in Phase 5
  
  ✓ 6. Final HTML files contain rendered child lists
       Test: verify-children-rendered.js passes
  
  ✓ 7. No console errors or warnings during build
       Test: Build output clean
  
  ✓ 8. Pages render correctly in browser
       Test: Visual inspection in Phase 6C
  
  ✓ 9. Child navigation links work properly
       Test: Manual testing + E2E link validation
  
  ✓ 10. All versions (v3, v4, v5, v6) render child lists correctly
        Test: Cross-version testing in Phase 7B
  
  ✓ 11. Folder filtering works if implemented
        Test: Unit tests with folder parameter
  
  ✓ 12. No performance regression in build time
        Test: Build time measurement in Phase 7C
  
  ✓ 13. Pages without [CHILDREN] blocks unaffected
        Test: Regression testing in Phase 8
  
  ✓ 14. All unit tests pass
        Test: npm test shows all green
  
  ✓ 15. All E2E tests pass
        Test: E2E test suite passes
  
  ✓ 16. No broken links introduced
        Test: Link checker in Phase 8C

Run final validation:
```bash
# Run all tests
npm test

# Run build
npm run build

# Check output
node tests/verify-children-rendered.js

# Preview site
npm run preview
# (manually inspect several pages)
```

All criteria must pass before considering implementation complete.

TESTING SUMMARY
================================================================================

Test Coverage:
  - Unit tests: childrenMarkersUtils, rehypeChildrenBlocks, renderChildren
  - Integration tests: remark → rehype pipeline
  - Build tests: Astro integration, placeholder replacement
  - E2E tests: Complete build cycle, cross-version
  - Regression tests: Existing functionality
  - Manual tests: Visual inspection, link checking

Testing Phases Distribution:
  - Phase 0: Baseline (1 test phase)
  - Phase 1: Markers (1 test phase)
  - Phase 2: Remark (2 test phases)
  - Phase 3: Rehype (2 test phases)
  - Phase 4: Integration (2 test phases)
  - Phase 5: Rendering (2 test phases)
  - Phase 6: Build hook (3 test phases)
  - Phase 7: E2E (3 test phases)
  - Phase 8: Regression (3 test phases)
  - Phase 9: Documentation
  - Phase 10: Final validation

Total: 19 distinct testing phases integrated throughout implementation

ESTIMATED EFFORT (Updated)
================================================================================
Phase 0:  Baseline & infrastructure    - 1 hour
Phase 1:  Marker system + tests        - 1.5 hours
Phase 2:  Remark update + tests        - 2 hours
Phase 3:  Rehype plugin + tests        - 2 hours
Phase 4:  Astro integration + tests    - 1.5 hours
Phase 5:  Rendering utility + tests    - 2 hours
Phase 6:  Build hook + tests           - 2.5 hours
Phase 7:  E2E testing                  - 2 hours
Phase 8:  Regression testing           - 1.5 hours
Phase 9:  Documentation                - 1 hour
Phase 10: Final validation             - 1 hour

Total Estimated: 18-20 hours (vs original 6-10 hours)

Additional time is due to comprehensive testing at each phase.
This investment prevents drift and catches issues early, ultimately
saving debugging time and ensuring correct implementation.

BENEFITS OF TESTING-INTEGRATED APPROACH
================================================================================

1. PREVENTS DRIFT
   - LLM validates work at each step
   - Catches errors before they compound
   - Ensures understanding of implementation

2. PROVIDES CONFIDENCE
   - Each phase has clear pass/fail criteria
   - No guessing if implementation is correct
   - Can roll back to last known-good state

3. ENABLES INCREMENTAL PROGRESS
   - Can pause/resume at any phase
   - Each phase is self-contained
   - Progress is measurable and verifiable

4. CREATES REGRESSION SUITE
   - Tests remain for future changes
   - Prevents breaking [CHILDREN] later
   - Documents expected behavior

5. IMPROVES CODE QUALITY
   - Forces thinking about edge cases
   - Encourages proper error handling
   - Results in more robust implementation

ROLLBACK POINTS
================================================================================

Each phase has a clear rollback point:
- Phase 0: Baseline captured
- Phase 1-2: Can revert remark plugin
- Phase 3-4: Can remove rehype plugin
- Phase 5-6: Can remove build hook
- Any phase: Git commit after each successful phase

If any testing phase fails repeatedly (>3 attempts):
1. Document the failure
2. Roll back to previous phase
3. Reassess approach
4. Consider alternative implementation

NEXT STEPS FOR LLM AGENT
================================================================================

Start with Phase 0:
1. Run npm test to establish baseline
2. Create test fixtures
3. Run npm run build
4. Document current behavior
5. Report results before proceeding

After each phase:
1. Run the specified tests
2. Verify all tests pass
3. Document any issues
4. Only proceed when validation passes
5. Commit work with descriptive message

DO NOT skip testing phases.
DO NOT proceed if tests fail.
DO ask for clarification if tests are ambiguous.
DO report test results before continuing.

================================================================================
END OF PLAN
================================================================================
