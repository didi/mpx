import { LIFECYCLE, lifecycleProxyMap, pageMode } from '../platform/patch/lifecycle/index'
import { mergeLifecycle } from './mergeLifecycle'
import { error, extend } from '@mpxjs/utils'
import wxToAliRule from './wxToAli'
import wxToWebRule from './wxToWeb'
import wxToTenonRule from './wxToTenon'
import wxToSwanRule from './wxToSwan'
import wxToQqRule from './wxToQq'
import wxToTtRule from './wxToTt'
import wxToDdRule from './wxToDd'
import wxToJdRule from './wxToJd'
import wxToReactRule from './wxToReact'

/**
 * 转换规则包含四点
 * lifecycle [object] 生命周期
 * lifecycleProxyMap [object] 代理规则
 * pageMode [string] 页面生命周期合并模式，是否为blend
 * support [boolean]当前平台是否支持blend
 * convert [function] 自定义转换函数, 接收一个options
 */
const defaultConvertRule = {
  lifecycle: mergeLifecycle(LIFECYCLE),
  lifecycleProxyMap: lifecycleProxyMap,
  pageMode,
  support: !!pageMode,
  convert: null
}

const rulesMap = {
  local: extend({}, defaultConvertRule),
  default: defaultConvertRule,
  wxToWeb: wxToWebRule,
  wxToTenon: wxToTenonRule,
  wxToAli: wxToAliRule,
  wxToSwan: wxToSwanRule,
  wxToQq: extend({}, defaultConvertRule, wxToQqRule),
  wxToTt: extend({}, defaultConvertRule, wxToTtRule),
  wxToDd: extend({}, defaultConvertRule, wxToDdRule),
  wxToJd: extend({}, defaultConvertRule, wxToJdRule),
  wxToIos: extend({}, defaultConvertRule, wxToReactRule),
  wxToAndroid: extend({}, defaultConvertRule, wxToReactRule)
}

export function getConvertRule (convertMode) {
  const rule = rulesMap[convertMode]
  if (!rule || !rule.lifecycle) {
    error(`Absence of convert rule for ${convertMode}, please check.`)
  } else {
    return rule
  }
}
