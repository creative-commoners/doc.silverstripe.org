import { useEffect, useRef, useState } from 'react';

function buildSlugFromId(docId) {
  const parts = docId.split('/');
  const version = parts[0];
  const slug = parts.slice(1).join('/');
  return `/en/${version}/${slug}/`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getChildrenFromIndex(docId, docsIndex) {
  const docParts = docId.split('/').filter(Boolean);
  const parentPath = docParts.slice(0, -1).join('/');
  
  const children = [];
  
  for (const [id, data] of Object.entries(docsIndex)) {
    if (!id.startsWith(docParts[0])) continue;
    
    const idParts = id.split('/').filter(Boolean);
    const childPath = idParts.slice(0, -1).join('/');
    
    if (childPath === parentPath && id !== docId) {
      children.push({ id, data });
    }
  }
  
  return children;
}

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

function renderChildrenAsGrid(children) {
  const cards = children.map(child => {
    const slug = buildSlugFromId(child.id);
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

function renderPlaceholder(placeholder, docsIndex) {
  const docId = placeholder.getAttribute('data-current-doc-id');
  if (!docId) return false;
  
  const folder = placeholder.getAttribute('data-folder') || '';
  const onlyStr = placeholder.getAttribute('data-only') || '';
  const excludeStr = placeholder.getAttribute('data-exclude') || '';
  const asList = placeholder.getAttribute('data-as-list') === 'true';
  const reverse = placeholder.getAttribute('data-reverse') === 'true';
  
  let children = getChildrenFromIndex(docId, docsIndex);
  
  if (folder) {
    children = children.filter(doc => {
      const docParts = doc.id.split('/');
      const docFolder = docParts[docParts.length - 2];
      return docFolder === folder;
    });
  }
  
  if (onlyStr) {
    const only = onlyStr.split(',').filter(Boolean);
    children = children.filter(doc =>
      only.some(term => doc.id.includes(term))
    );
  }
  
  if (excludeStr) {
    const exclude = excludeStr.split(',').filter(Boolean);
    children = children.filter(doc =>
      !exclude.some(term => doc.id.includes(term))
    );
  }
  
  children = sortDocs(children);
  if (reverse) {
    children = children.reverse();
  }
  
  if (children.length === 0) {
    placeholder.remove();
    return true;
  }
  
  const html = renderChildrenAsGrid(children);
  const temp = document.createElement('div');
  temp.innerHTML = html;
  placeholder.replaceWith(...temp.childNodes);
  return true;
}

function normalizeFileName(name) {
  return name
    .replace(/^\.\//, '') // Remove ./
    .replace(/^\.\.\//, '') // Remove ../
    .toLowerCase()
    .replace(/^\d+_/, '')
    .replace(/_/g, '_');
}

function resolveLinkToFile(simpleLink, parentDir, slugMap) {
  // Try to look up the mapping
  const key = `${parentDir}|${normalizeFileName(simpleLink)}`;
  if (slugMap[key]) {
    return slugMap[key];
  }
  return null;
}

function resolveRelativeLink(href, version, parentDir, slugMap) {
  // Handle API links with shorthand
  if (href.match(/^api\:/)) {
    const match = href.match(/api\:(.*)/);
    if (match) {
      return `https://api.silverstripe.org/search/lookup?q=${match[1]}&version=${version}`;
    }
  }
  
  // Skip if already absolute or external
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('/en/')) {
    return href;
  }
  
  // Skip hash-only links
  if (href.startsWith('#')) {
    return href;
  }
  
  // Extract hash fragment from href if present
  let hashFragment = '';
  let hrefWithoutHash = href;
  const hashIndex = href.indexOf('#');
  if (hashIndex > -1) {
    hashFragment = href.substring(hashIndex);
    hrefWithoutHash = href.substring(0, hashIndex);
  }
  
  // Handle leading slash (root-relative) - use slug map for resolution
  if (hrefWithoutHash.startsWith('/')) {
    const pathToResolve = hrefWithoutHash.slice(1); // Remove leading slash
    const resolvedSlug = slugMap[pathToResolve];
    
    if (resolvedSlug) {
      return `/en/${version}/${resolvedSlug}/${hashFragment}`;
    }
    
    // Fallback: just prepend version if no mapping found
    let finalUrl = `/en/${version}${hrefWithoutHash}`;
    if (!finalUrl.match(/\.[a-z]+$/i)) {
      finalUrl += '/';
    }
    return (finalUrl + hashFragment).replace(/\/+/g, '/');
  }
  
  // Handle relative paths
  let resolvedPath;
  
  if (hrefWithoutHash.includes('../')) {
    // Go up directories
    const baseParts = parentDir ? parentDir.split('/') : [];
    const hrefParts = hrefWithoutHash.split('/');
    
    for (const part of hrefParts) {
      if (part === '..') {
        baseParts.pop();
      } else if (part !== '.' && part !== '') {
        baseParts.push(part);
      }
    }
    
    resolvedPath = baseParts.join('/');
  } else {
    // Simple relative link - try to resolve using the slug map
    const resolvedFile = resolveLinkToFile(hrefWithoutHash, parentDir, slugMap);
    if (resolvedFile) {
      resolvedPath = resolvedFile;
    } else {
      // Fallback to directory + link if not found in map
      const baseParts = parentDir ? parentDir.split('/') : [];
      const hrefParts = hrefWithoutHash.split('/');
      
      for (const part of hrefParts) {
        if (part !== '.' && part !== '') {
          baseParts.push(part);
        }
      }
      
      resolvedPath = baseParts.join('/');
    }
  }
  
  // Build final URL
  let finalUrl = `/en/${version}`;
  if (resolvedPath) {
    finalUrl += `/${resolvedPath}`;
  }
  
  // Add trailing slash unless it's a file link
  if (!finalUrl.match(/\.[a-z]+$/i)) {
    finalUrl += '/';
  }
  
  return (finalUrl + hashFragment).replace(/\/+/g, '/');
}

/**
 * Wrapper component that processes links with slug map and provides context to children
 */
export default function DocsContent({ children, version, slug = '', docId = '' }) {
  // Get the current page's directory context from the slug
  const slugParts = slug.split('/').filter(p => p);
  const pageDir = slugParts.length > 1 ? slugParts.slice(0, -1).join('/') : (slugParts.length === 1 ? slugParts[0] : '');
  const containerRef = useRef(null);
  const [slugMap, setSlugMap] = useState({});
  const [docsIndex, setDocsIndex] = useState({});
  const [initialized, setInitialized] = useState(false);

  // Load the slug map and docs index on mount
  useEffect(() => {
    Promise.all([
      fetch('/slug-map.json').then(res => res.json()),
      fetch('/docs-index.json').then(res => res.json())
    ])
      .then(([slug, index]) => {
        setSlugMap(slug);
        setDocsIndex(index);
      })
      .catch(err => {
        // noop
      });
  }, []);

  // Process links when slug map is loaded
  useEffect(() => {
    if (!containerRef.current) return;
    if (Object.keys(slugMap).length === 0 || Object.keys(docsIndex).length === 0) return;
    
    // First, fill in placeholder docIds if needed
    const placeholders = containerRef.current.querySelectorAll('.astro-children-list-placeholder');
    placeholders.forEach(placeholder => {
      const currentDocId = placeholder.getAttribute('data-current-doc-id');
      if (!currentDocId && docId) {
        placeholder.setAttribute('data-current-doc-id', docId);
      }
    });
    
    // Now render all placeholders
    const placeholdersToRender = containerRef.current.querySelectorAll('.astro-children-list-placeholder');
    placeholdersToRender.forEach(placeholder => {
      renderPlaceholder(placeholder, docsIndex);
    });
    
    // Find all links in the container and fix their hrefs
    const links = containerRef.current.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      const newHref = resolveRelativeLink(href, version, pageDir, slugMap);
      if (newHref !== href) {
        link.setAttribute('href', newHref);
        
        // Add external link indicators
        if (newHref.startsWith('http')) {
          link.setAttribute('target', '_blank');
          if (newHref.includes('api.silverstripe.org')) {
            link.classList.add('api-link');
          }
        }
      }
    });

    setInitialized(true);
  }, [version, pageDir, slugMap, docsIndex, docId]);

  return (
    <div 
      ref={containerRef} 
      className="docs-content-wrapper" 
      data-version={version} 
      data-slug={slug} 
      data-page-dir={pageDir}
      data-current-doc-id={docId}
      data-initialized={initialized}
    >
      {children}
    </div>
  );
}
