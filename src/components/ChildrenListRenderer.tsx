'use client';

import React, { useEffect, useState } from 'react';
import { parseDocId, getChildren, getSiblings, getChildrenByFolder, sortDocs, buildSlug, getFolderName } from '../utils/childrenHelpers';

interface ChildrenListRendererProps {
  folder?: string;
  only?: string[];
  exclude?: string[];
  asList?: boolean;
  includeFolders?: boolean;
  reverse?: boolean;
}

/**
 * React component that renders a list of child documents
 * Used to render [CHILDREN] blocks in documentation
 */
const ChildrenListRenderer: React.FC<ChildrenListRendererProps> = ({
  folder,
  only,
  exclude,
  asList = false,
  includeFolders = false,
  reverse = false,
}) => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChildren() {
      try {
        // Get current document ID from the page context
        const wrapper = document.querySelector('[data-current-doc-id]');
        const docId = wrapper?.getAttribute('data-current-doc-id');
        
        if (!docId) {
          console.warn('ChildrenListRenderer: Could not find current document ID');
          setError('Could not determine current document');
          setLoading(false);
          return;
        }

        // Load docs index
        const response = await fetch('/docs-index.json');
        if (!response.ok) throw new Error('Failed to load docs index');
        const allDocsData = await response.json();

        // Parse current document
        const parsed = parseDocId(docId);

        // Filter docs for this version
        const versionDocs = allDocsData.filter((doc: any) => doc.id.startsWith(`${parsed.version}/`));

        let childrenList = [];

        if (folder) {
          childrenList = getChildrenByFolder(versionDocs, docId, folder);
        } else if (only) {
          const matchingFolders = getChildren(versionDocs, docId, true).filter((doc: any) => {
            const folderName = getFolderName(doc.id);
            return only.some(name => name.toLowerCase() === folderName.toLowerCase());
          });
          
          for (const parentFolder of matchingFolders) {
            const folderChildren = getChildren(versionDocs, parentFolder.id, false);
            childrenList.push(...folderChildren);
          }
        } else if (exclude) {
          childrenList = getChildren(versionDocs, docId, includeFolders);
          childrenList = childrenList.filter((doc: any) => {
            const folderName = getFolderName(doc.id);
            return !exclude.some(name => name.toLowerCase() === folderName.toLowerCase());
          });
        } else {
          if (parsed.isIndex) {
            childrenList = getChildren(versionDocs, docId, includeFolders);
          } else {
            childrenList = getSiblings(versionDocs, docId, includeFolders);
          }
        }

        // Sort
        childrenList = sortDocs(childrenList);

        // Reverse if needed
        if (reverse) {
          childrenList.reverse();
        }

        setChildren(childrenList);
      } catch (err) {
        console.error('ChildrenListRenderer: Error loading children:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadChildren();
  }, [folder, only, exclude, includeFolders, reverse]);

  if (loading) {
    return <div className="children-list-renderer loading">Loading...</div>;
  }

  if (error) {
    console.error('ChildrenListRenderer error:', error);
    return null;
  }

  if (children.length === 0) {
    return null;
  }

  if (asList) {
    return (
      <div className="children-list-renderer as-list">
        <dl>
          {children.map((child) => {
            const title = child.title || getFolderName(child.id);
            const slug = buildSlug(child.id);
            const summary = child.summary || '';
            
            return (
              <React.Fragment key={child.id}>
                <dt><a href={slug}>{title}</a></dt>
                <dd>{summary}</dd>
              </React.Fragment>
            );
          })}
        </dl>
      </div>
    );
  }

  return (
    <div className="children-list-renderer docs-overview py-5">
      <div className="row">
        {children.map((child) => {
          const title = child.title || getFolderName(child.id);
          const slug = buildSlug(child.id);
          const summary = child.summary || '';
          const iconClass = child.iconBrand 
            ? `fab fa-${child.iconBrand}` 
            : `fas fa-${child.icon || 'file-alt'}`;
          
          return (
            <div key={child.id} className="col-12 col-lg-6 py-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    <span className="theme-icon-holder card-icon-holder mr-2">
                      <i className={iconClass}></i>
                    </span>
                    <span className="card-title-text">{title}</span>
                  </h5>
                  <div className="card-text">{summary}</div>
                  <a className="card-link-mask" href={slug} aria-label={title}></a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChildrenListRenderer;
