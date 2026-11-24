const fs = require('fs')
const path = require('path')

// Keep each fixture's test tools, but use workspace sources and their installed dependencies.
module.exports = function linkPackages (projectDir) {
  const packagesDir = path.resolve(__dirname, '../../packages')
  const nodeModules = path.join(projectDir, 'node_modules')

  function link (name, source) {
    const target = path.join(nodeModules, name)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.rmSync(target, { recursive: true, force: true })
    fs.symlinkSync(source, target, 'junction')
  }

  fs.readdirSync(packagesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).forEach(({ name: dir }) => {
    const source = path.join(packagesDir, dir)
    const { name } = require(path.join(source, 'package.json'))
    link(name, source)
  })

  // Webpack plugins and the fixture's compiler must share the same Webpack instance.
  link('webpack', path.dirname(require.resolve('webpack/package.json')))
  fs.rmSync(path.join(projectDir, '.cache'), { recursive: true, force: true })
}

if (require.main === module) {
  module.exports(process.cwd())
}
