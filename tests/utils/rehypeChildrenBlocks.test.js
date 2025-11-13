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

  test('handles array data (only, exclude)', async () => {
    const html = '<!-- CHILDREN_BLOCK:{"currentDocId":"v6/test","only":["rc","beta"],"exclude":["alpha"]} -->';
    const result = await processHtml(html);
    
    expect(result).toContain('data-only="rc,beta"');
    expect(result).toContain('data-exclude="alpha"');
  });

  test('handles all boolean flags', async () => {
    const html = '<!-- CHILDREN_BLOCK:{"currentDocId":"v6/test","asList":true,"includeFolders":true,"reverse":true} -->';
    const result = await processHtml(html);
    
    expect(result).toContain('data-as-list="true"');
    expect(result).toContain('data-include-folders="true"');
    expect(result).toContain('data-reverse="true"');
  });

  test('creates empty-children div', async () => {
    const html = '<!-- CHILDREN_BLOCK:{"currentDocId":"v6/test"} -->';
    const result = await processHtml(html);
    
    expect(result).toMatch(/<div[^>]*class="astro-children-list-placeholder"[^>]*><\/div>/);
  });
});
