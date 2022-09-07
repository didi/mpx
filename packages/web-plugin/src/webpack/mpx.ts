import { WebpackError } from 'webpack'

export interface Mpx {
  pagesMap: any
  componentsMap: any
  usingComponents: any
  vueContentCache: Map<any, any>
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
  getOutputPath: (path: string, type: string, option?: {conflictPath: any}) => string
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
  vueContentCache: new Map(),
  wxsAssetsCache: new Map(),
  currentPackageRoot: '',
  wxsContentMap: {},
  minimize: false,
  recordResourceMap() {
    return
  },
  getOutputPath() {
    return ''
  },
  staticResourcesMap: undefined,
  externals: [],
  projectRoot: '',
  defs: {},
  transRpxRules: {},
	webConfig: {},
	postcssInlineConfig: {},
	mode: '',
  pathHash: (resourcePath) => ''
}

export default mpx
