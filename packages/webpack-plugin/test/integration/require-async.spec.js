const os = require('node:os')
const path = require('node:path')
const webpack = require('webpack')
const VirtualModulesPlugin = require('webpack-virtual-modules')
const MpxWebpackPlugin = require('../../lib')
const parseRequest = require('../../lib/utils/parse-request')

global.setImmediate = require('node:timers').setImmediate

class NoEmitPlugin {
  apply (compiler) {
    compiler.hooks.shouldEmit.tap('NoEmitPlugin', () => false)
  }
}

function runCompiler (compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        compiler.close(() => reject(error))
        return
      }

      compiler.close((closeError) => {
        if (closeError) {
          reject(closeError)
          return
        }
        resolve(stats)
      })
    })
  })
}

let caseIndex = 0

async function compileRequireAsync ({ source, transSubpackageRules, pluginOptions = {} }) {
  caseIndex += 1
  const virtualRoot = path.join(__dirname, `.virtual-require-async-${caseIndex}`)
  const entryPath = path.join(virtualRoot, 'entry.js')
  const targetPath = path.join(virtualRoot, 'target.js')

  const compiler = webpack({
    mode: 'development',
    context: virtualRoot,
    target: 'node',
    entry: entryPath,
    output: {
      path: path.join(os.tmpdir(), 'mpx-require-async-test'),
      filename: '[name].js'
    },
    optimization: {
      concatenateModules: false
    },
    plugins: [
      new VirtualModulesPlugin({
        [entryPath]: source,
        [targetPath]: 'module.exports = { value: 1 }'
      }),
      new MpxWebpackPlugin({
        mode: 'ios',
        srcMode: 'wx',
        projectRoot: virtualRoot,
        rnConfig: {
          supportSubpackage: true
        },
        transSubpackageRules,
        ...pluginOptions
      }),
      new NoEmitPlugin()
    ]
  })

  const stats = await runCompiler(compiler)
  return { stats, entryPath, targetPath }
}

function getWarnings (stats) {
  return stats.toJson({
    all: false,
    warnings: true
  }).warnings.map(item => item.message)
}

function getModules (stats, entryPath, targetPath) {
  const modules = [...stats.compilation.modules]
  return {
    entryModule: modules.find(module => module.resource === entryPath),
    targetModules: modules.filter(module => {
      return module.resource && parseRequest(module.resource).resourcePath === targetPath
    })
  }
}

function expectSingleTargetModule (targetModules, targetPath) {
  expect(targetModules).toHaveLength(1)
  expect(targetModules[0].resource).toBe(targetPath)
}

const directAndAsyncSource = `
  const direct = require('./target.js')
  const asyncModule = require.async('./target.js?root=map')
  module.exports = { direct, asyncModule }
`

describe('require.async', () => {
  it('should remove root query when RN subpackage is transformed to main package', async () => {
    const { stats, entryPath, targetPath } = await compileRequireAsync({
      source: directAndAsyncSource,
      transSubpackageRules: [
        {
          from: ['map'],
          to: ''
        }
      ]
    })

    expect(stats.hasErrors()).toBe(false)

    const { entryModule, targetModules } = getModules(stats, entryPath, targetPath)
    expectSingleTargetModule(targetModules, targetPath)

    const asyncDependencies = entryModule.dependencies.filter(dependency => {
      return dependency.type === 'mpx cjs async'
    })
    expect(asyncDependencies).toHaveLength(1)
    expect(asyncDependencies[0].request).toBe('./target.js')

    expect(getWarnings(stats).join('\n')).not.toContain(
      'need to declare subpackage name by root'
    )
  })

  it.each([
    ['RN transformed subpackage', { mode: 'ios' }, 'target'],
    ['Web subpackage', { mode: 'web' }, 'map']
  ])('should preserve async chunk behavior for %s', async (_, pluginOptions, targetRoot) => {
    const { stats, entryPath, targetPath } = await compileRequireAsync({
      source: directAndAsyncSource,
      transSubpackageRules: targetRoot === 'target'
        ? [{ from: ['map'], to: targetRoot }]
        : undefined,
      pluginOptions
    })

    expect(stats.hasErrors()).toBe(false)

    const { entryModule, targetModules } = getModules(stats, entryPath, targetPath)
    expectSingleTargetModule(targetModules, targetPath)
    expect(entryModule.blocks).toHaveLength(1)
    expect(entryModule.blocks[0].groupOptions.name).toBe(`${targetRoot}/index`)
    expect(entryModule.blocks[0].dependencies[0].request).toBe('./target.js')
  })

  it('should preserve async entry behavior for supported mini program', async () => {
    const { stats, entryPath, targetPath } = await compileRequireAsync({
      source: directAndAsyncSource,
      pluginOptions: {
        mode: 'tt'
      }
    })

    expect(stats.hasErrors()).toBe(false)

    const { entryModule, targetModules } = getModules(stats, entryPath, targetPath)
    expectSingleTargetModule(targetModules, targetPath)
    const asyncDependencies = entryModule.presentationalDependencies.filter(dependency => {
      return dependency.type === 'mpx dynamic entry'
    })
    expect(asyncDependencies).toHaveLength(1)
    expect(asyncDependencies[0].request).toBe('./target.js')
    expect(asyncDependencies[0].packageRoot).toBe('map')
  })

  it.each([
    ['RN with subpackages disabled', { mode: 'ios', rnConfig: { supportSubpackage: false } }],
    ['unsupported mini program', { mode: 'swan' }]
  ])('should remove root query when degrading %s', async (_, pluginOptions) => {
    const { stats, entryPath, targetPath } = await compileRequireAsync({
      source: directAndAsyncSource,
      pluginOptions
    })

    expect(stats.hasErrors()).toBe(false)

    const { entryModule, targetModules } = getModules(stats, entryPath, targetPath)
    expectSingleTargetModule(targetModules, targetPath)
    const asyncDependencies = entryModule.dependencies.filter(dependency => {
      return dependency.type === 'mpx cjs async'
    })
    expect(asyncDependencies).toHaveLength(1)
    expect(asyncDependencies[0].request).toBe('./target.js')
    expect(getWarnings(stats).join('\n')).not.toContain(
      'need to declare subpackage name by root'
    )
  })

  it('should warn when require.async has no root declaration', async () => {
    const { stats } = await compileRequireAsync({
      source: "module.exports = require.async('./target.js')"
    })

    expect(stats.hasErrors()).toBe(false)
    expect(getWarnings(stats).join('\n')).toContain(
      'need to declare subpackage name by root'
    )
  })

  it('should preserve root inferred from asyncSubpackageRules', async () => {
    const { stats, entryPath } = await compileRequireAsync({
      source: "module.exports = require.async('./target.js')",
      transSubpackageRules: [{ from: ['map'], to: '' }],
      pluginOptions: {
        asyncSubpackageRules: [{ include: /target\.js$/, root: 'map' }]
      }
    })

    expect(stats.hasErrors()).toBe(false)

    const entryModule = [...stats.compilation.modules].find(module => {
      return module.resource === entryPath
    })
    const asyncDependencies = entryModule.dependencies.filter(dependency => {
      return dependency.type === 'mpx cjs async'
    })
    expect(asyncDependencies).toHaveLength(1)
    expect(asyncDependencies[0].request).toBe('./target.js')
    expect(getWarnings(stats).join('\n')).not.toContain(
      'need to declare subpackage name by root'
    )
  })
})
