import {
  isRemoteImage,
  getOptimizedDimensions,
  getImageSizes,
  parseImageTag,
  getImageFormats,
} from '../../src/utils/imageHelpers.js';

describe('imageHelpers', () => {
  describe('isRemoteImage', () => {
    it('should return true for http URL', () => {
      const result = isRemoteImage('http://example.com/image.png');
      expect(result).toBe(true);
    });

    it('should return true for https URL', () => {
      const result = isRemoteImage('https://example.com/image.png');
      expect(result).toBe(true);
    });

    it('should return false for relative path', () => {
      const result = isRemoteImage('/_images/file.png');
      expect(result).toBe(false);
    });

    it('should return false for local path', () => {
      const result = isRemoteImage('./images/file.png');
      expect(result).toBe(false);
    });

    it('should return false for absolute path', () => {
      const result = isRemoteImage('/images/file.png');
      expect(result).toBe(false);
    });

    it('should return false for data URL', () => {
      const result = isRemoteImage('data:image/png;base64,ABC123');
      expect(result).toBe(false);
    });
  });

  describe('getOptimizedDimensions', () => {
    it('should return original dimensions if within max width', () => {
      const result = getOptimizedDimensions(600, 400, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(400);
    });

    it('should scale down dimensions maintaining aspect ratio', () => {
      const result = getOptimizedDimensions(2000, 1000, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(400);
    });

    it('should use default max width of 800', () => {
      const result = getOptimizedDimensions(1000, 500);
      expect(result.width).toBe(800);
      expect(result.height).toBe(400);
    });

    it('should handle square images', () => {
      const result = getOptimizedDimensions(1000, 1000, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(800);
    });

    it('should handle portrait images', () => {
      const result = getOptimizedDimensions(500, 1000, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(1000);
    });

    it('should round height to nearest integer', () => {
      const result = getOptimizedDimensions(1920, 1080, 800);
      expect(result.width).toBe(800);
      expect(Number.isInteger(result.height)).toBe(true);
    });

    it('should handle very large images', () => {
      const result = getOptimizedDimensions(10000, 5000, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(400);
    });

    it('should handle very small images', () => {
      const result = getOptimizedDimensions(100, 50, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(50);
    });
  });

  describe('getImageSizes', () => {
    it('should return size string with default max width', () => {
      const result = getImageSizes();
      expect(result).toContain('100vw');
      expect(result).toContain('90vw');
      expect(result).toContain('800px');
    });

    it('should return size string with custom max width', () => {
      const result = getImageSizes(1000);
      expect(result).toContain('1000px');
    });

    it('should return string with media queries', () => {
      const result = getImageSizes();
      expect(result).toContain('(max-width)');
    });
  });

  describe('parseImageTag', () => {
    it('should parse img tag with src and alt', () => {
      const html = '<img src="test.png" alt="Test image" />';
      const result = parseImageTag(html);
      expect(result).not.toBeNull();
      expect(result.src).toBe('test.png');
      expect(result.alt).toBe('Test image');
    });

    it('should parse img tag with single quotes', () => {
      const html = "<img src='test.png' alt='Test' />";
      const result = parseImageTag(html);
      expect(result.src).toBe('test.png');
      expect(result.alt).toBe('Test');
    });

    it('should parse img tag with width and height', () => {
      const html = '<img src="test.png" width="800" height="600" />';
      const result = parseImageTag(html);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should return null for missing src', () => {
      const html = '<img alt="No source" />';
      const result = parseImageTag(html);
      expect(result).toBeNull();
    });

    it('should return null if no img tag found', () => {
      const html = '<div>No image here</div>';
      const result = parseImageTag(html);
      expect(result).toBeNull();
    });

    it('should return empty string for missing alt', () => {
      const html = '<img src="test.png" />';
      const result = parseImageTag(html);
      expect(result.alt).toBe('');
    });

    it('should return undefined for missing width', () => {
      const html = '<img src="test.png" alt="Test" />';
      const result = parseImageTag(html);
      expect(result.width).toBeUndefined();
    });

    it('should return undefined for missing height', () => {
      const html = '<img src="test.png" alt="Test" />';
      const result = parseImageTag(html);
      expect(result.height).toBeUndefined();
    });

    it('should parse attributes with single quotes', () => {
      const html = "<img src='test.png' alt='Test' />";
      const result = parseImageTag(html);
      expect(result.src).toBe('test.png');
      expect(result.alt).toBe('Test');
    });

    it('should parse full img tag with all attributes', () => {
      const html = '<img src="path/to/image.png" alt="A test image" width="1024" height="768" />';
      const result = parseImageTag(html);
      expect(result.src).toBe('path/to/image.png');
      expect(result.alt).toBe('A test image');
      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
    });
  });

  describe('getImageFormats', () => {
    it('should return object with original property', () => {
      const result = getImageFormats('test.png');
      expect(result).toHaveProperty('original');
    });

    it('should set original to the src parameter', () => {
      const src = 'path/to/image.png';
      const result = getImageFormats(src);
      expect(result.original).toBe(src);
    });

    it('should handle URLs', () => {
      const src = 'https://example.com/image.png';
      const result = getImageFormats(src);
      expect(result.original).toBe(src);
    });

    it('should handle relative paths', () => {
      const src = '/_images/doc/image.png';
      const result = getImageFormats(src);
      expect(result.original).toBe(src);
    });
  });
});
