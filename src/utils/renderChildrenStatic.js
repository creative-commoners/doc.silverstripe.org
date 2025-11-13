import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = path.join(__dirname, '../../.cache/content/docs');

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    return data;
  } catch {
    return {};
  }
}

/**
 * Get document ID from file path
 */
function getDocId(filePath) {
  const relative = path.relative(contentRoot, filePath);
  return relative.replace(/\\/g, '/').replace(/\.md(x)?$/, '');
}

/**
 * Parse version and slug from doc ID
 */
function parseDocId(docId) {
  const parts = docId.split('/');
  if (parts.length < 1) return null;
  
  const version = parts[0];
  if (!version.startsWith('v')) return null;
  
  return { version };
}

/**
 * Get children of a document
 */
function getChildrenDocs(docId, includeFolders = false) {
  try {
    const docParts = docId.split('/');
    // Remove the filename (last part) to get the directory
    docParts.pop();
    
    // Insert 'docs/en' after version if not already present
    // Convert: v6/02_Developer_Guides -> v6/docs/en/02_Developer_Guides
    if (docParts.length > 0 && docParts[0].match(/^v\d+$/)) {
      // Check if 'docs' is already in the path
      if (!docParts.includes('docs')) {
        docParts.splice(1, 0, 'docs', 'en');
      }
    }
    
    const parentDir = path.join(contentRoot, ...docParts);
    
    if (!fs.existsSync(parentDir)) {
      return [];
    }
    
    const items = fs.readdirSync(parentDir);
    const children = [];
    
    for (const item of items) {
      const itemPath = path.join(parentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && includeFolders) {
        // Check for index file in folder
        const indexPath = path.join(itemPath, 'index.md');
        if (fs.existsSync(indexPath)) {
          const childDocId = getDocId(indexPath);
          const frontmatter = parseFrontmatter(indexPath);
          children.push({
            id: childDocId,
            data: frontmatter
          });
        }
      } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
        const childDocId = getDocId(itemPath);
        const frontmatter = parseFrontmatter(itemPath);
        children.push({
          id: childDocId,
          data: frontmatter
        });
      }
    }
    
    return children;
  } catch {
    return [];
  }
}

/**
 * Sort documents by title
 */
function sortDocs(docs) {
  return docs.sort((a, b) => {
    const aOrder = a.data.order ?? Number.MAX_VALUE;
    const bOrder = b.data.order ?? Number.MAX_VALUE;
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    
    const aTitle = a.data.title || a.id.split('/').pop() || '';
    const bTitle = b.data.title || b.id.split('/').pop() || '';
    return aTitle.localeCompare(bTitle);
  });
}

/**
 * Build slug from doc ID
 */
function buildSlug(docId) {
  const parts = docId.split('/');
  const version = parts[0];
  const slug = parts.slice(1).join('/');
  return `/en/${version}/${slug}/`;
}

/**
 * Render ChildrenList as static HTML string
 * This runs at build time during the astro:build:done hook
 */
export async function renderChildrenListStatic(options) {
  const {
    currentDocId,
    folder = '',
    only = [],
    exclude = [],
    asList = false,
    includeFolders = false,
    reverse = false
  } = options;

  if (!currentDocId) {
    return '<!-- CHILDREN: Missing currentDocId -->';
  }

  try {
    const parsed = parseDocId(currentDocId);
    if (!parsed) {
      return '<!-- CHILDREN: Invalid currentDocId -->';
    }

    // Get children of current doc
    let children = getChildrenDocs(currentDocId, includeFolders);

    // Apply filters
    if (folder) {
      children = children.filter(doc => {
        const docParts = doc.id.split('/');
        const docFolder = docParts[docParts.length - 2];
        return docFolder === folder;
      });
    }

    if (only.length > 0) {
      children = children.filter(doc =>
        only.some(term => doc.id.includes(term))
      );
    }

    if (exclude.length > 0) {
      children = children.filter(doc =>
        !exclude.some(term => doc.id.includes(term))
      );
    }

    // Sort
    children = sortDocs(children);
    if (reverse) {
      children = children.reverse();
    }

    if (children.length === 0) {
      return '<!-- CHILDREN: No children found -->';
    }

    // Render as HTML
    if (asList) {
      return renderAsList(children);
    } else {
      return renderAsGrid(children);
    }

  } catch (error) {
    return `<!-- CHILDREN: Error - ${error.message} -->`;
  }
}

function renderAsGrid(children) {
  const cards = children.map(child => {
    const slug = buildSlug(child.id);
    const title = child.data.title || 'Untitled';
    const summary = child.data.summary || '';
    const icon = child.data.icon || 'file-alt';

    return `
        <div class="docs-overview__item card">
          <div class="card-body">
            <h3 class="card-title">
              <i class="fas fa-${icon}"></i>
              <a href="${slug}">${escapeHtml(title)}</a>
            </h3>
            ${summary ? `<p class="card-text">${escapeHtml(summary)}</p>` : ''}
          </div>
        </div>
      `.trim();
  }).join('\n');

  return `<div class="docs-overview">\n${cards}\n</div>`;
}

function renderAsList(children) {
  const items = children.map(child => {
    const slug = buildSlug(child.id);
    const title = child.data.title || 'Untitled';

    return `<li><a href="${slug}">${escapeHtml(title)}</a></li>`;
  }).join('\n');

  return `<ul class="children-list">\n${items}\n</ul>`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
