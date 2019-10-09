'use strict'

const path = require('path')
const ConcatSource = require('webpack-sources').ConcatSource
const loaderUtils = require('loader-utils')
const ResolveDependency = require('./dependency/ResolveDependency')
const InjectDependency = require('./dependency/InjectDependency')
const ReplaceDependency = require('./dependency/ReplaceDependency')
const NullFactory = require('webpack/lib/NullFactory')
const normalize = require('./utils/normalize')
const toPosix = require('./utils/to-posix')
const getResource = require('./utils/get-resource-path')
const addQuery = require('./utils/add-query')
const DefinePlugin = require('webpack/lib/DefinePlugin')
const AddModePlugin = require('./resolver/AddModePlugin')
const CommonJsRequireDependency = require('webpack/lib/dependencies/CommonJsRequireDependency')
const HarmonyImportSideEffectDependency = require('webpack/lib/dependencies/HarmonyImportSideEffectDependency')
const RequireHeaderDependency = require('webpack/lib/dependencies/RequireHeaderDependency')
const RemovedModuleDependency = require('./dependency/RemovedModuleDependency')
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin')
const fixRelative = require('./utils/fix-relative')

const isProductionLikeMode = options => {
  return options.mode === 'production' || !options.mode
}

const outputFilename = '[name].js'
const publicPath = '/'

function isChunkInPackage (chunkName, packageName) {
  return (new RegExp(`^${packageName}\\/`)).test(chunkName)
}

function getPackageCacheGroup (packageName) {
  if (packageName === 'main') {
    return {
      name: 'bundle',
      minChunks: 2,
      chunks: 'initial'
    }
  } else {
    return {
      test: (module, chunks) => {
        return chunks.every((chunk) => {
          return isChunkInPackage(chunk.name, packageName)
        })
      },
      name: `${packageName}/bundle`,
      minChunks: 2,
      minSize: 1000,
      priority: 100,
      chunks: 'initial'
    }
  }
}

let loaderOptions

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
    options.writeMode = options.writeMode || 'changed'
    options.enableAutoScope = options.enableAutoScope || false
    if (options.autoSplit === undefined) {
      options.autoSplit = true
    }
    this.options = options
  }

  static loader (options) {
    loaderOptions = options
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
    if (compiler.options.output.publicPath && compiler.options.output.publicPath !== publicPath) {
      console.warn(`MpxWebpackPlugin accept output publicPath to be ${publicPath} only, custom output publicPath will be ignored!`)
    }
    compiler.options.output.publicPath = publicPath
    if (compiler.options.output.filename && compiler.options.output.filename !== outputFilename) {
      console.warn(`MpxWebpackPlugin accept output filename to be ${outputFilename} only, custom output filename will be ignored!`)
    }
    compiler.options.output.filename = compiler.options.output.chunkFilename = outputFilename

    const resolvePlugin = new AddModePlugin('before-resolve', this.options.mode, 'resolve')

    if (Array.isArray(compiler.options.resolve.plugins)) {
      compiler.options.resolve.plugins.push(resolvePlugin)
    } else {
      compiler.options.resolve.plugins = [resolvePlugin]
    }

    compiler.options.optimization.runtimeChunk = {
      name: 'bundle'
    }

    let splitChunksPlugin
    let splitChunksOptions = {
      cacheGroups: {
        main: {
          name: 'bundle',
          minChunks: 2,
          chunks: 'initial'
        }
      }
    }

    if (this.options.autoSplit) {
      if (compiler.options.optimization.splitChunks) {
        splitChunksOptions = compiler.options.optimization.splitChunks
        delete compiler.options.optimization.splitChunks
      }
      splitChunksPlugin = new SplitChunksPlugin(splitChunksOptions)
      splitChunksPlugin.apply(compiler)
    }

    // 代理writeFile
    if (this.options.writeMode === 'changed') {
      const writedFileContentMap = new Map()
      const originalWriteFile = compiler.outputFileSystem.writeFile
      compiler.outputFileSystem.writeFile = (filePath, content, callback) => {
        if (writedFileContentMap.has(filePath) && writedFileContentMap.get(filePath).equals(content)) {
          return callback()
        }
        writedFileContentMap.set(filePath, content)
        originalWriteFile(filePath, content, callback)
      }
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

    let mpx

    compiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation, { normalModuleFactory }) => {
      // additionalAssets和mpx由于包含缓存机制，必须在每次compilation时重新初始化
      const additionalAssets = {}
      if (!compilation.__mpx__) {
        // init mpx
        mpx = compilation.__mpx__ = {
          // pages全局记录，无需区分主包分包
          pagesMap: {},
          componentsMap: {
            main: {}
          },
          resourceMap: {
            main: {}
          },
          resourceHit: {},
          loaderOptions,
          extractedMap: {},
          extractSeenFile: {},
          usingComponents: [],
          processingSubPackageRoot: '',
          wxsMap: {},
          wxsConentMap: {},
          forceDisableInject: this.options.forceDisableInject,
          resolveMode: this.options.resolveMode,
          mode: this.options.mode,
          srcMode: this.options.srcMode,
          externalClasses: this.options.externalClasses,
          projectRoot: this.options.projectRoot,
          enableAutoScope: this.options.enableAutoScope,
          extract: (content, file, index, sideEffects) => {
            additionalAssets[file] = additionalAssets[file] || []
            if (!additionalAssets[file][index]) {
              additionalAssets[file][index] = content
            }
            sideEffects && sideEffects(additionalAssets)
          }
        }
      }

      if (splitChunksPlugin) {
        // 自动跟进分包配置修改splitChunksPlugin配置
        compilation.hooks.finishModules.tap('MpxWebpackPlugin', (modules) => {
          let needInit = false
          Object.keys(mpx.componentsMap).forEach((packageName) => {
            if (!splitChunksOptions.cacheGroups.hasOwnProperty(packageName)) {
              needInit = true
              splitChunksOptions.cacheGroups[packageName] = getPackageCacheGroup(packageName)
            }
          })
          if (needInit) {
            splitChunksPlugin.options = SplitChunksPlugin.normalizeOptions(splitChunksOptions)
          }
        })
      }

      compilation.hooks.optimizeModules.tap('MpxWebpackPlugin', (modules) => {
        modules.forEach((module) => {
          if (module.needRemove) {
            let removed = false
            module.reasons.forEach((reason) => {
              if (reason.module) {
                if (reason.dependency instanceof HarmonyImportSideEffectDependency) {
                  reason.module.removeDependency(reason.dependency)
                  reason.module.addDependency(new RemovedModuleDependency(reason.dependency.request))
                  removed = true
                } else if (reason.dependency instanceof CommonJsRequireDependency && reason.dependency.loc.range) {
                  let index = reason.module.dependencies.indexOf(reason.dependency)
                  if (index > -1 && reason.module.dependencies[index + 1] instanceof RequireHeaderDependency) {
                    reason.module.dependencies.splice(index, 2)
                    reason.module.addDependency(new RemovedModuleDependency(reason.dependency.request, reason.dependency.loc.range))
                    removed = true
                  }
                }
              }
            })
            if (removed) {
              module.chunksIterable.forEach((chunk) => {
                module.removeChunk(chunk)
              })
              module.disconnect()
            }
          }
        })
      })

      compilation.hooks.additionalAssets.tapAsync('MpxWebpackPlugin', (callback) => {
        for (let file in additionalAssets) {
          let content = new ConcatSource()
          if (additionalAssets[file].prefix) {
            additionalAssets[file].prefix.forEach((item) => {
              content.add(item)
            })
          }
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

      compilation.dependencyFactories.set(RemovedModuleDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(RemovedModuleDependency, new RemovedModuleDependency.Template())

      normalModuleFactory.hooks.parser.for('javascript/auto').tap('MpxWebpackPlugin', (parser) => {
        // hack预处理，将expr.range写入loc中便于在CommonJsRequireDependency中获取，移除无效require
        parser.hooks.call.for('require').tap({ name: 'MpxWebpackPlugin', stage: -100 }, (expr) => {
          expr.loc.range = expr.range
        })

        parser.hooks.call.for('__mpx_resolve_path__').tap('MpxWebpackPlugin', (expr) => {
          if (expr.arguments[0]) {
            const resource = expr.arguments[0].value
            let resourceQuery = '?'
            const queryIndex = resource.indexOf('?')
            if (queryIndex >= 0) {
              resourceQuery = resource.substr(queryIndex)
            }
            const packageName = loaderUtils.parseQuery(resourceQuery).subPackageRoot || 'main'
            const pagesMap = mpx.pagesMap
            const componentsMap = mpx.componentsMap
            const resourceMap = mpx.resourceMap
            const publicPath = compilation.outputOptions.publicPath || ''
            const range = expr.range
            const dep = new ResolveDependency(resource, packageName, pagesMap, componentsMap, resourceMap, publicPath, range)
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

          let target

          if (expr.type === 'Identifier') {
            target = expr
          } else if (expr.type === 'MemberExpression') {
            target = expr.object
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

        const srcMode = this.options.srcMode
        if (srcMode !== this.options.mode) {
          parser.hooks.evaluate.for('MemberExpression').tap('MpxWebpackPlugin', (expr) => {
            // Undeclared varible for wx[identifier]()
            // TODO Unable to handle wx[identifier]
            if (expr.object.name === 'wx' && !parser.scope.definitions.has('wx')) {
              transHandler(expr)
            }
          })
          // Trans for wx.xx, wx['xx'], wx.xx(), wx['xx']()
          parser.hooks.expressionAnyMember.for('wx').tap('MpxWebpackPlugin', transHandler)
          parser.hooks.call.for('Page').tap('MpxWebpackPlugin', (expr) => {
            transHandler(expr.callee)
          })
          parser.hooks.call.for('Component').tap('MpxWebpackPlugin', (expr) => {
            transHandler(expr.callee)
          })
          parser.hooks.call.for('App').tap('MpxWebpackPlugin', (expr) => {
            transHandler(expr.callee)
          })
          // 支付宝不支持Behaviors
          parser.hooks.call.for('Behavior').tap('MpxWebpackPlugin', (expr) => {
            transHandler(expr.callee)
          })
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
          const srcModeString = `__mpx_src_mode_${srcMode}__`
          const dep = new InjectDependency({
            content: args.length
              ? `, ${JSON.stringify(srcModeString)}`
              : JSON.stringify(srcModeString),
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
        let elements = request.split('!')
        let resource = elements.pop()
        let resourceQuery = '?'
        const queryIndex = resource.indexOf('?')
        if (queryIndex >= 0) {
          resourceQuery = resource.substr(queryIndex)
        }
        const queryObj = loaderUtils.parseQuery(resourceQuery)

        if (queryObj.resolve) {
          const pathLoader = normalize.lib('path-loader')
          const subPackageRoot = mpx.processingSubPackageRoot
          if (subPackageRoot) {
            resource = addQuery(resource, { subPackageRoot })
          }
          data.request = `!!${pathLoader}!${resource}`
        } else if (queryObj.wxsModule) {
          const wxsPreLoader = normalize.lib('wxs/wxs-pre-loader')
          if (!/wxs-loader/.test(request)) {
            data.request = `!!${wxsPreLoader}!${resource}`
          }
        }
        callback(null, data)
      })

      normalModuleFactory.hooks.afterResolve.tapAsync('MpxWebpackPlugin', (data, callback) => {
        const isFromMpx = /\.(mpx|vue)/.test(data.resource)
        if (data.loaders) {
          data.loaders.forEach((loader) => {
            if (/ts-loader/.test(loader.loader) && isFromMpx) {
              loader.options = Object.assign({}, { appendTsSuffixTo: [/\.(mpx|vue)$/] })
            }
          })
        }

        if (mpx.processingSubPackageRoot) {
          const resourcPath = getResource(data.resource)

          const resourceHit = mpx.resourceHit
          const mainResourceMap = mpx.resourceMap.main

          let needAddQuery = false

          if (resourceHit[resourcPath]) {
            if (!mainResourceMap[resourcPath]) {
              needAddQuery = true
            }
          }
          if (needAddQuery) {
            data.request = addQuery(data.request, {
              subPackageRoot: mpx.processingSubPackageRoot
            })
          }
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
      const rootName = compilation._preparedEntrypoints[0].name

      function processChunk (chunk, isRuntime, relativeChunks) {
        if (!chunk.files[0] || processedChunk.has(chunk)) {
          return
        }

        let originalSource = compilation.assets[chunk.files[0]]
        const source = new ConcatSource()
        source.add('\nvar window = window || {};\n\n')

        relativeChunks.forEach((relativeChunk, index) => {
          if (!relativeChunk.files[0]) return
          let chunkPath = getTargetFile(chunk.files[0])
          let relativePath = getTargetFile(relativeChunk.files[0])
          relativePath = path.relative(path.dirname(chunkPath), relativePath)
          relativePath = fixRelative(relativePath, mpx.mode)
          relativePath = toPosix(relativePath)
          if (index === 0) {
            // 引用runtime
            // 支付宝分包独立打包，通过全局context获取webpackJSONP
            if (mpx.mode === 'ali') {
              if (chunk.name === rootName) {
                // 在rootChunk中挂载jsonpFunction
                source.add('// process ali subpackages runtime in root chunk\n' +
                  'var context = Function("return this")();\n\n')
                source.add(`context[${JSON.stringify(jsonpFunction)}] = window[${JSON.stringify(jsonpFunction)}] = require("${relativePath}");\n`)
              } else {
                // 其余chunk中通过context全局传递runtime
                source.add('// process ali subpackages runtime in other chunk\n' +
                  'var context = Function("return this")();\n\n')
                source.add(`window[${JSON.stringify(jsonpFunction)}] = context[${JSON.stringify(jsonpFunction)}];\n`)
              }
            } else {
              source.add(`window[${JSON.stringify(jsonpFunction)}] = require("${relativePath}");\n`)
            }
          } else {
            source.add(`require("${relativePath}");\n`)
          }
        })

        if (isRuntime) {
          source.add('// hack promise polyfill\n' +
            'var context = Function("return this")();\n' +
            'context.console = console;\n\n')
          source.add(originalSource)
          source.add(`\nmodule.exports = window[${JSON.stringify(jsonpFunction)}];\n`)
        } else {
          if (mpx.pluginMain === chunk.name) {
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
