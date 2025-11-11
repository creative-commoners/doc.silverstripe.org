import { visit } from 'unist-util-visit';

/**
 * Generate the ID for a heading
 */
function generateID(title) {
  return title
    .replace('&amp;', '-and-')
    .replace('&', '-and-')
    .replace(/[^A-Za-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/g, '')
    .replace(/-$/g, '')
    .toLowerCase();
}

/**
 * Get the full plain text of the heading for checking and generating the ID
 */
function getFullHeading(element) {
  let text = '';
  if ('value' in element) {
    text += element.value;
  }

  if ('children' in element && element.children) {
    for (const child of element.children) {
      text += getFullHeading(child);
    }
  }

  return text;
}

/**
 * Rehype plugin to add anchor links to headings
 * Supports explicit IDs via {#explicit-id} syntax
 */
export function rehypeHeaders() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      if (!headingTags.includes(node.tagName)) {
        return;
      }

      const plainText = getFullHeading(node);

      if (plainText) {
        const matches = plainText.match(/^(.*?)\{#([A-Za-z0-9_-]+)\}$/);
        let headingText;
        let id;

        if (matches) {
          headingText = matches[1];
          id = matches[2];
        } else {
          headingText = plainText;
          id = generateID(plainText);
        }

        // Set the ID on the heading
        if (!node.properties) {
          node.properties = {};
        }
        node.properties.id = id;

        // Remove explicit ID syntax from last text child
        const lastChild = node.children?.[node.children.length - 1];
        if (lastChild && 'value' in lastChild) {
          lastChild.value = lastChild.value.replace(/\s*{#([A-Za-z0-9_-]+)\}$/, '');
        }

        // Add anchor link child
        const anchor = {
          type: 'element',
          tagName: 'a',
          properties: {
            id,
            className: ['anchor'],
            'aria-hidden': true,
            href: `#${id}`,
          },
          children: [{ type: 'text', value: '#' }],
        };

        node.children?.unshift(anchor);

        // Add aria-details to h1 for version callout
        if (node.tagName === 'h1') {
          node.properties['aria-details'] = 'version-callout';
        }
      }
    });
  };
}

/**
 * Rehype plugin to rewrite links for proper navigation
 * Handles relative, absolute, API, and external links
 */
export function rehypeFixLinks(options= {}) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') {
        return;
      }

      const href = node.properties?.href;
      if (!href || typeof href !== 'string') {
        return;
      }

      // mailto links - no transformation
      if (href.startsWith('mailto:')) {
        return;
      }

      // API links with shorthand
      if (href.match(/^api\:/)) {
        const match = href.match(/api\:(.*)/);
        const version = options.version || '6';
        if (match) {
          node.properties.href = `https://api.silverstripe.org/search/lookup?q=${match[1]}&version=${version}`;
          node.properties.className = ['api-link'];
          node.properties.target = '_blank';
        }
        return;
      }

      // Explicit API links
      if (href.match(/api\.silverstripe\.org/)) {
        node.properties.className = ['api-link'];
        node.properties.target = '_blank';
        return;
      }

      // Absolute external URLs
      if (href.match(/^https?/)) {
        // Handle docs.silverstripe.org links specially
        const docsMatch = href.match(/^https?:\/\/docs\.silverstripe\.org\/en\/([0-9]+)(\/.*)?$/);
        if (docsMatch) {
          const linkVersion = docsMatch[1];
          const linkPath = docsMatch[2] || '/';
          node.properties.href = `/en/${linkVersion}${linkPath}`;
          return;
        }

        // Image links and other external links
        if (href.match(/\.(jpg|jpeg|gif|png|webp|avif|tiff|bmp)$/i)) {
          node.properties.target = '_blank';
        } else if (!href.includes('localhost')) {
          node.properties.target = '_blank';
        }
        return;
      }

      // Root-relative links
      if (href.startsWith('/')) {
        const version = options.version || '6';
        node.properties.href = `/en/${version}${href}`;
        return;
      }

      // Relative links (handle markdown files)
      if (!href.startsWith('#')) {
        const currentSlug = options.slug || '';
        const basePath = currentSlug.substring(0, currentSlug.lastIndexOf('/')) || '/';

        if (href.endsWith('.md')) {
          const linkPath = href.replace(/\.md$/, '');
          node.properties.href = `${basePath}/${linkPath}`.replace(/\/+/g, '/');
        } else if (href.match(/(\.md#([A-Za-z0-9_-]+))$/)) {
          const matches = href.match(/(\.md#([A-Za-z0-9_-]+))$/);
          if (matches) {
            const newHashLink = href.replace(/\.md/, '').replace(/\/$/, '');
            node.properties.href = `${basePath}${newHashLink}`.replace(/\/+/g, '/');
          }
        } else {
          node.properties.href = `${basePath}/${href}`.replace(/\/+/g, '/');
        }
        return;
      }

      // Hash links (local anchors)
      if (href.startsWith('#')) {
        // Already valid
        return;
      }
    });
  };
}

/**
 * Rehype plugin to handle callout blocks
 * Converts divs with callout classes to semantic callout elements
 */
export function rehypeCallouts() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'div') {
        return;
      }

      const classNames = node.properties?.className;
      if (!Array.isArray(classNames)) {
        return;
      }

      const calloutMatch = classNames.find((c) => 
        c.match(/^(hint|note|warning|info|error|danger|success|alert|deprecated)/)
      );

      if (!calloutMatch) {
        return;
      }

      // Extract the callout type
      const calloutType = calloutMatch.replace(/[-\d]$/, '');

      // Create new structure for the callout
      node.tagName = 'div';
      if (!node.properties) {
        node.properties = {};
      }
      node.properties.className = [`callout`, `callout-${calloutType}`];
      node.properties['data-callout-type'] = calloutType;
    });
  };
}

/**
 * Rehype plugin to handle [CHILDREN] tags
 * Note: This is a placeholder implementation requires
 * access to the content collection at render time
 */
export function rehypeChildrenOf() {
  return (tree) => {
    visit(tree, 'text', (node) => {
      if (typeof node.value !== 'string') {
        return;
      }

      const match = node.value.match(/\[CHILDREN([^\]]*)\]/);
      if (!match) {
        return;
      }

      // This would need to be handled at the component level
      // Store metadata for later processing
      if (!node.data) {
        node.data = {};
      }
      node.data.childrenOfDirective = match[0];
    });
  };
}

/**
 * Rehype plugin to make tables responsive
 */
export function rehypeTables() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'table') {
        return;
      }

      // Create a wrapper div
      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-responsive', 'my-4'],
        },
        children};

      // Add Bootstrap table classes
      if (!node.properties) {
        node.properties = {};
      }
      if (!Array.isArray(node.properties.className)) {
        node.properties.className = [];
      }
      (node.properties.className).push('table', 'table-striped');

      // Replace the table node with the wrapper
      const parent = tree.children.find((child) =>
        child.children?.includes(node)
      );
      if (parent && Array.isArray(parent.children)) {
        const index = parent.children.indexOf(node);
        if (index !== -1) {
          parent.children[index] = wrapper;
        }
      }
    });
  };
}

/**
 * Rehype plugin to fix relative image paths
 * Converts relative paths like ../_images/file.png to /_images/file.png
 */
export function rehypeFixImages() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') {
        return;
      }

      const src = node.properties?.src;
      if (!src || typeof src !== 'string') {
        return;
      }

      // Only process relative paths that go up directories
      if (src.includes('../_images/')) {
        // Replace any number of ../ with / to make it absolute
        node.properties.src = src.replace(/^(\.\.\/)*_images\//, '/_images/');
      }
    });
  };
}
