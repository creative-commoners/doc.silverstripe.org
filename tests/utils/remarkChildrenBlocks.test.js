import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkChildrenBlocks from '../../src/utils/remarkChildrenBlocks.js';

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

  describe('Basic [CHILDREN] Parsing', () => {
    it('should parse a simple [CHILDREN] block', () => {
      const markdown = '[CHILDREN]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      // Find the div element created by the plugin
      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties.class).toBe('children-list-placeholder');
      expect(element.properties['data-current-doc-id']).toBe('v6/02_Developer_Guides/index');
    });

    it('should preserve non-[CHILDREN] paragraphs', () => {
      const markdown = 'This is a normal paragraph.\n\n[CHILDREN]\n\nAnother paragraph.';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const paragraphs = result.children.filter(child => child.type === 'paragraph');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    it('should process [CHILDREN] even with other text on same line', () => {
      const markdown = 'Some text [CHILDREN] more text';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );
      // The plugin converts [CHILDREN] blocks in any paragraph
      expect(element).toBeDefined();
    });
  });

  describe('Folder Attribute', () => {
    it('should parse Folder attribute with quotes', () => {
      const markdown = '[CHILDREN Folder="optional_features"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-folder']).toBe('optional_features');
    });

    it('should parse Folder attribute without quotes', () => {
      const markdown = '[CHILDREN Folder=Field_types]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-folder']).toBe('Field_types');
    });

    it('should handle folder names with underscores', () => {
      const markdown = '[CHILDREN Folder="optional_features"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-folder']).toBe('optional_features');
    });
  });

  describe('asList Attribute', () => {
    it('should parse asList flag', () => {
      const markdown = '[CHILDREN asList]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-as-list']).toBe('true');
    });

    it('should combine Folder and asList attributes', () => {
      const markdown = '[CHILDREN Folder="guides" asList]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-folder']).toBe('guides');
      expect(element.properties['data-as-list']).toBe('true');
    });
  });

  describe('Only Attribute', () => {
    it('should parse Only attribute with comma-separated values', () => {
      const markdown = '[CHILDREN Only="rc,beta,alpha"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-only']).toBe('rc,beta,alpha');
    });

    it('should handle single value in Only attribute', () => {
      const markdown = '[CHILDREN Only="stable"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-only']).toBe('stable');
    });
  });

  describe('Exclude Attribute', () => {
    it('should parse Exclude attribute', () => {
      const markdown = '[CHILDREN Exclude="deprecated,internal"]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-exclude']).toBe('deprecated,internal');
    });
  });

  describe('includeFolders Attribute', () => {
    it('should parse includeFolders flag', () => {
      const markdown = '[CHILDREN includeFolders]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-include-folders']).toBe('true');
    });
  });

  describe('reverse Attribute', () => {
    it('should parse reverse flag', () => {
      const markdown = '[CHILDREN reverse]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-reverse']).toBe('true');
    });
  });

  describe('Complex Combinations', () => {
    it('should handle multiple attributes together', () => {
      const markdown = '[CHILDREN Folder="guides" asList Only="v4,v5" reverse]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-folder']).toBe('guides');
      expect(element.properties['data-as-list']).toBe('true');
      expect(element.properties['data-only']).toBe('v4,v5');
      expect(element.properties['data-reverse']).toBe('true');
    });

    it('should handle attributes in different order', () => {
      const markdown1 = '[CHILDREN asList Folder="test"]';
      const markdown2 = '[CHILDREN Folder="test" asList]';

      const tree1 = processor.parse(markdown1);
      const result1 = processor.runSync(tree1);
      const element1 = result1.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      const tree2 = processor.parse(markdown2);
      const result2 = processor.runSync(tree2);
      const element2 = result2.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element1.properties['data-folder']).toBe(element2.properties['data-folder']);
      expect(element1.properties['data-as-list']).toBe(element2.properties['data-as-list']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extra whitespace', () => {
      const markdown = '[CHILDREN   asList   Folder="test"  ]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-folder']).toBe('test');
    });

    it('should match [CHILDREN2] as a valid CHILDREN tag (regex quirk)', () => {
      const markdown = '[CHILD] or [CHILDREN2]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const elements = result.children.filter(
        child => child.type === 'element' && child.tagName === 'div'
      );

      // [CHILDREN2] is matched by the regex as valid
      // This is a quirk of the current implementation
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should match [CHILDREN] in middle of text', () => {
      const markdown = 'Some text [CHILDREN] in middle';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const elements = result.children.filter(
        child => child.type === 'element' && child.tagName === 'div'
      );

      // Plugin will match [CHILDREN] anywhere in text
      expect(elements.length).toBe(1);
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

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element.properties['data-current-doc-id']).toBe('v6/custom/path');
    });

    it('should create placeholder element without currentDocId when not available', () => {
      const noIdProcessor = unified()
        .use(remarkParse)
        .use(remarkChildrenBlocks);

      const markdown = '[CHILDREN]';
      const tree = noIdProcessor.parse(markdown);
      const result = noIdProcessor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element).toBeDefined();
      expect(element.properties['data-current-doc-id']).toBeUndefined();
    });
  });

  describe('Output Structure', () => {
    it('should create proper div element', () => {
      const markdown = '[CHILDREN]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element.type).toBe('element');
      expect(element.tagName).toBe('div');
      expect(Array.isArray(element.children)).toBe(true);
      expect(element.properties).toBeDefined();
    });

    it('should have empty children array', () => {
      const markdown = '[CHILDREN]';
      const tree = processor.parse(markdown);
      const result = processor.runSync(tree);

      const element = result.children.find(
        child => child.type === 'element' && child.tagName === 'div'
      );

      expect(element.children).toEqual([]);
    });
  });
});
