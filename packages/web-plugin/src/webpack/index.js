'use strict'

const path = require('path')
const ResolveDependency = require('./dependencies/ResolveDependency')
const InjectDependency = require('./dependencies/InjectDependency')
const NullFactory = require('webpack/lib/NullFactory')
const NormalModule = require('webpack/lib/NormalModule')
const CommonJsVariableDependency = require('./dependencies/CommonJsVariableDependency')
const ReplaceDependency = require('./dependencies/ReplaceDependency')
const harmonySpecifierTag = require('webpack/lib/dependencies/HarmonyImportDependencyParserPlugin').harmonySpecifierTag
const FlagEntryExportAsUsedPlugin = require('webpack/lib/FlagEntryExportAsUsedPlugin')
const FileSystemInfo = require('webpack/lib/FileSystemInfo')
const normalize = require('@mpxjs/utils/normalize')
const toPosix = require(normalize.utils('to-posix'))
const addQuery = require(normalize.utils('add-query'))
const DefinePlugin = require('webpack/lib/DefinePlugin')
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin')
const AddModePlugin = require('./resolver/AddModePlugin')
const AddEnvPlugin = require('./resolver/AddEnvPlugin')
const RecordResourceMapDependency = require('./dependencies/RecordResourceMapDependency')
const parseRequest = require(normalize.utils('parse-request'))
const { matchCondition } = require(normalize.utils('match-condition'))
const { preProcessDefs } = require(normalize.utils('index'))
const hash = require('hash-sum')
const styleCompilerPath = normalize.webLib('webpack/style-compiler/index')
const stringifyLoadersAndResource = require(normalize.utils('stringify-loaders-resource'))
const async = require('async')
let mpx = require('./mpx')

const isProductionLikeMode = options => {
  return options.mode === 'production' || !options.mode
}

const externalsMap = {
  weui: /^weui-miniprogram/
}

const warnings = []
const errors = []

class MpxWebpackPlugin {
  constructor (options = {}) {
    options.mode = options.mode || 'wx'
    options.env = options.env || ''

    options.srcMode = options.srcMode || options.mode
    if (options.mode !== options.srcMode && options.srcMode !== 'wx') {
      errors.push('MpxWebpackPlugin supports srcMode to be "wx" only temporarily!')
    }
    if (options.mode === 'web' && options.srcMode !== 'wx') {
      errors.push('MpxWebpackPlugin supports mode to be "web" only when srcMode is set to "wx"!')
    }
    options.externalClasses = options.externalClasses || ['custom-class', 'i-class']
    options.writeMode = options.writeMode || 'changed'
    options.autoScopeRules = options.autoScopeRules || {}
    options.forceDisableProxyCtor = options.forceDisableProxyCtor || false
    options.transMpxRules = options.transMpxRules || {
      include: () => true
    }
    // 通过默认defs配置实现mode及srcMode的注入，简化内部处理逻辑
    options.defs = Object.assign({}, options.defs, {
      '__mpx_mode__': options.mode,
      '__mpx_src_mode__': options.srcMode,
      '__mpx_env__': options.env
    })
    // 批量指定源码mode
    options.modeRules = options.modeRules || {}
    options.externals = (options.externals || []).map((external) => {
      return externalsMap[external] || external
    })
    options.projectRoot = options.projectRoot || process.cwd()
    options.postcssInlineConfig = options.postcssInlineConfig || {}
    options.transRpxRules = options.transRpxRules || null
    options.decodeHTMLText = options.decodeHTMLText || false
    options.i18n = options.i18n || null
    options.checkUsingComponents = options.checkUsingComponents || false
    options.pathHashMode = options.pathHashMode || 'absolute'
    // 文件条件编译
    options.fileConditionRules = options.fileConditionRules || {
      include: () => true
    }
    options.customOutputPath = options.customOutputPath || null
    options.webConfig = options.webConfig || {}
    this.options = options
    // Hack for buildDependencies
    const rawResolveBuildDependencies = FileSystemInfo.prototype.resolveBuildDependencies
    FileSystemInfo.prototype.resolveBuildDependencies = function (context, deps, rawCallback) {
      return rawResolveBuildDependencies.call(this, context, deps, (err, result) => {
        if (result && typeof options.hackResolveBuildDependencies === 'function') options.hackResolveBuildDependencies(result)
        return rawCallback(err, result)
      })
    }
  }

  static loader (options = {}) {
    if (options.transRpx) {
      warnings.push('Mpx loader option [transRpx] is deprecated now, please use mpx webpack plugin config [transRpxRules] instead!')
    }
    return {
      loader: normalize.webLib('webpack/loader'),
      options
    }
  }
  static wxsPreLoader (options = {}) {
    return {
      loader: normalize.webLib('webpack/wxs/pre-loader'),
      options
    }
  }

  static urlLoader (options = {}) {
    return {
      loader: normalize.webLib('webpack/url-loader'),
      options
    }
  }

  static fileLoader (options = {}) {
    return {
      loader: normalize.webLib('webpack/file-loader'),
      options
    }
  }

  runModeRules (data) {
    const { resourcePath, queryObj } = parseRequest(data.resource)
    if (queryObj.mode) {
      return
    }
    const mode = this.options.mode
    const modeRule = this.options.modeRules[mode]
    if (!modeRule) {
      return
    }
    if (matchCondition(resourcePath, modeRule)) {
      data.resource = addQuery(data.resource, { mode })
      data.request = addQuery(data.request, { mode })
    }
  }

  apply (compiler) {
    if (!compiler.__mpx__) {
      compiler.__mpx__ = true
    } else {
      errors.push('Multiple MpxWebpackPlugin instances exist in webpack compiler, please check webpack plugins config!')
    }

    // 将entry export标记为used且不可mangle，避免require.async生成的js chunk在生产环境下报错
    new FlagEntryExportAsUsedPlugin(true, 'entry').apply(compiler)
    if (!compiler.options.node || !compiler.options.node.global) {
      compiler.options.node = compiler.options.node || {}
      compiler.options.node.global = true
    }

    const addModePlugin = new AddModePlugin('before-file', this.options.mode, this.options.fileConditionRules, 'file')
    const addEnvPlugin = new AddEnvPlugin('before-file', this.options.env, this.options.fileConditionRules, 'file')
    if (Array.isArray(compiler.options.resolve.plugins)) {
      compiler.options.resolve.plugins.push(addModePlugin)
    } else {
      compiler.options.resolve.plugins = [addModePlugin]
    }
    if (this.options.env) {
      compiler.options.resolve.plugins.push(addEnvPlugin)
    }
    // 代理writeFile
    if (this.options.writeMode === 'changed') {
      const writedFileContentMap = new Map()
      const originalWriteFile = compiler.outputFileSystem.writeFile
      compiler.outputFileSystem.writeFile = (filePath, content, callback) => {
        const lastContent = writedFileContentMap.get(filePath)
        if (Buffer.isBuffer(lastContent) ? lastContent.equals(content) : lastContent === content) {
          return callback()
        }
        writedFileContentMap.set(filePath, content)
        originalWriteFile(filePath, content, callback)
      }
    }

    const defs = this.options.defs

    const defsOpt = {
      '__mpx_wxs__': DefinePlugin.runtimeValue(({ module }) => {
        return JSON.stringify(!!module.wxs)
      })
    }

    Object.keys(defs).forEach((key) => {
      defsOpt[key] = JSON.stringify(defs[key])
    })

    // define mode & defs
    new DefinePlugin(defsOpt).apply(compiler)

    new ExternalsPlugin('commonjs2', this.options.externals).apply(compiler)

    compiler.hooks.compilation.tap('MpxWebpackPlugin ', (compilation, { normalModuleFactory }) => {
      NormalModule.getCompilationHooks(compilation).loader.tap('MpxWebpackPlugin', (loaderContext) => {
        // 设置loaderContext的minimize
        if (isProductionLikeMode(compiler.options)) {
          mpx.minimize = true
        }
      })
      compilation.dependencyFactories.set(ResolveDependency, new NullFactory())
      compilation.dependencyTemplates.set(ResolveDependency, new ResolveDependency.Template())

      compilation.dependencyFactories.set(InjectDependency, new NullFactory())
      compilation.dependencyTemplates.set(InjectDependency, new InjectDependency.Template())

      compilation.dependencyFactories.set(ReplaceDependency, new NullFactory())
      compilation.dependencyTemplates.set(ReplaceDependency, new ReplaceDependency.Template())
      compilation.dependencyFactories.set(CommonJsVariableDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(CommonJsVariableDependency, new CommonJsVariableDependency.Template())
      compilation.dependencyFactories.set(RecordResourceMapDependency, new NullFactory())
      compilation.dependencyTemplates.set(RecordResourceMapDependency, new RecordResourceMapDependency.Template())
    })

    compiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation, { normalModuleFactory }) => {
      compilation.warnings = compilation.warnings.concat(warnings)
      compilation.errors = compilation.errors.concat(errors)
      const moduleGraph = compilation.moduleGraph
      if (!compilation.__mpx__) {
        // init mpx
        const initMpxData = {
          // pages全局记录，无需区分主包分包
          pagesMap: {},
          // 组件资源记录，依照所属包进行记录
          componentsMap: {
            main: {}
          },
          staticResourcesMap: {
            main: {}
          },
          usingComponents: {},
          // todo es6 map读写性能高于object，之后会逐步替换
          vueContentCache: new Map(),
          wxsAssetsCache: new Map(),
          currentPackageRoot: '',
          wxsContentMap: {},
          minimize: false,
          mode: this.options.mode,
          srcMode: this.options.srcMode,
          env: this.options.env,
          externalClasses: this.options.externalClasses,
          projectRoot: this.options.projectRoot,
          autoScopeRules: this.options.autoScopeRules,
          transRpxRules: this.options.transRpxRules,
          postcssInlineConfig: this.options.postcssInlineConfig,
          decodeHTMLText: this.options.decodeHTMLText,
          // 输出web专用配置
          webConfig: this.options.webConfig,
          defs: preProcessDefs(this.options.defs),
          i18n: this.options.i18n,
          checkUsingComponents: this.options.checkUsingComponents,
          appTitle: 'Mpx homepage',
          externals: this.options.externals,
          pathHash: (resourcePath) => {
            if (this.options.pathHashMode === 'relative' && this.options.projectRoot) {
              return hash(path.relative(this.options.projectRoot, resourcePath))
            }
            return hash(resourcePath)
          },
          getOutputPath: (resourcePath, type, { ext = '', conflictPath = '' } = {}) => {
            const name = path.parse(resourcePath).name
            const hash = mpx.pathHash(resourcePath)
            const customOutputPath = this.options.customOutputPath
            if (conflictPath) return conflictPath.replace(/(\.[^\\/]+)?$/, match => hash + match)
            if (typeof customOutputPath === 'function') return customOutputPath(type, name, hash, ext).replace(/^\//, '')
            if (type === 'component' || type === 'page') return path.join(type + 's', name + hash, 'index' + ext)
            return path.join(type, name + hash + ext)
          },
          recordResourceMap: ({ resourcePath, resourceType, outputPath, packageRoot = '', recordOnly, warn, error }) => {
            const packageName = packageRoot || 'main'
            const resourceMap = mpx[`${resourceType}sMap`]
            const currentResourceMap = resourceMap.main ? resourceMap[packageName] = resourceMap[packageName] || {} : resourceMap
            let alreadyOutputted = false
            if (outputPath) {
              if (!currentResourceMap[resourcePath] || currentResourceMap[resourcePath] === true) {
                if (!recordOnly) {
                  // 在非recordOnly的模式下，进行输出路径冲突检测，如果存在输出路径冲突，则对输出路径进行重命名
                  for (let key in currentResourceMap) {
                    // todo 用outputPathMap来检测输出路径冲突
                    if (currentResourceMap[key] === outputPath && key !== resourcePath) {
                      outputPath = mpx.getOutputPath(resourcePath, resourceType, { conflictPath: outputPath })
                      warn && warn(new Error(`Current ${resourceType} [${resourcePath}] is registered with conflicted outputPath [${currentResourceMap[key]}] which is already existed in system, will be renamed with [${outputPath}], use ?resolve to get the real outputPath!`))
                      break
                    }
                  }
                }
                currentResourceMap[resourcePath] = outputPath
              } else {
                if (currentResourceMap[resourcePath] === outputPath) {
                  alreadyOutputted = true
                } else {
                  error && error(new Error(`Current ${resourceType} [${resourcePath}] is already registered with outputPath [${currentResourceMap[resourcePath]}], you can not register it with another outputPath [${outputPath}]!`))
                }
              }
            } else if (!currentResourceMap[resourcePath]) {
              currentResourceMap[resourcePath] = true
            }

            return {
              outputPath,
              alreadyOutputted
            }
          }
        }
        const initAttrs = Object.keys(initMpxData)
        initAttrs.forEach(key => {
          mpx[key] = initMpxData[key]
        })
        compilation.__mpx__ = mpx
      }
      const rawProcessModuleDependencies = compilation.processModuleDependencies
      compilation.processModuleDependencies = (module, callback) => {
        const presentationalDependencies = module.presentationalDependencies || []
        async.forEach(presentationalDependencies.filter((dep) => dep.mpxAction), (dep, callback) => {
          dep.mpxAction(module, compilation, callback)
        }, (err) => {
          rawProcessModuleDependencies.call(compilation, module, (innerErr) => {
            return callback(err || innerErr)
          })
        })
      }
      normalModuleFactory.hooks.parser.for('javascript/auto').tap('MpxWebpackPlugin', (parser) => {
        parser.hooks.call.for('__mpx_resolve_path__').tap('MpxWebpackPlugin', (expr) => {
          if (expr.arguments[0]) {
            const resource = expr.arguments[0].value
            const packageName = mpx.currentPackageRoot || 'main'
            const issuerResource = moduleGraph.getIssuer(parser.state.module).resource
            const range = expr.range
            const dep = new ResolveDependency(resource, packageName, issuerResource, range)
            parser.state.current.addPresentationalDependency(dep)
            return true
          }
        })
        // hack babel polyfill global
        parser.hooks.statementIf.tap('MpxWebpackPlugin', (expr) => {
          if (/core-js.+microtask/.test(parser.state.module.resource)) {
            if (expr.test.left && (expr.test.left.name === 'Observer' || expr.test.left.name === 'MutationObserver')) {
              const current = parser.state.current
              current.addPresentationalDependency(new InjectDependency({
                content: 'document && ',
                index: expr.test.range[0]
              }))
            }
          }
        })

        parser.hooks.evaluate.for('CallExpression').tap('MpxWebpackPlugin', (expr) => {
          const current = parser.state.current
          const arg0 = expr.arguments[0]
          const callee = expr.callee
          // todo 该逻辑在corejs3中不需要，等corejs3比较普及之后可以干掉
          if (/core-js.+global/.test(parser.state.module.resource)) {
            if (callee.name === 'Function' && arg0 && arg0.value === 'return this') {
              current.addPresentationalDependency(new InjectDependency({
                content: '(function() { return this })() || ',
                index: expr.range[0]
              }))
            }
          }
        })

        // 处理跨平台转换
        if (mpx.srcMode !== mpx.mode) {
          // 处理跨平台全局对象转换
          const transGlobalObject = (expr) => {
            const module = parser.state.module
            const current = parser.state.current
            const { queryObj, resourcePath } = parseRequest(module.resource)
            const localSrcMode = queryObj.mode
            const globalSrcMode = mpx.srcMode
            const srcMode = localSrcMode || globalSrcMode
            const mode = mpx.mode

            let target
            if (expr.type === 'Identifier') {
              target = expr
            } else if (expr.type === 'MemberExpression') {
              target = expr.object
            }

            if (!matchCondition(resourcePath, this.options.transMpxRules) || resourcePath.indexOf('@mpxjs') !== -1 || !target || mode === srcMode) return

            const type = target.name
            const name = type === 'wx' ? 'mpx' : 'createFactory'
            const replaceContent = type === 'wx' ? 'mpx' : `createFactory(${JSON.stringify(type)})`

            const dep = new ReplaceDependency(replaceContent, target.range)
            current.addPresentationalDependency(dep)

            let needInject = true
            for (let dep of module.dependencies) {
              if (dep instanceof CommonJsVariableDependency && dep.name === name) {
                needInject = false
                break
              }
            }
            if (needInject) {
              const dep = new CommonJsVariableDependency(`@mpxjs/core/src/runtime/${name}`, name)
              module.addDependency(dep)
            }
          }

          // 转换wx全局对象
          parser.hooks.expression.for('wx').tap('MpxWebpackPlugin', transGlobalObject)
          // Proxy ctor for transMode
          if (!this.options.forceDisableProxyCtor) {
            parser.hooks.call.for('Page').tap('MpxWebpackPlugin', (expr) => {
              transGlobalObject(expr.callee)
            })
            parser.hooks.call.for('Component').tap('MpxWebpackPlugin', (expr) => {
              transGlobalObject(expr.callee)
            })
            parser.hooks.call.for('App').tap('MpxWebpackPlugin', (expr) => {
              transGlobalObject(expr.callee)
            })
            parser.hooks.call.for('Behavior').tap('MpxWebpackPlugin', (expr) => {
              transGlobalObject(expr.callee)
            })
          }

          // 为跨平台api调用注入srcMode参数指导api运行时转换
          const apiBlackListMap = [
            'createApp',
            'createPage',
            'createComponent',
            'createStore',
            'createStoreWithThis',
            'mixin',
            'injectMixins',
            'toPureObject',
            'observable',
            'watch',
            'use',
            'set',
            'remove',
            'delete',
            'setConvertRule',
            'getMixin',
            'getComputed',
            'implement'
          ].reduce((map, api) => {
            map[api] = true
            return map
          }, {})

          const injectSrcModeForTransApi = (expr, members) => {
            // members为空数组时，callee并不是memberExpression
            if (!members.length) return
            const callee = expr.callee
            const args = expr.arguments
            const name = callee.object.name
            const { queryObj, resourcePath } = parseRequest(parser.state.module.resource)
            const localSrcMode = queryObj.mode
            const globalSrcMode = mpx.srcMode
            const srcMode = localSrcMode || globalSrcMode

            if (srcMode === globalSrcMode || apiBlackListMap[callee.property.name || callee.property.value] || (name !== 'mpx' && name !== 'wx') || (name === 'wx' && !matchCondition(resourcePath, this.options.transMpxRules))) return

            const srcModeString = `__mpx_src_mode_${srcMode}__`
            const dep = new InjectDependency({
              content: args.length
                ? `, ${JSON.stringify(srcModeString)}`
                : JSON.stringify(srcModeString),
              index: expr.end - 1
            })
            parser.state.current.addPresentationalDependency(dep)
          }

          parser.hooks.callMemberChain.for(harmonySpecifierTag).tap('MpxWebpackPlugin', injectSrcModeForTransApi)
          parser.hooks.callMemberChain.for('mpx').tap('MpxWebpackPlugin', injectSrcModeForTransApi)
          parser.hooks.callMemberChain.for('wx').tap('MpxWebpackPlugin', injectSrcModeForTransApi)
        }
      })
    })

    compiler.hooks.normalModuleFactory.tap('MpxWebpackPlugin', (normalModuleFactory) => {
      // resolve前修改原始request
      normalModuleFactory.hooks.beforeResolve.tap('MpxWebpackPlugin', (data) => {
        let request = data.request
        let { queryObj, resource } = parseRequest(request)
        if (queryObj.resolve) {
          // 此处的query用于将资源引用的当前包信息传递给resolveDependency
          const resolveLoaderPath = normalize.webLib('webpack/resolve-loader')
          data.request = `!!${resolveLoaderPath}!${resource}`
        }
      })
      // 应用过rules后，注入mpx相关资源编译loader
      normalModuleFactory.hooks.afterResolve.tap('MpxWebpackPlugin', ({ createData }) => {
        const { queryObj } = parseRequest(createData.request)
        const loaders = createData.loaders
        const mpxStyleOptions = queryObj.mpxStyleOptions
        const firstLoader = loaders[0] ? toPosix(loaders[0].loader) : ''
        const isPitcherRequest = firstLoader.includes('vue-loader/lib/loaders/pitcher')
        let cssLoaderIndex = -1
        let vueStyleLoaderIndex = -1
        let mpxStyleLoaderIndex = -1
        loaders.forEach((loader, index) => {
            const currentLoader = toPosix(loader.loader)
            if (currentLoader.includes('css-loader')) {
              cssLoaderIndex = index
            } else if (currentLoader.includes('vue-loader/lib/loaders/stylePostLoader')) {
              vueStyleLoaderIndex = index
            } else if (currentLoader.includes(styleCompilerPath)) {
              mpxStyleLoaderIndex = index
            }
          })
        if (mpxStyleLoaderIndex === -1) {
          let loaderIndex = -1
          if (cssLoaderIndex > -1 && vueStyleLoaderIndex === -1) {
            loaderIndex = cssLoaderIndex
          } else if (cssLoaderIndex > -1 && vueStyleLoaderIndex > -1 && !isPitcherRequest) {
            loaderIndex = vueStyleLoaderIndex
          }
          if (loaderIndex > -1) {
            loaders.splice(loaderIndex + 1, 0, {
              loader: styleCompilerPath,
              options: (mpxStyleOptions && JSON.parse(mpxStyleOptions)) || {}
            })
          }
        }

        createData.request = stringifyLoadersAndResource(loaders, createData.resource)
        // 根据用户传入的modeRules对特定资源添加mode query
        this.runModeRules(createData)
      })
    })
  }
}

module.exports = MpxWebpackPlugin
