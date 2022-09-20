import { Mpx } from '../mpx'
const mpx: Mpx = {
  componentsMap: {
    main: {}
  },
  currentPackageRoot: '',
  defs: {},
  externals: [],
  mode: 'web',
  minimize: false,
  projectRoot: '',
  // pages全局记录，无需区分主包分包
  pagesMap: {},
  postcssInlineConfig: {},
  srcMode: 'wx',
  staticResourcesMap: {
    main: {}
  },
  transRpxRules: {},
  // 组件资源记录，依照所属包进行记录
  usingComponents: {},
  vueContentCache: new Map(),
  webConfig: {},
  // todo es6 map读写性能高于object，之后会逐步替换
  wxsAssetsCache: new Map(),
  wxsContentMap: {},
  pathHash: (resourcePath) => '',
  getOutputPath: () => '',
  recordResourceMap: () => ''
}

export default mpx
