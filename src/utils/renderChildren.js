import { getCollection } from 'astro:content';
import { getChildren, sortDocs, buildSlug, parseDocId } from './childrenHelpers.js';

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

    // Get all docs for this version
    const allDocs = await getCollection('docs', ({ id }) =>
      id.startsWith(`${parsed.version}/`)
    );

    // Get children of current doc
    let children = getChildren(allDocs, currentDocId, includeFolders);

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
