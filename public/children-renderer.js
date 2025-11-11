/**
 * Client-side script that finds [CHILDREN] placeholders and renders them dynamically
 * This runs after the page loads and replaces the placeholder elements with actual content
 */

async function renderChildrenLists() {
  // Get current document ID from data attribute
  const wrapper = document.querySelector('[data-current-doc-id]');
  const currentDocId = wrapper?.getAttribute('data-current-doc-id');
  
  if (!currentDocId) {
    console.warn('ChildrenListRenderer: Could not find current document ID');
    return;
  }

  // Load docs index
  let allDocsData;
  try {
    const response = await fetch('/docs-index.json');
    if (!response.ok) throw new Error('Failed to load docs index');
    allDocsData = await response.json();
  } catch (err) {
    console.error('ChildrenListRenderer: Failed to load docs index:', err);
    return;
  }

  // Find all placeholder elements - MDX lowercases the tag name
  const placeholders = document.querySelectorAll('childrenlistrenderer, [data-component="ChildrenListRenderer"]');
  
  for (const placeholder of placeholders) {
    try {
      // Handle both JSX-rendered elements and div with data attributes
      const folder = placeholder.getAttribute('folder') || placeholder.getAttribute('data-folder');
      const only = (placeholder.getAttribute('only') || placeholder.getAttribute('data-only'))?.split(',');
      const exclude = (placeholder.getAttribute('exclude') || placeholder.getAttribute('data-exclude'))?.split(',');
      const asList = placeholder.getAttribute('aslist') || placeholder.getAttribute('data-as-list') === 'true';
      const includeFolders = placeholder.getAttribute('includefolders') || placeholder.getAttribute('data-include-folders') === 'true';
      const reverse = placeholder.getAttribute('reverse') || placeholder.getAttribute('data-reverse') === 'true';

      // Import helpers
      const helpers = await import('./children-helpers.js');
      const { parseDocId, getChildren, getSiblings, getChildrenByFolder, sortDocs, buildSlug, getFolderName } = helpers;

      // Parse current document
      const parsed = parseDocId(currentDocId);

      // Filter docs for this version
      const versionDocs = allDocsData.filter((doc) => doc.id.startsWith(`${parsed.version}/`));

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

      // Sort
      children = sortDocs(children);

      // Reverse if needed
      if (reverse) {
        children.reverse();
      }

      // Skip if no children
      if (children.length === 0) {
        placeholder.remove();
        continue;
      }

      // Render content
      let html = '<div class="docs-overview py-5">';
      
      if (asList) {
        html += '<dl>';
        for (const child of children) {
          const title = child.title || getFolderName(child.id);
          const slug = buildSlug(child.id);
          const summary = child.summary || '';
          html += `<dt><a href="${escapeHtml(slug)}">${escapeHtml(title)}</a></dt><dd>${escapeHtml(summary)}</dd>`;
        }
        html += '</dl>';
      } else {
        html += '<div class="row">';
        for (const child of children) {
          const title = child.title || getFolderName(child.id);
          const slug = buildSlug(child.id);
          const summary = child.summary || '';
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
                  <div class="card-text">${escapeHtml(summary)}</div>
                  <a class="card-link-mask" href="${escapeHtml(slug)}" aria-label="${escapeHtml(title)}"></a>
                </div>
              </div>
            </div>
          `;
        }
        html += '</div>';
      }
      
      html += '</div>';

      // Replace placeholder with rendered content
      const wrapper = createElementFromHTML(html);
      placeholder.replaceWith(wrapper);
    } catch (err) {
      console.error('ChildrenListRenderer: Error rendering children:', err);
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createElementFromHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild;
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderChildrenLists);
} else {
  renderChildrenLists().catch(err => console.error('Error in renderChildrenLists:', err));
}

