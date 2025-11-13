// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { remarkConvertImagesToPictures } from './src/utils/remarkConvertImages.mjs';
import { remarkLanguageAliases } from './src/utils/remarkPlugins.js';
import remarkChildrenBlocks from './src/utils/remarkChildrenBlocks.js';
import { 
  rehypeHeaders, 
  rehypeFixLinks, 
  rehypeCallouts, 
  rehypeTables,
  rehypeFixImages 
} from './src/utils/rehypePlugins.js';
import rehypeChildrenBlocks from './src/utils/rehypeChildrenBlocks.js';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.silverstripe.org',
  integrations: [
    react(),
    mdx({
      optimize: false,
      remarkPlugins: [remarkChildrenBlocks],
      // remarkPlugins: [remarkConvertImagesToPictures],
    }),
    sitemap()
  ],
  srcDir: './src',
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
      langs: ['javascript', 'typescript', 'html', 'css', 'bash', 'php', 'yaml', 'json'],
      wrap: true,
    },
    // [CHILDREN] blocks are server-side rendered at build time
    // - Parser: src/utils/remarkChildrenBlocks.js
    // - Renderer: src/components/ChildrenList.astro
    // - Helpers: src/utils/childrenHelpers.js
    remarkPlugins: [remarkLanguageAliases, remarkChildrenBlocks],
    rehypePlugins: [
      rehypeHeaders,
      rehypeTables,
      rehypeFixImages,
      // rehypeFixLinks is disabled - link fixing is done client-side in DocsContent component
      // to have access to the current page's slug for proper relative link resolution
      rehypeCallouts,
      rehypeChildrenBlocks,
    ],
  },
  vite: {
    alias: {
      '@content': join(__dirname, '.cache/content/docs'),
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions']
        }
      }
    },
    ssr: {
      noExternal: ['@docsearch/js', 'bootstrap'],
    },
  },
});