import {
  parseCalloutTag,
  extractCalloutTags,
  getCalloutClass,
} from '../../src/utils/parseCalloutTags.js';

describe('parseCalloutTags', () => {
  describe('parseCalloutTag', () => {
    it('should parse hint callout tag', () => {
      const result = parseCalloutTag('[hint]');
      expect(result).toBe('hint');
    });

    it('should parse note callout tag', () => {
      const result = parseCalloutTag('[note]');
      expect(result).toBe('note');
    });

    it('should parse warning callout tag', () => {
      const result = parseCalloutTag('[warning]');
      expect(result).toBe('warning');
    });

    it('should parse info callout tag', () => {
      const result = parseCalloutTag('[info]');
      expect(result).toBe('info');
    });

    it('should parse error callout tag', () => {
      const result = parseCalloutTag('[error]');
      expect(result).toBe('error');
    });

    it('should parse danger callout tag', () => {
      const result = parseCalloutTag('[danger]');
      expect(result).toBe('danger');
    });

    it('should parse success callout tag', () => {
      const result = parseCalloutTag('[success]');
      expect(result).toBe('success');
    });

    it('should parse alert callout tag', () => {
      const result = parseCalloutTag('[alert]');
      expect(result).toBe('alert');
    });

    it('should parse deprecated callout tag', () => {
      const result = parseCalloutTag('[deprecated]');
      expect(result).toBe('deprecated');
    });

    it('should be case-insensitive', () => {
      const result = parseCalloutTag('[WARNING]');
      expect(result).toBe('warning');
    });

    it('should be case-insensitive with mixed case', () => {
      const result = parseCalloutTag('[HiNt]');
      expect(result).toBe('hint');
    });

    it('should return null for unknown callout type', () => {
      const result = parseCalloutTag('[unknown]');
      expect(result).toBeNull();
    });

    it('should return null when no callout tag found', () => {
      const result = parseCalloutTag('no tag here');
      expect(result).toBeNull();
    });

    it('should find callout tag in longer content', () => {
      const result = parseCalloutTag('Some content [warning] more text');
      expect(result).toBe('warning');
    });
  });

  describe('extractCalloutTags', () => {
    it('should extract single callout tag', () => {
      const content = '[hint]This is a hint[/hint]';
      const result = extractCalloutTags(content);
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('hint');
      expect(result[0].content).toBe('This is a hint');
    });

    it('should extract multiple callout tags', () => {
      const content = '[hint]Hint content[/hint]\n[warning]Warning content[/warning]';
      const result = extractCalloutTags(content);
      expect(result.length).toBe(2);
      expect(result[0].type).toBe('hint');
      expect(result[1].type).toBe('warning');
    });

    it('should extract callout with multiline content', () => {
      const content = '[note]This is a note\nwith multiple\nlines[/note]';
      const result = extractCalloutTags(content);
      expect(result.length).toBe(1);
      expect(result[0].content).toContain('This is a note');
      expect(result[0].content).toContain('lines');
    });

    it('should be case-insensitive for tag type', () => {
      const content = '[WARNING]Some content[/WARNING]';
      const result = extractCalloutTags(content);
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('warning');
    });

    it('should return empty array when no callouts found', () => {
      const content = 'No callouts here';
      const result = extractCalloutTags(content);
      expect(result).toEqual([]);
    });

    it('should handle nested-like content safely', () => {
      const content = '[hint]Hint [note]more text[/note] end[/hint]';
      const result = extractCalloutTags(content);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should extract content with special characters', () => {
      const content = '[warning]This has **bold** and `code`[/warning]';
      const result = extractCalloutTags(content);
      expect(result[0].content).toContain('**bold**');
      expect(result[0].content).toContain('`code`');
    });

    it('should handle various callout types', () => {
      const types = ['hint', 'note', 'warning', 'info', 'error', 'danger', 'success', 'alert', 'deprecated'];
      const content = types.map(t => `[${t}]content[/${t}]`).join('\n');
      const result = extractCalloutTags(content);
      expect(result.length).toBe(types.length);
    });

    it('should extract callouts with empty content', () => {
      const content = '[hint][/hint]';
      const result = extractCalloutTags(content);
      expect(result.length).toBe(1);
      expect(result[0].content).toBe('');
    });
  });

  describe('getCalloutClass', () => {
    it('should return alert-info for hint', () => {
      const result = getCalloutClass('hint');
      expect(result).toBe('alert-info');
    });

    it('should return alert-info for note', () => {
      const result = getCalloutClass('note');
      expect(result).toBe('alert-info');
    });

    it('should return alert-warning for warning', () => {
      const result = getCalloutClass('warning');
      expect(result).toBe('alert-warning');
    });

    it('should return alert-info for info', () => {
      const result = getCalloutClass('info');
      expect(result).toBe('alert-info');
    });

    it('should return alert-danger for error', () => {
      const result = getCalloutClass('error');
      expect(result).toBe('alert-danger');
    });

    it('should return alert-danger for danger', () => {
      const result = getCalloutClass('danger');
      expect(result).toBe('alert-danger');
    });

    it('should return alert-success for success', () => {
      const result = getCalloutClass('success');
      expect(result).toBe('alert-success');
    });

    it('should return alert-warning for alert', () => {
      const result = getCalloutClass('alert');
      expect(result).toBe('alert-warning');
    });

    it('should return alert-danger for deprecated', () => {
      const result = getCalloutClass('deprecated');
      expect(result).toBe('alert-danger');
    });

    it('should return undefined for unknown type', () => {
      const result = getCalloutClass('unknown');
      expect(result).toBeUndefined();
    });

    it('should handle case-sensitive lookup', () => {
      const result = getCalloutClass('WARNING');
      expect(result).toBeUndefined();
    });
  });
});
