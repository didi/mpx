/**
 * @file config of jest
 * @url https://jestjs.io/docs/en/configuration
 */
module.exports = {
  // rootDir: path.join(__dirname),
  moduleFileExtensions: ['js', 'mpx', 'json'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // webpack的alias需要在此处理
    '^mini-project-plugin(.*)': '<rootDir>/src/plugin/$1'
  },
  globals: {
    'ts-jest': {
      tsConfig: {
        target: 'ES2019'
      },
      babelConfig: true
    }
  },
  testPathIgnorePatterns: ['dist', 'node_modules'],
  testURL: 'http://test.api.com',
  setupFiles: ['<rootDir>/test/setup'],
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.ts$': '<rootDir>/node_modules/ts-jest',
    '^.+\\.mpx$': '<rootDir>/node_modules/@mpxjs/mpx-jest'
  },
  transformIgnorePatterns: ['node_modules/(?!(@mpxjs))']
}
