import { getCollection, type CollectionEntry } from 'astro:content';

export async function getDocsByVersion(version: string) {
  const allDocs = await getCollection('docs');
  return allDocs.filter(doc => {
    return doc.id.startsWith(`v${version}/`);
  });
}

export async function getAllVersions(): Promise<string[]> {
  return ['3', '4', '5', '6'];
}

export function buildSlug(filePath: string, version: string, thirdparty?: string): string {
  const parts = filePath
    .split('/')
    .filter(p => p && p !== 'en')
    .map(part => part.replace(/^\d+_/, '').replace(/\.(md|mdx)$/, ''))
    .filter(Boolean);

  const slug = ['en', version, thirdparty, ...parts]
    .filter(Boolean)
    .join('/')
    .toLowerCase();

  return `/${slug}/`;
}

export type NavItem = {
  title: string;
  path: string;
  children?: NavItem[];
  icon?: string;
  order?: number;
};

export function buildNavHierarchy(
  docs: CollectionEntry<'docs'>[],
  basePath?: string
): NavItem[] {
  const hierarchy: Record<string, NavItem> = {};
  const roots: NavItem[] = [];

  const filtered = basePath 
    ? docs.filter(doc => doc.id.startsWith(basePath))
    : docs;

  filtered.forEach(doc => {
    const parts = doc.slug.split('/').filter(Boolean);
    let current: any = hierarchy;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          title: part
            .replace(/^\d+_/, '')
            .replace(/_/g, ' ')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          path: '/' + parts.slice(0, index + 1).join('/') + '/',
          children: [],
          order: doc.data.order,
        };
      }

      if (index === parts.length - 1) {
        current[part].title = doc.data.title || current[part].title;
        current[part].order = doc.data.order;
      } else {
        current = current[part].children;
      }
    });
  });

  return roots;
}

export function sortByOrder(items: NavItem[]): NavItem[] {
  return items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
