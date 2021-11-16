'use strict'

const path = require('path')
const ConcatSource = require('webpack-sources').ConcatSource
const RawSource = require('webpack-sources').RawSource
const ResolveDependency = require('./dependency/ResolveDependency')
const InjectDependency = require('./dependency/InjectDependency')
const ReplaceDependency = require('./dependency/ReplaceDependency')
const ChildCompileDependency = require('./dependency/ChildCompileDependency')
const NullFactory = require('webpack/lib/NullFactory')
const normalize = require('./utils/normalize')
const toPosix = require('./utils/to-posix')
const addQuery = require('./utils/add-query')
const DefinePlugin = require('webpack/lib/DefinePlugin')
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin')
const AddModePlugin = require('./resolver/AddModePlugin')
const AddEnvPlugin = require('./resolver/AddEnvPlugin')
const PackageEntryPlugin = require('./resolver/PackageEntryPlugin')
const CommonJsRequireDependency = require('webpack/lib/dependencies/CommonJsRequireDependency')
const HarmonyImportSideEffectDependency = require('webpack/lib/dependencies/HarmonyImportSideEffectDependency')
const RequireHeaderDependency = require('webpack/lib/dependencies/RequireHeaderDependency')
const RemovedModuleDependency = require('./dependency/RemovedModuleDependency')
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin')
const fixRelative = require('./utils/fix-relative')
const parseRequest = require('./utils/parse-request')
const matchCondition = require('./utils/match-condition')
const { preProcessDefs } = require('./utils/index')
const hash = require('hash-sum')

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
      chunks: 'all'
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
      chunks: 'all'
    }
  }
}

let loaderOptions

const externalsMap = {
  weui: /^weui-miniprogram/
}

const warnings = []
const errors = []

class EntryNode {
  constructor (options) {
    this.request = options.request
    this.type = options.type
    this.module = null
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
    options.forceDisableInject = options.forceDisableInject || false
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
    options.nativeOptions = Object.assign({
      cssLangs: ['css', 'less', 'stylus', 'scss', 'sass']
    }, options.nativeOptions)
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
    this.options = options
  }

  static loader (options = {}) {
    loaderOptions = options
    if (loaderOptions.transRpx) {
      warnings.push('Mpx loader option [transRpx] is deprecated now, please use mpx webpack plugin config [transRpxRules] instead!')
    }
    return { loader: normalize.lib('loader'), options }
  }

  static pluginLoader (options = {}) {
    return { loader: normalize.lib('plugin-loader'), options }
  }

  static wxsPreLoader (options = {}) {
    return { loader: normalize.lib('wxs/wxs-pre-loader'), options }
  }

  static urlLoader (options = {}) {
    return { loader: normalize.lib('url-loader'), options }
  }

  static fileLoader (options = {}) {
    return { loader: normalize.lib('file-loader'), options }
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
      warnings.push(`webpack options: MpxWebpackPlugin strongly depends options.node.globel to be true, custom options.node will be ignored!`)
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
      compiler.options.optimization.runtimeChunk = {
        name: (entrypoint) => {
          for (let packageName in mpx.independentSubpackagesMap) {
            if (mpx.independentSubpackagesMap.hasOwnProperty(packageName) && isChunkInPackage(entrypoint.name, packageName)) {
              return `${packageName}/bundle`
            }
          }
          return 'bundle'
        }
      }
      splitChunksOptions = compiler.options.optimization.splitChunks
      delete compiler.options.optimization.splitChunks
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

    compiler.hooks.compilation.tap('MpxWebpackPlugin ', (compilation, { normalModuleFactory }) => {
      compilation.hooks.normalModuleLoader.tap('MpxWebpackPlugin', (loaderContext, module) => {
        // 设置loaderContext的minimize
        if (isProductionLikeMode(compiler.options)) {
          loaderContext.minimize = true
        }
      })
      compilation.dependencyFactories.set(ResolveDependency, new NullFactory())
      compilation.dependencyTemplates.set(ResolveDependency, new ResolveDependency.Template())

      compilation.dependencyFactories.set(InjectDependency, new NullFactory())
      compilation.dependencyTemplates.set(InjectDependency, new InjectDependency.Template())

      compilation.dependencyFactories.set(ReplaceDependency, new NullFactory())
      compilation.dependencyTemplates.set(ReplaceDependency, new ReplaceDependency.Template())

      compilation.dependencyFactories.set(ChildCompileDependency, new NullFactory())
      compilation.dependencyTemplates.set(ChildCompileDependency, new ChildCompileDependency.Template())

      compilation.dependencyFactories.set(RemovedModuleDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(RemovedModuleDependency, new RemovedModuleDependency.Template())

      // hack cacheGroup参数往addModule中传递当前module的issuer
      const rawAddModuleDependencies = compilation.addModuleDependencies
      compilation.addModuleDependencies = (
        module,
        dependencies,
        bail,
        cacheGroup,
        recursive,
        callback
      ) => {
        const hackedCacheGroup = {
          module,
          cacheGroup
        }
        return rawAddModuleDependencies.call(
          compilation,
          module,
          dependencies,
          bail,
          hackedCacheGroup,
          recursive,
          callback
        )
      }

      // 处理watch时缓存模块中的buildInfo
      // 在调用addModule前对module添加分包信息，以控制分包输出及消除缓存，该操作由afterResolve钩子迁移至此是由于dependencyCache的存在，watch状态下afterResolve钩子并不会对所有模块执行，而模块的packageName在watch过程中是可能发生变更的，如新增删除一个分包资源的主包引用
      const rawAddModule = compilation.addModule
      compilation.addModule = (module, cacheGroup) => {
        let issuerResource
        if (cacheGroup && cacheGroup.module) {
          issuerResource = cacheGroup.module.resource
          cacheGroup = cacheGroup.cacheGroup
        }
        // 避免context module报错
        if (module.request && module.resource) {
          const { queryObj, resourcePath } = parseRequest(module.resource)
          let isStatic = queryObj.isStatic
          if (module.loaders) {
            module.loaders.forEach((loader) => {
              if (/(url-loader|file-loader)/.test(loader.loader)) {
                isStatic = true
              }
            })
          }
          const isIndependent = mpx.independentSubpackagesMap[mpx.currentPackageRoot]

          let needPackageQuery = isStatic || isIndependent
          if (!needPackageQuery && matchCondition(resourcePath, this.options.subpackageModulesRules)) {
            needPackageQuery = true
          }

          if (needPackageQuery) {
            const { packageRoot } = mpx.getPackageInfo({
              resource: module.resource,
              resourceType: isStatic ? 'staticResources' : 'subpackageModules',
              issuerResource,
              warn (e) {
                compilation.warnings.push(e)
              },
              error (e) {
                compilation.errors.push(e)
              }
            })
            if (packageRoot) {
              module.request = addQuery(module.request, { packageRoot })
              module.resource = addQuery(module.resource, { packageRoot })
            }
          }
        }

        const addModuleResult = rawAddModule.call(compilation, module, cacheGroup)
        if (!addModuleResult.build && addModuleResult.issuer) {
          const buildInfo = addModuleResult.module.buildInfo
          if (buildInfo.pagesMap) {
            Object.assign(mpx.pagesMap, buildInfo.pagesMap)
          }
          if (buildInfo.componentsMap && buildInfo.packageName) {
            Object.assign(mpx.componentsMap[buildInfo.packageName], buildInfo.componentsMap)
          }
        }
        return addModuleResult
      }
    })

    compiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation, { normalModuleFactory }) => {
      compilation.warnings = compilation.warnings.concat(warnings)
      compilation.errors = compilation.errors.concat(errors)
      // additionalAssets和mpx由于包含缓存机制，必须在每次compilation时重新初始化
      const additionalAssets = {}
      if (!compilation.__mpx__) {
        // init mpx
        mpx = compilation.__mpx__ = {
          // pages全局记录，无需区分主包分包
          pagesMap: {},
          // 记录pages对应的entry，处理多appEntry输出web多页项目时可能出现的pagePath冲突的问题，多appEntry输出目前仅web模式支持
          pagesEntryMap: {},
          // 组件资源记录，依照所属包进行记录，冗余存储，只要某个包有引用会添加对应记录，不管其会不会在当前包输出，这样设计主要是为了在resolve时能够以较低成本找到特定资源的输出路径
          componentsMap: {
            main: {}
          },
          // 静态资源(图片，字体，独立样式)等，依照所属包进行记录，冗余存储，同上
          staticResourcesMap: {
            main: {}
          },
          // 用于记录命中subpackageModulesRules的js模块最终输出到了什么分包中
          subpackageModulesMap: {
            main: {}
          },
          // 记录独立分包
          independentSubpackagesMap: {},
          // 当前机制下分包处理队列在app.json的json-compiler中进行，由于addEntry回调特性，无法保障app.js中引用的模块都被标记为主包，故重写processModuleDependencies获取app.js及其所有依赖处理完成的时机，在这之后再执行分包处理队列
          appScriptRawRequest: '',
          appScriptPromise: null,
          // 记录entry依赖关系，用于体积分析
          entryNodesMap: {},
          // 记录entryModule与entryNode的对应关系，用于体积分析
          entryModulesMap: new Map(),
          loaderOptions,
          extractedMap: {},
          usingComponents: {},
          hasApp: false,
          // todo es6 map读写性能高于object，之后会逐步替换
          vueContentCache: new Map(),
          currentPackageRoot: '',
          wxsMap: {},
          wxsContentMap: {},
          assetsInfo: new Map(),
          forceDisableInject: this.options.forceDisableInject,
          forceUsePageCtor: this.options.forceUsePageCtor,
          resolveMode: this.options.resolveMode,
          mode: this.options.mode,
          srcMode: this.options.srcMode,
          env: this.options.env,
          // deprecated option
          globalMpxAttrsFilter: this.options.globalMpxAttrsFilter,
          externalClasses: this.options.externalClasses,
          projectRoot: this.options.projectRoot,
          autoScopeRules: this.options.autoScopeRules,
          autoVirtualHostRules: this.options.autoVirtualHostRules,
          transRpxRules: this.options.transRpxRules,
          postcssInlineConfig: this.options.postcssInlineConfig,
          decodeHTMLText: this.options.decodeHTMLText,
          // native文件专用相关配置
          nativeOptions: this.options.nativeOptions,
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
          getEntryNode: (request, type, module) => {
            const entryNodesMap = mpx.entryNodesMap
            const entryModulesMap = mpx.entryModulesMap
            if (!entryNodesMap[request]) {
              entryNodesMap[request] = new EntryNode({
                type,
                request
              })
            }
            const currentEntry = entryNodesMap[request]
            if (currentEntry.type !== type) {
              compilation.errors.push(`获取request为${request}的entryNode时类型与已有节点冲突, 当前获取的type为${type}, 已有节点的type为${currentEntry.type}!`)
            }
            if (module) {
              currentEntry.module = module
              entryModulesMap.set(module, currentEntry)
            }
            return currentEntry
          },
          pathHash: (resourcePath) => {
            let hashPath = resourcePath
            const pathHashMode = this.options.pathHashMode
            const projectRoot = this.options.projectRoot || ''
            if (pathHashMode === 'relative') {
              hashPath = path.relative(projectRoot, resourcePath)
            }
            if (typeof pathHashMode === 'function') {
              hashPath = pathHashMode(resourcePath, projectRoot) || resourcePath
            }
            return hash(hashPath)
          },
          getOutputPath: (resourcePath, type, { ext = '', conflictPath = '' }) => {
            const name = path.parse(resourcePath).name
            const hash = mpx.pathHash(resourcePath)
            const customOutputPath = this.options.customOutputPath
            if (conflictPath) return conflictPath.replace(/(\.[^\\/]+)?$/, match => hash + match)
            if (typeof customOutputPath === 'function') return customOutputPath(type, name, hash, ext)
            if (type === 'component' || type === 'page') return path.join(type + 's', name + hash, 'index' + ext)
            return path.join(type, name + hash + ext)
          },
          extract: (content, file, index, sideEffects) => {
            index = index === -1 ? 0 : index
            additionalAssets[file] = additionalAssets[file] || []
            if (!additionalAssets[file][index]) {
              additionalAssets[file][index] = content
            }
            sideEffects && sideEffects.forEach((sideEffect) => {
              sideEffect(additionalAssets)
            })
          },
          // 组件和静态资源的输出规则如下：
          // 1. 主包引用的资源输出至主包
          // 2. 分包引用且主包引用过的资源输出至主包，不在当前分包重复输出
          // 3. 分包引用且无其他包引用的资源输出至当前分包
          // 4. 分包引用且其他分包也引用过的资源，重复输出至当前分包
          getPackageInfo: ({ resource, outputPath, resourceType = 'components', issuerResource, warn }) => {
            let packageRoot = ''
            let packageName = 'main'
            const resourceMap = mpx[`${resourceType}Map`]
            const { queryObj, resourcePath } = parseRequest(resource)
            if (resourceType === 'staticResources' && outputPath) {
              packageRoot = queryObj.packageRoot || ''
              packageName = packageRoot || 'main'
            } else {
              const currentPackageRoot = mpx.currentPackageRoot
              const currentPackageName = currentPackageRoot || 'main'
              const isIndependent = mpx.independentSubpackagesMap[currentPackageRoot]
              // 主包中有引用一律使用主包中资源，不再额外输出
              // 资源路径匹配到forceMainPackageRules规则时强制输出到主包，降低分包资源冗余
              // 如果存在issuer且issuerPackageRoot与当前packageRoot不一致，也输出到主包
              let isMain = resourceMap.main[resourcePath] || matchCondition(resourcePath, this.options.forceMainPackageRules)
              if (issuerResource) {
                const { queryObj } = parseRequest(issuerResource)
                const issuerPackageRoot = queryObj.packageRoot || ''
                if (issuerPackageRoot !== currentPackageRoot) {
                  warn && warn(new Error(`当前模块[${resource}]的引用者[${issuerResource}]不带有分包标记或分包标记与当前分包不符，模块资源将被输出到主包，可以尝试将引用者加入到subpackageModulesRules来解决这个问题！`))
                  isMain = true
                }
              }
              // todo forceMainPackageRules规则目前只能处理当前资源，不能处理资源子树，配置不当有可能会导致资源引用错误
              if (!isMain || isIndependent) {
                packageRoot = currentPackageRoot
                packageName = currentPackageName
                if (this.options.auditResource && resourceType !== 'subpackageModules' && !isIndependent) {
                  if (this.options.auditResource !== 'component' || resourceType === 'components') {
                    Object.keys(resourceMap).filter(key => key !== 'main').forEach((key) => {
                      if (resourceMap[key][resourcePath] && key !== packageName) {
                        warn && warn(new Error(`当前${resourceType === 'components' ? '组件' : '静态'}资源${resourcePath}在分包${key}和分包${packageName}中都有引用，会分别输出到两个分包中，为了总体积最优，可以在主包中建立引用声明以消除资源输出冗余！`))
                      }
                    })
                  }
                }
              }
            }

            resourceMap[packageName] = resourceMap[packageName] || {}
            const currentResourceMap = resourceMap[packageName]

            let alreadyOutputed = false
            if (outputPath) {
              outputPath = toPosix(path.join(packageRoot, outputPath))
              // 如果之前已经进行过输出，则不需要重复进行
              if (currentResourceMap[resourcePath] === outputPath) {
                alreadyOutputed = true
              } else {
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
        let proxyedCallback = callback
        if (module.rawRequest === mpx.appScriptRawRequest) {
          // 避免模块request重名，只对第一次匹配到的模块进行代理
          mpx.appScriptRawRequest = ''
          mpx.appScriptPromise = new Promise((resolve) => {
            proxyedCallback = (err) => {
              resolve()
              return callback(err)
            }
          })
        }
        return rawProcessModuleDependencies.apply(compilation, [module, proxyedCallback])
      }

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
            splitChunksPlugin.options = SplitChunksPlugin.normalizeOptions(splitChunksOptions)
          }
        }
      })

      compilation.hooks.optimizeModules.tap('MpxWebpackPlugin', (modules) => {
        modules.forEach((module) => {
          if (module.needRemove) {
            let removed = false
            module.reasons.forEach((reason) => {
              if (reason.module) {
                if (reason.dependency instanceof HarmonyImportSideEffectDependency) {
                  reason.module.removeDependency(reason.dependency)
                  reason.module.addDependency(new RemovedModuleDependency(reason.dependency.request, module))
                  removed = true
                } else if (reason.dependency instanceof CommonJsRequireDependency && reason.dependency.loc.range) {
                  let index = reason.module.dependencies.indexOf(reason.dependency)
                  if (index > -1 && reason.module.dependencies[index + 1] instanceof RequireHeaderDependency) {
                    reason.module.dependencies.splice(index, 2)
                    reason.module.addDependency(new RemovedModuleDependency(reason.dependency.request, module, reason.dependency.loc.range))
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

      compilation.moduleTemplates.javascript.hooks.content.tap('MpxWebpackPlugin', (source, module, options) => {
        // 处理dll产生的external模块
        if (module.external && module.userRequest.startsWith('dll-reference ') && mpx.mode !== 'web') {
          const chunk = options.chunk
          const request = module.request
          let relativePath = toPosix(path.relative(path.dirname(chunk.name), request))
          if (!/^\.\.?\//.test(relativePath)) relativePath = './' + relativePath
          if (chunk) {
            return new RawSource(`module.exports = require("${relativePath}");\n`)
          }
        }
        return source
      })

      compilation.hooks.additionalAssets.tapAsync('MpxWebpackPlugin', (callback) => {
        for (let file in additionalAssets) {
          let content = new ConcatSource()
          if (additionalAssets[file].prefix) {
            additionalAssets[file].prefix.forEach((item) => {
              if (item) content.add(item)
            })
          }
          additionalAssets[file].forEach((item) => {
            if (item) content.add(item)
          })
          const modules = (additionalAssets[file].modules || []).concat(additionalAssets[file].relativeModules || [])

          if (modules.length > 1) {
            // 同步relativeModules和modules之间的依赖
            const fileDependencies = new Set()
            const contextDependencies = new Set()

            modules.forEach((module) => {
              module.buildInfo.fileDependencies.forEach((fileDependency) => {
                fileDependencies.add(fileDependency)
              })
              module.buildInfo.contextDependencies.forEach((contextDependency) => {
                contextDependencies.add(contextDependency)
              })
              module.buildInfo.fileDependencies = fileDependencies
              module.buildInfo.contextDependencies = contextDependencies
            })
          }
          compilation.emitAsset(file, content, { modules: additionalAssets[file].modules })
        }
        // 所有编译的静态资源assetsInfo合入主编译
        mpx.assetsInfo.forEach((assetInfo, name) => {
          const oldAssetInfo = compilation.assetsInfo.get(name)
          if (oldAssetInfo && oldAssetInfo.modules) {
            assetInfo.modules = assetInfo.modules.concat(oldAssetInfo.modules)
          }
          compilation.assetsInfo.set(name, assetInfo)
        })
        // 链接主编译模块与子编译入口
        Object.values(mpx.wxsMap).concat(Object.values(mpx.extractedMap)).forEach((item) => {
          item.modules.forEach((module) => {
            module.addDependency(item.dep)
          })
        })

        callback()
      })

      normalModuleFactory.hooks.parser.for('javascript/auto').tap('MpxWebpackPlugin', (parser) => {
        // hack预处理，将expr.range写入loc中便于在CommonJsRequireDependency中获取，移除无效require
        parser.hooks.call.for('require').tap({ name: 'MpxWebpackPlugin', stage: -100 }, (expr) => {
          expr.loc.range = expr.range
        })

        parser.hooks.call.for('__mpx_resolve_path__').tap('MpxWebpackPlugin', (expr) => {
          if (expr.arguments[0]) {
            const resource = expr.arguments[0].value
            const { queryObj } = parseRequest(resource)
            const packageName = queryObj.packageRoot || 'main'
            const pagesMap = mpx.pagesMap
            const componentsMap = mpx.componentsMap
            const staticResourcesMap = mpx.staticResourcesMap
            const range = expr.range
            const issuerResource = parser.state.module.issuer.resource
            const dep = new ResolveDependency(resource, packageName, pagesMap, componentsMap, staticResourcesMap, publicPath, range, issuerResource, compilation)
            parser.state.current.addDependency(dep)
            return true
          }
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
          const replaceContent = type === 'wx' ? '__webpack_require__.n(mpx)()' : `__webpack_require__.n(createFactory)()(${JSON.stringify(type)})`

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
            module.addVariable(name, expression, deps)
          }
        }
        // hack babel polyfill global
        parser.hooks.statementIf.tap('MpxWebpackPlugin', (expr) => {
          if (/core-js.+microtask/.test(parser.state.module.resource)) {
            if (expr.test.left && (expr.test.left.name === 'Observer' || expr.test.left.name === 'MutationObserver')) {
              const current = parser.state.current
              current.addDependency(new InjectDependency({
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
              current.addDependency(new InjectDependency({
                content: '(function() { return this })() || ',
                index: expr.range[0]
              }))
            }
          }
          if (/regenerator-runtime/.test(parser.state.module.resource)) {
            if (callee.name === 'Function' && arg0 && arg0.value === 'r' && arg1 && arg1.value === 'regeneratorRuntime = r') {
              current.addDependency(new ReplaceDependency('(function () {})', expr.range))
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
          // parser.hooks.expressionAnyMember.for('wx').tap('MpxWebpackPlugin', transHandler)
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
          parser.state.current.addDependency(dep)
        }

        if (mpx.srcMode !== mpx.mode) {
          parser.hooks.callAnyMember.for('imported var').tap('MpxWebpackPlugin', handler)
          parser.hooks.callAnyMember.for('mpx').tap('MpxWebpackPlugin', handler)
          parser.hooks.callAnyMember.for('wx').tap('MpxWebpackPlugin', handler)
        }
      })

      // 为了正确生成sourceMap，将该步骤由原来的compile.hooks.emit迁移到compilation.hooks.optimizeChunkAssets中来
      compilation.hooks.optimizeChunkAssets.tapAsync('MpxWebpackPlugin', (chunks, callback) => {
        if (mpx.mode === 'web') return callback()
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
              if (mpx.mode === 'ali' && !mpx.isPluginMode) {
                if (chunk.name === rootName) {
                  // 在rootChunk中挂载jsonpFunction
                  source.add('// process ali subpackages runtime in root chunk\n' +
                    'var context = (function() { return this })() || Function("return this")();\n\n')
                  source.add(`context[${JSON.stringify(jsonpFunction)}] = window[${JSON.stringify(jsonpFunction)}] = require("${relativePath}");\n`)
                } else {
                  // 其余chunk中通过context全局传递runtime
                  source.add('// process ali subpackages runtime in other chunk\n' +
                    'var context = (function() { return this })() || Function("return this")();\n\n')
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
            source.add(`\nmodule.exports = window[${JSON.stringify(jsonpFunction)}];\n`)
          } else {
            if (mpx.pluginMainModule && chunk.entryModule && mpx.pluginMainModule === chunk.entryModule) {
              source.add('module.exports =\n')
              // mpx.miniToPluginExports is a Set
            } else if (mpx.miniToPluginModules && chunk.entryModule && mpx.miniToPluginModules.has(chunk.entryModule)) {
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
    })

    compiler.hooks.normalModuleFactory.tap('MpxWebpackPlugin', (normalModuleFactory) => {
      // resolve前修改原始request
      normalModuleFactory.hooks.beforeResolve.tapAsync('MpxWebpackPlugin', (data, callback) => {
        let request = data.request
        let { queryObj, resource } = parseRequest(request)
        if (queryObj.resolve) {
          // 此处的query用于将资源引用的当前包信息传递给resolveDependency
          const pathLoader = normalize.lib('path-loader')
          resource = addQuery(resource, {
            packageRoot: mpx.currentPackageRoot
          })
          data.request = `!!${pathLoader}!${resource}`
        } else if (queryObj.wxsModule) {
          const wxsPreLoader = normalize.lib('wxs/wxs-pre-loader')
          if (!/wxs-loader/.test(request)) {
            data.request = `!!${wxsPreLoader}!${resource}`
          }
        }
        callback(null, data)
      })

      // resolve完成后修改loaders信息并批量添加mode query
      normalModuleFactory.hooks.afterResolve.tapAsync('MpxWebpackPlugin', (data, callback) => {
        if (data.loaders) {
          const { queryObj } = parseRequest(data.request)
          const mpxStyleOptions = queryObj.mpxStyleOptions
          const firstLoader = (data.loaders[0] && data.loaders[0].loader) || ''
          const isPitcherRequest = firstLoader.includes('vue-loader/lib/loaders/pitcher.js')
          let cssLoaderIndex = -1
          let vueStyleLoaderIndex = -1
          let mpxStyleLoaderIndex = -1
          data.loaders.forEach((loader, index) => {
            const currentLoader = loader.loader
            if (currentLoader.includes('ts-loader')) {
              // todo 暂时固定写死options，待后续优化为复用rules后修正
              loader.options = { appendTsSuffixTo: [/\.(mpx|vue)$/] }
            }
            if (currentLoader.includes('css-loader')) {
              cssLoaderIndex = index
            } else if (currentLoader.includes('vue-loader/lib/loaders/stylePostLoader.js')) {
              vueStyleLoaderIndex = index
            } else if (currentLoader.includes('@mpxjs/webpack-plugin/lib/style-compiler/index.js')) {
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
              data.loaders.splice(loaderIndex + 1, 0, {
                loader: normalize.lib('style-compiler/index.js'),
                options: (mpxStyleOptions && JSON.parse(mpxStyleOptions)) || {}
              })
            }
          }
        }
        // 根据用户传入的modeRules对特定资源添加mode query
        this.runModeRules(data)
        callback(null, data)
      })
    })

    compiler.hooks.emit.tapAsync('MpxWebpackPlugin', (compilation, callback) => {
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
      callback()
    })
  }
}

module.exports = MpxWebpackPlugin
