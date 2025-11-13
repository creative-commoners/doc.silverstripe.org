# Silverstripe CMS Documentation Site

This is the Silverstripe CMS documentation site, currently being migrated from Gatsby v2 to Astro v4+.

The site serves two contexts:
- **Developer Documentation** - Technical documentation for CMS developers
- **User Help** - End-user guides and tutorials

## 🚀 Quick Start

```sh
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run build        # Build production site
npm run preview      # Preview production build
npm run clean        # Remove dist directory
```

## 🧞 Available Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                                           |
| :--------------------- | :--------------------------------------------------------------- |
| `npm install`          | Installs dependencies                                            |
| `npm run dev`          | Starts local dev server at `localhost:4321`                      |
| `npm run build`        | Builds production site to `./dist/` with content cloning         |
| `npm run clean`        | Removes `./dist/` directory                                      |
| `npm run clone-docs`   | Clone developer documentation from git repos (runs in build)     |
| `npm run clone-user`   | Clone user help from git repos (runs in build)                   |
| `npm run fix-paths`    | Normalize relative image paths in markdown (runs in build)       |
| `npm run preview`      | Preview your build locally, before deploying                     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check`                 |
| `npm test`             | Run Jest unit tests                                              |
| `npm run test:watch`   | Run Jest tests in watch mode                                     |

## 📁 Project Structure

```text
/
├── .cache/content/              # Git-cloned documentation (gitignored)
│   └── docs/
│       ├── v3/                  # Version 3 documentation
│       ├── v4/                  # Version 4 documentation
│       ├── v5/                  # Version 5 documentation
│       └── v6/                  # Version 6 documentation
├── _gatsby/                     # Archived Gatsby v2 project (reference only, gitignored)
├── scripts/
│   ├── clone-docs.js            # Clones documentation from git repos
│   └── archive-gatsby.sh        # Initial setup script
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Header.astro         # Site header (Astro)
│   │   ├── Sidebar.tsx          # Navigation sidebar (React island)
│   │   ├── SearchBox.tsx        # Algolia search (React island)
│   │   ├── VersionSwitcher.tsx  # Version selector (React island)
│   │   └── ChildrenList.astro   # Child page navigation (from Phase 6b)
│   ├── layouts/
│   │   ├── BaseLayout.astro     # Base HTML structure
│   │   └── DocsLayout.astro     # Documentation page layout
│   ├── pages/
│   │   ├── index.astro          # Homepage (redirects to latest version)
│   │   ├── 404.astro
│   │   └── [version]/[...slug].astro  # Dynamic documentation routes
│   ├── content/
│   │   └── config.ts            # Content collection definitions
│   ├── styles/
│   │   ├── global.scss          # Global styles
│   │   └── utilities.scss       # SCSS utilities (for post-Tailwind migration)
│   ├── utils/                   # Utility functions (migrated from _gatsby/src/utils/)
│   │   ├── fileToTitle.ts
│   │   ├── contentHelpers.js
│   │   ├── childrenHelpers.js   # Child page helpers (from Phase 6b)
│   │   ├── sidebarHelpers.js    # Sidebar state helpers (from Phase 6c)
│   │   └── rewrite*.js
├── static/                      # Static assets (copied from original project)
├── public/                      # Build output for static files
│   └── api/nav/                 # Generated navigation JSON files per version
└── astro.config.mjs             # Astro configuration
```

## 🧪 Testing

Unit tests are written with Jest and located in the `tests/` directory. Tests cover both utility functions and React components.

**Run tests:**
```bash
npm test           # Run tests once
npm run test:watch # Run tests in watch mode (rerun on changes)
```

**Test coverage:**
- **Utilities** (`tests/utils/`): All utility functions in `src/utils/` have unit tests covering link rewriting, content parsing, sidebar navigation, image path handling, and more
- **Components** (`tests/components/`): React components are tested using React Testing Library, including interactive behavior testing

**Testing tools & setup:**
- **Framework**: Jest with jsdom environment for DOM simulation
- **React Testing**: @testing-library/react for component testing
- **Configuration**: `jest.config.js` | Babel: `babel.config.js` | Mocks: `tests/__mocks__/` | Setup: `tests/setup.js`

**Writing tests:**
- Test files should be named `*.test.js` or `*.test.jsx` and placed in corresponding `tests/` subdirectory
- Utility tests in `tests/utils/` - test pure functions with Jest assertions
- Component tests in `tests/components/` - test React components with React Testing Library (use `@testing-library/react` for interactive behavior)
- Mock styles and external dependencies as needed (see existing tests for patterns)

## 🔧 Development Workflow

### Dev Server
```sh
npm run dev
```
Starts the development server with hot reload at `localhost:4321`.

### Production Build
```sh
npm run build
```
Runs the full build pipeline:
1. Clones documentation content from source repositories
2. Normalizes relative image paths in markdown files
3. Builds static Astro site to `./dist/`
4. Optimizes images with Astro's image pipeline

### Clean Rebuild
```sh
npm run clean && npm run build
```
Removes old dist directory and performs a clean build.

## 📝 Content Management

- **Documentation source**: Cloned from git repositories to `.cache/content/docs/`
- **Content collection**: Points to `.cache/content/docs/` (configured in `src/content/config.ts`)
- **Version structure**: Content organized in versioned directories (`v3/`, `v4/`, `v5/`, `v6/`)
- **Dynamic routes**: All pages generated from `src/pages/[version]/[...slug].astro`
- **Image assets**: Located within each version's content directory

## 🔗 Documentation

For detailed information about the project architecture, migration status, and coding standards, see:
- **Architecture & Process**: See [AGENTS.md](./AGENTS.md)
- **Migration Plan**: See [z_astro-plan.md](./z_astro-plan.md)
- **Astro Docs**: https://docs.astro.build

## 📦 Tech Stack

- **Astro v4+** - Static site generator with islands architecture
- **React v18** - Interactive components (SearchBox, VersionSwitcher, Sidebar)
- **Node.js v24 LTS** - Runtime environment
- **Bootstrap v5** - Component framework (upgraded from v4)
- **SCSS** - Styling with Dart Sass compiler
- **Tailwind CSS** - Utility framework (to be removed in Phase 11.3)
- **MDX** - Markdown with JSX support
- **Shiki** - Syntax highlighting
- **Algolia DocSearch v3** - Search functionality

## 🚀 Deployment

The site is deployed on **Netlify**. See `netlify.toml` for deployment configuration.

