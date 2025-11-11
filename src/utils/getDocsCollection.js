import { getCollection } from 'astro:content';

export async function getDocsWithVersions(): Promise<Array<CollectionEntry<'docs'> & { version }>> {
  const docs = await getCollection('docs');
  
  return docs.map(doc => {
    // Extract version from doc ID (first path component)
    const versionMatch = doc.id.match(/^v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '6';
    
    return {
      ...doc,
      version,
    };
  });
}

export async function getDocsByVersion(version): Promise<CollectionEntry<'docs'>[]> {
  const docs = await getCollection('docs');
  return docs.filter(doc => doc.id.startsWith(`v${version}/`));
}
