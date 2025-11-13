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
