# [CHILDREN] Rendering Refactoring - Implementation Steps

## STEP 1: Create Canonical Helper Module

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Create `src/utils/childrenHelpers.js` with all helper functions. Base this on existing `src/utils/childrenHelpers.js` and consolidate duplicates.

**Functions to include:**
- `parseDocId(id)` - Parse doc ID into version, path parts, filename, isIndex
- `getParentPath(id)` - Get parent folder path from doc ID
- `getFolderName(id)` - Extract folder name from doc ID
- `isChildOf(childId, parentId)` - Check if child belongs under parent
- `getSiblings(docs, id, includeFolders)` - Get sibling pages
- `getChildren(docs, id, includeFolders)` - Get direct children
- `getChildrenByFolder(docs, parentId, folderName)` - Get children of specific folder
- `sortDocs(docs)` - Sort docs by order field
- `buildSlug(id)` - Build URL slug from doc ID

**Example structure:**
```javascript
/**
 * Parse a doc ID into its components
 * @param {string} id - Doc ID like "v6/00_Getting_Started/index"
 * @returns {object} {version, pathParts, fileName, isIndex}
 */
export function parseDocId(id) {
  // implementation
}

/**
 * Get all children of a document
 * @param {array} docs - Array of all docs
 * @param {string} id - Parent doc ID
 * @param {boolean} includeFolders - Include folder index pages
 * @returns {array} Child docs
 */
export function getChildren(docs, id, includeFolders = false) {
  // implementation
}

// ... other functions with JSDoc comments
```

**Requirements:**
- All functions have JSDoc comments
- File compiles without errors
- Proper exports for reuse
- Remove duplicates from `src/utils/childrenHelpers.js` (keep only this file)

---

## STEP 2: Update Remark Plugin for Server-Side Rendering

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Update `src/utils/remarkChildrenBlocks.js` to output Astro component syntax instead of HTML elements.

**Changes:**
1. Modify plugin to accept `currentDocId` via options
2. Output MDX JSX nodes instead of HTML strings:
   ```javascript
   return {
     type: 'mdxJsxFlowElement',
     name: 'ChildrenList',
     attributes: [
       { type: 'mdxJsxAttribute', name: 'currentDocId', value: currentDocId },
       { type: 'mdxJsxAttribute', name: 'folder', value: childrenData.folder },
       // ... other attributes
     ],
     children: [],
   };
   ```

**Requirements:**
- Plugin accepts options parameter with `currentDocId`
- All [CHILDREN] attributes map to component props (folder, only, exclude, asList, includeFolders, reverse)
- No HTML elements in output
- Test with sample markdown to verify output format

---

## STEP 3: Refactor ChildrenList.astro Component

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Update `src/components/ChildrenList.astro` to render children at build time.

**Component props:**
```javascript
// These come from remark plugin as JSX attributes
const { currentDocId, folder, only, exclude, asList, includeFolders, reverse } = Astro.props;
```

**Prop types:**
- `currentDocId` (string, required) - Current document ID for context
- `folder` (string, optional) - Specific folder to list children from
- `only` (string, optional) - Comma-separated folders to include only
- `exclude` (string, optional) - Comma-separated folders to exclude
- `asList` (boolean, optional) - Render as `<dl>` instead of cards
- `includeFolders` (boolean, optional) - Include folder index pages
- `reverse` (boolean, optional) - Reverse sort order

**Component logic:**
1. Extract current version from `currentDocId` using helpers
2. Query Astro Content Collections to get all docs
3. Filter to docs matching current version
4. Get children using helper functions
5. Apply folder/only/exclude filters
6. Sort with `sortDocs()`, reverse if needed
7. Render as either:
   - `<dl>` with `<dt>` and `<dd>` for asList=true
   - Grid of Bootstrap cards for card view (default)

**Styling:**
- Use Bootstrap classes from existing codebase (grid, cards)
- Use Font Awesome for icons (fas fa-file-alt, fab fa-*)
- Match existing ChildrenList styling

**Requirements:**
- Imports from `src/utils/childrenHelpers.js`
- Imports from `astro:content`
- Queries Astro Content Collections
- Renders semantic HTML
- No JavaScript dependencies
- Test with pages that have [CHILDREN] blocks

---

## STEP 4: Update Page Template

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Update `src/pages/en/[version]/[...slug].astro` to pass `currentDocId` to remark plugin.

**Changes:**
1. Import `ChildrenList` component:
   ```javascript
   import ChildrenList from '../../../components/ChildrenList.astro';
   ```

2. Pass `currentDocId` to remarkChildrenBlocks plugin options:
   ```javascript
   const { Content } = await doc.render({
     remarkPlugins: [
       [remarkChildrenBlocks, { currentDocId: doc.id }]
     ],
     components: {
       ChildrenList,
     },
   });
   ```

**Requirements:**
- Remark plugin receives current document ID at render time
- ChildrenList component available to MDX renderer
- Build succeeds without TypeScript errors
- Test build to verify pages render

---

## STEP 5: Delete Client-Side Files

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Remove all client-side rendering scripts and unused components.

**Files to delete:**
- `src/scripts/renderChildren.js`
- `src/scripts/hydrateChildren.js`
- `public/render-children.js`
- `public/children-renderer.js`
- `public/children-helpers.js`
- `src/components/ChildrenListRenderer.tsx`
- `src/components/ChildrenOf.astro`
- `src/utils/rehypeChildrenRenderer.js`
- `src/utils/parseChildrenOf.js`

**Requirements:**
- All files deleted permanently using `rm` or `git rm`
- Build succeeds without errors
- Verify files are gone: `git status` should show deleted files

---

## STEP 6: Update Layouts

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Remove script tags that load client-side children renderers.

**File: `src/layouts/DocsLayout.astro`**
- Remove: `<script>import '../scripts/renderChildren';</script>`
- Look for any script tags referencing children rendering

**File: `src/layouts/BaseLayout.astro`**
- Remove: `<script src="/children-renderer.js"></script>`
- Remove: `<script type="module" src="/children-renderer.js"></script>`
- Look for any other children rendering scripts

**Requirements:**
- No child-rendering scripts loaded
- Build succeeds without errors
- Verify script tags are removed: `grep -n "children" src/layouts/*.astro`

---

## STEP 7: Update Configuration

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Update `astro.config.mjs` to clarify the [CHILDREN] rendering approach.

**Changes:**
1. Verify `remarkChildrenBlocks` is in the markdown config
2. Verify `rehypeChildrenRenderer` is NOT active (should be commented out or removed)
3. Add comment explaining SSR approach:
   ```javascript
   // [CHILDREN] blocks are server-side rendered at build time
   // - Parser: src/utils/remarkChildrenBlocks.js
   // - Renderer: src/components/ChildrenList.astro
   // - Helpers: src/utils/childrenHelpers.js
   ```

**Requirements:**
- Config file has clear comments
- No rehype children renderer active
- Build succeeds

---

## STEP 8: Update Documentation

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Update `AGENTS.md` to document the [CHILDREN] block system.

**Add section under "Common Patterns":**
```markdown
## [CHILDREN] Blocks

Documentation pages can include `[CHILDREN]` blocks to automatically list child or sibling pages.

**Syntax:**
- `[CHILDREN]` - List all children/siblings of current page
- `[CHILDREN Folder="name"]` - List children of specific folder
- `[CHILDREN Only="a,b,c"]` - List only children from these folders
- `[CHILDREN Exclude="x,y"]` - Exclude these folders from results
- `[CHILDREN asList]` - Render as definition list (`<dl>`) instead of cards
- `[CHILDREN reverse]` - Reverse the sort order

**Example:**
```markdown
[CHILDREN]
[CHILDREN Folder="Field_types"]
[CHILDREN Only="rc,beta" asList]
```

**Implementation:**
- **Parser:** `src/utils/remarkChildrenBlocks.js` - Converts `[CHILDREN]` markdown to component
- **Component:** `src/components/ChildrenList.astro` - Renders at build time
- **Helpers:** `src/utils/childrenHelpers.js` - Shared utility functions

**How it works:**
1. Remark plugin finds `[CHILDREN]` syntax in markdown files
2. Converts to `<ChildrenList>` Astro component with attributes
3. Component queries Astro Content Collections for all pages
4. Filters and sorts to find matching child pages
5. Renders as cards (with icons, titles, summaries) or definition list
6. Output is static HTML (no JavaScript)
```

**Requirements:**
- Documentation is clear and accurate
- Syntax examples are correct
- Links to relevant files work

---

## STEP 9: Validation

This is one step in a larger project to refactoring the [CHILDREN] block rendering system to use **Server-Side Rendering (SSR)** with Astro components.
- **Current state:** Massive code duplication, 15+ files, multiple rendering paths, ~500 lines of dead code.
- **Target state:** Single SSR implementation, zero JavaScript, all files consolidated.

Run build and dev environments to verify all functionality works.

**Commands:**
```bash
npm run build
npm run dev
```

**Checks:**
1. Build completes without errors or warnings
2. No "missing import" or "undefined variable" errors
3. All pages with [CHILDREN] blocks render correctly
4. HTML output contains rendered children (not placeholders like `<childrenlistrenderer>`)
5. No console errors when viewing pages locally (if you can test)
6. Git shows deleted files (not errors): `git status`

**Test specific pages:**
- Find pages with [CHILDREN] blocks
- Verify rendered output contains child page links
- Verify icons display correctly
- Verify titles and summaries show
- For asList pages, verify `<dl>` structure
- For card pages, verify card grid layout

**Requirements:**
- Build succeeds completely
- No regressions in existing functionality
- All [CHILDREN] blocks render as expected
- No TypeScript errors

---

## Success Criteria

After all steps:

✅ Single rendering path (SSR only)
✅ No code duplication (helpers in one file)
✅ No dead code (all unused files deleted)
✅ Clear documentation (AGENTS.md updated)
✅ Pure JavaScript (no TypeScript)
✅ Build succeeds (`npm run build` works)
✅ Dev works (`npm run dev` works)
✅ No console errors
✅ Zero Flash of Unstyled Content (FOUC)

---

## Rollback

If something breaks during any step:

```bash
git reset --hard HEAD~1
```

Then identify the issue and retry the step.
