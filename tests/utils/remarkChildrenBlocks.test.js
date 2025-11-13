import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkChildrenBlocks from '../../src/utils/remarkChildrenBlocks.js';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { deserializeChildrenData } from '../../src/utils/childrenMarkersUtils.js';

describe('remarkChildrenBlocks plugin', () => {
  let processor;

  beforeEach(() => {
    processor = unified()
      .use(remarkParse)
      .use(remarkChildrenBlocks, { currentDocId: 'v6/02_Developer_Guides/index' });
  });

  describe('Plugin Loading', () => {
    it('should load without errors', () => {
      expect(remarkChildrenBlocks).toBeDefined();
      expect(typeof remarkChildrenBlocks).toBe('function');
    });

    it('should return a function when called', () => {
      const plugin = remarkChildrenBlocks();
      expect(typeof plugin).toBe('function');
    });
  });

  describe('Marker Output Format', () => {
    it('should output HTML comment marker for [CHILDREN]', () => {
      const markdown = '[CHILDREN]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      // Find the html node created by the plugin
      const htmlNode = result.children.find(child => child.type === 'html');

      expect(htmlNode).toBeDefined();
      expect(htmlNode.value).toContain('<!-- CHILDREN_BLOCK:');
      expect(htmlNode.value).toContain('-->');
    });

    it('should contain valid JSON in marker', () => {
      const markdown = '[CHILDREN]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      const match = htmlNode.value.match(/<!-- CHILDREN_BLOCK:(.+) -->/);
      
      expect(match).not.toBeNull();
      const jsonStr = match[1];
      expect(() => JSON.parse(jsonStr)).not.toThrow();
    });

    it('should include currentDocId in marker', () => {
      const markdown = '[CHILDREN]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"currentDocId":"v6/02_Developer_Guides/index"');
    });

    it('should not output div elements anymore', () => {
      const markdown = '[CHILDREN]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const divElements = result.children.filter(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(divElements.length).toBe(0);
    });

    it('should not create children-list-placeholder class', () => {
      const markdown = '[CHILDREN]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).not.toContain('children-list-placeholder');
    });
  });

  describe('Marker with Folder Attribute', () => {
    it('should include folder attribute in marker', () => {
      const markdown = '[CHILDREN Folder="optional_features"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"folder":"optional_features"');
    });

    it('should parse Folder attribute without quotes', () => {
      const markdown = '[CHILDREN Folder=Field_types]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"folder":"Field_types"');
    });

    it('should handle folder names with underscores', () => {
      const markdown = '[CHILDREN Folder="optional_features"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"folder":"optional_features"');
    });
  });

  describe('Marker with Boolean Attributes', () => {
    it('should include asList attribute in marker', () => {
      const markdown = '[CHILDREN asList]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"asList":true');
    });

    it('should include includeFolders attribute in marker', () => {
      const markdown = '[CHILDREN includeFolders]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"includeFolders":true');
    });

    it('should include reverse attribute in marker', () => {
      const markdown = '[CHILDREN reverse]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"reverse":true');
    });
  });

  describe('Marker with Only/Exclude Attributes', () => {
    it('should include Only attribute in marker', () => {
      const markdown = '[CHILDREN Only="rc,beta,alpha"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"only":');
    });

    it('should include Exclude attribute in marker', () => {
      const markdown = '[CHILDREN Exclude="deprecated,internal"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"exclude":');
    });
  });

  describe('Marker with Multiple Attributes', () => {
    it('should include all attributes in marker', () => {
      const markdown = '[CHILDREN Folder="guides" asList Only="v4,v5" reverse]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"folder":"guides"');
      expect(htmlNode.value).toContain('"asList":true');
      expect(htmlNode.value).toContain('"only":');
      expect(htmlNode.value).toContain('"reverse":true');
    });

    it('should handle attributes in different order', () => {
      const markdown1 = '[CHILDREN asList Folder="test"]';
      const markdown2 = '[CHILDREN Folder="test" asList]';

      const tree1 = processor.parse(markdown1);
      const result1 = processor.runSync(tree1);
      const htmlNode1 = result1.children.find(child => child.type === 'html');

      const tree2 = processor.parse(markdown2);
      const result2 = processor.runSync(tree2);
      const htmlNode2 = result2.children.find(child => child.type === 'html');

      // Both should contain the same attributes
      expect(htmlNode1.value).toContain('"folder":"test"');
      expect(htmlNode1.value).toContain('"asList":true');
      expect(htmlNode2.value).toContain('"folder":"test"');
      expect(htmlNode2.value).toContain('"asList":true');
    });
  });

  describe('Marker Deserialization', () => {
    it('should allow deserializing marker back to object', () => {
      const markdown = '[CHILDREN Folder="guides" asList]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      const match = htmlNode.value.match(/<!-- CHILDREN_BLOCK:(.+) -->/);
      const jsonStr = match[1];
      const data = JSON.parse(jsonStr);

      expect(data.folder).toBe('guides');
      expect(data.asList).toBe(true);
      expect(data.currentDocId).toBe('v6/02_Developer_Guides/index');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extra whitespace', () => {
      const markdown = '[CHILDREN   asList   Folder="test"  ]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode).toBeDefined();
      expect(htmlNode.value).toContain('"folder":"test"');
    });

    it('should match [CHILDREN] in middle of text', () => {
      const markdown = 'Some text [CHILDREN] in middle';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const htmlNodes = result.children.filter(child => child.type === 'html');
      expect(htmlNodes.length).toBe(1);
    });

    it('should preserve non-[CHILDREN] paragraphs', () => {
      const markdown = 'This is a normal paragraph.\n\n[CHILDREN]\n\nAnother paragraph.';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const paragraphs = result.children.filter(child => child.type === 'paragraph');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('currentDocId Resolution', () => {
    it('should use provided currentDocId option', () => {
      const customProcessor = unified()
        .use(remarkParse)
        .use(remarkChildrenBlocks, { currentDocId: 'v6/custom/path' });

      const markdown = '[CHILDREN]';
      const tree = customProcessor.parse(markdown);
      const result = customProcessor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode.value).toContain('"currentDocId":"v6/custom/path"');
    });

    it('should include currentDocId in marker even when null', () => {
      const noIdProcessor = unified()
        .use(remarkParse)
        .use(remarkChildrenBlocks);

      const markdown = '[CHILDREN]';
      const tree = noIdProcessor.parse(markdown);
      const result = noIdProcessor.runSync(tree);

      const htmlNode = result.children.find(child => child.type === 'html');
      expect(htmlNode).toBeDefined();
      expect(htmlNode.value).toContain('"currentDocId":null');
    });
  });
});
