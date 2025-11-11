/**
 * Parse [CHILDREN] tag syntax into options
 */

export function parseChildrenTag(tagContent) {
  const options = {
    asList,
    includeFolders,
    reverse,
  };

  // Parse [CHILDREN Folder="..."]
  let match = tagContent.match(/Folder="?([A-Za-z0-9_<>\/]+)"?/);
  if (match) {
    options.folder = match[1].replace(/<\/?em>/g, '_');
  }

  // Parse [CHILDREN Exclude="..."]
  match = tagContent.match(/Exclude="?([A-Za-z0-9_,]+)"?/);
  if (match) {
    options.exclude = match[1].split(',').map(s => s.trim());
  }

  // Parse [CHILDREN Only="..."]
  match = tagContent.match(/Only="?([A-Za-z0-9_,]+)"?/);
  if (match) {
    options.only = match[1].split(',').map(s => s.trim());
  }

  // Parse flags
  options.asList = /asList/.test(tagContent);
  options.includeFolders = /includeFolders/.test(tagContent);
  options.reverse = /reverse/.test(tagContent);

  return options;
}

/**
 * Extract all [CHILDREN] tags from content
 */
export function extractChildrenTags(content) { tag; options: ChildrenOfOptions }> {
  const pattern = /\[CHILDREN([^\]]*)\]/g;
  const results = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const options = parseChildrenTag(match[1]);
    if (options) {
      results.push({ tag);
    }
  }

  return results;
}
