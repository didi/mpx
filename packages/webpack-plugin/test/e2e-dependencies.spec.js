const fs = require('fs')
const os = require('os')
const path = require('path')
const linkPackages = require('../../../test/e2e/linkPackages')

describe('E2E workspace dependencies', () => {
  let projectDir

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpx-e2e-dependencies-'))
  })

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true })
  })

  it('replaces published packages with workspace sources and can run repeatedly', () => {
    const nodeModules = path.join(projectDir, 'node_modules')
    fs.mkdirSync(path.join(nodeModules, '@mpxjs/core'), { recursive: true })
    fs.writeFileSync(path.join(nodeModules, '@mpxjs/core/stale.js'), '')
    fs.mkdirSync(path.join(nodeModules, '@mpxjs/mpx-jest'), { recursive: true })
    fs.writeFileSync(path.join(nodeModules, '@mpxjs/mpx-jest/keep.js'), '')

    linkPackages(projectDir)
    linkPackages(projectDir)

    const packagesDir = path.resolve(__dirname, '../../../packages')
    fs.readdirSync(packagesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).forEach(({ name: dir }) => {
      const source = path.join(packagesDir, dir)
      const { name } = require(path.join(source, 'package.json'))
      expect(fs.realpathSync(path.join(nodeModules, name))).toBe(source)
    })
    expect(fs.existsSync(path.join(nodeModules, '@mpxjs/core/stale.js'))).toBe(false)
    expect(fs.existsSync(path.join(nodeModules, '@mpxjs/mpx-jest/keep.js'))).toBe(true)
  })

  it('uses the same Webpack from the fixture and workspace plugin and clears stale build cache', () => {
    fs.mkdirSync(path.join(projectDir, '.cache'))
    fs.writeFileSync(path.join(projectDir, '.cache/stale'), '')
    linkPackages(projectDir)

    const plugin = require.resolve('@mpxjs/webpack-plugin', { paths: [projectDir] })
    expect(require.resolve('webpack', { paths: [projectDir] })).toBe(
      require.resolve('webpack', { paths: [path.dirname(plugin)] })
    )
    expect(fs.existsSync(path.join(projectDir, '.cache'))).toBe(false)
  })
})
