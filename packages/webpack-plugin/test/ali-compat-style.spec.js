const path = require('node:path')
const webpack = require('webpack')
const VirtualModulesPlugin = require('webpack-virtual-modules')
const MpxWebpackPlugin = require('../lib')
const { ConcatSource, RawSource } = webpack.sources
const injectAliCompatStyle = require('../lib/utils/ali-compat-style')
const { MPX_ROOT_VIEW, MPX_SCROLLBAR_HIDDEN } = require('../lib/utils/const')

global.setImmediate = require('node:timers').setImmediate

const ALI_COMPAT_STYLE_FILENAME = 'mpx-ali-compat.acss'

class NoEmitPlugin {
  apply (compiler) {
    compiler.hooks.shouldEmit.tap('NoEmitPlugin', () => false)
  }
}

class MockUnoStylePlugin {
  apply (compiler) {
    compiler.hooks.thisCompilation.tap('MockUnoStylePlugin', (compilation) => {
      compilation.hooks.processAssets.tap({
        name: 'MockUnoStylePlugin',
        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS - 1
      }, () => {
        const filename = 'nested/app.acss'
        if (compilation.getAsset(filename)) {
          compilation.updateAsset(filename, source => new ConcatSource('@import "../styles/uno.acss";\n', source))
        }
      })
    })
  }
}

function runCompiler (compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        compiler.close(() => reject(error))
        return
      }
      compiler.close(closeError => closeError ? reject(closeError) : resolve(stats))
    })
  })
}

let caseIndex = 0

async function compileApp ({ mode = 'ali', content, files = {}, plugins = [] }) {
  caseIndex += 1
  const root = path.join(__dirname, `.virtual-ali-compat-${caseIndex}`)
  const appPath = path.join(root, 'app.mpx')
  const virtualModules = {}
  virtualModules[appPath] = content
  Object.keys(files).forEach((filename) => {
    virtualModules[path.join(root, filename)] = files[filename]
  })
  const rules = [
    {
      test: /\.mpx$/,
      use: MpxWebpackPlugin.loader()
    },
    {
      test: /\.(wxss|css)$/,
      use: [path.resolve(__dirname, '../lib/wxss/index.js')]
    },
    {
      test: /\.json$/,
      resourceQuery: /asScript/,
      type: 'javascript/auto'
    }
  ]
  const compiler = webpack({
    mode: 'development',
    context: root,
    entry: {
      'nested/app': appPath
    },
    output: {
      path: path.join(root, 'dist'),
      filename: '[name].js'
    },
    module: { rules },
    plugins: [
      new VirtualModulesPlugin(virtualModules),
      ...plugins,
      new MpxWebpackPlugin({ mode, srcMode: 'wx', projectRoot: root }),
      new NoEmitPlugin()
    ]
  })
  return runCompiler(compiler)
}

function createCompilation (assets = {}) {
  const assetMap = new Map()
  Object.keys(assets).forEach(filename => assetMap.set(filename, new RawSource(assets[filename])))
  return {
    errors: [],
    getAsset (filename) {
      const source = assetMap.get(filename)
      return source && { name: filename, source }
    },
    emitAsset (filename, source) {
      assetMap.set(filename, source)
    },
    updateAsset (filename, update) {
      assetMap.set(filename, update(assetMap.get(filename)))
    }
  }
}

function expectAliCompatStyle (source) {
  expect(source).toContain(`.${MPX_ROOT_VIEW} {`)
  expect(source).toContain('text {\n  white-space: inherit;')
  expect(source).toContain(`.${MPX_SCROLLBAR_HIDDEN}::-webkit-scrollbar {`)
}

describe('ali compatibility style', () => {
  it('should generate compatibility rules from shared constants', () => {
    const compilation = createCompilation()
    injectAliCompatStyle(compilation, 'app.acss')
    expectAliCompatStyle(compilation.getAsset(ALI_COMPAT_STYLE_FILENAME).source.source().toString())
  })

  it('should insert the import after charset and preserve user content', () => {
    const compilation = createCompilation({
      'sub/app.acss': '@charset "UTF-8";\n@import "./user.acss";\n.user { color: red; }'
    })
    injectAliCompatStyle(compilation, 'sub/app.acss')

    expect(compilation.getAsset('sub/app.acss').source.source().toString()).toBe('@charset "UTF-8";\n@import "./mpx-ali-compat.acss";\n@import "./user.acss";\n.user { color: red; }')
    expectAliCompatStyle(compilation.getAsset(`sub/${ALI_COMPAT_STYLE_FILENAME}`).source.source().toString())
  })

  it('should create an empty app style entry with only the compatibility import', () => {
    const compilation = createCompilation()
    injectAliCompatStyle(compilation, 'custom/app.acss')
    expect(compilation.getAsset('custom/app.acss').source.source().toString()).toBe('@import "./mpx-ali-compat.acss";')
  })

  it('should report a reserved asset conflict without overwriting it', () => {
    const compilation = createCompilation({
      [ALI_COMPAT_STYLE_FILENAME]: 'user content'
    })
    injectAliCompatStyle(compilation, 'app.acss')

    expect(compilation.errors).toHaveLength(1)
    expect(compilation.errors[0].message).toContain('reserved ali compatibility style asset')
    expect(compilation.getAsset(ALI_COMPAT_STYLE_FILENAME).source.source().toString()).toBe('user content')
    expect(compilation.getAsset('app.acss')).toBeUndefined()
  })

  it('should prepend compatibility styles before generated, external and inline styles', async () => {
    const stats = await compileApp({
      content: '<script>App({})</script><style src="./external.css"></style><style>.user { white-space: normal; }</style><json>{}</json>',
      files: {
        'external.css': '@import "./common.css";\n.external { color: blue; }',
        'common.css': '.common { color: green; }'
      },
      plugins: [new MockUnoStylePlugin()]
    })
    expect(stats.hasErrors()).toBe(false)

    const appStyle = stats.compilation.getAsset('nested/app.acss').source.source().toString()
    expect(appStyle).toMatch(/^@import "\.\/mpx-ali-compat\.acss";\n@import "\.\.\/styles\/uno\.acss";/)
    expect(appStyle.indexOf('mpx-ali-compat.acss')).toBeLessThan(appStyle.indexOf('external'))
    expect(appStyle.indexOf('external')).toBeLessThan(appStyle.indexOf('.user'))
    expectAliCompatStyle(stats.compilation.getAsset('nested/mpx-ali-compat.acss').source.source().toString())
  })

  it('should generate the app style without an app style module', async () => {
    const stats = await compileApp({
      content: '<script>App({})</script><json>{}</json>'
    })
    expect(stats.hasErrors()).toBe(false)
    expect(stats.compilation.getAsset('nested/app.acss').source.source().toString()).toBe('@import "./mpx-ali-compat.acss";')
    expect([...stats.compilation.modules].some(module => /type=styles/.test(module.resource || ''))).toBe(false)
  })

  it('should not emit ali compatibility assets for other targets', async () => {
    const stats = await compileApp({
      mode: 'wx',
      content: '<script>App({})</script><json>{}</json>'
    })
    expect(stats.hasErrors()).toBe(false)
    expect(stats.compilation.getAsset('nested/mpx-ali-compat.acss')).toBeUndefined()
    expect(stats.compilation.getAsset('nested/app.wxss')).toBeUndefined()
  })
})
