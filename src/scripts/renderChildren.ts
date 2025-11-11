/**
 * Client-side script to render [CHILDREN] blocks
 * This runs in the browser and processes <childrenlistrenderer> custom elements
 */

// Types for the docs index
interface DocIndexEntry {
  id: string;
  title: string | null;
  summary: string | null;
  icon: string | null;
  iconBrand: string | null;
  order: number | null;
}

//Helper functions (client-side versions, simplified)
function parseDocId(id: string) {
  const parts = id.split('/');
  const version = parts[0]; // v6
  const fileName = parts[parts.length - 1]; // Last component (either a page name or "index")
  const isIndex = fileName === 'index' || fileName === 'index.md';
  
  // pathParts is the folder hierarchy, excluding version and filename
  // For "v6/02_Developer_Guides/index":
  //   parts = ["v6", "02_Developer_Guides", "index"]
  //   pathParts should = ["02_Developer_Guides"]
  // For "v6/02_Developer_Guides/00_Model/01_Data_Model_and_ORM":
  //   parts = ["v6", "02_Developer_Guides", "00_Model", "01_Data_Model_and_ORM"]
  //   pathParts should = ["02_Developer_Guides", "00_Model"]
  const pathParts = parts.slice(1, parts.length - 1); // Everything except version and filename
  
  return { version, pathParts, fileName, isIndex };
}

function getParentPath(id: string): string | null {
  const { version, pathParts } = parseDocId(id);
  
  if (pathParts.length === 0) {
    return null;
  }
  
  if (pathParts.length === 1) {
    const result = `${version}/index`;
    return result;
  }
  
  const result = `${version}/${pathParts.slice(0, -1).join('/')}/index`;
  return result;
}

function getFolderName(id: string): string {
  const { pathParts } = parseDocId(id);
  if (pathParts.length === 0) return '';
  return pathParts[pathParts.length - 1] || '';
}

function getChildren(
  docs: DocIndexEntry[],
  id: string,
  includeFolders: boolean = true
): DocIndexEntry[] {
  return docs.filter(doc => {
    const childParsed = parseDocId(doc.id);
    const parentParsed = parseDocId(id);
    
    // Must be same version
    if (childParsed.version !== parentParsed.version) return false;
    
    // Parent must be an index file
    if (!parentParsed.isIndex) return false;
    
    // Parent path must be prefix of child path
    const parentPath = parentParsed.pathParts;
    const childPath = childParsed.pathParts;
    
    // Child must have exactly one more path component than parent
    const expectedLength = parentPath.length + 1;
    if (childPath.length !== expectedLength) {
      return false;
    }
    
    // Parent path must be prefix of child path
    let isPrefix = true;
    for (let i = 0; i < parentPath.length; i++) {
      if (parentPath[i] !== childPath[i]) {
        isPrefix = false;
        break;
      }
    }
    
    if (!isPrefix) return false;
    
    // Filter by folder type:
    // includeFolders=false means include ONLY folders (index files)
    // includeFolders=true means include BOTH folders and leaf pages
    const { isIndex } = childParsed;
    if (!includeFolders && !isIndex) {
      return false;
    }
    
    return true;
  });
}

function getSiblings(
  docs: DocIndexEntry[],
  id: string,
  includeFolders: boolean = false
): DocIndexEntry[] {
  const parsed = parseDocId(id);
  
  if (parsed.isIndex) {
    return [];
  }
  
  const parentPath = `${parsed.version}/${parsed.pathParts.slice(0, -1).join('/')}/index`;
  
  return docs.filter(doc => {
    const docParsed = parseDocId(doc.id);
    
    if (docParsed.version !== parsed.version) return false;
    
    const docParentPath = `${docParsed.version}/${docParsed.pathParts.slice(0, -1).join('/')}/index`;
    if (docParentPath !== parentPath) return false;
    
    if (!includeFolders && docParsed.isIndex) return false;
    
    return true;
  });
}

function getChildrenByFolder(
  docs: DocIndexEntry[],
  parentId: string,
  folderName: string
): DocIndexEntry[] {
  const children = getChildren(docs, parentId, true);
  
  const targetFolder = children.find(doc => {
    const parsed = parseDocId(doc.id);
    return parsed.isIndex && 
           getFolderName(doc.id).toLowerCase() === folderName.toLowerCase();
  });
  
  if (!targetFolder) return [];
  
  return getChildren(docs, targetFolder.id, false);
}

function sortDocs(docs: DocIndexEntry[]): DocIndexEntry[] {
  return [...docs].sort((a, b) => {
    const aOrder = a.order ?? Infinity;
    const bOrder = b.order ?? Infinity;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    const aTitle = (a.title || getFolderName(a.id)).toLowerCase();
    const bTitle = (b.title || getFolderName(b.id)).toLowerCase();
    
    return aTitle.localeCompare(bTitle);
  });
}

function buildSlug(id: string): string {
  const { version, pathParts } = parseDocId(id);
  
  const slugParts = pathParts.map(part => {
    const cleaned = part.replace(/^\d+_/, '');
    return cleaned.toLowerCase().replace(/_/g, '-');
  });
  
  return `/en/${version.replace('v', '')}/${slugParts.join('/')}/`;
}

function escapeHtml(text: string | null): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function renderChildrenBlocks() {
  console.log('🎯 renderChildrenBlocks() client-side script started');
  
  // Wait for current document ID to be available
  let attempts = 0;
  let currentDocId: string | null = null;
  
  while (attempts < 50 && !currentDocId) {
    const wrapper = document.querySelector('[data-current-doc-id]');
    currentDocId = wrapper?.getAttribute('data-current-doc-id') || null;
    
    if (currentDocId) break;
    
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }

  if (!currentDocId) {
    console.warn('⚠️ [CHILDREN] Could not find document ID after 50 attempts');
    return;
  }

  console.log('📍 Current document ID found:', currentDocId);

  // Remove .md or .mdx extension from document ID to match docs index format
  let docId = currentDocId;
  if (docId.endsWith('.md') || docId.endsWith('.mdx')) {
    docId = docId.replace(/\.mdx?$/, '');
    console.log('🔧 Normalized document ID (removed extension):', docId);
  }

  // Load docs index
  let allDocsData: DocIndexEntry[];
  try {
    console.log('🔍 Fetching docs-index.json...');
    const response = await fetch('/docs-index.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allDocsData = await response.json();
    console.log('📚 Docs index loaded:', allDocsData.length, 'entries');
  } catch (err) {
    console.error('❌ [CHILDREN] Failed to load docs index:', err);
    return;
  }

  // Parse current document
  const parsed = parseDocId(docId);
  console.log('🔎 Parsed current document:', { version: parsed.version, isIndex: parsed.isIndex, pathParts: parsed.pathParts });

  // Filter docs for this version
  const versionDocs = allDocsData.filter(doc => doc.id.startsWith(`${parsed.version}/`));
  console.log('🎯 Filtered', versionDocs.length, `docs for version ${parsed.version}`);

  // Process all [CHILDREN] elements
  const childrenElements = document.querySelectorAll('childrenlistrenderer');
  console.log('🔎 Found', childrenElements.length, '<childrenlistrenderer> elements to process');
  
  for (let elemIndex = 0; elemIndex < childrenElements.length; elemIndex++) {
    const el = childrenElements[elemIndex];
    try {
      console.log(`\n📦 Processing element ${elemIndex + 1}/${childrenElements.length}`);
      
      // Extract props from attributes
      const folder = el.getAttribute('folder') || undefined;
      const only = el.getAttribute('only')?.split(',') || undefined;
      const exclude = el.getAttribute('exclude')?.split(',') || undefined;
      const asList = el.getAttribute('as-list') === 'true';
      const includeFolders = el.getAttribute('include-folders') === 'true';
      const reverse = el.getAttribute('reverse') === 'true';

      console.log('⚙️ Element props:', { folder, only, exclude, asList, includeFolders, reverse });

      let childrenList: DocIndexEntry[] = [];

      if (folder) {
        console.log('📂 Using folder filter:', folder);
        childrenList = getChildrenByFolder(versionDocs, docId, folder);
      } else if (only) {
        console.log('🔖 Using only filter:', only);
        const matchingFolders = getChildren(versionDocs, docId, true).filter(doc => {
          const folderName = getFolderName(doc.id);
          return only.some(name => name.toLowerCase() === folderName.toLowerCase());
        });
        console.log('🔍 Matching folders found:', matchingFolders.length);
        
        for (const parentFolder of matchingFolders) {
          const folderChildren = getChildren(versionDocs, parentFolder.id, false);
          childrenList.push(...folderChildren);
        }
      } else if (exclude) {
        console.log('🚫 Using exclude filter:', exclude);
        childrenList = getChildren(versionDocs, docId, includeFolders);
        childrenList = childrenList.filter(doc => {
          const folderName = getFolderName(doc.id);
          return !exclude.some(name => name.toLowerCase() === folderName.toLowerCase());
        });
      } else {
        console.log('📋 Using default filter (children if index, siblings if not)');
        if (parsed.isIndex) {
          // For index pages, get children but ONLY folder indices, not leaf pages
          childrenList = getChildren(versionDocs, docId, false);
          console.log('📚 Getting children folders (document is index, includeFolders=false)');
        } else {
          childrenList = getSiblings(versionDocs, docId, includeFolders);
          console.log('👥 Getting siblings (document is not index)');
        }
      }

      console.log('📊 Children list before sort:', childrenList.length, 'items');

      // Sort
      childrenList = sortDocs(childrenList);
      console.log('✅ Children sorted alphabetically by title/folder name');

      // Reverse if needed
      if (reverse) {
        childrenList.reverse();
        console.log('🔄 Children list reversed');
      }

      if (childrenList.length === 0) {
        console.log('⏭️ No children found, removing element');
        el.remove();
        continue;
      }

      console.log('🎨 Final children list:', childrenList.length, 'items');

      // Render HTML
      let html = '';
      
      if (asList) {
        console.log('📄 Rendering as definition list (asList)');
        html = '<div class="docs-overview py-5"><dl>';
        for (const child of childrenList) {
          const title = child.title || getFolderName(child.id);
          const slug = buildSlug(child.id);
          const summary = child.summary || '';
          
          html += `
            <dt><a href="${escapeHtml(slug)}">${escapeHtml(title)}</a></dt>
            <dd>${escapeHtml(summary)}</dd>
          `;
        }
        html += '</dl></div>';
      } else {
        console.log('🏛️ Rendering as card grid (default)');
        html = '<div class="docs-overview py-5"><div class="row">';
        
        for (const child of childrenList) {
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
                      <i class="${iconClass}"></i>
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
        
        html += '</div></div>';
      }

      console.log('📝 Generated HTML (length:', html.length, 'chars)');

      // Replace element
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const newElement = wrapper.firstElementChild;
      if (newElement) {
        el.parentNode?.replaceChild(newElement, el);
        console.log('✨ Element replaced with rendered content');
      } else {
        console.log('⚠️ Could not get first element from wrapper');
      }
    } catch (err) {
      console.error('❌ [CHILDREN] Error rendering block:', err);
    }
  }
  
  console.log('✅ renderChildrenBlocks() completed');
}

// Run when ready
if (document.readyState === 'loading') {
  console.log('⏳ DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', renderChildrenBlocks);
} else {
  console.log('📄 DOM already loaded, running renderChildrenBlocks immediately');
  renderChildrenBlocks();
}
