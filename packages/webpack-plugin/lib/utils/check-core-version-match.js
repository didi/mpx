const semverSatisfies = require('semver/functions/satisfies')
const semverCoerce = require('semver/functions/coerce')

// 定义包之间的依赖关系和最低版本要求
const PACKAGE_DEPENDENCIES = {
  '@mpxjs/webpack-plugin': {
    '@mpxjs/core': '^2.10.15 || ^2.10.15-beta.1',
    '@mpxjs/utils': '^2.10.13 || ^2.10.13-beta.1',
    '@mpxjs/api-proxy': '^2.10.15 || ^2.10.15-beta.1'
  }
}

function getPackageVersion (packageName) {
  try {
    return require(`${packageName}/package.json`).version
  } catch (e) {
    console.warn(`无法获取 ${packageName} 的版本信息: ${e.message}`)
    return null
  }
}

function checkVersionSatisfies (version, requiredVersion) {
  try {
    const normalizedVersion = semverCoerce(version).version
    return semverSatisfies(normalizedVersion, requiredVersion)
  } catch (e) {
    console.warn(`版本检查失败: ${e.message}`)
    return false
  }
}

function checkPackageDependencies (packageName) {
  const dependencies = PACKAGE_DEPENDENCIES[packageName]
  if (!dependencies) return []

  const results = []

  for (const depName in dependencies) {
    const requiredVersion = dependencies[depName]
    const actualVersion = getPackageVersion(depName)

    if (!actualVersion) {
      results.push({
        dependency: depName,
        required: requiredVersion,
        actual: null,
        compatible: false,
        error: `无法获取 ${depName} 的版本信息`
      })
      continue
    }

    const isCompatible = checkVersionSatisfies(actualVersion, requiredVersion)
    results.push({
      dependency: depName,
      required: requiredVersion,
      actual: actualVersion,
      compatible: isCompatible
    })
  }

  return results
}

function checkVersionCompatibility () {
  const pluginResults = checkPackageDependencies('@mpxjs/webpack-plugin')
  const incompatibleResults = pluginResults.filter(result => !result.compatible)
  if (incompatibleResults.length > 0) {
    const errorMessages = incompatibleResults.map(result => {
      if (!result.actual) {
        return `  - ${result.error || `${result.dependency} 未安装`}`
      }
      return `  - ${result.dependency}@${result.actual} 不满足所需版本 ${result.required}`
    })
    throw new Error(
      `检测到 @mpxjs 包版本不兼容问题：\n${errorMessages.join('\n')}\n\n` +
      '这可能导致编译或运行异常。请确保所有 @mpxjs 相关包的版本兼容，建议使用相同版本。'
    )
  }
}

module.exports = checkVersionCompatibility
