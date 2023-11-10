const coreVersion = require('@mpxjs/core/package.json').version
const utilsVersion = require('@mpxjs/utils/package.json').version
const corePath = require.resolve('@mpxjs/core')
const utilsPath = require.resolve('@mpxjs/utils')
const latestCoreVersion = '2.8.59'
const latestUtilsVersion = '2.8.59'

function compareVersion (v1, v2) {
  v1 = v1.split('.')
  v2 = v2.split('.')
  const len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i])
    const num2 = parseInt(v2[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
}

function compare (version, latestVersion, npmName, npmPath) {
  if (compareVersion(version, latestVersion) === -1) {
    throw new Error(
      `${npmName} packages version mismatch:
    -@mpxjs/core@${version}(${npmPath})
    This may cause things to work incorrectly, Make sure the usage version is greater than ${latestVersion}.
    `
    )
  }
}

compare(coreVersion, latestCoreVersion, '@mpxjs/core', corePath)
compare(utilsVersion, latestUtilsVersion, '@mpxjs/utils', utilsPath)
