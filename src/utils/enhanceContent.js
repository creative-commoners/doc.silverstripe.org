import { fileToTitle } from './fileToTitle';
import path from 'path';

export function enhanceMarkdownContent(
  slug,
  frontmatter) {
  const versionMatch = slug.match(/\/v(\d+)\//);
  const version = versionMatch ? versionMatch[1] : '6';

  const fileName = path.basename(slug).replace(/\.(md|mdx)$/, '');
  const title = frontmatter.title || fileToTitle(fileName);

  return {
    title,
    summary: frontmatter.summary || '',
    introduction: frontmatter.introduction || '',
    icon: frontmatter.icon || 'file-alt',
    iconBrand: frontmatter.iconBrand || undefined,
    hideChildren: frontmatter.hideChildren || false,
    hide: frontmatter.hide || false,
    order: frontmatter.order,
    version,
  };
}
