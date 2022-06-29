'use strict'

const path = require('path')
const ResolveDependency = require('./dependencies/ResolveDependency')
const InjectDependency = require('./dependencies/InjectDependency')
const ReplaceDependency = require('./dependencies/ReplaceDependency')
const NullFactory = require('webpack/lib/NullFactory')
const CommonJsVariableDependency = require('./dependencies/CommonJsVariableDependency')
const CommonJsAsyncDependency = require('./dependencies/CommonJsAsyncDependency')
const NormalModule = require('webpack/lib/NormalModule')
const EntryPlugin = require('webpack/lib/EntryPlugin')
const FlagEntryExportAsUsedPlugin = require('webpack/lib/FlagEntryExportAsUsedPlugin')
const FileSystemInfo = require('webpack/lib/FileSystemInfo')
const normalize = require('./utils/normalize')
const toPosix = require('./utils/to-posix')
const addQuery = require('./utils/add-query')
const DefinePlugin = require('webpack/lib/DefinePlugin')
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin')
const AddModePlugin = require('./resolver/AddModePlugin')
const AddEnvPlugin = require('./resolver/AddEnvPlugin')
const PackageEntryPlugin = require('./resolver/PackageEntryPlugin')
const FixDescriptionInfoPlugin = require('./resolver/FixDescriptionInfoPlugin')
const AppEntryDependency = require('./dependencies/AppEntryDependency')
const RecordResourceMapDependency = require('./dependencies/RecordResourceMapDependency')
const RecordGlobalComponentsDependency = require('./dependencies/RecordGlobalComponentsDependency')
const RecordIndependentDependency = require('./dependencies/RecordIndependentDependency')
const DynamicEntryDependency = require('./dependencies/DynamicEntryDependency')
const FlagPluginDependency = require('./dependencies/FlagPluginDependency')
const RemoveEntryDependency = require('./dependencies/RemoveEntryDependency')
const PartialCompilePlugin = require('./partial-compile/index')
const parseRequest = require('./utils/parse-request')
const { matchCondition } = require('./utils/match-condition')
const { preProcessDefs } = require('./utils/index')
const config = require('./config')
const hash = require('hash-sum')
const wxssLoaderPath = normalize.lib('wxss/loader')
const wxmlLoaderPath = normalize.lib('wxml/loader')
const wxsLoaderPath = normalize.lib('wxs/loader')
const styleCompilerPath = normalize.lib('style-compiler/index')
const templateCompilerPath = normalize.lib('template-compiler/index')
const jsonCompilerPath = normalize.lib('json-compiler/index')
const jsonThemeCompilerPath = normalize.lib('json-compiler/theme')
const jsonPluginCompilerPath = normalize.lib('json-compiler/plugin')
const extractorPath = normalize.lib('extractor')
const async = require('async')
const stringifyLoadersAndResource = require('./utils/stringify-loaders-resource')
const emitFile = require('./utils/emit-file')
const { MPX_PROCESSED_FLAG, MPX_DISABLE_EXTRACTOR_CACHE } = require('./utils/const')

const isProductionLikeMode = options => {
  return options.mode === 'production' || !options.mode
}

const isStaticModule = module => {
  if (!module.resource) return false
  const { queryObj } = parseRequest(module.resource)
  let isStatic = queryObj.isStatic || false
  if (module.loaders) {
    for (const loader of module.loaders) {
      if (/(url-loader|file-loader)/.test(loader.loader)) {
        isStatic = true
        break
      }
    }
  }
  return isStatic
}


const externalsMap = {
  weui: /^weui-miniprogram/
}

const warnings = []
const errors = []

class EntryNode {
  constructor (module, type) {
    this.module = module
    this.type = type
    this.parents = new Set()
    this.children = new Set()
  }

  addChild (node) {
    this.children.add(node)
    node.parents.add(this)
  }
}

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
    options.resolveMode = options.resolveMode || 'webpack'
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
    options.generateBuildMap = options.generateBuildMap || false
    options.attributes = options.attributes || []
    options.externals = (options.externals || []).map((external) => {
      return externalsMap[external] || external
    })
    options.projectRoot = options.projectRoot || process.cwd()
    options.forceUsePageCtor = options.forceUsePageCtor || false
    options.postcssInlineConfig = options.postcssInlineConfig || {}
    options.transRpxRules = options.transRpxRules || null
    options.auditResource = options.auditResource || false
    options.decodeHTMLText = options.decodeHTMLText || false
    options.i18n = options.i18n || null
    options.checkUsingComponents = options.checkUsingComponents || false
    options.reportSize = options.reportSize || null
    options.pathHashMode = options.pathHashMode || 'absolute'
    options.forceDisableBuiltInLoader = options.forceDisableBuiltInLoader || false
    options.useRelativePath = options.useRelativePath || false
    options.subpackageModulesRules = options.subpackageModulesRules || {}
    options.forceMainPackageRules = options.forceMainPackageRules || {}
    options.forceProxyEventRules = options.forceProxyEventRules || {}
    options.fileConditionRules = options.fileConditionRules || {
      include: () => true
    }
    options.customOutputPath = options.customOutputPath || null
    options.nativeConfig = Object.assign({
      cssLangs: ['css', 'less', 'stylus', 'scss', 'sass']
    }, options.nativeConfig)
    options.webConfig = options.webConfig || {}
    options.partialCompile = options.mode !== 'web' && options.partialCompile
    let proxyComponentEventsRules = []
    const proxyComponentEventsRulesRaw = options.proxyComponentEventsRules
    if (proxyComponentEventsRulesRaw) {
      proxyComponentEventsRules = Array.isArray(proxyComponentEventsRulesRaw) ? proxyComponentEventsRulesRaw : [proxyComponentEventsRulesRaw]
    }
    options.proxyComponentEventsRules = proxyComponentEventsRules
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
      loader: normalize.lib('loader'),
      options
    }
  }

  static wxssLoader (options) {
    return {
      loader: normalize.lib('wxss/loader'),
      options
    }
  }

  static wxmlLoader (options) {
    return {
      loader: normalize.lib('wxml/loader'),
      options
    }
  }

  static pluginLoader (options = {}) {
    return {
      loader: normalize.lib('json-compiler/plugin'),
      options
    }
  }

  static wxsPreLoader (options = {}) {
    return {
      loader: normalize.lib('wxs/pre-loader'),
      options
    }
  }

  static urlLoader (options = {}) {
    return {
      loader: normalize.lib('url-loader'),
      options
    }
  }

  static fileLoader (options = {}) {
    return {
      loader: normalize.lib('file-loader'),
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
    compiler.options.resolve.plugins.push(packageEntryPlugin)
    compiler.options.resolve.plugins.push(new FixDescriptionInfoPlugin())

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

    const typeExtMap = config[this.options.mode].typeExtMap

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

    let mpx

    if (this.options.partialCompile) {
      new PartialCompilePlugin(this.options.partialCompile).apply(compiler)
    }

    compiler.hooks.compilation.tap('MpxWebpackPlugin ', (compilation, { normalModuleFactory }) => {
      NormalModule.getCompilationHooks(compilation).loader.tap('MpxWebpackPlugin', (loaderContext) => {
        // 设置loaderContext的minimize
        if (isProductionLikeMode(compiler.options)) {
          loaderContext.minimize = true
        }

        loaderContext.getMpx = () => {
          return mpx
        }
      })
      compilation.dependencyFactories.set(ResolveDependency, new NullFactory())
      compilation.dependencyTemplates.set(ResolveDependency, new ResolveDependency.Template())

      compilation.dependencyFactories.set(InjectDependency, new NullFactory())
      compilation.dependencyTemplates.set(InjectDependency, new InjectDependency.Template())

      compilation.dependencyFactories.set(ReplaceDependency, new NullFactory())
      compilation.dependencyTemplates.set(ReplaceDependency, new ReplaceDependency.Template())

      compilation.dependencyFactories.set(AppEntryDependency, new NullFactory())
      compilation.dependencyTemplates.set(AppEntryDependency, new AppEntryDependency.Template())

      compilation.dependencyFactories.set(DynamicEntryDependency, new NullFactory())
      compilation.dependencyTemplates.set(DynamicEntryDependency, new DynamicEntryDependency.Template())

      compilation.dependencyFactories.set(FlagPluginDependency, new NullFactory())
      compilation.dependencyTemplates.set(FlagPluginDependency, new FlagPluginDependency.Template())

      compilation.dependencyFactories.set(RemoveEntryDependency, new NullFactory())
      compilation.dependencyTemplates.set(RemoveEntryDependency, new RemoveEntryDependency.Template())

      compilation.dependencyFactories.set(RecordResourceMapDependency, new NullFactory())
      compilation.dependencyTemplates.set(RecordResourceMapDependency, new RecordResourceMapDependency.Template())

      compilation.dependencyFactories.set(RecordGlobalComponentsDependency, new NullFactory())
      compilation.dependencyTemplates.set(RecordGlobalComponentsDependency, new RecordGlobalComponentsDependency.Template())

      compilation.dependencyFactories.set(RecordIndependentDependency, new NullFactory())
      compilation.dependencyTemplates.set(RecordIndependentDependency, new RecordIndependentDependency.Template())

      compilation.dependencyFactories.set(CommonJsVariableDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(CommonJsVariableDependency, new CommonJsVariableDependency.Template())

      compilation.dependencyFactories.set(CommonJsAsyncDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(CommonJsAsyncDependency, new CommonJsAsyncDependency.Template())
    })

    compiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation, { normalModuleFactory }) => {
      compilation.warnings = compilation.warnings.concat(warnings)
      compilation.errors = compilation.errors.concat(errors)
      const moduleGraph = compilation.moduleGraph
      if (!compilation.__mpx__) {
        // init mpx
        mpx = compilation.__mpx__ = {
          // app信息，便于获取appName
          appInfo: {},
          // pages全局记录，无需区分主包分包
          pagesMap: {},
          // 组件资源记录，依照所属包进行记录
          componentsMap: {
            main: {}
          },
          // 静态资源(图片，字体，独立样式)等，依照所属包进行记录
          staticResourcesMap: {
            main: {}
          },
          // 用于记录命中subpackageModulesRules的js模块分包归属，用于js多分包冗余输出
          subpackageModulesMap: {
            main: {}
          },
          // 记录其他资源，如pluginMain、pluginExport，无需区分主包分包
          otherResourcesMap: {},
          // 记录独立分包
          independentSubpackagesMap: {},
          subpackagesEntriesMap: {},
          replacePathMap: {},
          exportModules: new Set(),
          // 记录entryModule与entryNode的对应关系，用于体积分析
          entryNodeModulesMap: new Map(),
          // 记录与asset相关联的modules，用于体积分析
          assetsModulesMap: new Map(),
          // 记录与asset相关联的ast，用于体积分析和esCheck，避免重复parse
          assetsASTsMap: new Map(),
          usingComponents: {},
          // todo es6 map读写性能高于object，之后会逐步替换
          vueContentCache: new Map(),
          wxsAssetsCache: new Map(),
          currentPackageRoot: '',
          wxsContentMap: {},
          forceUsePageCtor: this.options.forceUsePageCtor,
          resolveMode: this.options.resolveMode,
          mode: this.options.mode,
          srcMode: this.options.srcMode,
          env: this.options.env,
          externalClasses: this.options.externalClasses,
          projectRoot: this.options.projectRoot,
          autoScopeRules: this.options.autoScopeRules,
          transRpxRules: this.options.transRpxRules,
          postcssInlineConfig: this.options.postcssInlineConfig,
          decodeHTMLText: this.options.decodeHTMLText,
          // native文件专用配置
          nativeConfig: this.options.nativeConfig,
          // 输出web专用配置
          webConfig: this.options.webConfig,
          tabBarMap: {},
          defs: preProcessDefs(this.options.defs),
          i18n: this.options.i18n,
          checkUsingComponents: this.options.checkUsingComponents,
          forceDisableBuiltInLoader: this.options.forceDisableBuiltInLoader,
          appTitle: 'Mpx homepage',
          attributes: this.options.attributes,
          externals: this.options.externals,
          useRelativePath: this.options.useRelativePath,
          removedChunks: [],
          forceProxyEventRules: this.options.forceProxyEventRules,
          proxyComponentEventsRules: this.options.proxyComponentEventsRules,
          pathHash: (resourcePath) => {
            if (this.options.pathHashMode === 'relative' && this.options.projectRoot) {
              return hash(path.relative(this.options.projectRoot, resourcePath))
            }
            return hash(resourcePath)
          },
          addEntry (request, name, callback) {
            const dep = EntryPlugin.createDependency(request, { name })
            compilation.addEntry(compiler.context, dep, { name }, callback)
            return dep
          },
          getEntryNode: (module, type) => {
            const entryNodeModulesMap = mpx.entryNodeModulesMap
            let entryNode = entryNodeModulesMap.get(module)
            if (!entryNode) {
              entryNode = new EntryNode(module, type)
              entryNodeModulesMap.set(module, entryNode)
            }
            return entryNode
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
          extractedFilesCache: new Map(),
          getExtractedFile: (resource, { error } = {}) => {
            const cache = mpx.extractedFilesCache.get(resource)
            if (cache) return cache
            const { resourcePath, queryObj } = parseRequest(resource)
            const { type, isStatic, isPlugin } = queryObj
            let file
            if (isPlugin) {
              file = 'plugin.json'
            } else if (isStatic) {
              const packageRoot = queryObj.packageRoot || ''
              file = toPosix(path.join(packageRoot, mpx.getOutputPath(resourcePath, type, { ext: typeExtMap[type] })))
            } else {
              const appInfo = mpx.appInfo
              const pagesMap = mpx.pagesMap
              const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
              const componentsMap = mpx.componentsMap[packageName]
              let filename = resourcePath === appInfo.resourcePath ? appInfo.name : (pagesMap[resourcePath] || componentsMap[resourcePath])
              if (!filename) {
                error && error(new Error('Get extracted file error: missing filename!'))
                filename = 'missing-filename'
              }
              file = filename + typeExtMap[type]
            }
            mpx.extractedFilesCache.set(resource, file)
            return file
          },
          recordResourceMap: ({ resourcePath, resourceType, outputPath, packageRoot = '', recordOnly, warn, error }) => {
            const packageName = packageRoot || 'main'
            const resourceMap = mpx[`${resourceType}sMap`] || mpx.otherResourcesMap
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
          },
          // 组件和静态资源的输出规则如下：
          // 1. 主包引用的资源输出至主包
          // 2. 分包引用且主包引用过的资源输出至主包，不在当前分包重复输出
          // 3. 分包引用且无其他包引用的资源输出至当前分包
          // 4. 分包引用且其他分包也引用过的资源，重复输出至当前分包
          getPackageInfo: ({ resource, resourceType, outputPath, issuerResource, warn, error }) => {
            let packageRoot = ''
            let packageName = 'main'

            const { resourcePath } = parseRequest(resource)
            const currentPackageRoot = mpx.currentPackageRoot
            const currentPackageName = currentPackageRoot || 'main'
            const isIndependent = !!mpx.independentSubpackagesMap[currentPackageRoot]
            const resourceMap = mpx[`${resourceType}sMap`] || mpx.otherResourcesMap

            if (!resourceMap.main) {
              packageRoot = currentPackageRoot
              packageName = currentPackageName
            } else {
              // 主包中有引用一律使用主包中资源，不再额外输出
              // 资源路径匹配到forceMainPackageRules规则时强制输出到主包，降低分包资源冗余
              // 如果存在issuer且issuerPackageRoot与当前packageRoot不一致，也输出到主包
              // todo forceMainPackageRules规则目前只能处理当前资源，不能处理资源子树，配置不当有可能会导致资源引用错误
              let isMain = resourceMap.main[resourcePath] || matchCondition(resourcePath, this.options.forceMainPackageRules)
              if (issuerResource) {
                const { queryObj } = parseRequest(issuerResource)
                const issuerPackageRoot = queryObj.packageRoot || ''
                if (issuerPackageRoot !== currentPackageRoot) {
                  warn && warn(new Error(`当前模块[${resource}]的引用者[${issuerResource}]不带有分包标记或分包标记与当前分包不符，模块资源将被输出到主包，可以尝试将引用者加入到subpackageModulesRules来解决这个问题！`))
                  isMain = true
                }
              }
              if (!isMain || isIndependent) {
                packageRoot = currentPackageRoot
                packageName = currentPackageName
                if (this.options.auditResource && resourceType !== 'subpackageModule' && !isIndependent) {
                  if (this.options.auditResource !== 'component' || resourceType === 'component') {
                    Object.keys(resourceMap).filter(key => key !== 'main').forEach((key) => {
                      if (resourceMap[key][resourcePath] && key !== packageName) {
                        warn && warn(new Error(`当前${resourceType === 'component' ? '组件' : '静态'}资源${resourcePath}在分包${key}和分包${packageName}中都有引用，会分别输出到两个分包中，为了总体积最优，可以在主包中建立引用声明以消除资源输出冗余！`))
                      }
                    })
                  }
                }
              }
              resourceMap[packageName] = resourceMap[packageName] || {}
            }

            if (outputPath) outputPath = toPosix(path.join(packageRoot, outputPath))

            return {
              packageName,
              packageRoot,
              // 返回outputPath及alreadyOutputted
              ...mpx.recordResourceMap({
                resourcePath,
                resourceType,
                outputPath,
                packageRoot,
                warn,
                error
              })
            }
          }
        }
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

      compilation.hooks.succeedModule.tap('MpxWebpackPlugin', (module) => {
        // 静态资源模块由于输出结果的动态性，通过importModule会合并asset的特性，通过emitFile传递信息禁用父级extractor的缓存来保障父级的importModule每次都能被执行
        if (isStaticModule(module)) {
          emitFile(module, MPX_DISABLE_EXTRACTOR_CACHE, '', undefined, { skipEmit: true })
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
          const resolveLoaderPath = normalize.lib('resolve-loader')
          data.request = `!!${resolveLoaderPath}!${resource}`
        }
      })

      const typeLoaderProcessInfo = {
        styles: ['css-loader', wxssLoaderPath, styleCompilerPath],
        template: ['html-loader', wxmlLoaderPath, templateCompilerPath]
      }

      // 应用过rules后，注入mpx相关资源编译loader
      normalModuleFactory.hooks.afterResolve.tap('MpxWebpackPlugin', ({ createData }) => {
        const { queryObj } = parseRequest(createData.request)
        const loaders = createData.loaders
        if (queryObj.mpx && queryObj.mpx !== MPX_PROCESSED_FLAG) {
          const type = queryObj.type
          const extract = queryObj.extract
          switch (type) {
            case 'styles':
            case 'template':
              let insertBeforeIndex = -1
              const info = typeLoaderProcessInfo[type]
              loaders.forEach((loader, index) => {
                const currentLoader = toPosix(loader.loader)
                if (currentLoader.includes(info[0])) {
                  loader.loader = info[1]
                  insertBeforeIndex = index
                } else if (currentLoader.includes(info[1])) {
                  insertBeforeIndex = index
                }
              })
              if (insertBeforeIndex > -1) {
                loaders.splice(insertBeforeIndex + 1, 0, {
                  loader: info[2]
                })
              }
              break
            case 'json':
              if (queryObj.isTheme) {
                loaders.unshift({
                  loader: jsonThemeCompilerPath
                })
              } else if (queryObj.isPlugin) {
                loaders.unshift({
                  loader: jsonPluginCompilerPath
                })
              } else {
                loaders.unshift({
                  loader: jsonCompilerPath
                })
              }
              break
            case 'wxs':
              loaders.unshift({
                loader: wxsLoaderPath
              })
          }
          if (extract) {
            loaders.unshift({
              loader: extractorPath
            })
          }
          createData.resource = addQuery(createData.resource, { mpx: MPX_PROCESSED_FLAG }, true)
        }

        if (mpx.mode === 'web') {
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
        }

        createData.request = stringifyLoadersAndResource(loaders, createData.resource)
        // 根据用户传入的modeRules对特定资源添加mode query
        this.runModeRules(createData)
      })
    })

    const clearFileCache = () => {
      const fs = compiler.intermediateFileSystem
      const cacheLocation = compiler.options.cache.cacheLocation
      return new Promise((resolve) => {
        if (!cacheLocation) return resolve()
        if (typeof fs.rm === 'function') {
          fs.rm(cacheLocation, {
            recursive: true,
            force: true
          }, resolve)
        } else {
          // polyfill fs.rm
          const rm = (file, callback) => {
            async.waterfall([
              (callback) => {
                fs.stat(file, callback)
              },
              (stats, callback) => {
                if (stats.isDirectory()) {
                  const dir = file
                  fs.readdir(dir, (err, files) => {
                    if (err) return callback(err)
                    async.each(files, (file, callback) => {
                      file = path.join(dir, file)
                      rm(file, callback)
                    }, (err) => {
                      if (err) return callback(err)
                      fs.rmdir(dir, callback)
                    })
                  })
                } else {
                  fs.unlink(file, callback)
                }
              }
            ], callback)
          }
          rm(cacheLocation, resolve)
        }
      })
    }

    compiler.hooks.done.tapPromise('MpxWebpackPlugin', async () => {
      const cache = compiler.getCache('MpxWebpackPlugin')
      const cacheIsValid = await cache.getPromise('cacheIsValid', null)
      if (!cacheIsValid) {
        await Promise.all([
          clearFileCache(),
          cache.storePromise('cacheIsValid', null, true)
        ])
      }
    })
  }
}

module.exports = MpxWebpackPlugin
