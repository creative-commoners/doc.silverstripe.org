import React, { useEffect, useRef } from 'react';
import docsearch from '@docsearch/js';
import '@docsearch/css';

interface Props {
  context: 'docs' | 'user';
}

export default function SearchBox({ context }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const apiKey = import.meta.env.PUBLIC_DOCSEARCH_API_KEY;
    const appId = import.meta.env.PUBLIC_DOCSEARCH_APP_ID;
    const indexName = context === 'user' 
      ? import.meta.env.PUBLIC_DOCSEARCH_INDEX_USER
      : import.meta.env.PUBLIC_DOCSEARCH_INDEX_DOCS;
    
    if (!apiKey || !appId || !indexName) {
      console.warn('DocSearch credentials not configured');
      return;
    }
    
    try {
      const search = docsearch({
        container: containerRef.current,
        appId,
        apiKey,
        indexName,
      });
      
      return () => {
        // Clean up if needed
      };
    } catch (error) {
      console.error('Error initializing DocSearch:', error);
    }
  }, [context]);
  
  return <div ref={containerRef} className="search-box" />;
}
