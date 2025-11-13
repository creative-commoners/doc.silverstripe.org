export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.test.jsx'],
  collectCoverageFrom: ['src/utils/**/*.js', 'src/components/**/*.{js,jsx}', '!src/utils/**/*.mjs'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(scss|sass|css)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '^astro:content$': '<rootDir>/tests/__mocks__/astroContent.js',
  },
};

