import { WebpackError } from 'webpack'
import { Options } from '../options'
import { preProcessDefs } from '@mpxjs/utils/index'
import hash from 'hash-sum'
import path from 'path'

export interface Mpx {
  pagesMap: any
  componentsMap: any
  usingComponents: any
  wxsAssetsCache: Map<any, any>
  currentPackageRoot: string
  wxsContentMap: any
  minimize: boolean
  staticResourcesMap: any

  recordResourceMap(record: {
    resourcePath: string
    resourceType: string
    outputPath: string
    packageRoot: string
    recordOnly: boolean
    warn(e: WebpackError): void
    error(e: WebpackError): void
  }): void

  externals: (string | RegExp)[]
  projectRoot: string
  getOutputPath: (path: string, type: string, option: { conflictPath: any }) => string
  defs: Record<string, any>
  transRpxRules: any,
  webConfig: any,
  postcssInlineConfig: any
  mode: any
  pathHash: (resourcePath: string) => string

  [k: string]: any
}

const mpx: Mpx = {
  // pages全局记录，无需区分主包分包
  pagesMap: {},
  // 组件资源记录，依照所属包进行记录
  componentsMap: {
    main: {}
  },
  usingComponents: {},
  // todo es6 map读写性能高于object，之后会逐步替换
  wxsAssetsCache: new Map(),
  currentPackageRoot: '',
  wxsContentMap: {},
  minimize: false,
  staticResourcesMap: undefined,
  externals: [],
  projectRoot: '',
  defs: {},
  transRpxRules: {},
  webConfig: {},
  postcssInlineConfig: {},
  mode: '',
  pathHash: (resourcePath) => '',
  getOutputPath: () => '',
  recordResourceMap: () => ''
}

export function processMpx(options: Options) {
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
    wxsAssetsCache: new Map(),
    currentPackageRoot: '',
    wxsContentMap: {},
    minimize: false,
    mode: options.mode,
    srcMode: options.srcMode,
    env: options.env,
    externalClasses: options.externalClasses,
    projectRoot: options.projectRoot,
    autoScopeRules: options.autoScopeRules,
    transRpxRules: options.transRpxRules,
    postcssInlineConfig: options.postcssInlineConfig,
    decodeHTMLText: options.decodeHTMLText,
    // 输出web专用配置
    webConfig: options.webConfig,
    defs: preProcessDefs(options.defs),
    i18n: options.i18n,
    checkUsingComponents: options.checkUsingComponents,
    appTitle: 'Mpx homepage',
    externals: options.externals,
    pathHash: (resourcePath: string) => {
      if (
        options.pathHashMode === 'relative' &&
        options.projectRoot
      ) {
        return hash(
          path.relative(options.projectRoot, resourcePath)
        )
      }
      return hash(resourcePath)
    },
    getOutputPath: (
      resourcePath: string,
      type: 'component' | 'page',
      { ext = '', conflictPath = '' } = {}
    ) => {
      const name = path.parse(resourcePath).name
      const hash = mpx.pathHash(resourcePath)
      const customOutputPath = options.customOutputPath
      if (conflictPath)
        return conflictPath.replace(
          /(\.[^\\/]+)?$/,
          match => hash + match
        )
      if (typeof customOutputPath === 'function')
        return customOutputPath(type, name, hash, ext).replace(
          /^\//,
          ''
        )
      if (type === 'component' || type === 'page')
        return path.join(type + 's', name + hash, 'index' + ext)
      return path.join(type, name + hash + ext)
    },
    recordResourceMap: ({
                          resourcePath,
                          resourceType,
                          outputPath,
                          packageRoot = '',
                          recordOnly,
                          warn,
                          error
                        }: Record<string, any>) => {
      const packageName = packageRoot || 'main'
      const resourceMap = mpx[`${resourceType}sMap`]
      const currentResourceMap = resourceMap.main
        ? (resourceMap[packageName] = resourceMap[packageName] || {})
        : resourceMap
      let alreadyOutputted = false
      if (outputPath) {
        if (
          !currentResourceMap[resourcePath] ||
          currentResourceMap[resourcePath] === true
        ) {
          if (!recordOnly) {
            // 在非recordOnly的模式下，进行输出路径冲突检测，如果存在输出路径冲突，则对输出路径进行重命名
            for (const key in currentResourceMap) {
              // todo 用outputPathMap来检测输出路径冲突
              if (
                currentResourceMap[key] === outputPath &&
                key !== resourcePath
              ) {
                outputPath = mpx.getOutputPath(
                  resourcePath,
                  resourceType,
                  { conflictPath: outputPath }
                )
                warn &&
                warn(
                  new Error(
                    `Current ${resourceType} [${resourcePath}] is registered with conflicted outputPath [${currentResourceMap[key]}] which is already existed in system, will be renamed with [${outputPath}], use ?resolve to get the real outputPath!`
                  )
                )
                break
              }
            }
          }
          currentResourceMap[resourcePath] = outputPath
        } else {
          if (currentResourceMap[resourcePath] === outputPath) {
            alreadyOutputted = true
          } else {
            error &&
            error(
              new Error(
                `Current ${resourceType} [${resourcePath}] is already registered with outputPath [${currentResourceMap[resourcePath]}], you can not register it with another outputPath [${outputPath}]!`
              )
            )
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
  Object.assign(mpx, initMpxData)
  return mpx
}

export default mpx
