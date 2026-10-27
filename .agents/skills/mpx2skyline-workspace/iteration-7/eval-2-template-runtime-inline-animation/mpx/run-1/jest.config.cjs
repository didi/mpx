module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/user-list.test.cjs'],
  transform: {},
  watchman: false,
  cacheDirectory: '<rootDir>/.jest-cache',
  cache: false
}
