import { visit } from 'unist-util-visit';

let hasLogged = false;

/**
 * Parse [CHILDREN] syntax from text
 * Supports variations like:
 * - [CHILDREN]
 * - [CHILDREN asList]
 * - [CHILDREN Folder="02_Developer_Guides"]
 * - [CHILDREN Folder=Field_types]
 * - [CHILDREN Only="rc,beta,alpha" includeFolders]
 * - [CHILDREN reverse]
 */
function parseChildrenBlock(text) {
  const childrenMatch = text.match(/^\[CHILDREN(.*?)\]$/);
  if (!childrenMatch) return null;
  
  const attributes = childrenMatch[1].trim();
  const data = {};
  
  // Parse Folder attribute
  const folderMatch = attributes.match(/Folder=["']?([A-Za-z0-9_<>\/]+)["']?/);
  if (folderMatch) {
    // Replace <em> tags and normalize folder name
    data.folder = folderMatch[1].replace(/<\/?em>/g, '_');
  }
  
  // Parse Only attribute
  const onlyMatch = attributes.match(/Only=["']?([A-Za-z0-9_,]+)["']?/);
  if (onlyMatch) {
    data.only = onlyMatch[1].split(',').map(s => s.trim());
  }
  
  // Parse Exclude attribute
  const excludeMatch = attributes.match(/Exclude=["']?([A-Za-z0-9_,]+)["']?/);
  if (excludeMatch) {
    data.exclude = excludeMatch[1].split(',').map(s => s.trim());
  }
  
  // Parse boolean flags
  data.asList = /\basList\b/.test(attributes);
  data.includeFolders = /\bincludeFolders\b/.test(attributes);
  data.reverse = /\breverse\b/.test(attributes);
  
  return data;
}

/**
 * Remark plugin to replace [CHILDREN] blocks with HTML elements
 * 
 * For Markdown files, creates HTML elements that will be processed by a rehype plugin.
 * The HTML elements are then converted to Astro ChildrenList components by a rehype plugin.
 * 
 * The currentDocId is derived from the file's ID in Astro's content collection.
 */
export default function remarkChildrenBlocks(options = {}) {
  return (tree, vfile) => {
    // Extract currentDocId from VFile data
    // Astro passes the file's collection entry ID in vfile.data
    let currentDocId = null;
    
    if (vfile.data?.astro?.frontmatter?.docId) {
      currentDocId = vfile.data.astro.frontmatter.docId;
    } else if (vfile.data?.astro?.id) {
      currentDocId = vfile.data.astro.id;
    } else if (options.currentDocId) {
      currentDocId = options.currentDocId;
    }
    
    // If still not found, try to derive from file path
    if (!currentDocId && vfile.path) {
      const match = vfile.path.match(/\.cache[/\\]content[/\\]docs[/\\](.*?)\.(md|mdx)$/i);
      if (match) {
        currentDocId = match[1];
      }
    }
    
    if (!hasLogged && currentDocId) {
      hasLogged = true;
    }
    
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index === undefined) return;
      
      // Check if paragraph contains only [CHILDREN] text
      if (node.children.length === 1 && node.children[0].type === 'text') {
        const text = node.children[0].value.trim();
        const childrenData = parseChildrenBlock(text);
        
        if (childrenData) {
          // Build AST node for the placeholder div
          const properties = { class: 'children-list-placeholder' };
          
          if (currentDocId) {
            properties['data-current-doc-id'] = currentDocId;
          }
          
          if (childrenData.folder) {
            properties['data-folder'] = childrenData.folder;
          }
          
          if (childrenData.only && childrenData.only.length > 0) {
            properties['data-only'] = childrenData.only.join(',');
          }
          
          if (childrenData.exclude && childrenData.exclude.length > 0) {
            properties['data-exclude'] = childrenData.exclude.join(',');
          }
          
          if (childrenData.asList) {
            properties['data-as-list'] = 'true';
          }
          
          if (childrenData.includeFolders) {
            properties['data-include-folders'] = 'true';
          }
          
          if (childrenData.reverse) {
            properties['data-reverse'] = 'true';
          }
          
          // Create proper AST element node instead of raw HTML
          parent.children[index] = {
            type: 'element',
            tagName: 'div',
            properties,
            children: []
          };
        }
      }
    });
  };
}

