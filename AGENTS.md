# Silverstripe CMS Documentation Site - Agent Context

## Project Overview

This is the Silverstripe CMS documentation site, currently being migrated from Gatsby v2 to Astro v4+. The site serves two contexts:
- **Developer Documentation** (`DOCS_CONTEXT=docs`) - Technical documentation for CMS developers
- **User Help** (`DOCS_CONTEXT=user`) - End-user guides and tutorials

The migration follows the detailed plan in `z_astro-plan.md`. Legacy Gatsby files are archived in `_gatsby/` for reference.

## Tech Stack

**Framework & Core:**
- Astro v4+ (static site generator with islands architecture)
- React v18 (for interactive components only - SearchBox, VersionSwitcher, Sidebar)
- TypeScript v5 (strict mode)
- Node.js v24 LTS

**Styling:**
- Bootstrap v5 (upgraded from v4)
- SCSS with Dart Sass compiler
- Tailwind CSS (retained initially, will be removed in final phase - see Phase 11.3)

**Content & Data:**
- Astro Content Collections (type-safe content management)
- MDX for markdown processing
- Shiki for syntax highlighting
- Content sourced from multiple git repositories (cloned to `.cache/content/`)

**Search & SEO:**
- Algolia DocSearch v3
- Astro Sitemap integration
- Comprehensive meta tags and OpenGraph support

**Build & Deploy:**
- npm (package manager)
- Netlify (hosting platform)
- Environment variables for context switching

## Project Structure

```
/
├── .cache/content/         # Git-cloned documentation (gitignored)
│   └── docs/
│       ├── v3/
│       ├── v4/
│       ├── v5/
│       └── v6/
├── _gatsby/                # Archived Gatsby project (reference only, gitignored)
├── scripts/
│   ├── clone-docs.js       # Clones documentation from git repos
│   └── archive-gatsby.sh   # Initial setup script
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.astro    # Site header (Astro)
│   │   ├── Sidebar.tsx     # Navigation sidebar (React island)
│   │   ├── SearchBox.tsx   # Algolia search (React island)
│   │   └── VersionSwitcher.tsx  # Version selector (React island)
│   ├── layouts/
│   │   ├── BaseLayout.astro      # Base HTML structure
│   │   └── DocsLayout.astro      # Documentation page layout
│   ├── pages/
│   │   ├── index.astro           # Homepage (redirects to latest version)
│   │   ├── 404.astro
│   │   └── [version]/[...slug].astro  # Dynamic documentation routes
│   ├── content/
│   │   └── config.ts       # Content collection definitions
│   ├── styles/
│   │   ├── global.scss     # Global styles
│   │   └── utilities.scss  # SCSS utilities (for post-Tailwind migration)
│   ├── utils/              # Utility functions (migrated from _gatsby/src/utils/)
│   │   ├── fileToTitle.ts
│   │   ├── contentHelpers.ts
│   │   └── rewrite*.ts
│   └── types/              # TypeScript type definitions
├── static/                 # Static assets (copied from original project)
├── public/                 # Build output for static files
└── astro.config.mjs        # Astro configuration
```

## Key Configuration Files

- **astro.config.mjs** - Astro settings, integrations, markdown config
- **tsconfig.json** - TypeScript strict mode configuration
- **package.json** - Dependencies and build scripts
- **sources-docs.js** / **sources-user.js** - Git repository sources (from _gatsby/)
- **.env** - Environment variables (Algolia credentials, context)
- **netlify.toml** - Netlify deployment configuration

## Coding Standards

**TypeScript:**
- Use strict mode
- Define explicit types for all function parameters and returns
- Leverage Astro's type inference where possible
- Use `type` for object shapes, `interface` for extendable contracts

**React Components:**
- Only use React for interactive components (islands)
- Always specify `client:*` directive (`client:load`, `client:idle`)
- Keep components small and focused
- Use TypeScript for all React components (.tsx)

**Astro Components:**
- Use `.astro` files for static/server-rendered content
- Extract reusable logic to utilities
- Prefer Astro components over React when no interactivity needed
- Keep component scripts minimal

**Styling:**
- Currently: Use both Bootstrap v5 and Tailwind CSS
- Future (Phase 11.3): Replace all Tailwind with SCSS utilities
- Use semantic class names over utility classes where appropriate
- Keep component-specific styles in `<style>` blocks
- Global styles in `src/styles/global.scss`

**File Naming:**
- Components: PascalCase (e.g., `SearchBox.tsx`, `Header.astro`)
- Utilities: camelCase (e.g., `fileToTitle.ts`, `contentHelpers.ts`)
- Pages: kebab-case or dynamic routes (e.g., `[version]/[...slug].astro`)

## Content Management

**Version Structure:**
- Supports versions 3, 4, 5, 6
- Each version has independent content tree
- Content cloned from git repositories to `.cache/content/docs/v{version}/`

**Frontmatter Schema:**
```yaml
title: string (optional, defaults to filename)
summary: string (optional)
introduction: string (optional)
icon: string (default: 'file-alt')
iconBrand: string (optional)
hideChildren: boolean (default: false)
hide: boolean (default: false)
order: number (optional)
```

**URL Structure:**
- Pattern: `/en/{version}/{category}/{subcategory}/{page}/`
- Example: `/en/6/getting-started/installation/`

## Build Process

**Development:**
```bash
npm run dev           # Run dev server (docs context)
npm run dev:docs      # Explicit docs context
npm run dev:user      # User help context
```

**Production:**
```bash
npm run build         # Full build with content cloning (will first remove dist directory)
npm run build:docs    # Build docs site
npm run build:user    # Build user help site
```

**Utility Scripts:**
```bash
npm run clean         # Remove dist directory
npm run clone-docs    # Clone docs content manually
npm run clone-user    # Clone user help content manually
npm run fix-paths     # Normalize relative image paths in markdown
```

**Content Cloning:**
- Runs automatically as part of `npm run build`
- Can be triggered manually: `npm run clone-docs` or `npm run clone-user`
- Uses `scripts/clone-docs.js` with sources from `sources-docs.js` / `sources-user.js`

**Image Path Fixing:**
- Runs automatically as part of `npm run build`
- Normalizes relative image paths in markdown files to correct nesting levels
- Prevents Astro asset resolution errors for symlinked content

## Testing Expectations

**Required Tests:**
- Smoke tests for page generation (all versions accessible)
- Link checking (no broken internal links)
- Search functionality verification
- Version switcher interactivity

**Testing Tools:**
- Playwright for end-to-end tests
- Custom link checker script (`scripts/check-links.js`)

**Run Tests:**
```bash
npm run test          # Run Playwright tests
npm run test:links    # Check for broken links
```

## Important Notes

**Migration Status:**
- Following `z_astro-plan.md` in phases
- Legacy code reference available in `_gatsby/` directory
- Do not modify files in `_gatsby/` - read-only reference

**Referencing Old Gatsby Code:**
When the plan indicates to reference old files, you can find them in the `_gatsby/` directory:

```
_gatsby/
├── src/
│   ├── components/          # React components (reference for logic/structure)
│   │   ├── Header.tsx       # Header component with styling
│   │   ├── Sidebar.tsx      # Sidebar navigation
│   │   ├── SearchBox.tsx    # Algolia search integration
│   │   ├── Nav.tsx          # Main navigation
│   │   └── ...
│   ├── hooks/
│   │   └── useHierarchy.ts  # Navigation tree building logic
│   ├── utils/               # Utility functions (migrate these)
│   │   ├── fileToTitle.js
│   │   ├── nodes.ts
│   │   ├── parseHTML.ts
│   │   └── rewrite*.ts
│   ├── types/               # TypeScript types
│   ├── theme/
│   │   └── assets/
│   │       └── scss/
│   │           ├── ss-docs.scss      # Main documentation theme
│   │           ├── ss-variables.scss # Theme variables
│   │           └── bootstrap/        # Bootstrap v4 customizations
│   └── templates/           # Page templates
├── gatsby-config.js         # Gatsby configuration (for plugin reference)
├── gatsby-node.js           # Build-time logic (page creation, redirects)
├── sources-docs.js          # Git sources for developer docs
├── sources-user.js          # Git sources for user help
├── package.json             # Dependencies reference
└── tsconfig.json            # TypeScript configuration

```

**When to Reference _gatsby/:**
- **Component styling**: Check `_gatsby/src/components/*.tsx` for CSS-in-JS or class names
- **Component logic**: Reference behavior and state management patterns
- **Theme/SCSS**: Copy and adapt from `_gatsby/src/theme/assets/scss/`
- **Utilities**: Migrate functions from `_gatsby/src/utils/`
- **Types**: Copy type definitions from `_gatsby/src/types/`
- **Build logic**: Check `_gatsby/gatsby-node.js` for page creation patterns
- **Configuration**: Reference plugin setups in `_gatsby/gatsby-config.js`

**Environment Variables:**
- Prefix client-side vars with `PUBLIC_` (e.g., `PUBLIC_DOCSEARCH_API_KEY`)
- Use `DOCS_CONTEXT` to switch between docs/user builds

**Content Location:**
- Content is NOT in `src/content/docs/` - it's in `.cache/content/docs/`
- Content Collections configured to point to `.cache/content/docs/`

**Performance:**
- Minimize JavaScript shipped to client
- Use Astro components over React when possible
- Leverage Astro's zero-JS default
- Images should use Astro's Image component for optimization

## Common Patterns

**Getting all docs for a version:**
```typescript
import { getCollection } from 'astro:content';
const docs = await getCollection('docs', ({ id }) => id.startsWith(`v${version}/`));
```

**Creating a dynamic route:**
```astro
---
export async function getStaticPaths() {
  const allDocs = await getCollection('docs');
  return allDocs.map(doc => ({ params: { slug: doc.slug }, props: { doc } }));
}
---
```

**React island with client directive:**
```astro
<SearchBox client:idle context={context} />
```

## Resources

- Migration Plan: `z_astro-plan.md`
- Astro Docs: https://docs.astro.build
- Legacy Reference: `_gatsby/` directory
