import { Mpx } from '../types/mpx'
const mpx: Mpx = {
  appInfo: {},
  componentsMap: {},
  defs: {},
  externals: [],
  mode: 'web',
  minimize: false,
  projectRoot: '',
  // pages全局记录，无需区分主包分包
  pagesMap: {},
  postcssInlineConfig: {},
  srcMode: 'wx',
  transRpxRules: {},
  // 组件资源记录，依照所属包进行记录
  usingComponents: {},
  vueContentCache: new Map(),
  webConfig: {},
  wxsContentMap: {},
  recordResourceMap: () => ''
}

export default mpx
