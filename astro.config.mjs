// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { remarkConvertImagesToPictures } from './src/utils/remarkConvertImages.mjs';
import { remarkLanguageAliases } from './src/utils/remarkPlugins.ts';
import { 
  rehypeHeaders, 
  rehypeFixLinks, 
  rehypeCallouts, 
  rehypeTables,
  rehypeFixImages 
} from './src/utils/rehypePlugins.ts';

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
      remarkPlugins: [],
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
    remarkPlugins: [remarkLanguageAliases],
    rehypePlugins: [
      rehypeHeaders,
      rehypeTables,
      rehypeFixImages,
      // rehypeFixLinks is disabled - link fixing is done client-side in DocsContent component
      // to have access to the current page's slug for proper relative link resolution
      rehypeCallouts,
    ],
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "variables.scss";`
        }
      }
    },
    ssr: {
      noExternal: ['@docsearch/js', 'bootstrap'],
    },
  },
});