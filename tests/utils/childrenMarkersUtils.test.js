import {
  serializeChildrenData,
  deserializeChildrenData,
  createChildrenMarker,
  isChildrenMarker,
} from '../../src/utils/childrenMarkersUtils.js';

describe('childrenMarkersUtils', () => {
  describe('serializeChildrenData', () => {
    test('creates valid JSON from object', () => {
      const data = { currentDocId: 'v6/test', folder: 'guides' };
      const result = serializeChildrenData(data);
      expect(result).toBe('{"currentDocId":"v6/test","folder":"guides"}');
    });

    test('handles empty object', () => {
      const result = serializeChildrenData({});
      expect(result).toBe('{}');
    });

    test('handles complex nested objects', () => {
      const data = { id: 'v6/test', nested: { key: 'value' }, array: [1, 2, 3] };
      const result = serializeChildrenData(data);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(data);
    });
  });

  describe('deserializeChildrenData', () => {
    test('parses valid marker correctly', () => {
      const comment = 'CHILDREN_BLOCK:{"currentDocId":"v6/test"}';
      const result = deserializeChildrenData(comment);
      expect(result).toEqual({ currentDocId: 'v6/test' });
    });

    test('returns null for non-marker comments', () => {
      const comment = 'Some other comment';
      const result = deserializeChildrenData(comment);
      expect(result).toBeNull();
    });

    test('handles empty JSON object marker', () => {
      const comment = 'CHILDREN_BLOCK:{}';
      const result = deserializeChildrenData(comment);
      expect(result).toEqual({});
    });

    test('handles malformed JSON gracefully', () => {
      const comment = 'CHILDREN_BLOCK:{invalid}';
      const result = deserializeChildrenData(comment);
      expect(result).toBeNull();
    });

    test('handles complex data structures', () => {
      const data = { id: 'v6/test', folder: 'guides', nested: { key: 'value' } };
      const comment = `CHILDREN_BLOCK:${JSON.stringify(data)}`;
      const result = deserializeChildrenData(comment);
      expect(result).toEqual(data);
    });
  });

  describe('createChildrenMarker', () => {
    test('creates valid HTML comment', () => {
      const data = { currentDocId: 'v6/test' };
      const result = createChildrenMarker(data);
      expect(result).toContain('<!-- CHILDREN_BLOCK:');
      expect(result).toContain('-->');
    });

    test('preserves data integrity through roundtrip', () => {
      const originalData = { id: 'v6/guides/intro', folder: 'api-docs' };
      const marker = createChildrenMarker(originalData);
      
      const commentText = marker.replace(/<!-- /, '').replace(/ -->/, '');
      const recoveredData = deserializeChildrenData(commentText);
      expect(recoveredData).toEqual(originalData);
    });

    test('produces valid HTML comment syntax', () => {
      const data = { id: 'test' };
      const result = createChildrenMarker(data);
      expect(result).toMatch(/^<!-- CHILDREN_BLOCK:.+ -->$/);
    });
  });

  describe('isChildrenMarker', () => {
    test('identifies valid markers', () => {
      expect(isChildrenMarker('CHILDREN_BLOCK:{}')).toBe(true);
      expect(isChildrenMarker('CHILDREN_BLOCK:{"id":"v6/test"}')).toBe(true);
    });

    test('rejects non-marker comments', () => {
      expect(isChildrenMarker('OTHER_COMMENT')).toBe(false);
      expect(isChildrenMarker('Some regular comment')).toBe(false);
      expect(isChildrenMarker('CHILDREN_BLOCKS:{}')).toBe(false);
    });

    test('rejects empty string', () => {
      expect(isChildrenMarker('')).toBe(false);
    });
  });

  describe('roundtrip serialization', () => {
    test('preserves complex data through full cycle', () => {
      const originalData = {
        currentDocId: 'v6/guides/installation',
        folder: 'tutorials',
        version: '6',
      };

      const marker = createChildrenMarker(originalData);
      const commentText = marker.replace(/<!-- /, '').replace(/ -->/, '');
      const recoveredData = deserializeChildrenData(commentText);

      expect(recoveredData).toEqual(originalData);
    });
  });

  describe('error handling', () => {
    test('deserializeChildrenData handles JSON with special characters', () => {
      const data = { message: 'Test with "quotes" and \\backslash' };
      const comment = `CHILDREN_BLOCK:${JSON.stringify(data)}`;
      const result = deserializeChildrenData(comment);
      expect(result).toEqual(data);
    });

    test('deserializeChildrenData handles malformed markers', () => {
      expect(deserializeChildrenData('CHILDREN_BLOCK:')).toBeNull();
      expect(deserializeChildrenData('CHILDREN_BLOCK:undefined')).toBeNull();
    });
  });
});
