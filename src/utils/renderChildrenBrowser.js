/**
 * Browser-compatible version of renderChildrenListStatic
 * Fetches content data from the docs index rather than using astro:content
 */

let docsIndex = null;

// Load docs index
async function getDocsIndex() {
  if (docsIndex) return docsIndex;
  
  try {
    const response = await fetch('/docs-index.json');
    docsIndex = await response.json();
    return docsIndex;
  } catch (error) {
    console.error('Failed to load docs index:', error);
    return {};
  }
}

/**
 * Parse version from doc ID
 */
function parseDocId(docId) {
  const parts = docId.split('/');
  if (parts.length < 1) return null;
  
  const version = parts[0];
  if (!version.startsWith('v')) return null;
  
  return { version, isIndex: parts[parts.length - 1] === 'index' };
}

/**
 * Get children of a document from the docs index
 */
function getChildrenFromIndex(docId, docsIndex, includeFolders = false) {
  const docParts = docId.split('/').filter(Boolean);
  const parentPath = docParts.slice(0, -1).join('/');
  
  const children = [];
  
  for (const [id, data] of Object.entries(docsIndex)) {
    // Skip if not in same version
    if (!id.startsWith(docParts[0])) continue;
    
    const idParts = id.split('/').filter(Boolean);
    const childPath = idParts.slice(0, -1).join('/');
    
    // Check if this is a direct child
    if (childPath === parentPath && id !== docId) {
      children.push({
        id: id,
        data: data
      });
    }
  }
  
  return children;
}

/**
 * Sort documents by title/order
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
 * Escape HTML
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render children as grid HTML
 */
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

/**
 * Render children as list HTML
 */
function renderAsList(children) {
  const items = children.map(child => {
    const slug = buildSlug(child.id);
    const title = child.data.title || 'Untitled';

    return `<li><a href="${slug}">${escapeHtml(title)}</a></li>`;
  }).join('\n');

  return `<ul class="children-list">\n${items}\n</ul>`;
}

/**
 * Render ChildrenList as HTML string (browser version)
 */
export async function renderChildrenListBrowser(options) {
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
    const docsIndex = await getDocsIndex();
    const parsed = parseDocId(currentDocId);
    
    if (!parsed) {
      return '<!-- CHILDREN: Invalid currentDocId -->';
    }

    // Get children
    let children = getChildrenFromIndex(currentDocId, docsIndex, includeFolders);

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

    // Render
    if (asList) {
      return renderAsList(children);
    } else {
      return renderAsGrid(children);
    }

  } catch (error) {
    return `<!-- CHILDREN: Error - ${error.message} -->`;
  }
}
