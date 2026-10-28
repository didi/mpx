module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/business.test.cjs'],
  transform: {},
  watchman: false,
  cacheDirectory: '<rootDir>/.jest-cache',
  maxWorkers: 1
}
