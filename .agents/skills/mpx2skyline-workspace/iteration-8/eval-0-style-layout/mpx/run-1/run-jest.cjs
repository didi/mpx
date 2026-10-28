const path = require('path')
require('jest').runCLI({
  config: JSON.stringify({
    rootDir: __dirname,
    testMatch: ['**/style-card.test.js'],
    testEnvironment: 'node',
    transform: {},
    watchman: false,
    cacheDirectory: path.join(__dirname, 'jest-cache')
  }),
  runInBand: true,
  json: true,
  outputFile: path.join(__dirname, 'jest-result.json')
}, [process.cwd()]).then(({ results }) => { process.exitCode = results.success ? 0 : 1 }).catch(error => { console.error(error); process.exitCode = 1 })
