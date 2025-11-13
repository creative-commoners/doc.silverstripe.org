import {
  parseHTML,
  extractFrontmatter,
} from '../../src/utils/parseHTML.js';

describe('parseHTML', () => {
  describe('parseHTML function', () => {
    it('should remove [CHILDREN] tags', () => {
      const html = 'Some content [CHILDREN] more content';
      const result = parseHTML(html);
      expect(result).not.toContain('[CHILDREN]');
    });

    it('should remove multiple [CHILDREN] tags', () => {
      const html = 'Start [CHILDREN] middle [CHILDREN] end';
      const result = parseHTML(html);
      expect(result).toBe('Start  middle  end');
    });

    it('should clean up excessive newlines (3+ newlines to 2)', () => {
      const html = 'Line 1\n\n\n\nLine 2';
      const result = parseHTML(html);
      expect(result).toBe('Line 1\n\nLine 2');
    });

    it('should preserve single newlines', () => {
      const html = 'Line 1\nLine 2';
      const result = parseHTML(html);
      expect(result).toBe('Line 1\nLine 2');
    });

    it('should preserve double newlines', () => {
      const html = 'Line 1\n\nLine 2';
      const result = parseHTML(html);
      expect(result).toBe('Line 1\n\nLine 2');
    });

    it('should clean up multiple excessive newlines', () => {
      const html = 'Para 1\n\n\n\nPara 2\n\n\n\nPara 3';
      const result = parseHTML(html);
      expect(result).toBe('Para 1\n\nPara 2\n\nPara 3');
    });

    it('should handle content with no transformations needed', () => {
      const html = 'Simple content';
      const result = parseHTML(html);
      expect(result).toBe('Simple content');
    });

    it('should handle empty string', () => {
      const result = parseHTML('');
      expect(result).toBe('');
    });

    it('should apply both transformations', () => {
      const html = 'Start [CHILDREN]\n\n\n\nEnd';
      const result = parseHTML(html);
      expect(result).not.toContain('[CHILDREN]');
      expect(result).not.toContain('\n\n\n');
    });

    it('should not modify original content passed', () => {
      const html = 'Original [CHILDREN]';
      parseHTML(html);
      expect(html).toContain('[CHILDREN]');
    });
  });

  describe('extractFrontmatter function', () => {
    it('should extract simple frontmatter', () => {
      const content = '---\ntitle: Test\n---\nBody content';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.title).toBe('Test');
      expect(result.body).toBe('Body content');
    });

    it('should extract multiple frontmatter fields', () => {
      const content = '---\ntitle: Test\nsummary: A summary\norder: 1\n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.title).toBe('Test');
      expect(result.frontmatter.summary).toBe('A summary');
      expect(result.frontmatter.order).toBe(1);
    });

    it('should parse boolean true value', () => {
      const content = '---\nhide: true\n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.hide).toBe(true);
    });

    it('should parse boolean false value', () => {
      const content = '---\nhide: false\n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.hide).toBe(false);
    });

    it('should parse numeric values', () => {
      const content = '---\norder: 42\n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.order).toBe(42);
    });

    it('should parse quoted string values', () => {
      const content = '---\ntitle: "My Title"\n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.title).toBe('My Title');
    });

    it('should parse single-quoted string values', () => {
      const content = "---\ntitle: 'My Title'\n---\nBody";
      const result = extractFrontmatter(content);
      expect(result.frontmatter.title).toBe('My Title');
    });

    it('should parse unquoted string values', () => {
      const content = '---\ntitle: MyTitle\n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.title).toBe('MyTitle');
    });

    it('should preserve body content with newlines', () => {
      const content = '---\ntitle: Test\n---\nLine 1\nLine 2\nLine 3';
      const result = extractFrontmatter(content);
      expect(result.body).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should return empty frontmatter and original content if no frontmatter', () => {
      const content = 'Just body content\nNo frontmatter';
      const result = extractFrontmatter(content);
      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe(content);
    });

    it('should handle empty frontmatter block', () => {
      const content = '---\n\n---\nBody content';
      const result = extractFrontmatter(content);
      expect(result.body).toBe('Body content');
    });

    it('should handle multiline body', () => {
      const content = '---\ntitle: Test\n---\nBody line 1\n\nBody line 2\n\nBody line 3';
      const result = extractFrontmatter(content);
      expect(result.body).toContain('Body line 1');
      expect(result.body).toContain('Body line 2');
      expect(result.body).toContain('Body line 3');
    });

    it('should skip lines without colon in frontmatter', () => {
      const content = '---\ntitle: Test\ninvalid line\nsummary: Summary\n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.title).toBe('Test');
      expect(result.frontmatter.summary).toBe('Summary');
    });

    it('should trim whitespace from keys and values', () => {
      const content = '---\n  title  :  Test Value  \n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.title).toBe('Test Value');
    });

    it('should handle colon in value', () => {
      const content = '---\nurl: http://example.com\n---\nBody';
      const result = extractFrontmatter(content);
      expect(result.frontmatter.url).toBe('http://example.com');
    });

    it('should handle empty body', () => {
      const content = '---\ntitle: Test\n---\n';
      const result = extractFrontmatter(content);
      expect(result.body).toBe('');
    });
  });
});
