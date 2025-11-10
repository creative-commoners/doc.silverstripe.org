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

## 📁 Project Structure

```text
/
├── .cache/content/              # Git-cloned documentation (gitignored)
├── _gatsby/                     # Archived Gatsby v2 project (reference only)
├── scripts/
│   ├── clone-docs.js            # Clones documentation from git repos
│   └── fix-image-paths.js       # Fixes relative image paths in markdown
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Header.astro
│   │   ├── Sidebar.tsx
│   │   ├── SearchBox.tsx
│   │   └── VersionSwitcher.tsx
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── DocsLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── [version]/[...slug].astro  # Dynamic documentation routes
│   ├── content/
│   │   ├── config.ts            # Content collection schema
│   │   └── docs/                # Markdown documentation files
│   ├── styles/
│   │   ├── global.scss
│   │   └── utilities.scss
│   └── utils/                   # Utility functions and plugins
├── static/                      # Static assets
├── public/                      # Build output for static files
└── astro.config.mjs             # Astro configuration
```

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

- **Documentation source**: Cloned from git repositories to `.cache/content/`
- **Content collection**: Located in `src/content/docs/`
- **Dynamic routes**: All pages generated from `src/pages/[version]/[...slug].astro`
- **Image assets**: Located in `src/content/docs/_images/`

## 🔗 Documentation

For detailed information about the project architecture, migration status, and coding standards, see:
- **Architecture & Process**: See [AGENTS.md](./AGENTS.md)
- **Migration Plan**: See [z_astro-plan.md](./z_astro-plan.md)
- **Astro Docs**: https://docs.astro.build

## 📦 Tech Stack

- **Astro v5** - Static site generator
- **React v19** - Interactive components (SearchBox, VersionSwitcher, Sidebar)
- **TypeScript v5** - Strict type checking
- **Bootstrap v5** - Component framework
- **SCSS** - Styling with Dart Sass
- **MDX** - Markdown with JSX support

## 🚀 Deployment

The site is deployed on **Netlify**. See `netlify.toml` for deployment configuration.

