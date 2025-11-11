import { visit } from 'unist-util-visit';
import type { Element } from 'hast';

/**
 * Rehype plugin to process ChildrenListRenderer custom elements
 * This converts lowercase custom elements to proper Astro islands
 */
export default function rehypeChildrenRenderer() {
  return (tree: any) => {
    console.log('🔧 rehypeChildrenRenderer() rehype plugin initialized');
    let elementCount = 0;
    
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'childrenlistrenderer' || node.tagName === 'ChildrenListRenderer') {
        elementCount++;
        console.log(`🔍 Found <${node.tagName}> element #${elementCount}`);
        console.log('📋 Original properties:', JSON.stringify(node.properties));
        
        // Convert to a special marker that Astro can hydrate
        // We'll add a data attribute to indicate this should be hydrated with ChildrenListRenderer
        node.tagName = 'div';
        node.properties = node.properties || {};
        node.properties.className = (node.properties.className || '') + ' children-list-renderer';
        node.properties['data-component'] = 'ChildrenListRenderer';
        
        // Copy over the props as data attributes
        if (node.properties.folder) {
          node.properties['data-folder'] = node.properties.folder;
          console.log('  📂 data-folder:', node.properties.folder);
        }
        if (node.properties.only) {
          node.properties['data-only'] = node.properties.only;
          console.log('  🔖 data-only:', node.properties.only);
        }
        if (node.properties.exclude) {
          node.properties['data-exclude'] = node.properties.exclude;
          console.log('  🚫 data-exclude:', node.properties.exclude);
        }
        if (node.properties.aslist) {
          node.properties['data-as-list'] = 'true';
          console.log('  📄 data-as-list: true');
        }
        if (node.properties.includefolders) {
          node.properties['data-include-folders'] = 'true';
          console.log('  📁 data-include-folders: true');
        }
        if (node.properties.reverse) {
          node.properties['data-reverse'] = 'true';
          console.log('  🔄 data-reverse: true');
        }
        
        console.log('✨ Converted to div with data attributes');
      }
    });
    
    console.log(`✅ rehypeChildrenRenderer processed ${elementCount} elements`);
  };
}
