/**
 * Helper functions for [CHILDREN] block rendering
 * This is a pure JavaScript version for use in the public folder
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

export function getFolderName(id) {
  const { pathParts } = parseDocId(id);
  return pathParts[pathParts.length - 1] || '';
}

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

export function getChildren(docs, id, includeFolders = true) {
  return docs.filter(doc => {
    // Child's parent must be this doc
    const childParent = getParentPath(doc.id);
    const isChild = childParent === id;
    
    if (!isChild) return false;
    
    // Filter folders if not includeFolders
    const { isIndex } = parseDocId(doc.id);
    if (!includeFolders && isIndex) return false;
    
    return true;
  });
}

export function getChildrenByFolder(docs, parentId, folderName) {
  // First get all direct children (including folders)
  const children = getChildren(docs, parentId, true);
  
  // Find the folder index page
  const targetFolder = children.find(
    doc => {
      const parsed = parseDocId(doc.id);
      return parsed.isIndex && 
             getFolderName(doc.id).toLowerCase() === folderName.toLowerCase();
    }
  );
  
  if (!targetFolder) return [];
  
  // Get children of that folder
  return getChildren(docs, targetFolder.id, false);
}

export function sortDocs(docs) {
  return [...docs].sort((a, b) => {
    const aOrder = a.order ?? Infinity;
    const bOrder = b.order ?? Infinity;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    const aTitle = a.title || getFolderName(a.id);
    const bTitle = b.title || getFolderName(b.id);
    
    return aTitle.localeCompare(bTitle);
  });
}

export function buildSlug(id) {
  const { version, pathParts } = parseDocId(id);
  
  // Remove numeric prefixes and convert to slug format
  const slugParts = pathParts.map(part => {
    // Remove leading numbers and underscores
    const cleaned = part.replace(/^\d+_/, '');
    // Convert to lowercase and replace underscores with hyphens
    return cleaned.toLowerCase().replace(/_/g, '-');
  });
  
  return `/en/${version}/${slugParts.join('/')}/`;
}
