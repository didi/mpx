const assert = require('assert')
const fs = require('fs')
const path = require('path')

function checkEnvironment (workspace = __dirname) {
  const dependencyRoot = __dirname
  const manifest = JSON.parse(fs.readFileSync(path.join(dependencyRoot, 'package.json'), 'utf8'))
  const lock = JSON.parse(fs.readFileSync(path.join(dependencyRoot, 'package-lock.json'), 'utf8'))
  const dependencies = Object.assign({}, manifest.dependencies, manifest.devDependencies)
  const resolved = {}
  Object.keys(dependencies).filter(name => name.startsWith('@mpxjs/')).forEach(name => {
    assert.strictEqual(dependencies[name], 'latest', `${name} must use the npm latest tag`)
    const directory = path.join(dependencyRoot, 'node_modules', name)
    assert.strictEqual(fs.realpathSync(directory), directory, `${name} must be installed in the shared node_modules, not linked`)
    const entry = fs.realpathSync(require.resolve(name, { paths: [workspace] }))
    assert(entry.startsWith(directory + path.sep), `${name} resolves outside shared dependencies: ${entry}`)
    const installed = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'))
    const locked = lock.packages[`node_modules/${name}`]
    assert(locked && !locked.link && locked.resolved.startsWith('https://registry.npmjs.org/'), `${name} must come from the npm registry`)
    assert.strictEqual(installed.version, locked.version, `${name} differs from package-lock.json`)
    resolved[name] = { version: installed.version, directory }
  })
  return resolved
}

module.exports = checkEnvironment
if (require.main === module) console.log(JSON.stringify(checkEnvironment(fs.realpathSync(process.cwd())), null, 2))
