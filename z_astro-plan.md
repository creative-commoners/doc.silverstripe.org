# Astro Migration Plan - doc.silverstripe.org

## Table of Contents

- Overview
- Key Migration Decisions
- Pre-Migration Checklist
- Phase 0: Archive Gatsby Files (Day 0)
  - Step 0.1: Move Gatsby Files to Archive
- Phase 1: Project Setup & Foundation (Days 1-2)
  - Step 1.1: Initialize New Astro Project
  - Step 1.2: Set Up Project Structure
- Phase 2: Content Pipeline (Days 3-5)
  - Step 2.1: Create Git Cloning Script
  - Step 2.2: Define Content Collections
  - Step 2.3: Create Content Processing Utilities
- Phase 3: Layouts & Base Components (Days 6-8)
  - Step 3.1: Create Base Layout
  - Step 3.2: Migrate Header Component
  - Step 3.3: Migrate SearchBox Component
- Phase 4: Documentation Pages (Days 9-11)
  - Step 4.1: Create Dynamic Route Handler
  - Step 4.2: Create Documentation Layout
  - Step 4.3: Build Sidebar Navigation
- Phase 5: Markdown Processing & Features (Days 12-13)
  - Step 5.1: Configure Syntax Highlighting
  - Step 5.2: Implement Image Optimization
  - Step 5.3: Migrate Content Transformation Utilities
- Phase 6: Styling & Polish (Days 14-15)
  - Step 6.1: Migrate Global Styles
  - Step 6.2: Implement Version Warnings
- Phase 6a: Multi-Version Documentation Support (Day 15.5)
  - Step 6a.1: Enable Additional Documentation Versions
  - Step 6a.2: Update Content Collection Configuration
- Phase 6b: Child Page Navigation Blocks (Day 16)
  - Step 6b.1: Understand Gatsby [CHILDREN] Implementation
  - Step 6b.2: Implement Astro [CHILDREN] Component
- Phase 6c: Persistent Sidebar State (Day 16.5)
  - Step 6c.1: Implement Client-Side State Persistence
  - Step 6c.2: Auto-Expand Current Path on Page Load
- Phase 7: Redirects & SEO (Day 17)
  - Step 7.1: Implement Redirects
  - Step 7.2: Configure SEO & Sitemap
- Phase 8: Build & Deploy (Days 18-19)
  - Step 8.1: Configure Build Process
  - Step 8.2: Configure Netlify Deployment
  - Step 8.3: Test Production Build
- Phase 9: Migration & Monitoring (Days 20-21)
  - Step 9.1: Deploy to Production
  - Step 9.2: Post-Launch Monitoring
- Phase 10: Testing & Validation (Day 20-21)
  - Step 10.1: Implement Basic Smoke Tests
- Phase 11: Optimization & Cleanup (Day 21+)
  - Step 11.1: Performance Optimization
  - Step 11.2: Code Cleanup
  - Step 11.3: Remove Tailwind CSS, Replace with SCSS
- Appendix
  - A. Key Differences Between Gatsby and Astro
  - B. Migration Checklist
  - C. Common Pitfalls & Solutions
  - D. Resources
- Summary

## Overview

This is a step-by-step migration plan to convert the Silverstripe CMS documentation site from Gatsby v2 to Astro v4+. The plan is designed to be executed incrementally, with each step being manageable and testable independently.

**Current Stack**: Gatsby v2.20 + React v16 + Node 12 + TypeScript v3  
**Target Stack**: Astro v4+ + React v18 (islands) + Node 24 LTS + TypeScript v5  
**Estimated Total Time**: 2-3 weeks  
**Complexity**: Medium

## Key Migration Decisions

- **Styling**: Keep Bootstrap, upgrade to v5; retain Tailwind initially, remove later (see Phase 11.3)
- **CSS Processing**: Keep SCSS with Dart Sass compiler
- **React Islands**: SearchBox, VersionSwitcher, Sidebar remain React; static components convert to Astro
- **Content Location**: `.cache/content/` (outside src, gitignored)
- **Git Cloning**: Smart caching (production), manual trigger (local dev)
- **Build Context**: Single project with ENV variable (docs/user)
- **Syntax Highlighting**: Switch to Shiki
- **Node Version**: Node 24 LTS
- **Package Manager**: npm
- **Testing**: Basic smoke tests (page generation, link checking)
- **Tailwind Removal**: After migration is stable, replace all Tailwind classes with equivalent SCSS

---

## Pre-Migration Checklist

Before starting, ensure you have:
- [ ] Node.js 20+ installed
- [ ] Git access to all source repositories
- [ ] Algolia search credentials
- [ ] Netlify deployment access
- [ ] Understanding of current build process
- [ ] Backup of current site
- [ ] Clean git working directory (commit or stash changes)

### CLI Automation Note

**All npm/npx/CLI commands in this plan should use pre-approval flags to prevent interactive prompts from blocking automated builds:**

- **npm**: Use `--yes` flag to skip confirmation dialogs
  ```bash
  npm install package-name --yes
  npm uninstall package-name --yes
  ```

- **npx astro add**: Use `--yes` flag to skip framework selection prompts
  ```bash
  npx astro add react --yes
  npx astro add mdx --yes
  ```

- **npm create**: Use `--yes` flag to skip project setup prompts
  ```bash
  npm create astro@latest . -- --template minimal --typescript strict --yes
  ```

- **General rule**: Any CLI tool that presents interactive prompts should have non-interactive flags set:
  - Avoid unattended commands that require user input ('y' to confirm, etc.)
  - Always include relevant flags like `--yes`, `-y`, `--force`, etc.
  - For CI/CD environments, ensure environment variables are set to bypass prompts

This ensures all builds and scripts can run in CI/CD pipelines and automated contexts without getting stuck.

---

## Phase 0: Archive Gatsby Files (Day 0)

### Step 0.1: Move Gatsby Files to Archive

**Goal**: Archive existing Gatsby project files for reference without interfering with the new Astro build.

**Tasks**:
Create and run `scripts/archive-gatsby.sh`:
```bash
#!/bin/bash
set -e

echo "Archiving Gatsby files..."

# Delete build artifacts and dependencies (if they exist)
[ -d ".cache" ] && rm -rf .cache && echo "Deleted .cache"
[ -d "node_modules" ] && rm -rf node_modules && echo "Deleted node_modules"
[ -d "public" ] && rm -rf public && echo "Deleted public"
[ -f ".env.production" ] && rm .env.production && echo "Deleted .env.production"

# Create archive directory
mkdir -p _gatsby

# Move all files/folders except:
# - z_*.md (planning docs)
# - .github folder
# - .git folder
# - static folder (needed for Astro)
# - _gatsby itself
# - archive script
for item in *; do
  # Skip items that should not be moved
  if [[ "$item" == z_*.md ]] || \
     [[ "$item" == ".github" ]] || \
     [[ "$item" == ".git" ]] || \
     [[ "$item" == "static" ]] || \
     [[ "$item" == "_gatsby" ]] || \
     [[ "$item" == "scripts" ]]; then
    echo "Keeping: $item"
    continue
  fi
  
  # Move everything else
  echo "Moving to _gatsby: $item"
  mv "$item" _gatsby/
done

# Also move hidden files (except .git and .github)
for item in .[^.]*; do
  if [[ "$item" == ".git" ]] || \
     [[ "$item" == ".github" ]]; then
    continue
  fi
  
  if [[ -e "$item" ]]; then
    echo "Moving to _gatsby: $item"
    mv "$item" _gatsby/
  fi
done

# Add _gatsby to .gitignore
if ! grep -q "^_gatsby/$" .gitignore 2>/dev/null; then
  echo "_gatsby/" >> .gitignore
  echo "Added _gatsby/ to .gitignore"
fi

echo "✅ Gatsby files archived to _gatsby/"
echo "You can now reference old files in _gatsby/ during migration"
```

Make it executable and run:
```bash
chmod +x scripts/archive-gatsby.sh
./scripts/archive-gatsby.sh
```

**What remains after archival**:
```
/
├── .git/
├── .github/
├── .gitignore (updated)
├── _gatsby/ (archived Gatsby project)
├── static/ (will be used by Astro)
├── z_astro-plan.md
├── z_gatsby-outline.md
└── scripts/
    └── archive-gatsby.sh
```

**Success Criteria**:
- `_gatsby/` folder contains all Gatsby project files
- Root directory is clean
- `static/` folder remains in root
- `.gitignore` includes `_gatsby/`
- Can still reference old files in `_gatsby/` directory

**Deliverables**:
- Clean workspace ready for Astro setup
- Archived Gatsby files for reference
- Updated `.gitignore`

---

## Phase 1: Project Setup & Foundation (Days 1-2)

### Step 1.1: Initialize New Astro Project

**Goal**: Create a fresh Astro project with necessary integrations.

**Tasks**:
```bash
# Initialize Astro in current directory (not a subdirectory)
# Pre-approve all interactive prompts with 'y' flag
npm create astro@latest . -- --template minimal --typescript strict --yes

# Install core integrations (--yes pre-approves any confirmation prompts)
npx astro add react --yes
npx astro add mdx --yes
npx astro add sitemap --yes

# Install styling dependencies
npm install bootstrap@5 sass

# Install additional dependencies
npm install @docsearch/css @docsearch/js
npm install sharp
npm install classnames
npm install --save-dev @types/node
```

**Note on CLI Prompts**: For all npm/npx commands that may prompt for confirmation:
- Add `--yes` or `--y` flag to pre-approve all interactive prompts
- For general npm commands, use `--yes` to skip confirmation dialogs
- For development/build scripts, you can set environment variables or use non-interactive flags
- This prevents builds/scripts from getting stuck waiting for user input

**Note**: You can reference old configuration files in `_gatsby/` for settings like:
- `_gatsby/gatsby-config.js` → Check plugin configurations
- `_gatsby/package.json` → Verify all dependencies
- `_gatsby/tsconfig.json` → Compare TypeScript settings

**Configuration**:
Create/update `astro.config.mjs`:
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://docs.silverstripe.org',
  integrations: [
    react(), 
    mdx(), 
    sitemap()
  ],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
      langs: ['javascript', 'typescript', 'html', 'css', 'bash', 'php', 'yaml', 'json'],
      wrap: true,
    },
    remarkPlugins: [],
    rehypePlugins: [],
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Import Bootstrap and custom variables globally
          additionalData: `@import "src/styles/variables.scss";`
        }
      }
    },
    ssr: {
      noExternal: ['@docsearch/js', 'bootstrap'],
    },
  },
});
```

**Success Criteria**:
- Astro project runs with `npm run dev`
- All integrations load without errors
- TypeScript configuration is strict

**Deliverables**:
- New project directory structure
- Working development server
- Basic configuration files

---

### Step 1.2: Set Up Project Structure

**Goal**: Create the directory structure matching Astro conventions.

**Tasks**:
```bash
mkdir -p src/{components,layouts,pages,content,utils,types,styles}
mkdir -p src/content/{docs,config}
mkdir -p scripts
mkdir -p public/{images,fonts}
```

**Directory Structure**:
```
src/
├── components/          # Reusable components (Astro + React)
│   ├── Header.astro
│   ├── Sidebar.astro
│   ├── Nav.astro
│   ├── SearchBox.tsx    # React island
│   └── ...
├── layouts/             # Page layouts
│   ├── BaseLayout.astro
│   ├── DocsLayout.astro
│   └── ...
├── pages/               # Routes
│   ├── index.astro
│   ├── 404.astro
│   └── [version]/
│       └── [...slug].astro
├── content/             # Content collections
│   ├── config.ts
│   └── docs/            # Cloned git content goes here
│       ├── v3/
│       ├── v4/
│       ├── v5/
│       └── v6/
├── styles/              # Global styles
│   ├── global.css
│   └── prism.css
├── utils/               # Utility functions
│   ├── fileToTitle.ts
│   ├── nodes.ts
│   └── ...
├── types/               # TypeScript types
│   └── index.ts
└── env.d.ts             # Environment type declarations
```

**Copy Files**:
Copy from archived Gatsby project (to be migrated later):
- `_gatsby/src/utils/*.ts` → `src/utils/`
- `_gatsby/src/types/*` → `src/types/`
- `_gatsby/src/theme/assets/scss/*` → `src/styles/`

**Success Criteria**:
- Directory structure created
- TypeScript recognizes all paths
- No import errors

---

## Phase 2: Content Pipeline (Days 3-5)

### Step 2.1: Create Git Cloning Script

**Goal**: Replicate the git content sourcing strategy from Gatsby.

**Tasks**:
Create `scripts/clone-docs.js`:
```javascript
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Import source configurations from archived Gatsby files
const sourcesUser = require('../_gatsby/sources-user');
const sourcesDocs = require('../_gatsby/sources-docs');

const isUser = process.env.DOCS_CONTEXT === 'user';
const sources = isUser ? sourcesUser : sourcesDocs;

const contentDir = path.join(__dirname, '../.cache/content/docs');

async function cloneRepository(config) {
  const { name, remote, branch, local } = config.options;
  const [category, version, thirdparty] = name.split('--');
  
  // Determine target directory
  const targetDir = path.join(
    contentDir,
    `v${version}`,
    thirdparty || category,
    local || ''
  );

  // Check if already cloned
  if (await fs.pathExists(targetDir)) {
    console.log(`Skipping ${name}, already exists`);
    return;
  }

  // Clone the repository
  return new Promise((resolve, reject) => {
    const cmd = `git clone --depth 1 --branch ${branch} ${remote} ${targetDir}`;
    console.log(`Cloning ${name} from ${remote}...`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error cloning ${name}:`, error);
        reject(error);
      } else {
        console.log(`Successfully cloned ${name}`);
        resolve();
      }
    });
  });
}

async function cloneAll() {
  // Filter to only gatsby-source-git plugins
  const gitSources = sources
    .filter(s => s.resolve === 'gatsby-source-git')
    .map(s => s);

  console.log(`Cloning ${gitSources.length} repositories...`);
  
  // Clone sequentially to avoid overwhelming git
  for (const source of gitSources) {
    try {
      await cloneRepository(source);
    } catch (err) {
      console.error(`Failed to clone ${source.options.name}`);
    }
  }

  console.log('All repositories cloned!');
}

cloneAll().catch(console.error);
```

**Update package.json scripts**:
```json
{
  "scripts": {
    "clone-docs": "DOCS_CONTEXT=docs node scripts/clone-docs.js",
    "clone-user": "DOCS_CONTEXT=user node scripts/clone-docs.js",
    "prebuild": "npm run clone-docs"
  }
}
```

**Note**: Copy `sources-user.js` and `sources-docs.js` from `_gatsby/` to root if not already done, or reference them directly from the archive.

**Success Criteria**:
- Script successfully clones all repositories
- Content ends up in correct directory structure
- Script handles errors gracefully

---

### Step 2.2: Define Content Collections

**Goal**: Set up Astro Content Collections for type-safe content management.

**Tasks**:
Create `src/content/config.ts`:
```typescript
import { defineCollection, z } from 'astro:content';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const docsCollection = defineCollection({
  type: 'content',
  // Point to .cache/content/docs instead of src/content/docs
  base: path.join(__dirname, '../../.cache/content/docs'),
  schema: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    introduction: z.string().optional(),
    icon: z.string().default('file-alt'),
    iconBrand: z.string().optional(),
    hideChildren: z.boolean().default(false),
    hide: z.boolean().default(false),
    order: z.number().optional(),
    // Version will be inferred from directory structure
    // Category (docs/user) will be inferred from build context
  }),
});

export const collections = {
  docs: docsCollection,
};
```

**Add frontmatter transformer**:
Create `src/utils/enhanceContent.ts`:
```typescript
import path from 'path';
import { fileToTitle } from './fileToTitle';

export function enhanceMarkdownContent(
  slug: string,
  frontmatter: Record<string, any>
) {
  // Parse version from slug (e.g., /en/6/... -> version: 6)
  const versionMatch = slug.match(/\/(\d+)\//);
  const version = versionMatch ? versionMatch[1] : '6';
  
  // Infer title from filename if not provided
  const fileName = path.basename(slug);
  const title = frontmatter.title || fileToTitle(fileName);
  
  return {
    ...frontmatter,
    title,
    version,
    icon: frontmatter.icon || 'file-alt',
    iconBrand: frontmatter.iconBrand || '',
    introduction: frontmatter.introduction || '',
    hideChildren: frontmatter.hideChildren || false,
  };
}
```

**Success Criteria**:
- Content collections defined with proper schema
- TypeScript types generated automatically
- Can query content with `getCollection('docs')`

---

### Step 2.3: Create Content Processing Utilities

**Goal**: Migrate utility functions from Gatsby to work with Astro.

**Tasks**:
1. **Copy and adapt utilities**:
   - `fileToTitle.js` → `fileToTitle.ts` (keep mostly the same)
   - `nodes.ts` (adapt for Astro content collections)
   - `parseHTML.ts` (keep)
   - `rewrite*.ts` (adapt as needed)

2. **Create new `src/utils/contentHelpers.ts`**:
```typescript
import { getCollection, type CollectionEntry } from 'astro:content';

export async function getDocsByVersion(version: string) {
  const allDocs = await getCollection('docs');
  return allDocs.filter(doc => {
    // Version inferred from file path
    return doc.id.startsWith(`v${version}/`);
  });
}

export async function getAllVersions() {
  return ['3', '4', '5', '6'];
}

export function buildSlug(filePath: string, version: string, thirdparty?: string) {
  const parts = filePath.split('/');
  const slug = [
    'en',
    version,
    thirdparty,
    ...parts,
  ]
    .filter(Boolean)
    .map(part => part.replace(/^\d+_/, ''))
    .join('/')
    .toLowerCase();
    
  return `/${slug}/`;
}

export function buildNavHierarchy(docs: CollectionEntry<'docs'>[]) {
  // TODO: Implement navigation tree building
  // Similar to current useHierarchy hook
  return [];
}
```

**Success Criteria**:
- All utility functions migrated and working
- TypeScript compiles without errors
- Functions tested with sample data

---

## Phase 3: Layouts & Base Components (Days 6-8)

### Step 3.1: Create Base Layout

**Goal**: Build the foundational layout component.

**Tasks**:
Create `src/layouts/BaseLayout.astro`:
```astro
---
import '../styles/global.css';

export interface Props {
  title: string;
  description?: string;
  version?: string;
  context?: 'docs' | 'user';
}

const { 
  title, 
  description = 'Silverstripe CMS Documentation',
  version = '6',
  context = 'docs'
} = Astro.props;

const fullTitle = `${title} | Silverstripe CMS ${context === 'user' ? 'User Help' : 'Documentation'}`;
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{fullTitle}</title>
  <meta name="description" content={description}>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  
  <!-- SEO -->
  <meta property="og:title" content={fullTitle}>
  <meta property="og:description" content={description}>
  <meta property="og:type" content="website">
  
  <!-- Algolia DocSearch CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />
</head>
<body>
  <div id="app">
    <slot />
  </div>
</body>
</html>
```

**Success Criteria**:
- Layout renders correctly
- Meta tags are set properly
- Styles load correctly

---

### Step 3.2: Migrate Header Component

**Goal**: Convert the Header component to Astro with React islands.

**Reference Files**:
- `_gatsby/src/components/Header.tsx` - Component logic and structure
- `_gatsby/src/components/Nav.tsx` - Navigation component
- `_gatsby/src/theme/assets/scss/ss-docs.scss` - Styling reference

**Tasks**:
Create `src/components/Header.astro`:
```astro
---
import SearchBox from './SearchBox';
import VersionSwitcher from './VersionSwitcher';

export interface Props {
  version: string;
  context: 'docs' | 'user';
}

const { version, context } = Astro.props;
const isUser = context === 'user';
---

<header class="header">
  <div class="header-inner">
    <div class="logo">
      <a href={`/en/${version}/`}>
        <img src="/images/logo.svg" alt="Silverstripe CMS" />
        <span class="logo-text">
          {isUser ? 'User Help' : 'Documentation'}
        </span>
      </a>
    </div>
    
    <nav class="header-nav">
      <SearchBox client:idle context={context} />
      <VersionSwitcher client:load version={version} context={context} />
    </nav>
  </div>
</header>

<style>
  .header {
    /* Reference _gatsby/src/components/Header.tsx for exact styles */
    /* Reference _gatsby/src/theme/assets/scss/ss-docs.scss for theme variables */
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 0;
  }
  
  .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
  }
  
  .logo {
    display: flex;
    align-items: center;
  }
  
  .header-nav {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
</style>
```

Create `src/components/VersionSwitcher.tsx`:
```tsx
import React, { useState } from 'react';

interface Props {
  version: string;
  context: 'docs' | 'user';
}

export default function VersionSwitcher({ version, context }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const versions = ['6', '5', '4', '3'];
  
  const handleVersionChange = (newVersion: string) => {
    // Navigate to same page in different version
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(
      new RegExp(`/en/${version}/`), 
      `/en/${newVersion}/`
    );
    window.location.href = newPath;
  };
  
  return (
    <div className="version-switcher">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="version-button"
      >
        Version {version}
      </button>
      {isOpen && (
        <ul className="version-dropdown">
          {versions.map(v => (
            <li key={v}>
              <button onClick={() => handleVersionChange(v)}>
                Version {v}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Success Criteria**:
- Header renders with logo and nav
- Version switcher is interactive
- Search box placeholder is visible

---

### Step 3.3: Migrate SearchBox Component

**Goal**: Integrate Algolia DocSearch as a React island.

**Reference Files**:
- `_gatsby/src/components/SearchBox.tsx` - Original component structure

**Tasks**:
Create `src/components/SearchBox.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';
import docsearch from '@docsearch/js';
import '@docsearch/css';

interface Props {
  context: 'docs' | 'user';
}

export default function SearchBox({ context }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const apiKey = import.meta.env.PUBLIC_DOCSEARCH_API_KEY;
    const appId = import.meta.env.PUBLIC_DOCSEARCH_APP_ID;
    const indexName = context === 'user' 
      ? import.meta.env.PUBLIC_DOCSEARCH_INDEX_USER
      : import.meta.env.PUBLIC_DOCSEARCH_INDEX_DOCS;
    
    if (!apiKey || !appId || !indexName) {
      console.warn('DocSearch credentials not configured');
      return;
    }
    
    const search = docsearch({
      container: containerRef.current,
      appId,
      apiKey,
      indexName,
    });
    
    return () => {
      search.destroy();
    };
  }, [context]);
  
  return <div ref={containerRef} />;
}
```

**Environment Setup**:
Create `.env`:
```
PUBLIC_DOCSEARCH_API_KEY=your_key_here
PUBLIC_DOCSEARCH_APP_ID=your_app_id_here
PUBLIC_DOCSEARCH_INDEX_DOCS=silverstripedocs
PUBLIC_DOCSEARCH_INDEX_USER=silverstripeuser
```

**Success Criteria**:
- Search modal opens on click
- Search queries Algolia correctly
- Results link to correct pages

---

## Phase 4: Documentation Pages (Days 9-11)

### Step 4.1: Create Dynamic Route Handler

**Goal**: Set up the main documentation page route with dynamic slug handling.

**Tasks**:
Create `src/pages/[version]/[...slug].astro`:
```astro
---
import { getCollection } from 'astro:content';
import DocsLayout from '../../layouts/DocsLayout.astro';
import type { GetStaticPaths } from 'astro';

export const getStaticPaths = (async () => {
  const allDocs = await getCollection('docs');
  
  return allDocs.map(doc => {
    // Parse version from doc.id (e.g., "v6/getting-started/index")
    const versionMatch = doc.id.match(/^v(\d+)\//);
    const version = versionMatch ? versionMatch[1] : '6';
    
    // Build slug without version prefix
    const slug = doc.id
      .replace(/^v\d+\//, '')
      .replace(/\/index$/, '')
      .replace(/\.md$/, '');
    
    return {
      params: { 
        version, 
        slug: slug || undefined 
      },
      props: { doc },
    };
  });
}) satisfies GetStaticPaths;

const { doc } = Astro.props;
const { version, slug } = Astro.params;
const { Content, headings } = await doc.render();

// Get frontmatter with defaults
const {
  title,
  introduction,
  icon,
  hideChildren,
} = doc.data;
---

<DocsLayout 
  title={title} 
  version={version}
  headings={headings}
  doc={doc}
>
  <article class="docs-content">
    {introduction && (
      <div class="introduction">
        {introduction}
      </div>
    )}
    
    <Content />
  </article>
</DocsLayout>
```

**Success Criteria**:
- All documentation pages generate correctly
- Slugs match expected URL structure
- Content renders with proper formatting

---

### Step 4.2: Create Documentation Layout

**Goal**: Build the layout for documentation pages with sidebar navigation.

**Tasks**:
Create `src/layouts/DocsLayout.astro`:
```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Sidebar from '../components/Sidebar.astro';
import type { CollectionEntry } from 'astro:content';

export interface Props {
  title: string;
  version: string;
  doc: CollectionEntry<'docs'>;
  headings: any[];
}

const { title, version, doc, headings } = Astro.props;
const context = import.meta.env.DOCS_CONTEXT || 'docs';
---

<BaseLayout title={title} version={version} context={context}>
  <Header version={version} context={context} />
  
  <div class="docs-container">
    <Sidebar 
      version={version} 
      currentPath={doc.id}
      client:load 
    />
    
    <main class="docs-main">
      <slot />
      
      {headings.length > 0 && (
        <aside class="toc">
          <h4>On this page</h4>
          <ul>
            {headings.map(heading => (
              <li class={`toc-${heading.depth}`}>
                <a href={`#${heading.slug}`}>
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </main>
  </div>
</BaseLayout>

<style>
  .docs-container {
    display: flex;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .docs-main {
    flex: 1;
    min-width: 0;
    padding: 2rem;
  }
  
  .toc {
    position: sticky;
    top: 2rem;
    width: 200px;
    margin-left: 2rem;
  }
</style>
```

**Success Criteria**:
- Layout renders with header, sidebar, and content
- Table of contents generates from headings
- Responsive design works on mobile

---

### Step 4.3: Build Sidebar Navigation

**Goal**: Create dynamic sidebar with version-specific navigation tree.

**Reference Files**:
- `_gatsby/src/components/Sidebar.tsx` - Original sidebar implementation
- `_gatsby/src/hooks/useHierarchy.ts` - Navigation tree building logic
- `_gatsby/src/utils/nodes.ts` - Node manipulation utilities

**Tasks**:
Create `src/components/Sidebar.tsx`:
```tsx
import React, { useState, useEffect } from 'react';

interface NavItem {
  title: string;
  slug: string;
  children?: NavItem[];
  icon?: string;
  hideChildren?: boolean;
}

interface Props {
  version: string;
  currentPath: string;
}

export default function Sidebar({ version, currentPath }: Props) {
  const [navTree, setNavTree] = useState<NavItem[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    // Fetch navigation tree for this version
    fetch(`/api/nav/${version}.json`)
      .then(r => r.json())
      .then(data => setNavTree(data))
      .catch(err => console.error('Failed to load nav:', err));
  }, [version]);
  
  const togglePath = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };
  
  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = currentPath === item.slug;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedPaths.has(item.slug);
    
    return (
      <li key={item.slug} className={`nav-item depth-${depth}`}>
        <div className="nav-item-header">
          {hasChildren && !item.hideChildren && (
            <button 
              onClick={() => togglePath(item.slug)}
              className="nav-toggle"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <a 
            href={item.slug}
            className={isActive ? 'active' : ''}
          >
            {item.icon && <i className={`icon fa-${item.icon}`} />}
            {item.title}
          </a>
        </div>
        {hasChildren && !item.hideChildren && isExpanded && (
          <ul className="nav-children">
            {item.children.map(child => renderNavItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };
  
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-tree">
          {navTree.map(item => renderNavItem(item))}
        </ul>
      </nav>
    </aside>
  );
}
```

**Create Navigation Data Generator**:
Create `scripts/generate-nav.js`:
```javascript
// This script generates static JSON files for each version's navigation
// Run during build to create /public/api/nav/{version}.json
const fs = require('fs-extra');
const path = require('path');
const { getDocsByVersion, buildNavHierarchy } = require('../src/utils/contentHelpers');

async function generateNavData() {
  const versions = ['3', '4', '5', '6'];
  
  for (const version of versions) {
    const docs = await getDocsByVersion(version);
    const navTree = buildNavHierarchy(docs);
    
    const outputPath = path.join(__dirname, `../public/api/nav/${version}.json`);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJSON(outputPath, navTree, { spaces: 2 });
    
    console.log(`Generated nav for version ${version}`);
  }
}

generateNavData().catch(console.error);
```

**Success Criteria**:
- Sidebar renders with hierarchical navigation
- Current page is highlighted
- Expand/collapse works correctly
- Navigation is version-specific

---

## Phase 5: Markdown Processing & Features (Days 12-13)

### Step 5.1: Configure Syntax Highlighting

**Goal**: Set up Shiki/Prism for code blocks with language aliases.

**Tasks**:
Update `astro.config.mjs`:
```javascript
export default defineConfig({
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
      langs: ['javascript', 'typescript', 'html', 'css', 'bash', 'php', 'yaml'],
      wrap: true,
    },
    remarkPlugins: [
      // Custom plugin to handle ss -> html alias
      function remarkLanguageAliases() {
        return (tree) => {
          visit(tree, 'code', (node) => {
            if (node.lang === 'ss') {
              node.lang = 'html';
            }
            if (node.lang === 'sh') {
              node.lang = 'bash';
            }
          });
        };
      },
    ],
  },
});
```

Create `src/utils/remarkPlugins.ts`:
```typescript
import { visit } from 'unist-util-visit';

export function remarkLanguageAliases() {
  return (tree: any) => {
    visit(tree, 'code', (node: any) => {
      const aliases: Record<string, string> = {
        'ss': 'html',
        'sh': 'bash',
      };
      
      if (node.lang && aliases[node.lang]) {
        node.lang = aliases[node.lang];
      }
    });
  };
}
```

**Success Criteria**:
- Code blocks render with syntax highlighting
- Language aliases work correctly
- Styling matches existing site

---

### Step 5.2: Implement Image Optimization

**Goal**: Use Astro's built-in image optimization for documentation images.

**Tasks**:
Create `src/components/DocsImage.astro`:
```astro
---
import { Image } from 'astro:assets';

export interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

const { src, alt, width, height } = Astro.props;

// Handle both local and remote images
const isRemote = src.startsWith('http');
---

{isRemote ? (
  <img src={src} alt={alt} width={width} height={height} />
) : (
  <Image src={src} alt={alt} width={width} height={height} />
)}
```

**Configure remark plugin for images**:
```typescript
export function remarkImageOptimization() {
  return (tree: any) => {
    visit(tree, 'image', (node: any) => {
      // Convert markdown images to use DocsImage component
      // This is handled automatically by Astro's MDX integration
    });
  };
}
```

**Success Criteria**:
- Images load and display correctly
- Optimization generates WebP/AVIF formats
- Lazy loading works

---

### Step 5.3: Migrate Content Transformation Utilities

**Goal**: Port the HTML/content transformation utilities to work with Astro.

**Tasks**:
1. **Migrate `parseCalloutTags.ts`** - Handle custom callout blocks
2. **Migrate `parseChildrenOf.ts`** - Dynamic child page listing
3. **Migrate `rewriteLink.ts`** - Fix internal links
4. **Migrate `rewriteHeader.ts`** - Add header anchors

Create custom remark/rehype plugins:
```typescript
// src/utils/rehypePlugins.ts
import { visit } from 'unist-util-visit';
import { parseCalloutTags } from './parseCalloutTags';
import { rewriteLink } from './rewriteLink';

export function rehypeCallouts() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'div' && node.properties?.className?.includes('callout')) {
        // Transform callout divs
        parseCalloutTags(node);
      }
    });
  };
}

export function rehypeFixLinks() {
  return (tree: any, file: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'a' && node.properties?.href) {
        node.properties.href = rewriteLink(node.properties.href, file.history[0]);
      }
    });
  };
}
```

Add to `astro.config.mjs`:
```javascript
import { rehypeCallouts, rehypeFixLinks } from './src/utils/rehypePlugins';

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeCallouts, rehypeFixLinks],
  },
});
```

**Success Criteria**:
- Callout blocks render correctly
- Links are rewritten properly
- Children listings work
- Headers have anchor links

---

## Phase 6: Styling & Polish (Days 14-15)

### Step 6.1: Migrate Global Styles

**Goal**: Port SCSS/CSS to work with Astro.

**Tasks**:
1. **Audit theme structure**: Review `_gatsby/src/theme/assets/scss/` directory
2. **Copy main SCSS files**: 
   - `_gatsby/src/theme/assets/scss/ss-docs.scss` → `src/styles/theme.scss` (main theme file)
   - `_gatsby/src/theme/assets/scss/ss-variables.scss` → `src/styles/_variables.scss` (variables)
3. **Copy Bootstrap v4 customizations**: These will need updating to v5
   - Review `_gatsby/src/theme/assets/scss/bootstrap/` for any custom overrides
4. **Upgrade Bootstrap**: Update imports from Bootstrap v4 to v5
5. **Keep SCSS**: Continue using SCSS with Dart Sass compiler
6. **Retain Tailwind**: Keep Tailwind CSS for now (will be removed in Phase 11.3)
7. **Reference for components**: Keep `_gatsby/src/theme/` available for style lookups

**Key SCSS Files to Copy**:
```
_gatsby/src/theme/assets/scss/
├── ss-docs.scss          # Main documentation theme
├── ss-variables.scss     # Theme variables
└── bootstrap/            # Bootstrap v4 customizations (update to v5)
```

Create `src/styles/global.scss` (note: .scss not .css):
```css
/* Import all theme styles */
@import './theme/base.css';
@import './theme/typography.css';
@import './theme/components.css';
@import './theme/prism.css';

/* Additional global styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

/* Version warnings */
.version-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.version-warning.eol {
  background: #f8d7da;
  border-color: #dc3545;
}
```

**Bootstrap v4 to v5 Migration Notes**:
- Update class names: `ml-*`/`mr-*` → `ms-*`/`me-*` (start/end instead of left/right)
- Update class names: `pl-*`/`pr-*` → `ps-*`/`pe-*`
- Remove `left-*`/`right-*` classes, use `start-*`/`end-*`
- Update form classes: `.form-group` removed, use utilities
- Update JavaScript: Bootstrap JS syntax changed (if used)
- Update SCSS variables: Some renamed in v5

**Success Criteria**:
- All styles load correctly
- Site looks visually similar to original
- Responsive design works (Bootstrap v5 grid)
- No console errors
- Both Bootstrap and Tailwind CSS working together

---

### Step 6.2: Implement Version Warnings

**Goal**: Show warnings for pre-release or EOL versions.

**Tasks**:
Create `src/components/VersionWarning.astro`:
```astro
---
export interface Props {
  version: string;
}

const { version } = Astro.props;

// Version metadata (could be moved to config)
const versionInfo = {
  '6': { status: 'stable', eol: null },
  '5': { status: 'stable', eol: '2025-12-31' },
  '4': { status: 'eol', eol: '2024-09-30' },
  '3': { status: 'eol', eol: '2022-03-31' },
};

const info = versionInfo[version as keyof typeof versionInfo];
const now = new Date();
const eolDate = info?.eol ? new Date(info.eol) : null;
const isEOL = eolDate && now > eolDate;
const isPreRelease = info?.status === 'prerelease';
---

{(isEOL || isPreRelease) && (
  <div class={`version-warning ${isEOL ? 'eol' : 'prerelease'}`}>
    {isEOL && (
      <p>
        <strong>⚠️ End of Life:</strong> 
        This version is no longer supported. Please upgrade to a newer version.
      </p>
    )}
    {isPreRelease && (
      <p>
        <strong>🚧 Pre-release:</strong>
        This version is not yet stable. Documentation may be incomplete.
      </p>
    )}
  </div>
)}
```

Add to `DocsLayout.astro`:
```astro
<main class="docs-main">
  <VersionWarning version={version} />
  <slot />
</main>
```

**Success Criteria**:
- Warnings display for EOL versions
- Pre-release warnings show correctly
- Styling is appropriate

---

## Phase 6a: Multi-Version Documentation Support (Day 15.5)

### Step 6a.1: Enable Additional Documentation Versions

**Goal**: Configure the build system to load and display documentation for versions 3, 4, and 5, plus optional feature modules like LinkField and Elemental.

**Context**: Currently only v6 documentation is loaded. The content sources are defined in `_gatsby/sources-docs.js` but many entries are commented out. The LLM needs to uncomment specific source configurations and verify the content cloning pipeline works for multiple versions.

**Tasks**:
1. **Audit Current State**:
   - Examine `_gatsby/sources-docs.js` to identify commented-out source configurations
   - Verify that v6 docs are currently in `.cache/content/docs/` or `src/content/docs/`
   - Check if current directory structure assumes single version (needs restructuring)

2. **Uncomment Source Configurations**:
   - Edit `_gatsby/sources-docs.js` (or copy to root if not already done)
   - Uncomment ONLY these specific source blocks:
     - `docs--5` (Silverstripe v5 core documentation)
     - `docs--6--optional_features/linkfield` (LinkField module for v6)
     - `docs--5--optional_features/linkfield` (LinkField module for v5)
   - Do NOT modify `sources-user.js`
   - Leave other commented sources alone for now

3. **Restructure Content Directory**:
   - Current state: `src/content/docs/` contains v6 docs at root level
   - Required state: `src/content/docs/v{version}/` structure
   - Move existing v6 content into `src/content/docs/v6/` subdirectory
   - Ensure `.cache/content/docs/` also follows versioned structure

4. **Update Clone Script**:
   - Verify `scripts/clone-docs.js` correctly handles version-based directory structure
   - Ensure it creates `v3/`, `v4/`, `v5/`, `v6/` subdirectories
   - Test that optional feature modules clone into correct paths (e.g., `v6/optional_features/linkfield/`)

5. **Test Content Cloning**:
   ```bash
   # Clear existing cache
   rm -rf .cache/content/docs
   
   # Run clone script
   npm run clone-docs
   
   # Verify structure
   ls -R .cache/content/docs/
   ```

**Expected Directory Structure After Cloning**:
```
.cache/content/docs/
├── v3/
│   └── (v3 documentation files)
├── v4/
│   └── (v4 documentation files)
├── v5/
│   ├── (v5 core documentation)
│   └── optional_features/
│       └── linkfield/
├── v6/
│   ├── (v6 core documentation)
│   └── optional_features/
│       └── linkfield/
```

**Success Criteria**:
- `sources-docs.js` has exactly 3 source blocks uncommented (v5 core, v6 linkfield, v5 linkfield)
- Content cloning creates versioned subdirectories correctly
- All version content directories contain markdown files
- No errors during clone process
- `sources-user.js` remains unmodified

---

### Step 6a.2: Update Content Collection Configuration

**Goal**: Update Astro's content collection configuration to handle multi-version content structure and ensure all versions are queryable.

**Tasks**:
1. **Update Content Collection Base Path**:
   - Edit `src/content/config.ts`
   - Verify content collection points to `.cache/content/docs/` (not `src/content/docs/`)
   - Ensure collection can recursively find content in `v3/`, `v4/`, `v5/`, `v6/` subdirectories

2. **Update Content Helpers**:
   - Edit `src/utils/contentHelpers.ts`
   - Update `getDocsByVersion()` to correctly filter by version from new structure
   - Update `getAllVersions()` to return `['3', '4', '5', '6']`
   - Ensure version inference works with new directory structure

3. **Update Dynamic Route**:
   - Edit `src/pages/[version]/[...slug].astro`
   - Verify `getStaticPaths()` correctly generates routes for all 4 versions
   - Test that version parameter extraction works with new structure
   - Ensure slug building accounts for optional_features subdirectories

4. **Update Navigation Generation**:
   - Edit `scripts/generate-nav.js` (if exists, otherwise create)
   - Ensure navigation data generation runs for all versions
   - Create `/public/api/nav/3.json`, `4.json`, `5.json`, `6.json`
   - Include optional features in navigation tree

5. **Test Version Routing**:
   ```bash
   npm run build
   
   # Verify all version routes exist
   ls dist/en/3/
   ls dist/en/4/
   ls dist/en/5/
   ls dist/en/6/
   ls dist/en/6/optional_features/linkfield/
   ls dist/en/5/optional_features/linkfield/
   ```

6. **Update Version Switcher**:
   - Edit `src/components/VersionSwitcher.tsx`
   - Ensure dropdown includes all 4 versions
   - Test version switching between all versions

**Success Criteria**:
- Content collections correctly load docs from all 4 versions
- All version URLs generate without errors (`/en/3/`, `/en/4/`, `/en/5/`, `/en/6/`)
- Optional feature modules appear in navigation and are accessible
- Version switcher shows all 4 options
- No build errors related to content paths
- Can navigate to LinkField docs in both v5 and v6

---

## Phase 6b: Child Page Navigation Blocks (Day 16)

### Step 6b.1: Understand Gatsby [CHILDREN] Implementation

**Goal**: Analyze the legacy Gatsby implementation to understand how `[CHILDREN]` blocks work before reimplementing in Astro.

**Context**: Documentation markdown files contain special `[CHILDREN]` tags (sometimes with attributes like `[CHILDREN Folder="Field_types"]`) that dynamically generate navigation links to child pages. The LLM needs to understand the exact behavior before recreating it.

**Tasks**:
1. **Locate Legacy Implementation**:
   - Search `_gatsby/` for how `[CHILDREN]` tags are processed
   - Check `_gatsby/src/utils/parseChildrenOf.ts` (if exists)
   - Check `_gatsby/gatsby-node.js` for content transformation logic
   - Look for remark/rehype plugins that handle this syntax

2. **Document Current Behavior**:
   - Identify the exact syntax variations:
     - `[CHILDREN]` - lists all child pages
     - `[CHILDREN Folder="Field_types"]` - lists children of specific folder
     - Any other attribute patterns
   - Determine output format (unordered list? grid? cards?)
   - Check if it uses frontmatter (title, summary, icon) from child pages
   - Determine sorting logic (alphabetical? by order field? folder-aware?)

3. **Find Example Usage**:
   - Search `.cache/content/docs/` for files containing `[CHILDREN]`
   - Identify at least 3 real-world examples with different attribute variations
   - Document expected output for each example

4. **Analyze Styling**:
   - Check `_gatsby/src/theme/assets/scss/` for child navigation styling
   - Identify CSS classes used (e.g., `.children-list`, `.child-card`)
   - Capture layout patterns (grid, list, etc.)

**Research Questions to Answer**:
- Does `[CHILDREN]` only work at specific locations in markdown (top, bottom, anywhere)?
- Does it support nesting (children of children)?
- Are hidden pages (frontmatter: `hide: true`) excluded?
- Does `hideChildren: true` affect this?
- What happens if a folder has no children?

**Success Criteria**:
- Complete understanding of all `[CHILDREN]` syntax variations documented
- Located the exact Gatsby code responsible for transformation
- Identified at least 3 real examples in documentation
- Documented expected HTML output structure
- Captured CSS styling requirements

---

### Step 6b.2: Implement Astro [CHILDREN] Component

**Goal**: Recreate the `[CHILDREN]` functionality in Astro using a custom remark plugin and component.

**Tasks**:
1. **Create Remark Plugin**:
   - Create `src/utils/remarkChildrenBlocks.ts`
   - Write remark plugin to detect `[CHILDREN]` syntax in markdown
   - Parse attributes (e.g., `Folder="Field_types"`)
   - Replace `[CHILDREN]` blocks with custom component syntax

2. **Create ChildrenList Component**:
   - Create `src/components/ChildrenList.astro`
   - Accept props: `currentPath`, `folder` (optional), `version`
   - Query content collection for child pages of current page
   - Filter based on `folder` attribute if provided
   - Exclude pages with `hide: true` frontmatter
   - Sort by `order` field, then alphabetically

3. **Implement Rendering Logic**:
   ```astro
   ---
   // src/components/ChildrenList.astro
   import { getCollection } from 'astro:content';
   
   export interface Props {
     currentPath: string;
     folder?: string;
     version: string;
   }
   
   const { currentPath, folder, version } = Astro.props;
   
   // Get all docs for this version
   const allDocs = await getCollection('docs', ({ id }) => 
     id.startsWith(`v${version}/`)
   );
   
   // Filter to children of current path
   const children = allDocs.filter(doc => {
     // Implementation logic based on Gatsby research
     const isChild = isChildOf(doc.id, currentPath);
     const matchesFolder = !folder || doc.id.includes(folder);
     const isVisible = !doc.data.hide;
     return isChild && matchesFolder && isVisible;
   });
   
   // Sort children
   children.sort((a, b) => {
     if (a.data.order !== undefined && b.data.order !== undefined) {
       return a.data.order - b.data.order;
     }
     return a.data.title.localeCompare(b.data.title);
   });
   ---
   
   <div class="children-list">
     {children.map(child => (
       <div class="child-item">
         <a href={buildChildUrl(child.id, version)}>
           {child.data.icon && <i class={`icon fa-${child.data.icon}`} />}
           <h3>{child.data.title}</h3>
           {child.data.summary && <p>{child.data.summary}</p>}
         </a>
       </div>
     ))}
   </div>
   
   <style>
     /* Copy styles from _gatsby/src/theme/assets/scss/ */
     .children-list {
       display: grid;
       grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
       gap: 1rem;
       margin: 2rem 0;
     }
     
     .child-item {
       border: 1px solid var(--border-color);
       padding: 1rem;
       border-radius: 4px;
     }
     
     .child-item:hover {
       background: var(--hover-bg);
     }
   </style>
   ```

4. **Integrate Plugin into Build**:
   - Edit `astro.config.mjs`
   - Add `remarkChildrenBlocks` to `remarkPlugins` array
   - Ensure plugin runs before MDX processing

5. **Create Helper Functions**:
   - Create `src/utils/childrenHelpers.ts`
   - Implement `isChildOf(docId, parentPath)` logic
   - Implement `buildChildUrl(docId, version)` slug builder
   - Handle edge cases (index files, nested paths)

6. **Test Implementation**:
   - Find pages with `[CHILDREN]` tags in cloned content
   - Build site and verify children lists render correctly
   - Test with and without `Folder` attribute
   - Test on pages with no children (should render nothing or message)
   - Verify styling matches old Gatsby site

7. **Handle Edge Cases**:
   - Empty children lists (no output or "No pages found" message?)
   - Invalid folder names in attributes
   - Nested `[CHILDREN]` blocks
   - `hideChildren: true` in parent page frontmatter

**Success Criteria**:
- `[CHILDREN]` blocks in markdown are detected and replaced
- Child pages render in a grid/list matching Gatsby output
- Folder attribute filtering works correctly
- Hidden pages are excluded
- Sorting respects `order` frontmatter
- Styling matches original design
- No build errors with pages containing `[CHILDREN]`
- Works for all versions (3, 4, 5, 6)

---

## Phase 6c: Persistent Sidebar State (Day 16.5)

### Step 6c.1: Implement Client-Side State Persistence

**Goal**: Make the sidebar navigation remember which folders are expanded when navigating between pages, eliminating the frustration of collapsed navigation.

**Context**: Currently, the `Sidebar.tsx` React component uses local state (`expandedPaths`) that resets on every page navigation. The LLM needs to persist this state using localStorage or sessionStorage and restore it on mount.

**Tasks**:
1. **Update Sidebar Component State Management**:
   - Edit `src/components/Sidebar.tsx`
   - Replace simple `useState` with persistent storage solution
   - Use `localStorage` for persistence across browser sessions
   - Store as JSON array of expanded path strings

2. **Implement Storage Helpers**:
   ```typescript
   // src/components/Sidebar.tsx
   
   const STORAGE_KEY = 'ss-docs-sidebar-state';
   
   function loadExpandedPaths(): Set<string> {
     if (typeof window === 'undefined') return new Set();
     
     try {
       const stored = localStorage.getItem(STORAGE_KEY);
       if (stored) {
         const parsed = JSON.parse(stored);
         return new Set(parsed);
       }
     } catch (err) {
       console.warn('Failed to load sidebar state:', err);
     }
     
     return new Set();
   }
   
   function saveExpandedPaths(paths: Set<string>) {
     if (typeof window === 'undefined') return;
     
     try {
       const array = Array.from(paths);
       localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
     } catch (err) {
       console.warn('Failed to save sidebar state:', err);
     }
   }
   ```

3. **Update Component Initialization**:
   ```typescript
   export default function Sidebar({ version, currentPath }: Props) {
     const [navTree, setNavTree] = useState<NavItem[]>([]);
     const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => 
       loadExpandedPaths()
     );
     
     // Save to localStorage whenever expanded paths change
     useEffect(() => {
       saveExpandedPaths(expandedPaths);
     }, [expandedPaths]);
     
     // ... rest of component
   }
   ```

4. **Update Toggle Logic**:
   - Ensure `togglePath()` function triggers state update correctly
   - Verify that expanding/collapsing persists immediately
   - Test that state survives page navigation

5. **Handle Version Switching**:
   - Consider whether expanded state should be version-specific
   - If yes, use storage key like `ss-docs-sidebar-v${version}`
   - If no, use single key for all versions
   - Decision: Version-specific is better (different nav trees per version)

**Success Criteria**:
- Expanding a folder persists when navigating to child page
- Refreshing the page retains expanded state
- State persists across browser sessions
- State is version-specific (v3 state ≠ v6 state)
- No console errors related to localStorage
- Works in browsers with localStorage disabled (graceful degradation)

---

### Step 6c.2: Auto-Expand Current Path on Page Load

**Goal**: Automatically expand the sidebar navigation tree to show the current page's position, providing visual context of where the user is in the documentation hierarchy.

**Context**: Even with persistent state, if a user arrives via direct link or bookmark, the sidebar may not show their current location. The LLM needs to ensure the current page's ancestor folders are always expanded on initial render.

**Tasks**:
1. **Determine Current Page's Ancestors**:
   - Create `src/utils/sidebarHelpers.ts`
   - Implement `getAncestorPaths(currentPath: string): string[]`
   - Returns array of parent paths from root to current page
   - Example: `/en/6/forms/field-types/` → `['/en/6/', '/en/6/forms/', '/en/6/forms/field-types/']`

2. **Auto-Expand on Mount**:
   ```typescript
   // src/components/Sidebar.tsx
   
   useEffect(() => {
     // When current path changes, ensure ancestors are expanded
     const ancestors = getAncestorPaths(currentPath);
     
     setExpandedPaths(prev => {
       const newExpanded = new Set(prev);
       ancestors.forEach(path => newExpanded.add(path));
       return newExpanded;
     });
   }, [currentPath]);
   ```

3. **Prevent Flash of Collapsed Content (FOUC)**:
   - The above `useEffect` runs after React hydration, causing visible expansion animation
   - Need to compute expanded state BEFORE hydration
   - Options:
     - **Option A**: Server-render with correct initial state (complex, requires SSR context)
     - **Option B**: Use `client:load` instead of `client:idle` for immediate hydration
     - **Option C**: Hide sidebar until hydration complete (brief flash)
     - **Option D**: Inline script in layout to set initial state before React loads
   - Recommended: **Option B** (simplest, acceptable tradeoff)

4. **Implement Pre-Hydration State** (if avoiding FOUC is critical):
   - Edit `src/layouts/DocsLayout.astro`
   - Add inline script before Sidebar component:
   ```astro
   <script define:vars={{ currentPath, version }}>
     // Set initial expanded state before React hydrates
     const ancestors = [/* compute ancestors from currentPath */];
     const stored = JSON.parse(localStorage.getItem('ss-docs-sidebar-state') || '[]');
     const initial = [...stored, ...ancestors];
     window.__SIDEBAR_INITIAL__ = initial;
   </script>
   
   <Sidebar 
     version={version} 
     currentPath={currentPath}
     client:load 
   />
   ```

5. **Update Sidebar to Use Pre-Computed State**:
   ```typescript
   const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
     // Check for pre-computed state from inline script
     if (typeof window !== 'undefined' && window.__SIDEBAR_INITIAL__) {
       const initial = new Set(window.__SIDEBAR_INITIAL__);
       delete window.__SIDEBAR_INITIAL__;
       return initial;
     }
     
     // Fallback to localStorage
     return loadExpandedPaths();
   });
   ```

6. **Highlight Current Page**:
   - Ensure current page has visual indicator in sidebar
   - Add `.active` class to current nav item
   - Style with bold text, background color, or left border
   - Ensure active item is scrolled into view if off-screen

7. **Scroll Active Item Into View**:
   ```typescript
   useEffect(() => {
     // After navigation, scroll active item into view
     const activeElement = document.querySelector('.sidebar .nav-item.active');
     if (activeElement) {
       activeElement.scrollIntoView({ 
         block: 'nearest', 
         behavior: 'smooth' 
       });
     }
   }, [currentPath]);
   ```

**Success Criteria**:
- Current page's ancestors are always expanded on page load
- Works for direct links, bookmarks, external referrals
- No visible flash of collapsed content (FOUC)
- Current page is highlighted in sidebar
- Current page scrolls into view if needed
- State persists when navigating away and back
- Works across all versions
- No layout shift or animation jank on load

**Deliverables**:
- Updated `Sidebar.tsx` with persistent state
- Helper functions for ancestor path calculation
- Inline script for FOUC prevention (if implemented)
- Styling for active nav item
- Smooth scroll behavior for active item

---

## Phase 7: Redirects & SEO (Day 17)

### Step 7.1: Implement Redirects

**Goal**: Set up legacy URL redirects to maintain SEO and user bookmarks.

**Tasks**:
Create `public/_redirects` (Netlify format):
```
# Default redirect
/                              /en/6/              302

# Legacy CMS 2.x redirects
/en/2/*                        /en/3/:splat        301

# Add other legacy redirects from gatsby-node.js
```

Or use Astro middleware for complex redirects:
Create `src/middleware/redirects.ts`:
```typescript
import { defineMiddleware } from 'astro:middleware';

const redirects: Record<string, string> = {
  '/old-path': '/new-path',
  // Add more redirects
};

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  
  if (redirects[url.pathname]) {
    return context.redirect(redirects[url.pathname], 301);
  }
  
  return next();
});
```

**Success Criteria**:
- Legacy URLs redirect correctly
- Default route goes to latest version
- No broken links from old site

---

### Step 7.2: Configure SEO & Sitemap

**Goal**: Ensure excellent SEO with proper meta tags and sitemap.

**Tasks**:
Update `BaseLayout.astro` with comprehensive SEO:
```astro
---
import { SEO } from 'astro-seo';

const {
  title,
  description,
  image,
  canonical,
} = Astro.props;

const siteUrl = 'https://docs.silverstripe.org';
const fullUrl = canonical || new URL(Astro.url.pathname, siteUrl).href;
const ogImage = image || `${siteUrl}/images/og-default.jpg`;
---

<SEO
  title={title}
  description={description}
  canonical={fullUrl}
  openGraph={{
    basic: {
      title: title,
      type: 'website',
      image: ogImage,
      url: fullUrl,
    },
    optional: {
      description: description,
      siteName: 'Silverstripe CMS Documentation',
    },
  }}
  twitter={{
    card: 'summary_large_image',
    title: title,
    description: description,
    image: ogImage,
  }}
/>
```

Configure sitemap in `astro.config.mjs`:
```javascript
export default defineConfig({
  site: 'https://docs.silverstripe.org',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/api/'),
    }),
  ],
});
```

**Success Criteria**:
- All pages have proper meta tags
- Sitemap generates correctly
- Social media previews work
- Google structured data validates

---

## Phase 8: Build & Deploy (Days 18-19)

### Step 8.1: Configure Build Process

**Goal**: Set up the complete build process with content cloning.

**Tasks**:
Update `package.json`:
```json
{
  "scripts": {
    "dev": "astro dev",
    "dev:docs": "DOCS_CONTEXT=docs astro dev",
    "dev:user": "DOCS_CONTEXT=user astro dev",
    "prebuild": "node scripts/clone-docs.js",
    "build": "astro check && astro build",
    "build:docs": "DOCS_CONTEXT=docs npm run build",
    "build:user": "DOCS_CONTEXT=user npm run build",
    "preview": "astro preview",
    "astro": "astro"
  }
}
```

Create `scripts/build-all.sh`:
```bash
#!/bin/bash
set -e

echo "Building docs site..."
npm run build:docs

echo "Building user help site..."
npm run build:user

echo "All builds complete!"
```

**Success Criteria**:
- Build completes without errors
- All pages generate correctly
- Assets are optimized
- Build time is reasonable

---

### Step 8.2: Configure Netlify Deployment

**Goal**: Set up Netlify to deploy both docs and user sites.

**Tasks**:
Create `netlify.toml`:
```toml
[build]
  command = "npm run build:docs"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24"
  DOCS_CONTEXT = "docs"

[[redirects]]
  from = "/"
  to = "/en/6/"
  status = 302

# Add other redirects

[context.production]
  environment = { DOCS_CONTEXT = "docs" }

# Optional: separate site for user help
[context.userhelp]
  environment = { DOCS_CONTEXT = "user" }
```

**Environment Variables in Netlify**:
- `PUBLIC_DOCSEARCH_API_KEY`
- `PUBLIC_DOCSEARCH_APP_ID`
- `PUBLIC_DOCSEARCH_INDEX_DOCS`
- `PUBLIC_DOCSEARCH_INDEX_USER`

**Success Criteria**:
- Netlify builds successfully
- Environment variables are set
- Redirects work in production
- Both doc contexts deploy correctly

---

### Step 8.3: Test Production Build

**Goal**: Thoroughly test the production build before going live.

**Tasks**:
1. **Build locally**: `npm run build`
2. **Preview**: `npm run preview`
3. **Test checklist**:
   - [ ] All 4 versions load correctly
   - [ ] Navigation works in each version
   - [ ] Search functionality works
   - [ ] Version switcher works
   - [ ] Images load and are optimized
   - [ ] Code blocks have syntax highlighting
   - [ ] Links work (no 404s)
   - [ ] Redirects work
   - [ ] Mobile responsive
   - [ ] Performance is good (Lighthouse)

4. **Deploy to staging**: Test on Netlify staging URL

**Success Criteria**:
- All tests pass
- No console errors
- Performance is equal or better than Gatsby site

---

## Phase 9: Migration & Monitoring (Days 20-21)

### Step 9.1: Deploy to Production

**Goal**: Switch production site to Astro build.

**Tasks**:
1. **Final build verification**: Ensure everything works on staging
2. **Update DNS/Netlify**: Point production to new build
3. **Monitor deployment**: Watch for errors
4. **Keep Gatsby as fallback**: Don't delete old code immediately

**Rollback Plan**:
- If issues arise, revert Netlify to previous build
- Fix issues on staging before re-deploying

**Success Criteria**:
- Site deploys successfully
- No downtime
- No broken links reported
- Search still works

---

### Step 9.2: Post-Launch Monitoring

**Goal**: Monitor site performance and fix any issues.

**Tasks**:
1. **Monitor analytics**: Check traffic patterns
2. **Check error logs**: Look for 404s or errors
3. **Test search**: Verify Algolia still works
4. **Performance testing**: Run Lighthouse audits
5. **User feedback**: Monitor for bug reports

**Week 1 checklist**:
- [ ] No critical errors
- [ ] Search working correctly
- [ ] Build times are acceptable
- [ ] All versions accessible
- [ ] Analytics tracking working

**Success Criteria**:
- Site is stable
- Performance is good
- No major issues reported

---

## Phase 10: Testing & Validation (Day 20-21)

### Step 10.1: Implement Basic Smoke Tests

**Goal**: Add automated tests to catch regressions during and after migration.

**Tasks**:
Create `tests/smoke.test.js`:
```javascript
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  // Test that pages generate
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toContain('/en/6/');
  });

  test('docs page loads', async ({ page }) => {
    await page.goto('/en/6/getting-started/');
    await expect(page.locator('h1')).toBeVisible();
  });

  // Test all versions work
  ['3', '4', '5', '6'].forEach(version => {
    test(`version ${version} is accessible`, async ({ page }) => {
      await page.goto(`/en/${version}/`);
      await expect(page.locator('main')).toBeVisible();
    });
  });

  // Test search box is present
  test('search box is visible', async ({ page }) => {
    await page.goto('/en/6/');
    await expect(page.locator('.DocSearch-Button')).toBeVisible();
  });

  // Test version switcher works
  test('version switcher is interactive', async ({ page }) => {
    await page.goto('/en/6/');
    const switcher = page.locator('.version-switcher button');
    await expect(switcher).toBeVisible();
    await switcher.click();
    await expect(page.locator('.version-dropdown')).toBeVisible();
  });
});
```

**Link Checker Script** (`scripts/check-links.js`):
```javascript
// Crawl built site and check for broken internal links
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const distDir = path.join(__dirname, '../dist');
const brokenLinks = [];

glob('**/*.html', { cwd: distDir }, (err, files) => {
  files.forEach(file => {
    const content = fs.readFileSync(path.join(distDir, file), 'utf8');
    const links = content.match(/href="([^"]+)"/g) || [];
    
    links.forEach(link => {
      const href = link.match(/href="([^"]+)"/)[1];
      if (href.startsWith('/') && !href.startsWith('//')) {
        const target = path.join(distDir, href, 'index.html');
        if (!fs.existsSync(target)) {
          brokenLinks.push({ source: file, target: href });
        }
      }
    });
  });

  if (brokenLinks.length > 0) {
    console.error('Broken links found:', brokenLinks);
    process.exit(1);
  } else {
    console.log('✅ No broken links found');
  }
});
```

**Install test dependencies**:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Add to package.json**:
```json
{
  "scripts": {
    "test": "playwright test",
    "test:links": "node scripts/check-links.js"
  }
}
```

**Success Criteria**:
- All smoke tests pass
- No broken internal links
- Search and version switcher are interactive
- All 4 versions generate correctly

---

## Phase 11: Optimization & Cleanup (Day 21+)

### Step 11.1: Performance Optimization

**Goal**: Fine-tune performance for optimal user experience.

**Tasks**:
1. **Image optimization**: Ensure all images use Astro's Image component
2. **Bundle analysis**: Check for unnecessarily large JS bundles
3. **CSS cleanup**: Remove unused CSS
4. **Lazy loading**: Implement for below-fold content
5. **Caching**: Configure appropriate cache headers

**Tools**:
- Lighthouse CI
- WebPageTest
- Astro build --analyze

**Success Criteria**:
- Lighthouse score 95+
- Fast Time to Interactive
- Minimal JavaScript shipped

---

### Step 11.2: Code Cleanup

**Goal**: Remove temporary code and finalize the implementation.

**Tasks**:
1. **Delete archived Gatsby files**: 
   ```bash
   # After confirming everything works
   rm -rf _gatsby
   ```
2. **Update `.gitignore`**: Remove `_gatsby/` entry since it's deleted
3. **Update documentation**: Document the new build process
4. **Clean up comments**: Remove TODO comments
5. **Type safety**: Ensure all TypeScript types are correct
6. **Linting**: Set up ESLint/Prettier
7. **Clean up scripts**: Remove `scripts/archive-gatsby.sh` if no longer needed

**Success Criteria**:
- Code is clean and maintainable
- No `_gatsby/` folder remains
- `.gitignore` is cleaned up
- Documentation is up to date
- No lingering TODOs

---

### Step 11.3: Remove Tailwind CSS, Replace with SCSS

**Goal**: Replace all Tailwind CSS classes with equivalent SCSS to simplify the styling stack.

**Tasks**:
1. **Audit Tailwind Usage**: 
   - Search codebase for Tailwind classes (e.g., `className="flex items-center"`)
   - Document all Tailwind utilities being used
   - Create mapping of Tailwind classes to SCSS equivalents

2. **Create SCSS Utilities**:
   - Build SCSS utility classes to replace common Tailwind patterns
   - Create `src/styles/utilities.scss` with flexbox, spacing, typography utilities
   - Ensure utilities match existing Tailwind behavior

3. **Replace Tailwind Classes**:
   - Component by component, replace Tailwind classes with SCSS equivalents
   - Use proper semantic class names where appropriate
   - Convert inline utility classes to component-specific SCSS

4. **Remove Tailwind Dependencies**:
   ```bash
   npm uninstall tailwindcss @tailwindcss/typography autoprefixer
   ```
   - Delete `tailwind.config.js`
   - Remove Tailwind imports from stylesheets
   - Update build configuration

5. **Verify Styling**:
   - Visual regression testing to ensure no styling changes
   - Check responsive behavior still works
   - Test all interactive components

**Example Conversion**:
```scss
// Before (Tailwind in component)
<div className="flex items-center justify-between p-4 bg-gray-100">

// After (SCSS)
<div className="header-nav">

// In SCSS file
.header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: var(--color-gray-100);
}
```

**Success Criteria**:
- No Tailwind dependencies in package.json
- No Tailwind classes in codebase
- All styling is pure SCSS/CSS
- Site looks identical to pre-removal state
- Build size potentially reduced
- Simplified CSS architecture

---

## Appendix

### A. Key Differences Between Gatsby and Astro

| Aspect | Gatsby | Astro |
|--------|--------|-------|
| **Routing** | gatsby-node.js createPages | file-based in src/pages/ |
| **Data Fetching** | GraphQL everywhere | getStaticPaths + Content Collections |
| **Components** | React only | Astro + any framework (React islands) |
| **Plugins** | gatsby-plugin-* | @astrojs/* integrations |
| **Images** | gatsby-image | astro:assets |
| **Client JS** | All React hydrates | Opt-in with client:* directives |

### B. Migration Checklist

Core Features:
- [ ] Content cloning from git repos
- [ ] Version management (3, 4, 5, 6)
- [ ] Sidebar navigation
- [ ] Header with search and version switcher
- [ ] Markdown rendering with Prism
- [ ] Image optimization
- [ ] Algolia DocSearch
- [ ] Callout blocks
- [ ] Children listings
- [ ] Breadcrumbs
- [ ] Table of contents
- [ ] Version warnings
- [ ] Redirects
- [ ] Sitemap
- [ ] SEO meta tags

### C. Common Pitfalls & Solutions

**Pitfall 1**: Content Collections require specific directory structure
- **Solution**: Ensure content is in `src/content/docs/` and follows naming convention

**Pitfall 2**: React components don't work without client directive
- **Solution**: Add `client:load` or `client:idle` to interactive React components

**Pitfall 3**: Image imports work differently
- **Solution**: Use `astro:assets` Image component, not Next.js style imports

**Pitfall 4**: No GraphQL in Astro
- **Solution**: Use Content Collections API and direct file operations

**Pitfall 5**: Environment variables need PUBLIC_ prefix for client
- **Solution**: Rename `GATSBY_*` to `PUBLIC_*` for client-side access

### D. Resources

**Official Docs**:
- Astro: https://docs.astro.build
- Gatsby to Astro migration: https://docs.astro.build/en/guides/migrate-to-astro/from-gatsby/

**Community**:
- Astro Discord: https://astro.build/chat
- GitHub Discussions: https://github.com/withastro/astro/discussions

**Tools**:
- Starlight (docs theme): https://starlight.astro.build
- Astro VS Code extension
- Astro DevTools

---

## Summary

This migration plan converts the Silverstripe documentation site from Gatsby to Astro in approximately 2-3 weeks. The plan is broken into discrete steps that can be executed incrementally, tested independently, and rolled back if needed.

**Key Benefits of Migration**:
- ✅ **Better Performance**: Zero JS by default, faster page loads
- ✅ **Simpler Architecture**: File-based routing, Content Collections
- ✅ **Faster Builds**: Vite-based, optimized for static content
- ✅ **Better DX**: Less boilerplate, clearer mental model
- ✅ **Future-Proof**: Modern stack, active development

**Next Steps**:
Start with Phase 1 (Setup) and work through each phase sequentially. Test thoroughly at each step before proceeding to the next.
