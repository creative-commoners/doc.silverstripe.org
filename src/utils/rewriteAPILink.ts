/**
 * Rewrite api: shorthand links to full API documentation URLs
 */
export function rewriteAPILink(link: string, version: string = '6'): string {
  const match = link.match(/api\:(.*)/);
  if (!match) {
    console.error(`Unable to resolve api link ${link}!`);
    return link;
  }

  return `https://api.silverstripe.org/search/lookup?q=${match[1]}&version=${version}`;
}
