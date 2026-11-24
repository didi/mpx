import { UnoCSSRNWebpackPlugin } from '../lib/rn-plugin/index.js'

describe('react native plugin', () => {
  test('generates class map from UnoCSS layers', async () => {
    let compilationCallback
    let optimizeAssets
    const blockedTokens = []
    const isBlocked = token => {
      blockedTokens.push(token)
      return false
    }
    const compiler = {
      options: {
        module: {
          rules: []
        }
      },
      hooks: {
        compilation: {
          tap: (_, callback) => { compilationCallback = callback }
        },
        thisCompilation: {
          tap: () => {}
        },
        beforeCompile: {
          tapPromise: () => {}
        }
      },
      __unoCtx: {
        transformCache: new Map(),
        uno: {
          isBlocked,
          generate: async () => ({
            layers: ['default'],
            getLayers: layers => layers.includes('default') ? '.text-red-500{color:red;}' : ''
          })
        }
      }
    }
    const compilation = {
      __mpx__: {
        mode: 'ios',
        srcMode: 'wx'
      },
      hooks: {
        optimizeAssets: {
          tapPromise: (_, callback) => { optimizeAssets = callback }
        }
      },
      modules: [{
        buildInfo: {
          assetsInfo: new Map([['app.js', { unocssTokens: new Set(['text-red-500']) }]])
        }
      }],
      errors: [],
      warnings: [],
      assets: {
        'app.js': {
          source: () => '__unoCssMapPlaceholder__'
        }
      }
    }

    UnoCSSRNWebpackPlugin().apply(compiler)
    compilationCallback(compilation)
    await optimizeAssets()

    expect(compilation.assets['app.js'].source()).toContain('["text-red-500"]: function(_f){return {\'color\':"red"};}')
    expect(blockedTokens).toEqual(['text-red-500'])
    expect(compilation.errors).toEqual([])
  })
})
