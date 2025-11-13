import { rewriteAPILink } from '../../src/utils/rewriteAPILink.js';

describe('rewriteAPILink', () => {
  it('should rewrite api: shorthand to full API URL', () => {
    const result = rewriteAPILink('api:SilverStripe\\Core\\Model');
    expect(result).toBe('https://api.silverstripe.org/search/lookup?q=SilverStripe\\Core\\Model&version=6');
  });

  it('should use provided version parameter', () => {
    const result = rewriteAPILink('api:DataObject', '4');
    expect(result).toBe('https://api.silverstripe.org/search/lookup?q=DataObject&version=4');
  });

  it('should handle version 3', () => {
    const result = rewriteAPILink('api:FormField', '3');
    expect(result).toContain('&version=3');
  });

  it('should handle version 5', () => {
    const result = rewriteAPILink('api:Controller', '5');
    expect(result).toContain('&version=5');
  });

  it('should extract class name from api: prefix', () => {
    const result = rewriteAPILink('api:FieldGroup', '6');
    expect(result).toContain('q=FieldGroup');
  });

  it('should handle namespaced class names', () => {
    const result = rewriteAPILink('api:SilverStripe\\Forms\\TextField');
    expect(result).toContain('q=SilverStripe');
  });

  it('should default to version 6 if not provided', () => {
    const result = rewriteAPILink('api:SomeClass');
    expect(result).toContain('&version=6');
  });

  it('should return original link if api: pattern not found', () => {
    const input = 'https://example.com/some-page';
    const result = rewriteAPILink(input);
    expect(result).toBe(input);
  });

  it('should handle class names with underscores', () => {
    const result = rewriteAPILink('api:Custom_Field_Name');
    expect(result).toContain('q=Custom_Field_Name');
  });

  it('should construct valid URL', () => {
    const result = rewriteAPILink('api:DataList');
    expect(result).toMatch(/^https:\/\/api\.silverstripe\.org\/search\/lookup\?q=.+&version=\d+$/);
  });
});
