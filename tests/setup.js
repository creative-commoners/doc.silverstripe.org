import '@testing-library/jest-dom';

// Mock environment variables
process.env.PUBLIC_DOCSEARCH_API_KEY = 'test-api-key';
process.env.PUBLIC_DOCSEARCH_APP_ID = 'test-app-id';
process.env.PUBLIC_DOCSEARCH_INDEX_DOCS = 'test-index-docs';
process.env.PUBLIC_DOCSEARCH_INDEX_USER = 'test-index-user';

// Create import.meta mock globally
if (!globalThis.import) {
  globalThis.import = {};
}
globalThis.import.meta = {
  env: {
    PUBLIC_DOCSEARCH_API_KEY: 'test-api-key',
    PUBLIC_DOCSEARCH_APP_ID: 'test-app-id',
    PUBLIC_DOCSEARCH_INDEX_DOCS: 'test-index-docs',
    PUBLIC_DOCSEARCH_INDEX_USER: 'test-index-user',
  },
};

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
window.localStorage = localStorageMock;
