const fs = require('fs')
const path = require('path')
const names = ['@mpxjs/webpack-plugin', '@mpxjs/core', '@mpxjs/api-proxy', 'webpack', 'eslint', '@mpxjs/eslint-config']
const result = { node: process.version, dependencies: {} }
names.forEach(name => {
  const file = fs.realpathSync(path.resolve('../node_modules', name, 'package.json'))
  result.dependencies[name] = { version: JSON.parse(fs.readFileSync(file)).version, package: file, entry: fs.realpathSync(require.resolve(name)) }
})
const jestPackage = require.resolve('jest/package.json')
result.dependencies.jest = { version: require(jestPackage).version, package: jestPackage }
console.log(JSON.stringify(result, null, 2))
