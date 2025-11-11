import { visit } from 'unist-util-visit';

/**
 * Remark plugin to convert language aliases to their canonical forms
 * Handles: ss -> html, sh -> bash
 */
export function remarkLanguageAliases() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      const aliases = {
        'ss': 'html',
        'sh': 'bash',
      };

      if (node.lang && aliases[node.lang]) {
        node.lang = aliases[node.lang];
      }
    });
  };
}
