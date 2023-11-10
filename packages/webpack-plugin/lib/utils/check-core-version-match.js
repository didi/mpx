// @mpxjs/webpack-plugin 2.7.x -> @mpxjs/core 2.7.x
// @mpxjs/webpack-plugin 2.8.x -> @mpxjs/core 2.8.x
const coreVersion = require('@mpxjs/core/package.json').version
const packageName = require('../../package.json').name
const packageVersion = require('../../package.json').version

if (packageVersion.slice(0, 3) !== coreVersion.slice(0, 3)) {
  const corePath = require.resolve('@mpxjs/core')
  const packagePath = require.resolve('../../package.json')
  throw new Error(
    `@mpxjs/core packages version mismatch:
    -@mpxjs/core@${coreVersion}(${corePath})
    -${packageName}@${packageVersion}(${packagePath})
    This may cause things to work incorrectly, Make sure to use the same minor version for both.
    For example: @mpxjs/core@2.7.x with @mpxjs/webpack-plugin@2.7.x
    `
  )
}
