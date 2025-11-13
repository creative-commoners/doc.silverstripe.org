import { fileToTitle } from '../../src/utils/fileToTitle.js';

describe('fileToTitle', () => {
  it('should remove leading numeric prefix', () => {
    const result = fileToTitle('01_getting_started');
    expect(result).toBe('Getting Started');
  });

  it('should replace underscores with spaces', () => {
    const result = fileToTitle('developer_guides');
    expect(result).toBe('Developer Guides');
  });

  it('should remove .md extension', () => {
    const result = fileToTitle('installation.md');
    expect(result).toBe('Installation');
  });

  it('should remove .mdx extension', () => {
    const result = fileToTitle('configuration.mdx');
    expect(result).toBe('Configuration');
  });

  it('should capitalize each word', () => {
    const result = fileToTitle('getting_started_guide');
    expect(result).toBe('Getting Started Guide');
  });

  it('should handle combination of prefix, underscores, and extension', () => {
    const result = fileToTitle('02_api_reference.md');
    expect(result).toBe('Api Reference');
  });

  it('should handle single word', () => {
    const result = fileToTitle('index');
    expect(result).toBe('Index');
  });

  it('should handle filename with multiple numeric prefixes', () => {
    const result = fileToTitle('01_section_02_subsection');
    expect(result).toBe('Section 02 Subsection');
  });

  it('should capitalize each word', () => {
    const result = fileToTitle('HTML_parser.md');
    expect(result).toBe('HTML Parser');
  });

  it('should handle empty string', () => {
    const result = fileToTitle('');
    expect(result).toBe('');
  });

  it('should handle string with only extension', () => {
    const result = fileToTitle('.md');
    expect(result).toBe('');
  });

  it('should handle string with only numeric prefix', () => {
    const result = fileToTitle('01_');
    expect(result).toBe('');
  });
});
