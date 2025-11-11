import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  children: ReactNode;
  version: string;
  slug?: string;
  docId?: string;
}

type SlugMap = Record<string, string>;

function normalizeFileName(name: string): string {
  return name
    .replace(/^\.\//, '') // Remove ./
    .replace(/^\.\.\//, '') // Remove ../
    .toLowerCase()
    .replace(/^\d+_/, '')
    .replace(/_/g, '_');
}

function resolveLinkToFile(simpleLink: string, parentDir: string, slugMap: SlugMap): string | null {
  // Try to look up the mapping
  const key = `${parentDir}|${normalizeFileName(simpleLink)}`;
  if (slugMap[key]) {
    return slugMap[key];
  }
  return null;
}

function resolveRelativeLink(href: string, version: string, parentDir: string, slugMap: SlugMap): string {
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
  let resolvedPath: string;
  
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
export default function DocsContent({ children, version, slug = '', docId = '' }: Props) {
  // Get the current page's directory context from the slug
  const slugParts = slug.split('/').filter(p => p);
  const pageDir = slugParts.length > 1 ? slugParts.slice(0, -1).join('/') : (slugParts.length === 1 ? slugParts[0] : '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [slugMap, setSlugMap] = useState<SlugMap>({});
  const [initialized, setInitialized] = useState(false);

  // Load the slug map on mount
  useEffect(() => {
    fetch('/slug-map.json')
      .then(res => res.json())
      .then(data => setSlugMap(data))
      .catch(err => console.warn('Failed to load slug map:', err));
  }, []);

  // Process links when slug map is loaded
  useEffect(() => {
    if (!containerRef.current) return;
    if (Object.keys(slugMap).length === 0) return;
    
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
  }, [version, pageDir, slugMap]);

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
