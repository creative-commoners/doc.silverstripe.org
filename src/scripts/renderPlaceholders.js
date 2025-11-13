/**
 * Client-side script to render [CHILDREN] placeholders in dev/SSR mode
 */

export async function renderPlaceholders(containerElement, docId = '') {
  // Find all placeholders in the container
  const placeholders = containerElement.querySelectorAll('.astro-children-list-placeholder');
  
  if (placeholders.length === 0) return;
  
  // Fill in docId from container if not already set
  placeholders.forEach(placeholder => {
    let currentDocId = placeholder.getAttribute('data-current-doc-id');
    if (!currentDocId && docId) {
      currentDocId = docId;
      placeholder.setAttribute('data-current-doc-id', currentDocId);
    }
  });
  
  // Dynamically import the render function
  try {
    const renderChildrenModule = await import('../utils/renderChildrenBrowser.js');
    const { renderChildrenListBrowser } = renderChildrenModule;
    
    for (const placeholder of placeholders) {
      const currentDocId = placeholder.getAttribute('data-current-doc-id');
      if (!currentDocId) {
        continue;
      }
      
      const options = {
        currentDocId: currentDocId,
        folder: placeholder.getAttribute('data-folder') || '',
        only: placeholder.getAttribute('data-only')?.split(',').filter(Boolean) || [],
        exclude: placeholder.getAttribute('data-exclude')?.split(',').filter(Boolean) || [],
        asList: placeholder.getAttribute('data-as-list') === 'true',
        includeFolders: placeholder.getAttribute('data-include-folders') === 'true',
        reverse: placeholder.getAttribute('data-reverse') === 'true'
      };
      
      try {
        const html = await renderChildrenListBrowser(options);
        const temp = document.createElement('div');
        temp.innerHTML = html;
        placeholder.replaceWith(...temp.childNodes);
      } catch (error) {
        console.error('Error rendering children for', currentDocId, error);
      }
    }
  } catch (error) {
    // Not available - expected in production
  }
}
