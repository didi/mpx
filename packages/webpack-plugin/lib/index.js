'use strict'

const path = require('path')
const ConcatSource = require('webpack-sources').ConcatSource
const loaderUtils = require('loader-utils')
const ResolveDependency = require('./dependency/ResolveDependency')
const InjectDependency = require('./dependency/InjectDependency')
const ReplaceDependency = require('./dependency/ReplaceDependency')
const NullFactory = require('webpack/lib/NullFactory')
const config = require('./config')
const normalize = require('./utils/normalize')
const stripExtension = require('./utils/strip-extention')
const toPosix = require('./utils/to-posix')
const fixSwanRelative = require('./utils/fix-swan-relative')
const DefinePlugin = require('webpack/lib/DefinePlugin')
const hash = require('hash-sum')
const AddModePlugin = require('./resolver/AddModePlugin')

const isProductionLikeMode = options => {
  return options.mode === 'production' || !options.mode
}

class MpxWebpackPlugin {
  constructor (options = {}) {
    options.mode = options.mode || 'wx'
    options.srcMode = options.srcMode || options.mode
    if (options.mode !== options.srcMode && options.srcMode !== 'wx') {
      throw new Error('MpxWebpackPlugin supports srcMode to be "wx" only temporarily!')
    }
    if (!Array.isArray(options.externalClasses)) {
      options.externalClasses = ['custom-class', 'i-class']
    }
    options.externalClasses = options.externalClasses.map((className) => {
      return {
        className,
        replacement: className.replace(/-(.)/g, (matched, $1) => {
          return $1.toUpperCase()
        })
      }
    })
    options.resolveMode = options.resolveMode || 'webpack'
    this.options = options
  }

  static loader (options) {
    return { loader: normalize.lib('loader'), options }
  }

  static pluginLoader (options) {
    return { loader: normalize.lib('plugin-loader'), options }
  }

  static wxsPreLoader (options) {
    return { loader: normalize.lib('wxs/wxs-pre-loader'), options }
  }

  static urlLoader (options) {
    return { loader: normalize.lib('url-loader'), options }
  }

  static fileLoader (options) {
    return { loader: normalize.lib('file-loader'), options }
  }

  apply (compiler) {
    // 强制设置publicPath为'/'
    compiler.options.output.publicPath = '/'

    const resolvePlugin = new AddModePlugin('before-resolve', this.options.mode, 'resolve')

    if (Array.isArray(compiler.options.resolve.plugins)) {
      compiler.options.resolve.plugins.push(resolvePlugin)
    } else {
      compiler.options.resolve.plugins = [resolvePlugin]
    }
    // define mode
    new DefinePlugin({
      '__mpx_mode__': JSON.stringify(this.options.mode),
      '__mpx_src_mode__': JSON.stringify(this.options.srcMode),
      '__mpx_wxs__': DefinePlugin.runtimeValue(({ module }) => {
        return JSON.stringify(!!module.wxs)
      })
    }).apply(compiler)

    compiler.hooks.compilation.tap('MpxWebpackPlugin ', (compilation) => {
      compilation.hooks.normalModuleLoader.tap('MpxWebpackPlugin', (loaderContext, module) => {
        // 设置loaderContext的minimize
        if (isProductionLikeMode(compiler.options)) {
          loaderContext.minimize = true
        }
      })
    })

    compiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation, { normalModuleFactory }) => {
      const typeExtMap = config[this.options.mode].typeExtMap
      const additionalAssets = {}
      if (!compilation.__mpx__) {
        compilation.__mpx__ = {
          pagesMap: {},
          componentsMap: {},
          loaderOptions: null,
          subPackagesMap: {},
          usingComponents: [],
          processingSubPackages: false,
          mainResourceMap: {},
          wxsMap: {},
          wxsConentMap: {},
          resolveMode: this.options.resolveMode,
          mode: this.options.mode,
          srcMode: this.options.srcMode,
          externalClasses: this.options.externalClasses,
          projectRoot: this.options.projectRoot,
          extract: (content, type, resourcePath, index, selfResourcePath) => {
            if (index === -1) {
              const compilationMpx = compilation.__mpx__
              const subPackagesMap = compilationMpx.subPackagesMap
              const mainResourceMap = compilationMpx.mainResourceMap
              const selfResourceName = path.parse(selfResourcePath).name

              let subPackageRoot = ''
              if (compilationMpx.processingSubPackages) {
                for (let src in subPackagesMap) {
                  // 分包引用且主包未引用的资源，需打入分包目录中
                  if (selfResourcePath.startsWith(src) && !mainResourceMap[selfResourcePath]) {
                    subPackageRoot = subPackagesMap[src]
                    break
                  }
                }
              } else {
                mainResourceMap[selfResourcePath] = true
              }
              // 针对src引入的styles进行特殊处理，处理为@import形式便于样式复用
              if (type === 'styles') {
                const file1 = resourcePath + typeExtMap[type]
                const file2 = toPosix(path.join(subPackageRoot, 'wxss', selfResourceName + hash(selfResourcePath) + typeExtMap[type]))
                let relativePath = toPosix(path.relative(path.dirname(file1), file2))
                if (this.options.mode === 'swan') {
                  relativePath = fixSwanRelative(relativePath)
                }
                additionalAssets[file1] = additionalAssets[file1] || []
                additionalAssets[file2] = additionalAssets[file2] || []
                additionalAssets[file1][0] = `@import "${relativePath}";\n` + (additionalAssets[file1][0] || '')
                if (!additionalAssets[file2][0]) {
                  additionalAssets[file2][0] = content
                }
              }
              // 针对import src引入的template进行特殊处理
              if (type === 'template') {
                const file = toPosix(path.join(subPackageRoot, 'wxml', selfResourceName + hash(selfResourcePath) + typeExtMap[type]))
                additionalAssets[file] = additionalAssets[file] || []
                additionalAssets[file][0] = content + (additionalAssets[file][0] || '')
                return file
              }
            } else {
              const file = resourcePath + typeExtMap[type]
              additionalAssets[file] = additionalAssets[file] || []
              if (index === -1) {
                additionalAssets[file][0] = content + (additionalAssets[file][0] || '')
              } else {
                additionalAssets[file][index] = (additionalAssets[file][index] || '') + content
              }
            }
          }
        }
      }

      compilation.hooks.additionalAssets.tapAsync('MpxWebpackPlugin', (callback) => {
        for (let file in additionalAssets) {
          let content = new ConcatSource()
          additionalAssets[file].forEach((item) => {
            content.add(item)
          })
          compilation.assets[file] = content
        }
        callback()
      })

      compilation.dependencyFactories.set(ResolveDependency, new NullFactory())
      compilation.dependencyTemplates.set(ResolveDependency, new ResolveDependency.Template())

      compilation.dependencyFactories.set(InjectDependency, new NullFactory())
      compilation.dependencyTemplates.set(InjectDependency, new InjectDependency.Template())

      compilation.dependencyFactories.set(ReplaceDependency, new NullFactory())
      compilation.dependencyTemplates.set(ReplaceDependency, new ReplaceDependency.Template())

      normalModuleFactory.hooks.parser.for('javascript/auto').tap('MpxWebpackPlugin', (parser) => {
        parser.hooks.call.for('__mpx_resolve_path__').tap('MpxWebpackPlugin', (expr) => {
          if (expr.arguments[0]) {
            const resource = stripExtension(expr.arguments[0].value)
            const pagesMap = compilation.__mpx__.pagesMap
            const componentsMap = compilation.__mpx__.componentsMap
            const publicPath = compilation.outputOptions.publicPath || ''
            const range = expr.range
            const dep = new ResolveDependency(resource, pagesMap, componentsMap, publicPath, range)
            parser.state.current.addDependency(dep)
            return true
          }
        })

        const transHandler = (expr) => {
          const module = parser.state.module
          const current = parser.state.current
          const resource = module.resource
          const queryIndex = resource.indexOf('?')
          let resourceQuery = '?'
          if (queryIndex > -1) {
            resourceQuery = resource.substr(queryIndex)
          }
          const localSrcMode = loaderUtils.parseQuery(resourceQuery).mode
          const globalSrcMode = this.options.srcMode
          const srcMode = localSrcMode || globalSrcMode
          const mode = this.options.mode

          const callee = expr.callee
          let target

          if (callee.type === 'Identifier') {
            target = callee
          } else if (callee.type === 'MemberExpression') {
            target = callee.object
          }
          if (/[/\\]@mpxjs[/\\]/.test(resource) || !target || mode === srcMode) {
            return
          }

          const type = target.name

          const name = type === 'wx' ? 'mpx' : 'createFactory'
          const replaceContent = type === 'wx' ? 'mpx' : `${name}(${JSON.stringify(type)})`

          const dep = new ReplaceDependency(replaceContent, target.range)
          current.addDependency(dep)

          let needInject = true
          for (let v of module.variables) {
            if (v.name === name) {
              needInject = false
              break
            }
          }
          if (needInject) {
            const expression = `require(${JSON.stringify(`@mpxjs/core/src/runtime/${name}`)})`
            const deps = []
            parser.parse(expression, {
              current: {
                addDependency: dep => {
                  dep.userRequest = name
                  deps.push(dep)
                }
              },
              module
            })
            current.addVariable(name, expression, deps)
          }
        }

        if (this.options.srcMode !== this.options.mode) {
          parser.hooks.callAnyMember.for('wx').tap('MpxWebpackPlugin', transHandler)
          if (this.options.mode === 'ali') {
            parser.hooks.call.for('Page').tap('MpxWebpackPlugin', transHandler)
            parser.hooks.call.for('Component').tap('MpxWebpackPlugin', transHandler)
            parser.hooks.call.for('App').tap('MpxWebpackPlugin', transHandler)
            // 支付宝不支持Behaviors
            parser.hooks.call.for('Behavior').tap('MpxWebpackPlugin', transHandler)
          }
        }

        const apiBlackListMap = [
          'createApp',
          'createPage',
          'createComponent',
          'createStore',
          'toPureObject',
          'mixin: injectMixins',
          'injectMixins',
          'observable',
          'extendObservable',
          'watch',
          'use',
          'set',
          'get',
          'remove',
          'setConvertRule',
          'createAction'
        ].reduce((map, api) => {
          map[api] = true
          return map
        }, {})

        const handler = (expr) => {
          const callee = expr.callee
          const args = expr.arguments
          const name = callee.object.name

          if (apiBlackListMap[callee.property.name || callee.property.value] || (name !== 'mpx' && name !== 'wx')) {
            return
          }
          const resource = parser.state.module.resource
          const queryIndex = resource.indexOf('?')
          let resourceQuery = '?'
          if (queryIndex > -1) {
            resourceQuery = resource.substr(queryIndex)
          }
          const localSrcMode = loaderUtils.parseQuery(resourceQuery).mode
          const globalSrcMode = this.options.srcMode
          const srcMode = localSrcMode || globalSrcMode
          const dep = new InjectDependency({
            content: args.length ? `, ${JSON.stringify(srcMode)}` : JSON.stringify(srcMode),
            index: expr.end - 1
          })
          parser.state.current.addDependency(dep)
        }

        if (this.options.srcMode !== this.options.mode) {
          parser.hooks.callAnyMember.for('imported var').tap('MpxWebpackPlugin', handler)
          parser.hooks.callAnyMember.for('mpx').tap('MpxWebpackPlugin', handler)
          parser.hooks.callAnyMember.for('wx').tap('MpxWebpackPlugin', handler)
        }
      })
    })

    compiler.hooks.normalModuleFactory.tap('MpxWebpackPlugin', (normalModuleFactory) => {
      normalModuleFactory.hooks.beforeResolve.tapAsync('MpxWebpackPlugin', (data, callback) => {
        let request = data.request
        let elements = request.replace(/^-?!+/, '').replace(/!!+/g, '!').split('!')
        let resource = elements.pop()
        let resourceQuery = '?'
        const queryIndex = resource.indexOf('?')
        if (queryIndex >= 0) {
          resourceQuery = resource.substr(queryIndex)
        }
        let queryObj = loaderUtils.parseQuery(resourceQuery)
        if (queryObj.resolve) {
          let pathLoader = normalize.lib('path-loader')
          data.request = `!!${pathLoader}!${resource}`
        }
        if (queryObj.wxsModule) {
          let wxsPreLoader = normalize.lib('wxs/wxs-pre-loader')
          if (!/wxs-loader/.test(request)) {
            data.request = `!!${wxsPreLoader}!${resource}`
          }
        }
        callback(null, data)
      })

      normalModuleFactory.hooks.afterResolve.tapAsync('MpxWebpackPlugin', (data, callback) => {
        const isFromMpx = typeof data.resource === 'string' && data.resource.includes('.mpx')
        if (data.loaders) {
          data.loaders.forEach((loader) => {
            if (/ts-loader/.test(loader.loader) && isFromMpx) {
              loader.options = Object.assign({}, { appendTsSuffixTo: [/\.mpx$/] })
            }
          })
        }
        callback(null, data)
      })
    })

    compiler.hooks.emit.tapAsync('MpxWebpackPlugin', (compilation, callback) => {
      const jsonpFunction = compilation.outputOptions.jsonpFunction

      function getTargetFile (file) {
        let targetFile = file
        const queryStringIdx = targetFile.indexOf('?')
        if (queryStringIdx >= 0) {
          targetFile = targetFile.substr(0, queryStringIdx)
        }
        return targetFile
      }

      const processedChunk = new Set()

      function processChunk (chunk, isRuntime, relativeChunks) {
        if (!chunk.files[0] || processedChunk.has(chunk)) {
          return
        }

        let originalSource = compilation.assets[chunk.files[0]]
        const source = new ConcatSource()
        source.add('var window = (function(){return this;})() || {};\n\n')

        relativeChunks.forEach((relativeChunk, index) => {
          if (!relativeChunk.files[0]) return
          let chunkPath = getTargetFile(chunk.files[0])
          let relativePath = getTargetFile(relativeChunk.files[0])
          relativePath = path.relative(path.dirname(chunkPath), relativePath)
          if (!/^\./.test(relativePath)) {
            relativePath = `.${path.sep}${relativePath}`
          }
          relativePath = toPosix(relativePath)
          if (index === 0) {
            source.add(`window[${JSON.stringify(jsonpFunction)}] = require("${relativePath}");\n`)
          } else {
            source.add(`require("${relativePath}");\n`)
          }
        })

        if (isRuntime) {
          source.add(originalSource)
          source.add(`\nmodule.exports = window[${JSON.stringify(jsonpFunction)}];\n`)
        } else {
          if (compilation.__mpx__.pluginMain === chunk.name) {
            source.add('module.exports =\n')
          }
          source.add(originalSource)
        }

        compilation.assets[chunk.files[0]] = source
        processedChunk.add(chunk)
      }

      compilation.chunkGroups.forEach((chunkGroup) => {
        if (!chunkGroup.isInitial()) {
          return
        }

        let runtimeChunk, entryChunk
        let middleChunks = []

        let chunksLength = chunkGroup.chunks.length

        chunkGroup.chunks.forEach((chunk, index) => {
          if (index === 0) {
            runtimeChunk = chunk
          } else if (index === chunksLength - 1) {
            entryChunk = chunk
          } else {
            middleChunks.push(chunk)
          }
        })

        if (runtimeChunk) {
          processChunk(runtimeChunk, true, [])
          if (middleChunks.length) {
            middleChunks.forEach((middleChunk) => {
              processChunk(middleChunk, false, [runtimeChunk])
            })
          }
          if (entryChunk) {
            middleChunks.unshift(runtimeChunk)
            processChunk(entryChunk, false, middleChunks)
          }
        }
      })
      callback()
    })
  }
}

module.exports = MpxWebpackPlugin
