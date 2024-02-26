const coreVersion = require('@mpxjs/core/package.json').version
const utilsVersion = require('@mpxjs/utils/package.json').version
const corePath = require.resolve('@mpxjs/core')
const utilsPath = require.resolve('@mpxjs/utils')
const semverLt = require('semver/functions/lt')

const leastCoreVersion = '2.8.59'
const leastUtilsVersion = '2.8.59'

function compare (version, leastVersion, npmName, npmPath) {
  if (semverLt(version, leastVersion)) {
    throw new Error(
      `${npmName} packages version mismatch:
    -${npmName}@${version}(${npmPath})
    This may cause things to work incorrectly, Make sure the usage version is greater than ${leastVersion}.
    `
    )
  }
}

compare(coreVersion, leastCoreVersion, '@mpxjs/core', corePath)
compare(utilsVersion, leastUtilsVersion, '@mpxjs/utils', utilsPath)
