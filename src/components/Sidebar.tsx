import React, { useState, useEffect, useRef } from 'react';
import type { NavItem } from '../utils/contentHelpers';
import { scrollElementIntoView } from '../utils/sidebarHelpers';
import '../styles/sidebar.scss';

interface Props {
  version: string;
  currentPath: string;
}

function getStorageKey(version: string): string {
  return `ss-docs-sidebar-v${version}`;
}

function loadExpandedPaths(version: string): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const storageKey = getStorageKey(version);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(parsed);
    }
  } catch (err) {
    console.warn('Failed to load sidebar state:', err);
  }

  return new Set();
}

function saveExpandedPaths(version: string, paths: Set<string>): void {
  if (typeof window === 'undefined') return;

  try {
    const storageKey = getStorageKey(version);
    const array = Array.from(paths);
    localStorage.setItem(storageKey, JSON.stringify(array));
  } catch (err) {
    console.warn('Failed to save sidebar state:', err);
  }
}

export default function Sidebar({ version, currentPath }: Props) {
  const [navTree, setNavTree] = useState<NavItem[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    loadExpandedPaths(version)
  );
  const [isLoading, setIsLoading] = useState(true);
  const activeItemRef = useRef<HTMLLIElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Save expanded paths to localStorage whenever they change
  useEffect(() => {
    saveExpandedPaths(version, expandedPaths);
  }, [expandedPaths, version]);

  // Scroll active item into view after navigation
  useEffect(() => {
    if (activeItemRef.current && navRef.current) {
      // Use setTimeout to ensure DOM has updated after expansion
      const timer = setTimeout(() => {
        scrollElementIntoView(activeItemRef.current!);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentPath]);

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        const response = await fetch(`/api/nav/${version}.json`);
        if (!response.ok) throw new Error(`Failed to load nav: ${response.status}`);
        const data = await response.json();
        setNavTree(data);
        
        // Merge stored expanded paths with auto-expanded paths from current page
        const storedExpanded = loadExpandedPaths(version);
        const ancestorPaths = new Set<string>();
        const parts = currentPath.split('/').filter(Boolean);
        let currentPath_ = '';
        for (let i = 0; i < parts.length - 1; i++) {
          // Don't include the last part (current page), only ancestors
          currentPath_ += parts[i] + '/';
          ancestorPaths.add('/' + currentPath_);
        }
        
        // Combine stored paths with current page ancestors
        const combined = new Set([...storedExpanded, ...ancestorPaths]);
        setExpandedPaths(combined);
      } catch (err) {
        console.error('Failed to load nav:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNavigation();
  }, [version, currentPath]);

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
    const isCurrentPage = currentPath === item.path;

    return (
      <li 
        key={item.path} 
        ref={isCurrentPage ? activeItemRef : null}
        className={`sidebar-item sidebar-depth-${depth} ${isActive ? 'sidebar-active' : ''} ${isCurrentPage ? 'sidebar-current-page' : ''}`}
      >
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
            className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${isCurrentPage ? 'sidebar-link-current' : ''}`}
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
    <aside className="sidebar" ref={navRef}>
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
