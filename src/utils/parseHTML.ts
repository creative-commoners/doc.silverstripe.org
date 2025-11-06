/**
 * Utility functions for parsing and transforming HTML content from markdown
 * This is a simplified version for Astro that avoids react-html-parser
 */

export interface ParseOptions {
  rewriteLinks?: boolean;
  parseTables?: boolean;
  parseCallouts?: boolean;
}

/**
 * Parse HTML string and return processed content
 * In Astro, we primarily work with markdown that's already processed
 * This utility provides hooks for additional transformation if needed
 */
export function parseHTML(
  html: string,
  options: ParseOptions = {}
): string {
  let content = html;

  // Remove [CHILDREN] tags if present
  content = content.replace(/\[CHILDREN\]/g, '');

  // Clean up excessive whitespace
  content = content.replace(/\n\n\n+/g, '\n\n');

  return content;
}

/**
 * Extract frontmatter from markdown content
 */
export function extractFrontmatter(
  content: string
): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter: Record<string, any> = {};

  frontmatterStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = parseYamlValue(value);
    }
  });

  return { frontmatter, body };
}

/**
 * Parse simple YAML values
 */
function parseYamlValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(Number(value))) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Rewrite links in content for correct routing
 */
export function rewriteLinks(
  content: string,
  baseVersion: string
): string {
  // Replace relative links with correct routing
  // This will be processed during build time
  return content;
}
