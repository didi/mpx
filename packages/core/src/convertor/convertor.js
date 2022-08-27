import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as aliLifecycle from '../platform/patch/ali/lifecycle'
import * as webLifecycle from '../platform/patch/web/lifecycle'
import * as swanLifecycle from '../platform/patch/swan/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
import { error } from '../helper/log'
import wxToAliRule from './wxToAli'
import wxToWebRule from './wxToWeb'
import wxToSwanRule from './wxToSwan'
import wxToQqRule from './wxToQq'
import wxToTtRule from './wxToTt'
import wxToDdRule from './wxToDd'
import wxToJdRule from './wxToJd'
import wxToKsRule from './wxToKs'

// 根据当前环境获取的默认生命周期信息
let lifecycleInfo
let pageMode

if (__mpx_mode__ === 'web') {
  lifecycleInfo = webLifecycle
  pageMode = ''
} else if (__mpx_mode__ === 'ali') {
  lifecycleInfo = aliLifecycle
  pageMode = ''
} else if (__mpx_mode__ === 'swan') {
  lifecycleInfo = swanLifecycle
  pageMode = 'blend'
} else {
  lifecycleInfo = wxLifecycle
  pageMode = 'blend'
}

/**
 * 转换规则包含四点
 * lifecycle [object] 生命周期
 * lifecycleProxyMap [object] 代理规则
 * pageMode [string] 页面生命周期合并模式，是否为blend
 * support [boolean]当前平台是否支持blend
 * convert [function] 自定义转换函数, 接收一个options
 */
const defaultConvertRule = {
  lifecycle: mergeLifecycle(lifecycleInfo.LIFECYCLE),
  lifecycleProxyMap: lifecycleInfo.lifecycleProxyMap,
  pageMode,
  support: !!pageMode,
  convert: null
}

const rulesMap = {
  local: { ...defaultConvertRule },
  default: defaultConvertRule,
  wxToWeb: wxToWebRule,
  wxToAli: wxToAliRule,
  wxToSwan: wxToSwanRule,
  wxToQq: { ...defaultConvertRule, ...wxToQqRule },
  wxToTt: { ...defaultConvertRule, ...wxToTtRule },
  wxToDd: { ...defaultConvertRule, ...wxToDdRule },
  wxToJd: { ...defaultConvertRule, ...wxToJdRule },
  wxToKs: { ...defaultConvertRule, ...wxToKsRule }
}

export function getConvertRule (convertMode) {
  let rule = rulesMap[convertMode]
  if (!rule || !rule.lifecycle) {
    error(`Absence of convert rule for ${convertMode}, please check.`)
  } else {
    return rule
  }
}
