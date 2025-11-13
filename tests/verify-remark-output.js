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
