// This script runs after the page has fully loaded and renders [CHILDREN] blocks
// It finds all <childrenlistrenderer> elements and populates them with content

async function renderChildrenBlocks() {
  // Get current document ID
  const wrapper = document.querySelector('[data-current-doc-id]');
  const currentDocId = wrapper?.getAttribute('data-current-doc-id');
  
  if (!currentDocId) {
    console.warn('[CHILDREN] renderer: Could not find document ID');
    return;
  }

  // Load docs index
  let docsIndex;
  try {
    const response = await fetch('/docs-index.json');
    if (!response.ok) throw new Error('Failed to load docs index');
    docsIndex = await response.json();
  } catch (err) {
    console.error('[CHILDREN] renderer: Failed to load docs index:', err);
    return;
  }

  // Import helpers
  const { parseDocId, getChildren, getSiblings, getChildrenByFolder, sortDocs, buildSlug, getFolderName } = await import('/src/utils/childrenHelpers.ts');

  // Process all [CHILDREN] elements
  const childrenElements = document.querySelectorAll('childrenlistrenderer');
  
  for (const el of childrenElements) {
    try {
      const folder = el.getAttribute('folder');
      const only = el.getAttribute('only')?.split(',');
      const exclude = el.getAttribute('exclude')?.split(',');
      const asList = el.getAttribute('as-list') === 'true';
      const includeFolders = el.getAttribute('include-folders') === 'true';
      const reverse = el.getAttribute('reverse') === 'true';

      const parsed = parseDocId(currentDocId);
      const versionDocs = docsIndex.filter((doc) => doc.id.startsWith(`${parsed.version}/`));

      let children = [];

      if (folder) {
        children = getChildrenByFolder(versionDocs, currentDocId, folder);
      } else if (only) {
        const matchingFolders = getChildren(versionDocs, currentDocId, true).filter((doc) => {
          const folderName = getFolderName(doc.id);
          return only.some(name => name.toLowerCase() === folderName.toLowerCase());
        });
        
        for (const parentFolder of matchingFolders) {
          const folderChildren = getChildren(versionDocs, parentFolder.id, false);
          children.push(...folderChildren);
        }
      } else if (exclude) {
        children = getChildren(versionDocs, currentDocId, includeFolders);
        children = children.filter((doc) => {
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

      children = sortDocs(children);
      if (reverse) children.reverse();

      if (children.length === 0) {
        el.remove();
        continue;
      }

      // Render HTML
      let html = '<div class="docs-overview py-5">';
      
      if (asList) {
        html += '<dl>';
        for (const child of children) {
          const title = child.title || getFolderName(child.id);
          const slug = buildSlug(child.id);
          const summary = escapeHtml(child.summary || '');
          html += `<dt><a href="${escapeHtml(slug)}">${escapeHtml(title)}</a></dt><dd>${summary}</dd>`;
        }
        html += '</dl>';
      } else {
        html += '<div class="row">';
        for (const child of children) {
          const title = child.title || getFolderName(child.id);
          const slug = buildSlug(child.id);
          const summary = escapeHtml(child.summary || '');
          const iconClass = child.iconBrand 
            ? `fab fa-${child.iconBrand}` 
            : `fas fa-${child.icon || 'file-alt'}`;
          
          html += `
            <div class="col-12 col-lg-6 py-3">
              <div class="card shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">
                    <span class="theme-icon-holder card-icon-holder mr-2">
                      <i class="${escapeHtml(iconClass)}"></i>
                    </span>
                    <span class="card-title-text">${escapeHtml(title)}</span>
                  </h5>
                  <div class="card-text">${summary}</div>
                  <a class="card-link-mask" href="${escapeHtml(slug)}" aria-label="${escapeHtml(title)}"></a>
                </div>
              </div>
            </div>
          `;
        }
        html += '</div>';
      }
      
      html += '</div>';

      // Replace element
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      el.parentNode?.replaceChild(wrapper.firstElementChild, el);
    } catch (err) {
      console.error('[CHILDREN] renderer error:', err);
    }
  }
}

// Run when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderChildrenBlocks);
} else {
  renderChildrenBlocks();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
