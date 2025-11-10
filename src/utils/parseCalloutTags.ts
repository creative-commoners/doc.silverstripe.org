/**
 * Callout types supported in documentation
 */
export type CalloutType = 'hint' | 'note' | 'warning' | 'info' | 'error' | 'danger' | 'success' | 'alert' | 'deprecated';

/**
 * Parse callout tag content and return callout type
 */
export function parseCalloutTag(content: string): CalloutType | null {
  const typeMatch = content.match(/\[(hint|note|warning|info|error|danger|success|alert|deprecated)\]/i);
  if (typeMatch) {
    return typeMatch[1].toLowerCase() as CalloutType;
  }
  return null;
}

/**
 * Extract all callout tags from content
 */
export function extractCalloutTags(content: string): Array<{ tag: string; type: CalloutType; content: string }> {
  const pattern = /\[(hint|note|warning|info|error|danger|success|alert|deprecated)\](.*?)\[\/\1\]/gis;
  const results = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const type = match[1].toLowerCase() as CalloutType;
    results.push({
      tag: match[0],
      type,
      content: match[2],
    });
  }

  return results;
}

/**
 * Get CSS class for callout type
 */
export function getCalloutClass(type: CalloutType): string {
  const classMap: Record<CalloutType, string> = {
    'hint': 'alert-info',
    'note': 'alert-info',
    'warning': 'alert-warning',
    'info': 'alert-info',
    'error': 'alert-danger',
    'danger': 'alert-danger',
    'success': 'alert-success',
    'alert': 'alert-warning',
    'deprecated': 'alert-danger',
  };
  return classMap[type];
}
