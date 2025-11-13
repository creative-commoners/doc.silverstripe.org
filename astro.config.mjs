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
import { renderChildrenListStatic } from './src/utils/renderChildrenStatic.js';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));

function childrenBlocksIntegration() {
  return {
    name: 'children-blocks-integration',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        try {
          // Find all HTML files
          const htmlFiles = await glob(path.join(dir.pathname, '**/*.html'));
          let totalPlaceholders = 0;
          let filesProcessed = 0;
          
          for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const $ = cheerio.load(content);
            const placeholders = $('.astro-children-list-placeholder');
            
            if (placeholders.length === 0) continue;
            
            filesProcessed++;
            
            for (let i = 0; i < placeholders.length; i++) {
              const $placeholder = $(placeholders[i]);
              const options = {
                currentDocId: $placeholder.attr('data-current-doc-id') || '',
                folder: $placeholder.attr('data-folder') || '',
                only: $placeholder.attr('data-only')?.split(',').filter(Boolean) || [],
                exclude: $placeholder.attr('data-exclude')?.split(',').filter(Boolean) || [],
                asList: $placeholder.attr('data-as-list') === 'true',
                includeFolders: $placeholder.attr('data-include-folders') === 'true',
                reverse: $placeholder.attr('data-reverse') === 'true'
              };
              
              const html = await renderChildrenListStatic(options);
              $placeholder.replaceWith(html);
              totalPlaceholders++;
            }
            
            // Write modified file
            fs.writeFileSync(file, $.html(), 'utf-8');
          }
          
          if (filesProcessed > 0) {
            console.log(`\n✓ Processed ${totalPlaceholders} [CHILDREN] blocks in ${filesProcessed} files`);
          }
        } catch (error) {
          console.error('Error processing [CHILDREN] placeholders:', error);
          throw error;
        }
      }
    }
  };
}

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
    sitemap(),
    childrenBlocksIntegration()
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