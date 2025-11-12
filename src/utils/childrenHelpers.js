
/**
 * Parse a document ID to extract path components
 * ID format: v6/02_Developer_Guides/01_Some_Page or v6/index
 * @param {string} id - Doc ID like "v6/00_Getting_Started/index"
 * @returns {object} {version, pathParts, fileName, isIndex}
 */
export function parseDocId(id) {
  const parts = id.split('/');
  const version = parts[0]; // v6
  const fileName = parts[parts.length - 1]; // index or page or index.md
  const isIndex = fileName === 'index' || fileName === 'index.md';

  // Everything between version and fileName
  const pathParts = parts.slice(1, -1); // Removes version and filename

  return { version, pathParts, fileName, isIndex };
}

/**
 * Get parent path from a document ID
 * For v6/02_Developer_Guides/01_Some_Page returns v6/02_Developer_Guides/index
 * @param {string} id - Doc ID
 * @returns {string|null} Parent path or null if at version root
 */
export function getParentPath(id) {
  const { version, pathParts } = parseDocId(id);

  if (pathParts.length === 0) {
    // Can't go higher than version root
    return null;
  }

  // For direct children of version (length 1), parent is v{version}/index
  if (pathParts.length === 1) {
    return `${version}/index`;
  }

  // For nested children, go up one level
  return `${version}/${pathParts.slice(0, -1).join('/')}/index`;
}

/**
 * Get the folder name (last path component) from a document ID
 * @param {string} id - Doc ID
 * @returns {string} Folder name or empty string
 */
export function getFolderName(id) {
  const { pathParts } = parseDocId(id);
  return pathParts[pathParts.length - 1] || '';
}

/**
 * Check if a document is a child of a parent
 * @param {string} childId - Child doc ID
 * @param {string} parentId - Parent doc ID
 * @returns {boolean} True if child is direct child of parent
 */
export function isChildOf(childId, parentId) {
  const child = parseDocId(childId);
  const parent = parseDocId(parentId);

  // Must be same version
  if (child.version !== parent.version) return false;

  // Parent must be an index file
  if (!parent.isIndex) return false;

  // Parent path must be prefix of child path
  const parentPath = parent.pathParts;
  const childPath = child.pathParts;

  // Child must have exactly one more path component than parent
  if (childPath.length !== parentPath.length + 1) return false;

  // Parent path must be prefix of child path
  for (let i = 0; i < parentPath.length; i++) {
    if (parentPath[i] !== childPath[i]) return false;
  }

  return true;
}

/**
 * Get siblings of a document (pages with same parent)
 * @param {array} docs - Array of all docs
 * @param {string} id - Doc ID
 * @param {boolean} includeFolders - Include folder index pages
 * @returns {array} Sibling docs
 */
export function getSiblings(docs, id, includeFolders = false) {
  const parsed = parseDocId(id);

  // For index files, return nothing (no siblings)
  if (parsed.isIndex) {
    return [];
  }

  // Get parent path
  const parentPath = `${parsed.version}/${parsed.pathParts.slice(0, -1).join('/')}/index`;

  // Return docs with same parent
  return docs.filter(doc => {
    const docId = doc.id;
    const docParsed = parseDocId(docId);

    // Must be same version
    if (docParsed.version !== parsed.version) return false;

    // Must have same parent
    const docParentPath = `${docParsed.version}/${docParsed.pathParts.slice(0, -1).join('/')}/index`;
    if (docParentPath !== parentPath) return false;

    // Filter folders if not includeFolders
    if (!includeFolders && docParsed.isIndex) return false;

    return true;
  });
}

/**
 * Get direct children of a document
 * @param {array} docs - Array of all docs
 * @param {string} id - Parent doc ID
 * @param {boolean} includeFolders - Include folder index pages
 * @returns {array} Child docs
 */
export function getChildren(docs, id, includeFolders = false) {
  return docs.filter(doc => {
    // Child's parent must be this doc
    const childParent = getParentPath(doc.id);
    const isChild = childParent === id;

    if (!isChild) return false;

    // Filter by folder type:
    // includeFolders=false means include ONLY folders (index files)
    // includeFolders=true means include BOTH folders and leaf pages
    const { isIndex } = parseDocId(doc.id);
    if (!includeFolders && !isIndex) {
      return false;
    }

    return true;
  });
}

/**
 * Get children of a specific folder by folder name
 * @param {array} docs - Array of all docs
 * @param {string} parentId - Parent doc ID
 * @param {string} folderName - Folder name to filter by
 * @returns {array} Children of the specified folder
 */
export function getChildrenByFolder(docs, parentId, folderName) {
  // First get all direct children (including folders)
  const children = getChildren(docs, parentId, true);

  // Find the folder index page
  const targetFolder = children.find(doc => {
    const parsed = parseDocId(doc.id);
    return (
      parsed.isIndex && getFolderName(doc.id).toLowerCase() === folderName.toLowerCase()
    );
  });

  if (!targetFolder) return [];

  // Get children of that folder
  return getChildren(docs, targetFolder.id, false);
}

/**
 * Filter docs by names (case-insensitive)
 * @param {array} docs - Array of all docs
 * @param {array} names - Folder names to filter by
 * @returns {array} Matching docs
 */
export function filterDocsByNames(docs, names) {
  const lowerNames = names.map(n => n.toLowerCase());

  return docs.filter(doc => {
    const folderName = getFolderName(doc.id).toLowerCase();
    return lowerNames.includes(folderName);
  });
}

/**
 * Sort documents by order field, then by title
 * @param {array} docs - Array of docs to sort
 * @returns {array} Sorted copy of docs
 */
export function sortDocs(docs) {
  return [...docs].sort((a, b) => {
    const aOrder = a.data?.order ?? a.order ?? Infinity;
    const bOrder = b.data?.order ?? b.order ?? Infinity;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    const aTitle = (a.data?.title || a.title || getFolderName(a.id)).toLowerCase();
    const bTitle = (b.data?.title || b.title || getFolderName(b.id)).toLowerCase();

    return aTitle.localeCompare(bTitle);
  });
}

/**
 * Build URL slug from document ID
 * v6/02_Developer_Guides/01_Page/index -> /en/6/02-developer-guides/01-page/
 * @param {string} id - Doc ID
 * @returns {string} URL slug
 */
export function buildSlug(id) {
  const { version, pathParts } = parseDocId(id);

  // Remove numeric prefixes and convert to slug format
  const slugParts = pathParts.map(part => {
    // Remove leading numbers and underscores
    const cleaned = part.replace(/^\d+_/, '');
    // Convert to lowercase and replace underscores with hyphens
    return cleaned.toLowerCase().replace(/_/g, '-');
  });

  return `/en/${version.replace('v', '')}/${slugParts.join('/')}/`;
}
