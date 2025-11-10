/**
 * Parse [CHILDREN] tag syntax into options
 */
export interface ChildrenOfOptions {
  folder?: string;
  exclude?: string[];
  only?: string[];
  asList?: boolean;
  includeFolders?: boolean;
  reverse?: boolean;
}

export function parseChildrenTag(tagContent: string): ChildrenOfOptions | null {
  const options: ChildrenOfOptions = {
    asList: false,
    includeFolders: false,
    reverse: false,
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
export function extractChildrenTags(content: string): Array<{ tag: string; options: ChildrenOfOptions }> {
  const pattern = /\[CHILDREN([^\]]*)\]/g;
  const results = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const options = parseChildrenTag(match[1]);
    if (options) {
      results.push({ tag: match[0], options });
    }
  }

  return results;
}
