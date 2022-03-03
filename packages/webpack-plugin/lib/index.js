'use strict'

const path = require('path')
const { ConcatSource, RawSource } = require('webpack').sources
const ResolveDependency = require('./dependencies/ResolveDependency')
const InjectDependency = require('./dependencies/InjectDependency')
const ReplaceDependency = require('./dependencies/ReplaceDependency')
const NullFactory = require('webpack/lib/NullFactory')
const CommonJsVariableDependency = require('./dependencies/CommonJsVariableDependency')
const NormalModule = require('webpack/lib/NormalModule')
const EntryPlugin = require('webpack/lib/EntryPlugin')
const JavascriptModulesPlugin = require('webpack/lib/javascript/JavascriptModulesPlugin')
const normalize = require('./utils/normalize')
const toPosix = require('./utils/to-posix')
const addQuery = require('./utils/add-query')
const { every } = require('./utils/set')
const DefinePlugin = require('webpack/lib/DefinePlugin')
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin')
const AddModePlugin = require('./resolver/AddModePlugin')
const AddEnvPlugin = require('./resolver/AddEnvPlugin')
const PackageEntryPlugin = require('./resolver/PackageEntryPlugin')
// const CommonJsRequireDependency = require('webpack/lib/dependencies/CommonJsRequireDependency')
// const HarmonyImportSideEffectDependency = require('webpack/lib/dependencies/HarmonyImportSideEffectDependency')
// const RequireHeaderDependency = require('webpack/lib/dependencies/RequireHeaderDependency')
// const RemovedModuleDependency = require('./dependencies/RemovedModuleDependency')
const AppEntryDependency = require('./dependencies/AppEntryDependency')
const RecordResourceMapDependency = require('./dependencies/RecordResourceMapDependency')
const RecordGlobalComponentsDependency = require('./dependencies/RecordGlobalComponentsDependency')
const RecordIndependentDependency = require('./dependencies/RecordIndependentDependency')
const DynamicEntryDependency = require('./dependencies/DynamicEntryDependency')
const FlagPluginDependency = require('./dependencies/FlagPluginDependency')
const RemoveEntryDependency = require('./dependencies/RemoveEntryDependency')
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin')
const PartialCompilePlugin = require('./partial-compile/index')
const fixRelative = require('./utils/fix-relative')
const parseRequest = require('./utils/parse-request')
const matchCondition = require('./utils/match-condition')
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
const isEmptyObject = require('./utils/is-empty-object')

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

const outputFilename = '[name].js'
const publicPath = '/'

const isChunkInPackage = (chunkName, packageName) => {
  return (new RegExp(`^${packageName}\\/`)).test(chunkName)
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
    options.autoVirtualHostRules = options.autoVirtualHostRules || {}
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
    options.miniNpmPackages = options.miniNpmPackages || []
    options.fileConditionRules = options.fileConditionRules || {
      include: () => true
    }
    options.customOutputPath = options.customOutputPath || null
    options.nativeConfig = Object.assign({
      cssLangs: ['css', 'less', 'stylus', 'scss', 'sass']
    }, options.nativeConfig)
    options.webConfig = options.webConfig || {}
    options.partialCompile = options.mode !== 'web' && options.partialCompile
    this.options = options
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

  static nativeLoader (options = {}) {
    return {
      loader: normalize.lib('native-loader'),
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

    if (this.options.mode !== 'web') {
      // 强制设置publicPath为'/'
      if (compiler.options.output.publicPath && compiler.options.output.publicPath !== publicPath) {
        warnings.push(`webpack options: MpxWebpackPlugin accept options.output.publicPath to be ${publicPath} only, custom options.output.publicPath will be ignored!`)
      }
      compiler.options.output.publicPath = publicPath
      if (compiler.options.output.filename && compiler.options.output.filename !== outputFilename) {
        warnings.push(`webpack options: MpxWebpackPlugin accept options.output.filename to be ${outputFilename} only, custom options.output.filename will be ignored!`)
      }
      compiler.options.output.filename = compiler.options.output.chunkFilename = outputFilename
    }

    if (!compiler.options.node || !compiler.options.node.global) {
      compiler.options.node = compiler.options.node || {}
      compiler.options.node.global = true
    }

    const addModePlugin = new AddModePlugin('before-file', this.options.mode, this.options.fileConditionRules, 'file')
    const addEnvPlugin = new AddEnvPlugin('before-file', this.options.env, this.options.fileConditionRules, 'file')
    const packageEntryPlugin = new PackageEntryPlugin('before-described-relative', this.options.miniNpmPackages, 'resolve')
    if (Array.isArray(compiler.options.resolve.plugins)) {
      compiler.options.resolve.plugins.push(addModePlugin)
    } else {
      compiler.options.resolve.plugins = [addModePlugin]
    }
    if (this.options.env) {
      compiler.options.resolve.plugins.push(addEnvPlugin)
    }
    compiler.options.resolve.plugins.push(packageEntryPlugin)

    let splitChunksPlugin
    let splitChunksOptions

    if (this.options.mode !== 'web') {
      const optimization = compiler.options.optimization
      optimization.runtimeChunk = {
        name: (entrypoint) => {
          for (let packageName in mpx.independentSubpackagesMap) {
            if (mpx.independentSubpackagesMap.hasOwnProperty(packageName) && isChunkInPackage(entrypoint.name, packageName)) {
              return `${packageName}/bundle`
            }
          }
          return 'bundle'
        }
      }
      splitChunksOptions = Object.assign({
        defaultSizeTypes: ['javascript', 'unknown'],
        chunks: 'all',
        usedExports: optimization.usedExports === true,
        minChunks: 1,
        minSize: 1000,
        enforceSizeThreshold: Infinity,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        automaticNameDelimiter: '-'
      }, optimization.splitChunks)
      delete optimization.splitChunks
      splitChunksPlugin = new SplitChunksPlugin(splitChunksOptions)
      splitChunksPlugin.apply(compiler)
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
  
    const getPackageCacheGroup = packageName => {
      if (packageName === 'main') {
        return {
          // 对于独立分包模块不应用该cacheGroup
          test: (module) => {
            let isIndependent = false
            if (module.resource) {
              const { queryObj } = parseRequest(module.resource)
              isIndependent = !!queryObj.independent
            } else {
              const identifier = module.identifier()
              isIndependent = /\|independent=/.test(identifier)
            }
            return !isIndependent
          },
          name: 'bundle',
          minChunks: 2,
          chunks: 'all'
        }
      } else {
        return {
          test: (module, { chunkGraph }) => {
            const chunks = chunkGraph.getModuleChunksIterable(module)
            return chunks.size && every(chunks, (chunk) => {
              return isChunkInPackage(chunk.name, packageName)
            })
          },
          name: `${packageName}/bundle`,
          minChunks: 2,
          minSize: 1000,
          priority: 100,
          chunks: 'all'
        }
      }
    }

    const processSubpackagesEntriesMap = (compilation, callback) => {
      const mpx = compilation.__mpx__
      if (mpx && !isEmptyObject(mpx.subpackagesEntriesMap)) {
        const subpackagesEntriesMap = mpx.subpackagesEntriesMap
        // 执行分包队列前清空mpx.subpackagesEntriesMap
        mpx.subpackagesEntriesMap = {}
        async.eachOfSeries(subpackagesEntriesMap, (deps, packageRoot, callback) => {
          mpx.currentPackageRoot = packageRoot
          mpx.componentsMap[packageRoot] = mpx.componentsMap[packageRoot] || {}
          mpx.staticResourcesMap[packageRoot] = mpx.staticResourcesMap[packageRoot] || {}
          mpx.subpackageModulesMap[packageRoot] = mpx.subpackageModulesMap[packageRoot] || {}
          async.each(deps, (dep, callback) => {
            dep.addEntry(compilation, (err, { resultPath }) => {
              if (err) return callback(err)
              mpx.replacePathMap[dep.key] = resultPath
              callback()
            })
          }, callback)
        }, (err) => {
          if (err) return callback(err)
          // 如果执行完当前队列后产生了新的分包执行队列（一般由异步分包组件造成），则继续执行
          processSubpackagesEntriesMap(compilation, callback)
        })
      } else {
        callback()
      }
    }

    // 构建分包队列，在finishMake钩子当中最先执行，stage传递-1000
    compiler.hooks.finishMake.tapAsync({
      name: 'MpxWebpackPlugin',
      stage: -1000
    }, (compilation, callback) => {
      processSubpackagesEntriesMap(compilation, callback)
    })

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
          assetModulesMap: new Map(),
          usingComponents: {},
          // todo es6 map读写性能高于object，之后会逐步替换
          vueContentCache: new Map(),
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
          autoVirtualHostRules: this.options.autoVirtualHostRules,
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
            if (typeof customOutputPath === 'function') return customOutputPath(type, name, hash, ext)
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
          // 组件和静态资源的输出规则如下：
          // 1. 主包引用的资源输出至主包
          // 2. 分包引用且主包引用过的资源输出至主包，不在当前分包重复输出
          // 3. 分包引用且无其他包引用的资源输出至当前分包
          // 4. 分包引用且其他分包也引用过的资源，重复输出至当前分包
          getPackageInfo: ({ resource, outputPath, resourceType, issuerResource, warn, error }) => {
            let packageRoot = ''
            let packageName = 'main'
            let currentResourceMap = {}

            const { resourcePath } = parseRequest(resource)
            const currentPackageRoot = mpx.currentPackageRoot
            const currentPackageName = currentPackageRoot || 'main'
            const isIndependent = !!mpx.independentSubpackagesMap[currentPackageRoot]
            const resourceMap = mpx[`${resourceType}sMap`] || mpx.otherResourcesMap

            if (!resourceMap.main) {
              currentResourceMap = resourceMap
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
              currentResourceMap = resourceMap[packageName]
            }

            let alreadyOutputed = false
            if (outputPath) {
              outputPath = toPosix(path.join(packageRoot, outputPath))
              // 如果之前已经进行过输出，则不需要重复进行
              if (currentResourceMap[resourcePath] === outputPath) {
                alreadyOutputed = true
              } else {
                // todo 用outputPathMap来检测冲突
                // 输出冲突检测，如果存在输出路径冲突，对输出路径进行重命名
                for (let key in currentResourceMap) {
                  if (currentResourceMap[key] === outputPath && key !== resourcePath) {
                    outputPath = toPosix(path.join(packageRoot, mpx.getOutputPath(resourcePath, resourceType, { conflictPath: outputPath })))
                    warn && warn(new Error(`Current ${resourceType} [${resourcePath}] is registered with a conflict outputPath [${currentResourceMap[key]}] which is already existed in system, will be renamed with [${outputPath}], use ?resolve to get the real outputPath!`))
                    break
                  }
                }
                currentResourceMap[resourcePath] = outputPath
              }
            } else if (!currentResourceMap[resourcePath]) {
              currentResourceMap[resourcePath] = true
            }

            return {
              packageName,
              packageRoot,
              outputPath,
              alreadyOutputed
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

      const rawFactorizeModule = compilation.factorizeModule
      compilation.factorizeModule = (options, callback) => {
        const originModule = options.originModule
        let proxyedCallback = callback
        if (originModule) {
          proxyedCallback = (err, module) => {
            // 避免selfModuleFactory的情况
            if (module && module !== originModule) {
              module.issuerResource = originModule.resource
            }
            return callback(err, module)
          }
        }
        return rawFactorizeModule.call(compilation, options, proxyedCallback)
      }

      // 处理watch时缓存模块中的buildInfo
      // 在调用addModule前对module添加分包信息，以控制分包输出及消除缓存，该操作由afterResolve钩子迁移至此是由于dependencyCache的存在，watch状态下afterResolve钩子并不会对所有模块执行，而模块的packageName在watch过程中是可能发生变更的，如新增删除一个分包资源的主包引用
      const rawAddModule = compilation.addModule
      compilation.addModule = (module, callback) => {
        const issuerResource = module.issuerResource
        const currentPackageRoot = mpx.currentPackageRoot
        const independent = mpx.independentSubpackagesMap[currentPackageRoot]

        if (module.resource) {
          // NormalModule
          const isStatic = isStaticModule(module)

          let needPackageQuery = isStatic || independent

          if (!needPackageQuery) {
            const { resourcePath } = parseRequest(module.resource)
            needPackageQuery = matchCondition(resourcePath, this.options.subpackageModulesRules)
          }

          if (needPackageQuery) {
            const { packageRoot } = mpx.getPackageInfo({
              resource: module.resource,
              resourceType: isStatic ? 'staticResource' : 'subpackageModule',
              issuerResource,
              warn (e) {
                compilation.warnings.push(e)
              },
              error (e) {
                compilation.errors.push(e)
              }
            })
            if (packageRoot) {
              const queryObj = {
                packageRoot
              }
              if (independent) queryObj.independent = independent
              module.request = addQuery(module.request, queryObj)
              module.resource = addQuery(module.resource, queryObj)
            }
          }
        } else if (independent) {
          // ContextModule和RawModule只在独立分包的情况下添加分包标记，其余默认不添加
          const postfix = `|independent=${independent}|${currentPackageRoot}`
          if (module._identifier) {
            module._identifier += postfix
          } else if (module.identifierStr) {
            module.identifierStr += postfix
          }
        }
        return rawAddModule.call(compilation, module, callback)
      }

      const rawEmitAsset = compilation.emitAsset

      compilation.emitAsset = (file, source, assetInfo) => {
        if (assetInfo && assetInfo.skipEmit) return
        return rawEmitAsset.call(compilation, file, source, assetInfo)
      }

      compilation.hooks.succeedModule.tap('MpxWebpackPlugin', (module) => {
        // 静态资源模块由于输出结果的动态性，通过importModule会合并asset的特性，通过emitFile传递信息禁用父级extractor的缓存来保障父级的importModule每次都能被执行
        if (isStaticModule(module)) {
          emitFile(module, MPX_DISABLE_EXTRACTOR_CACHE, '', undefined, { skipEmit: true })
        }
      })

      compilation.hooks.finishModules.tap('MpxWebpackPlugin', (modules) => {
        // 自动跟进分包配置修改splitChunksPlugin配置
        if (splitChunksPlugin) {
          let needInit = false
          Object.keys(mpx.componentsMap).forEach((packageName) => {
            if (!splitChunksOptions.cacheGroups.hasOwnProperty(packageName)) {
              needInit = true
              splitChunksOptions.cacheGroups[packageName] = getPackageCacheGroup(packageName)
            }
          })
          if (needInit) {
            splitChunksPlugin.options = new SplitChunksPlugin(splitChunksOptions).options
          }
        }
      })

      JavascriptModulesPlugin.getCompilationHooks(compilation).renderModuleContent.tap('MpxWebpackPlugin', (source, module, renderContext) => {
        // 处理dll产生的external模块
        if (module.external && module.userRequest.startsWith('dll-reference ') && mpx.mode !== 'web') {
          const chunk = renderContext.chunk
          const request = module.request
          let relativePath = toPosix(path.relative(path.dirname(chunk.name), request))
          if (!/^\.\.?\//.test(relativePath)) relativePath = './' + relativePath
          if (chunk) {
            return new RawSource(`module.exports = require("${relativePath}");\n`)
          }
        }
        return source
      })

      JavascriptModulesPlugin.getCompilationHooks(compilation).renderStartup.tap('MpxWebpackPlugin', (source, module) => {
        if (module && mpx.exportModules.has(module)) {
          source = new ConcatSource(source)
          source.add('module.exports = __webpack_exports__;\n')
        }
        return source
      })

      compilation.hooks.moduleAsset.tap('MpxWebpackPlugin', (module, filename) => {
        const modules = mpx.assetModulesMap.get(filename) || new Set()
        modules.add(module)
        mpx.assetModulesMap.set(filename, modules)
      })

      compilation.hooks.beforeModuleAssets.tap('MpxWebpackPlugin', () => {
        const extractedAssetsMap = new Map()
        for (const module of compilation.modules) {
          const assetsInfo = module.buildInfo.assetsInfo || new Map()
          for (const [filename, { extractedInfo } = {}] of assetsInfo) {
            if (extractedInfo) {
              let extractedAssets = extractedAssetsMap.get(filename)
              if (!extractedAssets) {
                extractedAssets = []
                extractedAssetsMap.set(filename, extractedAssets)
              }
              extractedAssets.push(extractedInfo)
              compilation.hooks.moduleAsset.call(module, filename)
            }
          }
        }

        for (const [filename, extractedAssets] of extractedAssetsMap) {
          const sortedExtractedAssets = extractedAssets.sort((a, b) => a.index - b.index)
          const source = new ConcatSource()
          sortedExtractedAssets.forEach(({ content }) => {
            if (content) {
              // 处理replace path
              if (/"mpx_replace_path_.*?"/.test(content)) {
                content = content.replace(/"mpx_replace_path_(.*?)"/g, (matched, key) => {
                  return JSON.stringify(mpx.replacePathMap[key] || 'missing replace path')
                })
              }
              source.add(content)
            }
          })
          compilation.emitAsset(filename, source)
        }
      })

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

        parser.hooks.call.for('__mpx_dynamic_entry__').tap('MpxWebpackPlugin', (expr) => {
          const args = expr.arguments.map((i) => i.value)
          args.push(expr.range)
          const dep = new DynamicEntryDependency(...args)
          parser.state.current.addPresentationalDependency(dep)
          return true
        })

        const transHandler = (expr) => {
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
          if (!matchCondition(resourcePath, this.options.transMpxRules) || resourcePath.indexOf('@mpxjs') !== -1 || !target || mode === srcMode) {
            return
          }

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
          const arg1 = expr.arguments[1]
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
          if (/regenerator-runtime/.test(parser.state.module.resource)) {
            if (callee.name === 'Function' && arg0 && arg0.value === 'r' && arg1 && arg1.value === 'regeneratorRuntime = r') {
              current.addPresentationalDependency(new ReplaceDependency('(function () {})', expr.range))
            }
          }
        })

        if (mpx.srcMode !== mpx.mode) {
          // 全量替换未声明的wx identifier
          parser.hooks.expression.for('wx').tap('MpxWebpackPlugin', transHandler)

          // parser.hooks.evaluate.for('MemberExpression').tap('MpxWebpackPlugin', (expr) => {
          //   // Undeclared varible for wx[identifier]()
          //   // TODO Unable to handle wx[identifier]
          //   if (expr.object.name === 'wx' && !parser.scope.definitions.has('wx')) {
          //     transHandler(expr)
          //   }
          // })
          // // Trans for wx.xx, wx['xx'], wx.xx(), wx['xx']()
          // parser.hooks.expressionMemberChain.for('wx').tap('MpxWebpackPlugin', transHandler)
          // Proxy ctor for transMode
          if (!this.options.forceDisableProxyCtor) {
            parser.hooks.call.for('Page').tap('MpxWebpackPlugin', (expr) => {
              transHandler(expr.callee)
            })
            parser.hooks.call.for('Component').tap('MpxWebpackPlugin', (expr) => {
              transHandler(expr.callee)
            })
            parser.hooks.call.for('App').tap('MpxWebpackPlugin', (expr) => {
              transHandler(expr.callee)
            })
            if (mpx.mode === 'ali' || mpx.mode === 'web') {
              // 支付宝和web不支持Behaviors
              parser.hooks.call.for('Behavior').tap('MpxWebpackPlugin', (expr) => {
                transHandler(expr.callee)
              })
            }
          }
        }

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
          'delete: del',
          'setConvertRule',
          'getMixin',
          'getComputed',
          'implement'
        ].reduce((map, api) => {
          map[api] = true
          return map
        }, {})

        const handler = (expr) => {
          const callee = expr.callee
          const args = expr.arguments
          const name = callee.object.name
          const { queryObj, resourcePath } = parseRequest(parser.state.module.resource)
          const localSrcMode = queryObj.mode
          const globalSrcMode = mpx.srcMode
          const srcMode = localSrcMode || globalSrcMode

          if (srcMode === globalSrcMode || apiBlackListMap[callee.property.name || callee.property.value] || (name !== 'mpx' && name !== 'wx') || (name === 'wx' && !matchCondition(resourcePath, this.options.transMpxRules))) {
            return
          }

          const srcModeString = `__mpx_src_mode_${srcMode}__`
          const dep = new InjectDependency({
            content: args.length
              ? `, ${JSON.stringify(srcModeString)}`
              : JSON.stringify(srcModeString),
            index: expr.end - 1
          })
          parser.state.current.addPresentationalDependency(dep)
        }

        if (mpx.srcMode !== mpx.mode) {
          parser.hooks.callMemberChain.for('imported var').tap('MpxWebpackPlugin', handler)
          parser.hooks.callMemberChain.for('mpx').tap('MpxWebpackPlugin', handler)
          parser.hooks.callMemberChain.for('wx').tap('MpxWebpackPlugin', handler)
        }
      })

      // 为了正确生成sourceMap，将该步骤由原来的compile.hooks.emit迁移到compilation.hooks.processAssets
      compilation.hooks.processAssets.tap({
        name: 'MpxWebpackPlugin',
        stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, () => {
        if (mpx.mode === 'web') return

        const {
          globalObject,
          chunkLoadingGlobal
        } = compilation.outputOptions

        function getTargetFile (file) {
          let targetFile = file
          const queryStringIdx = targetFile.indexOf('?')
          if (queryStringIdx >= 0) {
            targetFile = targetFile.substr(0, queryStringIdx)
          }
          return targetFile
        }

        const processedChunk = new Set()
        const appName = mpx.appInfo.name

        function processChunk (chunk, isRuntime, relativeChunks) {
          const chunkFile = chunk.files.values().next().value
          if (!chunkFile || processedChunk.has(chunk)) {
            return
          }

          let originalSource = compilation.assets[chunkFile]
          const source = new ConcatSource()
          source.add(`\nvar ${globalObject} = ${globalObject} || {};\n\n`)

          relativeChunks.forEach((relativeChunk, index) => {
            const relativeChunkFile = relativeChunk.files.values().next().value
            if (!relativeChunkFile) return
            let chunkPath = getTargetFile(chunkFile)
            let relativePath = getTargetFile(relativeChunkFile)
            relativePath = path.relative(path.dirname(chunkPath), relativePath)
            relativePath = fixRelative(relativePath, mpx.mode)
            relativePath = toPosix(relativePath)
            if (index === 0) {
              // 引用runtime
              // 支付宝分包独立打包，通过全局context获取webpackJSONP
              if (mpx.mode === 'ali' && !mpx.isPluginMode) {
                if (chunk.name === appName) {
                  // 在rootChunk中挂载jsonpCallback
                  source.add('// process ali subpackages runtime in root chunk\n' +
                    'var context = (function() { return this })() || Function("return this")();\n\n')
                  source.add(`context[${JSON.stringify(chunkLoadingGlobal)}] = ${globalObject}[${JSON.stringify(chunkLoadingGlobal)}] = require("${relativePath}");\n`)
                } else {
                  // 其余chunk中通过context全局传递runtime
                  source.add('// process ali subpackages runtime in other chunk\n' +
                    'var context = (function() { return this })() || Function("return this")();\n\n')
                  source.add(`${globalObject}[${JSON.stringify(chunkLoadingGlobal)}] = context[${JSON.stringify(chunkLoadingGlobal)}];\n`)
                }
              } else {
                source.add(`${globalObject}[${JSON.stringify(chunkLoadingGlobal)}] = require("${relativePath}");\n`)
              }
            } else {
              source.add(`require("${relativePath}");\n`)
            }
          })

          if (isRuntime) {
            source.add('var context = (function() { return this })() || Function("return this")();\n')
            source.add(`
// Fix babel runtime in some quirky environment like ali & qq dev.
try {
  if(!context.console){
    context.console = console;
    context.setInterval = setInterval;
    context.setTimeout = setTimeout;
    context.JSON = JSON;
    context.Math = Math;
    context.Date = Date;
    context.RegExp = RegExp;
    context.Infinity = Infinity;
    context.isFinite = isFinite;
    context.parseFloat = parseFloat;
    context.parseInt = parseInt;
    context.Promise = Promise;
    context.WeakMap = WeakMap;
    context.RangeError = RangeError;
    context.TypeError = TypeError;
    context.Uint8Array = Uint8Array;
    context.DataView = DataView;
    context.ArrayBuffer = ArrayBuffer;
    context.Symbol = Symbol;
    context.Reflect = Reflect;
    context.Object = Object;
    context.Error = Error;
    context.Array = Array;
    context.Float32Array = Float32Array;
    context.Float64Array = Float64Array;
    context.Int16Array = Int16Array;
    context.Int32Array = Int32Array;
    context.Int8Array = Int8Array;
    context.Uint16Array = Uint16Array;
    context.Uint32Array = Uint32Array;
    context.Uint8ClampedArray = Uint8ClampedArray;
    context.String = String;
    context.Function = Function;
    context.SyntaxError = SyntaxError;
    context.decodeURIComponent = decodeURIComponent;
    context.encodeURIComponent = encodeURIComponent;
  }
} catch(e){
}\n`)
            source.add(originalSource)
            source.add(`\nmodule.exports = ${globalObject}[${JSON.stringify(chunkLoadingGlobal)}];\n`)
          } else {
            source.add(originalSource)
          }

          compilation.assets[chunkFile] = source
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
                if (loader.loader.includes(info[0])) {
                  loader.loader = info[1]
                }
                if (loader.loader.includes(info[1])) {
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
          const firstLoader = (loaders[0] && loaders[0].loader) || ''
          const isPitcherRequest = firstLoader.includes('vue-loader/lib/loaders/pitcher')
          let cssLoaderIndex = -1
          let vueStyleLoaderIndex = -1
          let mpxStyleLoaderIndex = -1
          loaders.forEach((loader, index) => {
            const currentLoader = loader.loader
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

    compiler.hooks.emit.tap('MpxWebpackPlugin', (compilation) => {
      if (this.options.generateBuildMap) {
        const pagesMap = compilation.__mpx__.pagesMap
        const componentsPackageMap = compilation.__mpx__.componentsMap
        const componentsMap = Object.keys(componentsPackageMap).map(item => componentsPackageMap[item]).reduce((pre, cur) => {
          return { ...pre, ...cur }
        }, {})
        const outputMap = JSON.stringify({ ...pagesMap, ...componentsMap })
        compilation.assets['../outputMap.json'] = {
          source: () => {
            return outputMap
          },
          size: () => {
            return Buffer.byteLength(outputMap, 'utf8')
          }
        }
      }
    })

    const clearFileCache = () => {
      const fs = compiler.intermediateFileSystem
      const cacheLocation = compiler.options.cache.cacheLocation
      return new Promise((resolve) => {
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
