#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function findPackageRoot (entry) {
  let current = path.dirname(entry)

  while (true) {
    const packagePath = path.join(current, 'package.json')
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
        if (pkg.name === '@mpxjs/webpack-plugin') {
          return {
            packageRoot: current,
            version: pkg.version || null
          }
        }
      } catch (e) {
        // Continue searching parent manifests.
      }
    }

    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
}

function resolvePlatformDirectory (projectRoot) {
  projectRoot = path.resolve(projectRoot || process.cwd())
  if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
    throw new Error(`Project root is not a directory: ${projectRoot}`)
  }

  let entry
  try {
    entry = require.resolve('@mpxjs/webpack-plugin', { paths: [projectRoot] })
  } catch (e) {
    throw new Error(`Cannot resolve @mpxjs/webpack-plugin from project root: ${projectRoot}`)
  }

  const packageInfo = findPackageRoot(entry)
  if (!packageInfo) {
    throw new Error(`Cannot locate @mpxjs/webpack-plugin package root from entry: ${entry}`)
  }

  const platformDirectory = path.join(packageInfo.packageRoot, 'lib/platform')
  const platformEntry = path.join(platformDirectory, 'index.js')
  if (!fs.existsSync(platformEntry)) {
    throw new Error(`Platform rules entry does not exist: ${platformEntry}`)
  }

  return Object.assign({}, packageInfo, {
    projectRoot,
    entry,
    platformDirectory
  })
}

function main () {
  try {
    const result = resolvePlatformDirectory(process.argv[2])
    process.stdout.write(result.platformDirectory + '\n')
  } catch (e) {
    process.stderr.write(`resolve-platform: ${e.message}\n`)
    process.exitCode = 1
  }
}

if (require.main === module) main()

module.exports = {
  resolvePlatformDirectory
}
