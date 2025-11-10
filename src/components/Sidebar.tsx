import React, { useState, useEffect } from 'react';
import type { NavItem } from '../utils/contentHelpers';
import '../styles/sidebar.scss';

interface Props {
  version: string;
  currentPath: string;
}

export default function Sidebar({ version, currentPath }: Props) {
  const [navTree, setNavTree] = useState<NavItem[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        const response = await fetch(`/api/nav/${version}.json`);
        if (!response.ok) throw new Error(`Failed to load nav: ${response.status}`);
        const data = await response.json();
        setNavTree(data);
        
        // Auto-expand paths containing current page
        const expanded = new Set<string>();
        const parts = currentPath.split('/').filter(Boolean);
        let currentPath_ = '';
        for (const part of parts) {
          currentPath_ += '/' + part;
          expanded.add(currentPath_);
        }
        setExpandedPaths(expanded);
      } catch (err) {
        console.error('Failed to load nav:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNavigation();
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

  const renderNavItem = (item: NavItem, depth = 0): React.ReactNode => {
    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedPaths.has(item.path);

    return (
      <li key={item.path} className={`sidebar-item sidebar-depth-${depth} ${isActive ? 'sidebar-active' : ''}`}>
        <div className="sidebar-item-header">
          {hasChildren && (
            <button
              className={`sidebar-toggle ${isExpanded ? 'sidebar-expanded' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                togglePath(item.path);
              }}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className="sidebar-toggle-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 3L11 8L6 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {!hasChildren && <span className="sidebar-toggle-spacer" />}
          
          <a
            href={item.path}
            className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            {item.title}
          </a>
        </div>
        
        {hasChildren && isExpanded && (
          <ul className="sidebar-children">
            {item.children.map((child) => renderNavItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {isLoading ? (
          <div className="sidebar-loading">Loading...</div>
        ) : navTree.length > 0 ? (
          <ul className="sidebar-tree">
            {navTree.map((item) => renderNavItem(item))}
          </ul>
        ) : (
          <div className="sidebar-empty">No navigation available</div>
        )}
      </nav>
    </aside>
  );
}
