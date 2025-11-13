import { getAncestorPaths } from '../../src/utils/sidebarHelpers.js';

describe('sidebarHelpers', () => {
  describe('getAncestorPaths', () => {
    it('should return empty array for root path', () => {
      const result = getAncestorPaths('/');
      expect(result).toEqual([]);
    });

    it('should return empty array for single-level path', () => {
      const result = getAncestorPaths('/en/');
      expect(result).toEqual([]);
    });

    it('should return ancestor for two-level path', () => {
      const result = getAncestorPaths('/en/6/');
      expect(result).toEqual(['/en/']);
    });

    it('should return all ancestors for nested path', () => {
      const result = getAncestorPaths('/en/6/forms/');
      expect(result).toEqual(['/en/', '/en/6/']);
    });

    it('should return all ancestors for deeply nested path', () => {
      const result = getAncestorPaths('/en/6/forms/field-types/');
      expect(result).toEqual(['/en/', '/en/6/', '/en/6/forms/']);
    });

    it('should NOT include the current page path itself', () => {
      const result = getAncestorPaths('/en/6/forms/field-types/');
      expect(result).not.toContain('/en/6/forms/field-types/');
    });

    it('should handle path without trailing slash', () => {
      const result = getAncestorPaths('/en/6/forms');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(p => p.endsWith('/'))).toBe(true);
    });

    it('should handle path with multiple trailing slashes', () => {
      const result = getAncestorPaths('/en/6/forms//');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should maintain trailing slashes in ancestor paths', () => {
      const result = getAncestorPaths('/en/6/forms/');
      expect(result.every(p => p.endsWith('/'))).toBe(true);
    });

    it('should handle version 3 path', () => {
      const result = getAncestorPaths('/en/3/guides/');
      expect(result).toContain('/en/');
      expect(result).toContain('/en/3/');
    });

    it('should handle version 5 path', () => {
      const result = getAncestorPaths('/en/5/api/reference/');
      expect(result.length).toBe(3);
    });

    it('should handle paths with hyphens', () => {
      const result = getAncestorPaths('/en/6/getting-started/');
      expect(result).toEqual(['/en/', '/en/6/']);
    });

    it('should handle very deep nesting', () => {
      const result = getAncestorPaths('/en/6/a/b/c/d/e/');
      expect(result.length).toBe(6);
      expect(result[0]).toBe('/en/');
      expect(result[result.length - 1]).toBe('/en/6/a/b/c/d/');
    });

    it('should return ancestors in correct order', () => {
      const result = getAncestorPaths('/en/6/forms/field-types/');
      expect(result[0]).toBe('/en/');
      expect(result[1]).toBe('/en/6/');
      expect(result[2]).toBe('/en/6/forms/');
    });
  });
});
