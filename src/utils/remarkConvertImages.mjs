import { visit } from 'unist-util-visit';

/**
 * Remark plugin that optimizes images for documentation
 * - Converts relative paths to use img tags with lazy loading
 * - Preserves remote URLs as-is
 * - Adds responsive attributes for better performance
 */
export function remarkConvertImagesToPictures() {
  return (tree) => {
    visit(tree, 'image', (node, index, parent) => {
      if (!node.url) return;

      // Handle relative paths (local images)
      if (!node.url.startsWith('http') && !node.url.startsWith('/')) {
        // Create HTML with lazy loading and responsive attributes
        const title = node.title ? ` title="${node.title}"` : '';
        const html = `<img 
          src="${node.url}" 
          alt="${node.alt || ''}"${title}
          loading="lazy"
          style="max-width: 100%; height: auto; display: block; border-radius: 0.25rem;"
        />`;
        
        parent.children[index] = {
          type: 'html',
          value: html
        };
      } else if (node.url.startsWith('http')) {
        // Handle remote images with lazy loading
        const title = node.title ? ` title="${node.title}"` : '';
        const html = `<img 
          src="${node.url}" 
          alt="${node.alt || ''}"${title}
          loading="lazy"
          style="max-width: 100%; height: auto; display: block; border-radius: 0.25rem;"
        />`;
        
        parent.children[index] = {
          type: 'html',
          value: html
        };
      }
    });
  };
}

export default remarkConvertImagesToPictures;
