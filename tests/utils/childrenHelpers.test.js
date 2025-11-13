import {
  parseDocId,
  getParentPath,
  getFolderName,
  isChildOf,
  getSiblings,
  getChildren,
  getChildrenByFolder,
  filterDocsByNames,
  sortDocs,
  buildSlug,
} from '../../src/utils/childrenHelpers.js';

describe('childrenHelpers', () => {
  describe('parseDocId', () => {
    it('should parse a simple version root ID', () => {
      const result = parseDocId('v6/index');
      expect(result).toEqual({
        version: 'v6',
        pathParts: [],
        fileName: 'index',
        isIndex: true,
      });
    });

    it('should parse a nested document ID', () => {
      const result = parseDocId('v6/02_Developer_Guides/01_Some_Page');
      expect(result).toEqual({
        version: 'v6',
        pathParts: ['02_Developer_Guides'],
        fileName: '01_Some_Page',
        isIndex: false,
      });
    });

    it('should parse deeply nested document ID', () => {
      const result = parseDocId('v6/02_Developer_Guides/01_Subsection/03_Page');
      expect(result).toEqual({
        version: 'v6',
        pathParts: ['02_Developer_Guides', '01_Subsection'],
        fileName: '03_Page',
        isIndex: false,
      });
    });

    it('should recognize index files as index', () => {
      const result = parseDocId('v6/02_Developer_Guides/index');
      expect(result.isIndex).toBe(true);
      expect(result.pathParts).toEqual(['02_Developer_Guides']);
    });

    it('should recognize index.md files as index', () => {
      const result = parseDocId('v6/02_Developer_Guides/index.md');
      expect(result.isIndex).toBe(true);
    });

    it('should parse different versions', () => {
      const result3 = parseDocId('v3/02_Developer_Guides/index');
      const result5 = parseDocId('v5/02_Developer_Guides/index');
      expect(result3.version).toBe('v3');
      expect(result5.version).toBe('v5');
    });
  });

  describe('getParentPath', () => {
    it('should return null for version root', () => {
      const result = getParentPath('v6/index');
      expect(result).toBeNull();
    });

    it('should return version root for direct children', () => {
      const result = getParentPath('v6/02_Developer_Guides/index');
      expect(result).toBe('v6/index');
    });

    it('should return version root for files under single pathPart', () => {
      const result = getParentPath('v6/02_Developer_Guides/01_Some_Page');
      expect(result).toBe('v6/index');
    });

    it('should return parent folder for nested children (2+ pathParts)', () => {
      const result = getParentPath('v6/02_Developer_Guides/01_Subsection/03_Page');
      expect(result).toBe('v6/02_Developer_Guides/index');
    });
  });

  describe('getFolderName', () => {
    it('should return folder name from document', () => {
      const result = getFolderName('v6/02_Developer_Guides/01_Some_Page');
      expect(result).toBe('02_Developer_Guides');
    });

    it('should return last folder in nested path', () => {
      const result = getFolderName('v6/02_Developer_Guides/01_Subsection/03_Page');
      expect(result).toBe('01_Subsection');
    });

    it('should return empty string for version root', () => {
      const result = getFolderName('v6/index');
      expect(result).toBe('');
    });

    it('should return folder name for folder index', () => {
      const result = getFolderName('v6/02_Developer_Guides/index');
      expect(result).toBe('02_Developer_Guides');
    });
  });

  describe('isChildOf', () => {
    it('should identify direct children if child has one more pathPart', () => {
      const result = isChildOf('v6/02_Developer_Guides/01_Subsection/03_Page', 'v6/02_Developer_Guides/index');
      expect(result).toBe(true);
    });

    it('should return false if parent and child have same pathParts', () => {
      const result = isChildOf('v6/02_Developer_Guides/01_Subsection/03_Page', 'v6/02_Developer_Guides/01_Subsection/index');
      expect(result).toBe(false);
    });

    it('should identify nested children if child has one more pathPart', () => {
      const result = isChildOf(
        'v6/02_Developer_Guides/01_Subsection/03_Page',
        'v6/02_Developer_Guides/index'
      );
      expect(result).toBe(true);
    });

    it('should return false for non-children', () => {
      const result = isChildOf('v6/02_Developer_Guides/01_Some_Page', 'v6/03_API_Reference/index');
      expect(result).toBe(false);
    });

    it('should return false if parent is not an index', () => {
      const result = isChildOf('v6/02_Developer_Guides/01_Page', 'v6/02_Developer_Guides/01_Page');
      expect(result).toBe(false);
    });

    it('should return false for different versions', () => {
      const result = isChildOf(
        'v6/02_Developer_Guides/01_Some_Page',
        'v5/02_Developer_Guides/index'
      );
      expect(result).toBe(false);
    });

    it('should return false for pages that are too deep (more than one level)', () => {
      const result = isChildOf(
        'v6/02_Developer_Guides/01_Subsection/02_Page/03_Sub',
        'v6/02_Developer_Guides/index'
      );
      expect(result).toBe(false);
    });

    it('should identify children of version root', () => {
      const result = isChildOf('v6/02_Developer_Guides/index', 'v6/index');
      expect(result).toBe(true);
    });
  });

  describe('getSiblings', () => {
    const docs = [
      { id: 'v6/01_Getting_Started/index', data: { title: 'Getting Started' } },
      { id: 'v6/01_Getting_Started/01_Installation', data: { title: 'Installation' } },
      { id: 'v6/01_Getting_Started/02_Configuration', data: { title: 'Configuration' } },
      { id: 'v6/02_Developer_Guides/index', data: { title: 'Developer Guides' } },
      { id: 'v6/02_Developer_Guides/01_Routing', data: { title: 'Routing' } },
      { id: 'v6/02_Developer_Guides/02_Controllers', data: { title: 'Controllers' } },
    ];

    it('should return empty array for index files', () => {
      const result = getSiblings(docs, 'v6/01_Getting_Started/index');
      expect(result).toEqual([]);
    });

    it('should return pages that are siblings at root (both have single pathPart)', () => {
      const result = getSiblings(docs, 'v6/01_Getting_Started/01_Installation');
      expect(result.length).toBe(4);
      expect(result.every(d => !parseDocId(d.id).isIndex)).toBe(true);
    });

    it('should not include folders by default', () => {
      const result = getSiblings(docs, 'v6/01_Getting_Started/01_Installation');
      expect(result.every(d => !parseDocId(d.id).isIndex)).toBe(true);
    });

    it('should include folders when includeFolders is true', () => {
      const result = getSiblings(docs, 'v6/01_Getting_Started/01_Installation', true);
      expect(result.length).toBeGreaterThan(1);
      expect(result.some(d => parseDocId(d.id).isIndex)).toBe(true);
    });

    it('should return docs with same parent as siblings', () => {
      const singleDocs = [
        { id: 'v6/01_Getting_Started/index', data: { title: 'Getting Started' } },
        { id: 'v6/01_Getting_Started/01_Installation', data: { title: 'Installation' } },
      ];
      const result = getSiblings(singleDocs, 'v6/01_Getting_Started/01_Installation');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('v6/01_Getting_Started/01_Installation');
    });
  });

  describe('getChildren', () => {
    const docs = [
      { id: 'v6/index', data: { title: 'Home' } },
      { id: 'v6/01_Getting_Started/index', data: { title: 'Getting Started' } },
      { id: 'v6/01_Getting_Started/01_Installation/index', data: { title: 'Installation Folder' } },
      { id: 'v6/01_Getting_Started/01_Installation/01_Linux', data: { title: 'Linux' } },
      { id: 'v6/01_Getting_Started/02_Configuration', data: { title: 'Configuration' } },
      { id: 'v6/02_Developer_Guides/index', data: { title: 'Developer Guides' } },
    ];

    it('should get direct children of root (only folders)', () => {
      const result = getChildren(docs, 'v6/index');
      expect(result.map(d => d.id)).toContain('v6/01_Getting_Started/index');
      expect(result.map(d => d.id)).toContain('v6/02_Developer_Guides/index');
    });

    it('should get children of a folder (folders only by default)', () => {
      const result = getChildren(docs, 'v6/01_Getting_Started/index');
      expect(result.map(d => d.id)).toContain('v6/01_Getting_Started/01_Installation/index');
    });

    it('should include only index files by default (includeFolders=false)', () => {
      const result = getChildren(docs, 'v6/01_Getting_Started/index');
      expect(result.every(d => parseDocId(d.id).isIndex)).toBe(true);
    });

    it('should include all children when includeFolders is true', () => {
      const result = getChildren(docs, 'v6/01_Getting_Started/index', true);
      expect(result.length).toBe(2);
      expect(result.map(d => d.id)).toContain('v6/01_Getting_Started/01_Installation/index');
      expect(result.map(d => d.id)).toContain('v6/01_Getting_Started/01_Installation/01_Linux');
    });

    it('should not exclude grandchildren that match getParentPath', () => {
      const result = getChildren(docs, 'v6/01_Getting_Started/index', true);
      const hasGrandchildren = result.some(d => d.id.includes('01_Installation/01_Linux'));
      expect(hasGrandchildren).toBe(true);
    });

    it('should return empty for document with no children', () => {
      const result = getChildren(docs, 'v6/01_Getting_Started/01_Installation/index');
      expect(result.length).toBe(0);
    });
  });

  describe('getChildrenByFolder', () => {
    const docs = [
      { id: 'v6/index', data: { title: 'Home' } },
      { id: 'v6/01_Getting_Started/index', data: { title: 'Getting Started' } },
      { id: 'v6/01_Getting_Started/01_Installation/index', data: { title: 'Installation' } },
      { id: 'v6/01_Getting_Started/01_Installation/01_Linux', data: { title: 'Linux' } },
      { id: 'v6/01_Getting_Started/01_Installation/02_Windows', data: { title: 'Windows' } },
      { id: 'v6/01_Getting_Started/02_Configuration/index', data: { title: 'Configuration' } },
    ];

    it('should get children of a specific folder (folders only)', () => {
      const result = getChildrenByFolder(docs, 'v6/01_Getting_Started/index', '01_Installation');
      expect(result).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const result1 = getChildrenByFolder(docs, 'v6/01_Getting_Started/index', '01_Installation');
      const result2 = getChildrenByFolder(docs, 'v6/01_Getting_Started/index', '01_installation');
      expect(result1).toEqual(result2);
    });

    it('should return empty array for non-existent folder', () => {
      const result = getChildrenByFolder(docs, 'v6/01_Getting_Started/index', 'NonExistent');
      expect(result).toEqual([]);
    });

    it('should return empty array when folder name without prefix does not match', () => {
      const result = getChildrenByFolder(docs, 'v6/01_Getting_Started/index', 'Installation');
      expect(result).toEqual([]);
    });
  });

  describe('filterDocsByNames', () => {
    const docs = [
      { id: 'v6/01_Getting_Started/index' },
      { id: 'v6/02_Developer_Guides/index' },
      { id: 'v6/02_Developer_Guides/01_Routing' },
      { id: 'v6/03_API_Reference/index' },
    ];

    it('should filter docs by folder names (exact pathPart match)', () => {
      const result = filterDocsByNames(docs, ['02_Developer_Guides']);
      expect(result.length).toBe(2);
    });

    it('should return multiple docs matching names', () => {
      const result = filterDocsByNames(docs, ['02_Developer_Guides', '03_API_Reference']);
      expect(result.length).toBe(3);
    });

    it('should be case-insensitive', () => {
      const result = filterDocsByNames(docs, ['01_getting_started']);
      expect(result.length).toBe(1);
    });

    it('should return empty array for non-matching names', () => {
      const result = filterDocsByNames(docs, ['NonExistent']);
      expect(result).toEqual([]);
    });

    it('should handle matching files based on last pathPart', () => {
      const result = filterDocsByNames(docs, ['01_Routing']);
      expect(result.length).toBe(0);
    });
  });

  describe('sortDocs', () => {
    it('should sort by order field first', () => {
      const docs = [
        { id: 'v6/03_page', order: 3, data: { title: 'Page C' } },
        { id: 'v6/01_page', order: 1, data: { title: 'Page A' } },
        { id: 'v6/02_page', order: 2, data: { title: 'Page B' } },
      ];
      const result = sortDocs(docs);
      expect(result.map(d => d.id)).toEqual(['v6/01_page', 'v6/02_page', 'v6/03_page']);
    });

    it('should fall back to data.order if order not present', () => {
      const docs = [
        { id: 'v6/03_page', data: { order: 3, title: 'Page C' } },
        { id: 'v6/01_page', data: { order: 1, title: 'Page A' } },
        { id: 'v6/02_page', data: { order: 2, title: 'Page B' } },
      ];
      const result = sortDocs(docs);
      expect(result.map(d => d.id)).toEqual(['v6/01_page', 'v6/02_page', 'v6/03_page']);
    });

    it('should sort by title when order is not specified', () => {
      const docs = [
        { id: 'v6/03_page', data: { title: 'Zebra' } },
        { id: 'v6/01_page', data: { title: 'Apple' } },
        { id: 'v6/02_page', data: { title: 'Banana' } },
      ];
      const result = sortDocs(docs);
      expect(result.map(d => d.data.title)).toEqual(['Apple', 'Banana', 'Zebra']);
    });

    it('should sort by title when order is Infinity', () => {
      const docs = [
        { id: 'v6/page3', order: Infinity, data: { title: 'Zebra' } },
        { id: 'v6/page1', order: 1, data: { title: 'Apple' } },
        { id: 'v6/page2', order: Infinity, data: { title: 'Banana' } },
      ];
      const result = sortDocs(docs);
      expect(result.map(d => d.id)).toEqual(['v6/page1', 'v6/page2', 'v6/page3']);
    });

    it('should use folder name as fallback title', () => {
      const docs = [
        { id: 'v6/Zebra_Folder/index' },
        { id: 'v6/Apple_Folder/index' },
        { id: 'v6/Banana_Folder/index' },
      ];
      const result = sortDocs(docs);
      expect(result.map(d => getFolderName(d.id))).toEqual([
        'Apple_Folder',
        'Banana_Folder',
        'Zebra_Folder',
      ]);
    });

    it('should be case-insensitive for title sorting', () => {
      const docs = [
        { id: 'v6/page3', data: { title: 'zebra' } },
        { id: 'v6/page1', data: { title: 'APPLE' } },
        { id: 'v6/page2', data: { title: 'Banana' } },
      ];
      const result = sortDocs(docs);
      expect(result.map(d => d.data.title)).toEqual(['APPLE', 'Banana', 'zebra']);
    });

    it('should not modify original array', () => {
      const docs = [
        { id: 'v6/page3', order: 3 },
        { id: 'v6/page1', order: 1 },
      ];
      const original = [...docs];
      sortDocs(docs);
      expect(docs).toEqual(original);
    });
  });

  describe('buildSlug', () => {
    it('should build slug from simple folder-based document ID', () => {
      const result = buildSlug('v6/02_Developer_Guides/index');
      expect(result).toBe('/en/6/developer-guides/');
    });

    it('should handle root index with empty pathParts', () => {
      const result = buildSlug('v6/index');
      expect(result).toBe('/en/6//');
    });

    it('should convert underscores to hyphens', () => {
      const result = buildSlug('v6/02_Developer_Guides/index');
      expect(result).toBe('/en/6/developer-guides/');
    });

    it('should handle deeply nested paths', () => {
      const result = buildSlug('v6/02_Developer_Guides/01_Subsection/index');
      expect(result).toBe('/en/6/developer-guides/subsection/');
    });

    it('should strip numeric prefixes from all parts', () => {
      const result = buildSlug('v6/01_Getting_Started/02_Installation/index');
      expect(result).toBe('/en/6/getting-started/installation/');
    });

    it('should convert v3 to 3', () => {
      const result = buildSlug('v3/02_Developer_Guides/index');
      expect(result).toBe('/en/3/developer-guides/');
    });

    it('should convert v5 to 5', () => {
      const result = buildSlug('v5/02_Developer_Guides/index');
      expect(result).toBe('/en/5/developer-guides/');
    });

    it('should lowercase all text', () => {
      const result = buildSlug('v6/02_DEVELOPER_GUIDES/index');
      expect(result).toBe('/en/6/developer-guides/');
    });

    it('should handle single-word folders', () => {
      const result = buildSlug('v6/01_API/index');
      expect(result).toBe('/en/6/api/');
    });

    it('should use pathParts for slug, ignoring fileName', () => {
      const result = buildSlug('v6/02_Developer_Guides/01_Some_Page');
      expect(result).toBe('/en/6/developer-guides/');
    });

    it('should preserve order but remove leading numeric prefix', () => {
      const result = buildSlug('v6/01_First/02_Second/03_Third/index');
      expect(result).toBe('/en/6/first/second/third/');
    });
  });
});
