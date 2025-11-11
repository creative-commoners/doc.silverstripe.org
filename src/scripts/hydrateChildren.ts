/**
 * Client-side script to hydrate ChildrenListRenderer React components
 * This finds all <div data-component="ChildrenListRenderer"> elements
 * and mounts React components on them
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ChildrenListRenderer from '../components/ChildrenListRenderer';

function hydrateChildrenComponents() {
  // Find all divs that need to be hydrated
  const elements = document.querySelectorAll('[data-component="ChildrenListRenderer"]');
  
  elements.forEach((element) => {
    // Extract props from data attributes
    const folder = element.getAttribute('data-folder') || undefined;
    const only = element.getAttribute('data-only')?.split(',') || undefined;
    const exclude = element.getAttribute('data-exclude')?.split(',') || undefined;
    const asList = element.getAttribute('data-as-list') === 'true';
    const includeFolders = element.getAttribute('data-include-folders') === 'true';
    const reverse = element.getAttribute('data-reverse') === 'true';
    
    // Create root and render component
    const root = createRoot(element);
    root.render(
      React.createElement(ChildrenListRenderer, {
        folder,
        only,
        exclude,
        asList,
        includeFolders,
        reverse,
      })
    );
  });
}

// Run on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateChildrenComponents);
} else {
  hydrateChildrenComponents();
}
