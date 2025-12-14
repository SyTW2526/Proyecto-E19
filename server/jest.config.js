export default {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
