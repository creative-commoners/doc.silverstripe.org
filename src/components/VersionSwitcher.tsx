import React, { useState } from 'react';

interface Props {
  version: string;
  context: 'docs' | 'user';
}

export default function VersionSwitcher({ version, context }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const versions = ['6', '5', '4', '3'];
  
  const handleVersionChange = (newVersion: string) => {
    if (newVersion === version) {
      setIsOpen(false);
      return;
    }
    
    // Navigate to same page in different version
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(
      new RegExp(`/en/${version}/`), 
      `/en/${newVersion}/`
    );
    window.location.href = newPath;
  };
  
  return (
    <div className="version-switcher">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="version-button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        v{version}
        <span className="version-chevron">▼</span>
      </button>
      {isOpen && (
        <ul className="version-dropdown" role="listbox">
          {versions.map(v => (
            <li key={v} role="option" aria-selected={v === version}>
              <button 
                onClick={() => handleVersionChange(v)}
                className={v === version ? 'active' : ''}
              >
                v{v}
              </button>
            </li>
          ))}
        </ul>
      )}
      <style>{`
        .version-switcher {
          position: relative;
          display: inline-block;
        }
        
        .version-button {
          background-color: transparent;
          border: 1px solid #ccc;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        
        .version-button:hover {
          background-color: #f5f5f5;
          border-color: #999;
        }
        
        .version-chevron {
          font-size: 0.7rem;
          transition: transform 0.2s ease;
        }
        
        .version-button[aria-expanded="true"] .version-chevron {
          transform: rotate(180deg);
        }
        
        .version-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin: 0.5rem 0 0 0;
          padding: 0;
          list-style: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          min-width: 80px;
        }
        
        .version-dropdown li {
          margin: 0;
        }
        
        .version-dropdown button {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          background-color: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 0.9rem;
          transition: background-color 0.2s ease;
        }
        
        .version-dropdown button:hover,
        .version-dropdown button.active {
          background-color: #f0f0f0;
        }
        
        .version-dropdown button.active {
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
