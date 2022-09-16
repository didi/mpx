/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'

import ResolveDependency from '@mpxjs/webpack-plugin/lib/dependencies/ResolveDependency'
import InjectDependency from '@mpxjs/webpack-plugin/lib/dependencies/InjectDependency'
import CommonJsVariableDependency from '@mpxjs/webpack-plugin/lib/dependencies/CommonJsVariableDependency'
import ReplaceDependency from '@mpxjs/webpack-plugin/lib/dependencies/ReplaceDependency'
import RecordResourceMapDependency from '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency'
import NullFactory from 'webpack/lib/NullFactory'
import harmonySpecifierTag from 'webpack/lib/dependencies/HarmonyImportDependencyParserPlugin'
import FlagEntryExportAsUsedPlugin from 'webpack/lib/FlagEntryExportAsUsedPlugin'
import FileSystemInfo from 'webpack/lib/FileSystemInfo'
import toPosix from '@mpxjs/utils/to-posix'
import addQuery from '@mpxjs/utils/add-query'
import AddModePlugin from './resolver/AddModePlugin'
import AddEnvPlugin from './resolver/AddEnvPlugin'
import parseRequest from '@mpxjs/utils/parse-request'
import { matchCondition } from '@mpxjs/utils/match-condition'
import stringifyLoadersAndResource from '@mpxjs/utils/stringify-loaders-resource'
import async from 'async'
import { processOptions, Options } from '../options'
import { mpx, createMpx } from '../mpx'
import { NormalModule, DefinePlugin, ExternalsPlugin, Compiler, Dependency, Module } from 'webpack'

const styleCompilerPath = '@mpxjs/loaders/dist/style-loader.js'
const isProductionLikeMode = (options: any) => {
  return options.mode === 'production' || !options.mode
}
const warnings = [] as any[]
const errors = [] as any[]

class MpxWebpackPlugin {
  options: Options

  constructor(options: Options) {
    options = options || {}
    this.options = processOptions(options)
    // Hack for buildDependencies
    const rawResolveBuildDependencies =
    FileSystemInfo.prototype.resolveBuildDependencies
    FileSystemInfo.prototype.resolveBuildDependencies = function (
      context: string,
      deps: any,
      rawCallback: (err: string, result: string) => void
    ) {
      return rawResolveBuildDependencies.call(
        this,
        context,
        deps,
        (err: string, result:string) => {
          if (
            result &&
            typeof options.hackResolveBuildDependencies === 'function'
          )
            options.hackResolveBuildDependencies(result)
          return rawCallback(err, result)
        }
      )
    }
  }

  static loader(options: {[k: string]: any}) {
    if (options.transRpx) {
      warnings.push(
        'Mpx loader option [transRpx] is deprecated now, please use mpx webpack plugin config [transRpxRules] instead!'
      )
    }
    return {
      loader: '@mpxjs/web-plugin/dist/webpack/loader/web-loader',
      options
    }
  }
  static wxsPreLoader(options = {}) {
    return {
      loader: '@mpxjs/loaders/dist/pre-loader',
      options
    }
  }

  static urlLoader(options = {}) {
    return {
      loader: '@mpxjs/loaders/dist/url-loader',
      options
    }
  }

  static fileLoader(options = {}) {
    return {
      loader: '@mpxjs/loaders/dist/file-loader',
      options
    }
  }

  runModeRules(data: {[k: string]: any}) {
    const { resourcePath, queryObj } = parseRequest(data.resource)
    if (queryObj.mode) {
      return
    }
    const mode = this.options.mode
    const modeRule = this.options?.modeRules?.mode
    if (!modeRule) {
      return
    }
    if (matchCondition(resourcePath, modeRule)) {
      data.resource = addQuery(data.resource, { mode })
      data.request = addQuery(data.request, { mode })
    }
  }

  apply(compiler: {[k: string]: any} & Compiler ) {
    if (!compiler.__mpx__) {
      compiler.__mpx__ = true
    } else {
      errors.push(
        'Multiple MpxWebpackPlugin instances exist in webpack compiler, please check webpack plugins config!'
      )
    }

    // 将entry export标记为used且不可mangle，避免require.async生成的js chunk在生产环境下报错
    new FlagEntryExportAsUsedPlugin(true, 'entry').apply(compiler)
    if (!compiler.options.node || !compiler.options.node.global) {
      compiler.options.node = compiler.options.node || {}
      compiler.options.node.global = true
    }

    const addModePlugin = new AddModePlugin(
      'before-file',
      this.options.mode || 'web',
      this.options.fileConditionRules,
      'file'
    )
    const addEnvPlugin = new AddEnvPlugin(
      'before-file',
      this.options.env || '',
      this.options.fileConditionRules,
      'file'
    )
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
      compiler.outputFileSystem.writeFile = (filePath: string, content: any, callback: () => any) => {
        const lastContent = writedFileContentMap.get(filePath)
        if (
          Buffer.isBuffer(lastContent)
            ? lastContent.equals(content)
            : lastContent === content
        ) {
          return callback()
        }
        writedFileContentMap.set(filePath, content)
        originalWriteFile(filePath, content, callback)
        return ''
      }
    }

    const defs = this.options.defs || {}

    const defsOpt: {[k: string]: any} = {}

    Object.keys(defs).forEach(key => {
      defsOpt[key] = JSON.stringify(defs[key])
    })

    // define mode & defs
    new DefinePlugin(defsOpt).apply(compiler)

    new ExternalsPlugin('commonjs2', this.options.externals || []).apply(compiler)

    compiler.hooks.compilation.tap(
      'MpxWebpackPlugin ',
      (compilation, { normalModuleFactory }) => {
        NormalModule.getCompilationHooks(compilation).loader.tap(
          'MpxWebpackPlugin',
          (loaderContext: any) => {
            // 设置loaderContext的minimize
            if (isProductionLikeMode(compiler.options)) {
              mpx.minimize = true
            }
            loaderContext.getMpx = () => {
              return mpx
            }
          }
        )
        compilation.dependencyFactories.set(
          <DepConstructor>ResolveDependency,
          <ModuleFactory>new NullFactory()
        )
        compilation.dependencyTemplates.set(
          <DepConstructor>ResolveDependency,
          <DependencyTemplate>new ResolveDependency.Template()
        )

        compilation.dependencyFactories.set(
          <DepConstructor>InjectDependency,
          <ModuleFactory>new NullFactory()
        )
        compilation.dependencyTemplates.set(
          <DepConstructor>InjectDependency,
          <DependencyTemplate>new InjectDependency.Template()
        )

        compilation.dependencyFactories.set(
          <DepConstructor>ReplaceDependency,
          <ModuleFactory>new NullFactory()
        )
        compilation.dependencyTemplates.set(
          <DepConstructor>ReplaceDependency,
          <DependencyTemplate>new ReplaceDependency.Template()
        )
        compilation.dependencyFactories.set(
          <DepConstructor>CommonJsVariableDependency,
          normalModuleFactory
        )
        compilation.dependencyTemplates.set(
          <DepConstructor>CommonJsVariableDependency,
          <DependencyTemplate>new CommonJsVariableDependency.Template()
        )
        compilation.dependencyFactories.set(
          <DepConstructor>RecordResourceMapDependency,
          <ModuleFactory>new NullFactory()
        )
        compilation.dependencyTemplates.set(
          <DepConstructor>RecordResourceMapDependency,
          <DependencyTemplate>new RecordResourceMapDependency.Template()
        )
      }
    )

    compiler.hooks.thisCompilation.tap(
      'MpxWebpackPlugin',
      (compilation, { normalModuleFactory }) => {
        compilation.warnings = compilation.warnings.concat(warnings)
        compilation.errors = compilation.errors.concat(errors)
        const moduleGraph = compilation.moduleGraph
        if (!compilation.__mpx__) {
          compilation.__mpx__ = createMpx(this.options)
        }
        const rawProcessModuleDependencies =
          compilation.processModuleDependencies
        compilation.processModuleDependencies = (module, callback) => {
          const presentationalDependencies =
            module.presentationalDependencies || []
          async.forEach(
            presentationalDependencies.filter((dep: Dependency & {[k: string]: any}) => dep.mpxAction),
            (dep: Dependency & {[k: string]: any}, callback) => {
              dep.mpxAction(module, compilation, callback)
            },
            err => {
              rawProcessModuleDependencies.call(
                compilation,
                module,
                innerErr => {
                  const cbError: any = err || innerErr
                  return callback(cbError)
                }
              )
            }
          )
        }
        normalModuleFactory.hooks.parser
          .for('javascript/auto')
          .tap('MpxWebpackPlugin', (parser: any) => {
            parser.hooks.call
              .for('__mpx_resolve_path__')
              .tap('MpxWebpackPlugin', (expr: Record<string, any>) => {
                if (expr.arguments[0]) {
                  const resource = expr.arguments[0].value
                  const packageName = mpx.currentPackageRoot || 'main'
                  const module: Module = parser.state.module
                  const moduleGraphReturn = moduleGraph.getIssuer(module) as Module & {resource: any}
                  const resource1: string = moduleGraphReturn.resource
                  const issuerResource = resource1
                  const range = expr.range
                  const dep = new ResolveDependency(
                    resource,
                    packageName,
                    issuerResource,
                    range
                  )
                  parser.state.current.addPresentationalDependency(dep)
                  return true
                }
              })
            // hack babel polyfill global
            parser.hooks.statementIf.tap('MpxWebpackPlugin', (expr: any) => {
              if (/core-js.+microtask/.test(parser.state.module.resource)) {
                if (
                  expr.test.left &&
                  (expr.test.left.name === 'Observer' ||
                    expr.test.left.name === 'MutationObserver')
                ) {
                  const current = parser.state.current
                  current.addPresentationalDependency(
                    new InjectDependency({
                      content: 'document && ',
                      index: expr.test.range[0]
                    })
                  )
                }
              }
            })

            parser.hooks.evaluate
              .for('CallExpression')
              .tap('MpxWebpackPlugin', (expr: any) => {
                const current = parser.state.current
                const arg0 = expr.arguments[0]
                const callee = expr.callee
                // todo 该逻辑在corejs3中不需要，等corejs3比较普及之后可以干掉
                if (/core-js.+global/.test(parser.state.module.resource)) {
                  if (
                    callee.name === 'Function' &&
                    arg0 &&
                    arg0.value === 'return this'
                  ) {
                    current.addPresentationalDependency(
                      new InjectDependency({
                        content: '(function() { return this })() || ',
                        index: expr.range[0]
                      })
                    )
                  }
                }
              })

            // 处理跨平台转换
            if (mpx.srcMode !== mpx.mode) {
              // 处理跨平台全局对象转换
              const transGlobalObject = (expr: any) => {
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

                if (
                  !matchCondition(resourcePath, this.options.transMpxRules) ||
                  resourcePath.indexOf('@mpxjs') !== -1 ||
                  !target ||
                  mode === srcMode
                )
                  return

                const type = target.name
                const name = type === 'wx' ? 'mpx' : 'createFactory'
                const replaceContent =
                  type === 'wx'
                    ? 'mpx'
                    : `createFactory(${JSON.stringify(type)})`

                const dep = new ReplaceDependency(replaceContent, target.range)
                current.addPresentationalDependency(dep)

                let needInject = true
                for (const dep of module.dependencies) {
                  if (
                    dep instanceof CommonJsVariableDependency &&
                    dep.name === name
                  ) {
                    needInject = false
                    break
                  }
                }
                if (needInject) {
                  const dep = new CommonJsVariableDependency(
                    `@mpxjs/core/src/runtime/${name}`,
                    name
                  )
                  module.addDependency(dep)
                }
              }

              // 转换wx全局对象
              parser.hooks.expression
                .for('wx')
                .tap('MpxWebpackPlugin', transGlobalObject)
              // Proxy ctor for transMode
              if (!this.options.forceDisableProxyCtor) {
                parser.hooks.call.for('Page').tap('MpxWebpackPlugin', (expr: any) => {
                  transGlobalObject(expr.callee)
                })
                parser.hooks.call
                  .for('Component')
                  .tap('MpxWebpackPlugin', (expr: any) => {
                    transGlobalObject(expr.callee)
                  })
                parser.hooks.call.for('App').tap('MpxWebpackPlugin', (expr: any) => {
                  transGlobalObject(expr.callee)
                })
                parser.hooks.call
                  .for('Behavior')
                  .tap('MpxWebpackPlugin', (expr: any) => {
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
              ].reduce((map: Record<string, any>, api: string) => {
                map[api] = true
                return map
              }, {})

              const injectSrcModeForTransApi = (expr: any, members: Array<any>) => {
                // members为空数组时，callee并不是memberExpression
                if (!members.length) return
                const callee = expr.callee
                const args = expr.arguments
                const name = callee.object.name
                const { queryObj, resourcePath } = parseRequest(
                  parser.state.module.resource
                )
                const localSrcMode = queryObj.mode
                const globalSrcMode = mpx.srcMode
                const srcMode = localSrcMode || globalSrcMode

                if (
                  srcMode === globalSrcMode ||
                  apiBlackListMap[
                    callee.property.name || callee.property.value
                  ] ||
                  (name !== 'mpx' && name !== 'wx') ||
                  (name === 'wx' &&
                    !matchCondition(resourcePath, this.options.transMpxRules))
                )
                  return

                const srcModeString = `__mpx_src_mode_${srcMode}__`
                const dep = new InjectDependency({
                  content: args.length
                    ? `, ${JSON.stringify(srcModeString)}`
                    : JSON.stringify(srcModeString),
                  index: expr.end - 1
                })
                parser.state.current.addPresentationalDependency(dep)
              }

              parser.hooks.callMemberChain
                .for(harmonySpecifierTag)
                .tap('MpxWebpackPlugin', injectSrcModeForTransApi)
              parser.hooks.callMemberChain
                .for('mpx')
                .tap('MpxWebpackPlugin', injectSrcModeForTransApi)
              parser.hooks.callMemberChain
                .for('wx')
                .tap('MpxWebpackPlugin', injectSrcModeForTransApi)
            }
          })
      }
    )

    compiler.hooks.normalModuleFactory.tap(
      'MpxWebpackPlugin',
      normalModuleFactory => {
        // resolve前修改原始request
        normalModuleFactory.hooks.beforeResolve.tap(
          'MpxWebpackPlugin',
          data => {
            const request = data.request
            const { queryObj, resource } = parseRequest(request)
            if (queryObj.resolve) {
              // 此处的query用于将资源引用的当前包信息传递给resolveDependency
              const resolveLoaderPath = '@mpxjs/loaders/dist/resolve-loader'
              data.request = `!!${resolveLoaderPath}!${resource}`
            }
          }
        )
        // 应用过rules后，注入mpx相关资源编译loader
        normalModuleFactory.hooks.afterResolve.tap(
          'MpxWebpackPlugin',
          ({ createData }) => {
            const { queryObj } = parseRequest(createData.request || '')
            const loaders = createData.loaders
            const mpxStyleOptions = queryObj.mpxStyleOptions
            const firstLoader = loaders && loaders[0] ? toPosix(loaders[0].loader) : ''
            const isPitcherRequest = firstLoader.includes(
              'vue-loader/lib/loaders/pitcher'
            )
            let cssLoaderIndex = -1
            let vueStyleLoaderIndex = -1
            let mpxStyleLoaderIndex = -1
            loaders && loaders.forEach((loader, index) => {
              const currentLoader = toPosix(loader.loader)
              if (currentLoader.includes('css-loader')) {
                cssLoaderIndex = index
              } else if (
                currentLoader.includes('vue-loader/lib/loaders/stylePostLoader')
              ) {
                vueStyleLoaderIndex = index
              } else if (currentLoader.includes(styleCompilerPath)) {
                mpxStyleLoaderIndex = index
              }
            })
            if (mpxStyleLoaderIndex === -1) {
              let loaderIndex = -1
              if (cssLoaderIndex > -1 && vueStyleLoaderIndex === -1) {
                loaderIndex = cssLoaderIndex
              } else if (
                cssLoaderIndex > -1 &&
                vueStyleLoaderIndex > -1 &&
                !isPitcherRequest
              ) {
                loaderIndex = vueStyleLoaderIndex
              }
              if (loaderIndex > -1) {
                // TODO:
                loaders && loaders.splice(loaderIndex + 1, 0, {
                  loader: styleCompilerPath,
                  options:
                    (mpxStyleOptions && JSON.parse(mpxStyleOptions)) || {},
                  type: '',
                  ident: ''
                })
              }
            }

            createData.request = stringifyLoadersAndResource(
              loaders,
              createData.resource || ''
            )
            // 根据用户传入的modeRules对特定资源添加mode query
            this.runModeRules(createData)
          }
        )
      }
    )
  }
}

export default MpxWebpackPlugin
