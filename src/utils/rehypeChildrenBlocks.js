import { visit } from 'unist-util-visit';
import { deserializeChildrenData, isChildrenMarker } from './childrenMarkersUtils.js';

/**
 * Rehype plugin to transform CHILDREN_BLOCK comment markers
 * into placeholder div elements that can be replaced during build
 */
export default function rehypeChildrenBlocks() {
  return (tree) => {
    visit(tree, ['comment', 'raw'], (node, index, parent) => {
      let trimmedValue = null;
      
      if (node.type === 'comment') {
        trimmedValue = node.value?.trim();
      } else if (node.type === 'raw') {
        // Handle raw HTML from remark-rehype with allowDangerousHtml: true
        const match = node.value?.match(/<!--\s*(CHILDREN_BLOCK:.*?)\s*-->/);
        trimmedValue = match?.[1];
      }
      
      if (!trimmedValue || !isChildrenMarker(trimmedValue)) {
        return;
      }
      
      const metadata = deserializeChildrenData(trimmedValue);
      if (!metadata) {
        return;
      }
      
      // Create placeholder div with data attributes
      const placeholder = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['astro-children-list-placeholder'],
          dataCurrentDocId: metadata.currentDocId || '',
          dataFolder: metadata.folder || '',
          dataCategory: metadata.category || '',
          dataOnly: metadata.only ? metadata.only.join(',') : '',
          dataExclude: metadata.exclude ? metadata.exclude.join(',') : '',
          dataAsList: metadata.asList ? 'true' : 'false',
          dataIncludeFolders: metadata.includeFolders ? 'true' : 'false',
          dataReverse: metadata.reverse ? 'true' : 'false'
        },
        children: []
      };
      
      // Replace comment/raw with placeholder
      parent.children[index] = placeholder;
    });
  };
}
