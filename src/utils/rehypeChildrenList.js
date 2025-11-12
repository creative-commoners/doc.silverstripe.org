import { visit } from 'unist-util-visit';
import {
  parseDocId,
  getChildren,
  getSiblings,
  getChildrenByFolder,
  sortDocs,
  buildSlug,
  getFolderName
} from './childrenHelpers.js';

/**
 * Rehype plugin to render [CHILDREN] blocks
 * 
 * This plugin runs on the HTML tree and replaces .children-list-placeholder divs
 * with rendered children content. It queries the content collection to build the lists.
 */
export default function rehypeChildrenList() {
  console.log({where: 'rehypeChildrenList initialized'});
  return async (tree, vfile) => {
    // Dynamically import getCollection
    console.log({where: 'rehypeChildrenList plugin A', tree, vfile});
    let getCollection;
    try {
      const module = await import('astro:content');
      getCollection = module.getCollection;
    } catch (err) {
      console.log({where: 'rehypeChildrenList plugin A ERROR', err});
      return;
    }
    console.log({where: 'rehypeChildrenList plugin B'});
    
    // Get ALL docs once
    let allDocs;
    try {
      allDocs = await getCollection('docs');
    } catch (err) {
      return;
    }
    
    // Try to determine the current document ID
    let currentDocId = null;
    if (vfile.history && vfile.history.length > 0) {
      const filePath = vfile.history[0];
      const patterns = [
        /\.cache[/\\]content[/\\]docs[/\\](.*?)\.(md|mdx)$/i,
        /src[/\\]content[/\\]docs[/\\](.*?)\.(md|mdx)$/i,
        /content[/\\]docs[/\\](.*?)\.(md|mdx)$/i
      ];
      
      for (const pattern of patterns) {
        const match = filePath.match(pattern);
        if (match) {
          currentDocId = match[1];
          break;
        }
      }
    }
    
    // If still not found, try to match by ending
    if (!currentDocId && vfile.basename) {
      const fileWithoutExt = vfile.basename.replace(/\.(md|mdx)$/i, '');
      const matching = allDocs.find(doc => {
        const docPath = doc.id.split('/').pop();
        return docPath === fileWithoutExt || doc.id.endsWith('/' + fileWithoutExt);
      });
      if (matching) {
        currentDocId = matching.id;
      }
    }
    
    if (!currentDocId) {
      return;
    }
    
    const nodesToProcess = [];
    
    // Collect all placeholder nodes
    visit(tree, 'element', (node) => {
      if (node.tagName === 'div') {
        const classes = node.properties?.class;
        const hasPlaceholder = 
          (Array.isArray(classes) && classes.includes('children-list-placeholder')) ||
          (typeof classes === 'string' && classes.includes('children-list-placeholder'));
        if (hasPlaceholder) {
          nodesToProcess.push(node);
        }
      }
    });

    // Process each placeholder
    for (const node of nodesToProcess) {
      try {
        const props = node.properties || {};
        
        // Build props from data attributes
        const folder = props['data-folder'];
        const only = props['data-only'] ? props['data-only'].split(',').map(s => s.trim()) : undefined;
        const exclude = props['data-exclude'] ? props['data-exclude'].split(',').map(s => s.trim()) : undefined;
        const asList = props['data-as-list'] === 'true';
        const includeFolders = props['data-include-folders'] === 'true';
        const reverse = props['data-reverse'] === 'true';
        
        // Parse version
        const parsed = parseDocId(currentDocId);
        const versionDocs = allDocs.filter(doc => doc.id.startsWith(`${parsed.version}/`));
        
        // Get children using the same logic as ChildrenList.astro
        let children = [];
        
        if (folder) {
          children = getChildrenByFolder(versionDocs, currentDocId, folder);
        } else if (only) {
          const matchingFolders = getChildren(versionDocs, currentDocId, true).filter(doc => {
            const folderName = getFolderName(doc.id);
            return only.some(name => name.toLowerCase() === folderName.toLowerCase());
          });
          
          for (const parentFolder of matchingFolders) {
            const folderChildren = getChildren(versionDocs, parentFolder.id, false);
            children.push(...folderChildren);
          }
        } else if (exclude) {
          children = getChildren(versionDocs, currentDocId, includeFolders);
          children = children.filter(doc => {
            const folderName = getFolderName(doc.id);
            return !exclude.some(name => name.toLowerCase() === folderName.toLowerCase());
          });
        } else {
          if (parsed.isIndex) {
            children = getChildren(versionDocs, currentDocId, includeFolders);
          } else {
            children = getSiblings(versionDocs, currentDocId, includeFolders);
          }
        }
        
        // Sort
        children = sortDocs(children);
        
        // Reverse if needed
        if (reverse) {
          children.reverse();
        }
        
        // Skip if no children
        if (children.length === 0) {
          node.children = [];
          continue;
        }
        
        // Generate child elements
        const childElements = children.map(child => {
          const iconClass = child.data.iconBrand 
            ? `fab fa-${child.data.iconBrand}` 
            : `fas fa-${child.data.icon || 'file-alt'}`;
          const title = child.data.title || getFolderName(child.id);
          const slug = buildSlug(child.id);
          
          if (asList) {
            return {
              type: 'element',
              tagName: 'dt',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'a',
                  properties: { href: slug },
                  children: [{ type: 'text', value: title }]
                }
              ]
            };
          } else {
            return {
              type: 'element',
              tagName: 'div',
              properties: { className: ['col-12', 'col-lg-6', 'py-3'] },
              children: [
                {
                  type: 'element',
                  tagName: 'div',
                  properties: { className: ['card', 'shadow-sm'] },
                  children: [
                    {
                      type: 'element',
                      tagName: 'div',
                      properties: { className: 'card-body' },
                      children: [
                        {
                          type: 'element',
                          tagName: 'h5',
                          properties: { className: 'card-title' },
                          children: [
                            {
                              type: 'element',
                              tagName: 'span',
                              properties: { className: ['theme-icon-holder', 'card-icon-holder', 'mr-2'] },
                              children: [
                                {
                                  type: 'element',
                                  tagName: 'i',
                                  properties: { className: iconClass.split(' ') },
                                  children: []
                                }
                              ]
                            },
                            {
                              type: 'element',
                              tagName: 'span',
                              properties: { className: 'card-title-text' },
                              children: [{ type: 'text', value: title }]
                            }
                          ]
                        },
                        {
                          type: 'element',
                          tagName: 'div',
                          properties: { className: 'card-text' },
                          children: [{ type: 'text', value: child.data.summary || '' }]
                        },
                        {
                          type: 'element',
                          tagName: 'a',
                          properties: { 
                            className: 'card-link-mask',
                            href: slug,
                            'aria-label': title
                          },
                          children: []
                        }
                      ]
                    }
                  ]
                }
              ]
            };
          }
        });
        
        // Update the placeholder node
        node.tagName = 'div';
        node.properties = node.properties || {};
        node.properties.className = ['docs-overview', 'py-5'];
        
        if (asList) {
          // For list view, wrap in dl
          const dtElements = childElements;
          const ddElements = children.map(child => ({
            type: 'element',
            tagName: 'dd',
            properties: {},
            children: [{ type: 'text', value: child.data.summary || '' }]
          }));
          
          const dlChildren = [];
          for (let i = 0; i < dtElements.length; i++) {
            dlChildren.push(dtElements[i]);
            dlChildren.push(ddElements[i]);
          }
          
          node.children = [
            {
              type: 'element',
              tagName: 'dl',
              properties: {},
              children: dlChildren
            }
          ];
        } else {
          node.children = [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: 'row' },
              children: childElements
            }
          ];
        }
      } catch (err) {
        // Silently skip on error
      }
    }
  };
}
