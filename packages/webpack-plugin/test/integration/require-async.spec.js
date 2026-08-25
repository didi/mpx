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
  const targetPath = path.join(virtualRoot, 'od.js')

  const compiler = webpack({
    mode: 'development',
    context: virtualRoot,
    target: 'node',
    entry: entryPath,
    output: {
      path: path.join(os.tmpdir(), 'mpx-require-async-test'),
      filename: 'main.js'
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

describe('require.async', () => {
  it('should remove root query when RN subpackage is transformed to main package', async () => {
    const { stats, entryPath, targetPath } = await compileRequireAsync({
      source: `
        const direct = require('./od.js')
        const asyncModule = require.async('./od.js?root=map')
        module.exports = { direct, asyncModule }
      `,
      transSubpackageRules: [
        {
          from: ['map'],
          to: ''
        }
      ]
    })

    expect(stats.hasErrors()).toBe(false)

    const modules = [...stats.compilation.modules]
    const targetModules = modules.filter((module) => {
      return module.resource && parseRequest(module.resource).resourcePath === targetPath
    })
    expect(targetModules).toHaveLength(1)
    expect(targetModules[0].resource).toBe(targetPath)

    const entryModule = modules.find(module => module.resource === entryPath)
    const asyncDependencies = entryModule.dependencies.filter(dependency => {
      return dependency.type === 'mpx cjs async'
    })
    expect(asyncDependencies).toHaveLength(1)
    expect(asyncDependencies[0].request).toBe('./od.js')

    expect(getWarnings(stats).join('\n')).not.toContain(
      'need to declare subpackage name by root'
    )
  })
})
