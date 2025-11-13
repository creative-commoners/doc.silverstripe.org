export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/utils/**/*.js', '!src/utils/**/*.mjs'],
};

