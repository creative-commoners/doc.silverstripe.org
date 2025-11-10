import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function getDocsWithVersions(): Promise<Array<CollectionEntry<'docs'> & { version: string }>> {
  const docs = await getCollection('docs');
  
  // For now, we're using v6 as the default
  // In future phases, we'll need to handle multiple versions
  return docs.map(doc => ({
    ...doc,
    version: '6',
  }));
}

export async function getDocsByVersion(version: string): Promise<CollectionEntry<'docs'>[]> {
  const docs = await getCollection('docs');
  // Currently all docs are v6, filter as needed
  return docs;
}
