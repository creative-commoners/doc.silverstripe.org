import { visit } from 'unist-util-visit';

/**
 * Remark plugin that converts images with relative paths to raw HTML img tags
 * This prevents Astro from trying to import them as modules
 */
export function remarkConvertImagesToPictures() {
  return (tree) => {
    visit(tree, 'image', (node, index, parent) => {
      // Only process relative paths (not starting with http or /)
      if (node.url && !node.url.startsWith('http') && !node.url.startsWith('/')) {
        // Create an HTML node with the img tag
        // This will bypass Astro's import handling
        const html = `<img src="${node.url}" alt="${node.alt || ''}" />`;
        
        // Replace the image node with an HTML node
        parent.children[index] = {
          type: 'html',
          value: html
        };
      }
    });
  };
}

export default remarkConvertImagesToPictures;
