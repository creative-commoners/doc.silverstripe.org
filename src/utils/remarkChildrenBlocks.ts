import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

export interface ChildrenBlockData {
  folder?: string;
  only?: string[];
  exclude?: string[];
  asList?: boolean;
  includeFolders?: boolean;
  reverse?: boolean;
}

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
function parseChildrenBlock(text: string): ChildrenBlockData | null {
  const childrenMatch = text.match(/^\[CHILDREN(.*?)\]$/);
  if (!childrenMatch) return null;
  
  const attributes = childrenMatch[1].trim();
  const data: ChildrenBlockData = {};
  
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
 * Remark plugin to replace [CHILDREN] blocks with custom HTML elements
 * 
 * This creates <childrenlistrenderer> elements with attributes that will be
 * rendered by the ChildrenRenderer.astro script component
 */
export default function remarkChildrenBlocks() {
  return (tree: Root) => {
    console.log('🦄 remarkChildrenBlocks() remark plugin initialized');
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index === undefined) return;
      
      // Check if paragraph contains only [CHILDREN] text
      if (node.children.length === 1 && node.children[0].type === 'text') {
        const text = node.children[0].value.trim();
        console.log('📝 Checking paragraph:', text);
        const childrenData = parseChildrenBlock(text);
        
        if (childrenData) {
          console.log('✅ [CHILDREN] block parsed:', JSON.stringify(childrenData));
          // Build HTML attributes
          const attrs: string[] = [];
          
          if (childrenData.folder) {
            attrs.push(`folder="${childrenData.folder}"`);
          }
          if (childrenData.only) {
            attrs.push(`only="${childrenData.only.join(',')}"`);
          }
          if (childrenData.exclude) {
            attrs.push(`exclude="${childrenData.exclude.join(',')}"`);
          }
          if (childrenData.asList) {
            attrs.push('as-list="true"');
          }
          if (childrenData.includeFolders) {
            attrs.push('include-folders="true"');
          }
          if (childrenData.reverse) {
            attrs.push('reverse="true"');
          }
          
          // Create custom HTML element
          const html = `<childrenlistrenderer ${attrs.join(' ')}></childrenlistrenderer>`;
          console.log('🏗️ Created HTML element:', html);
          
          // Replace paragraph with HTML node
          parent.children[index] = {
            type: 'html',
            value: html,
          } as any;
          console.log('✨ Paragraph replaced with childrenlistrenderer element');
        }
      }
    });
  };
}
