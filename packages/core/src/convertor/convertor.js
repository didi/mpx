import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as aliLifecycle from '../platform/patch/ali/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
import { is } from '../helper/env'
import { type } from '../helper/utils'
import wxToAliRule from './wxToAli'
import wxToSwanRule from './wxToSwan'
import wxToQqRule from './wxToQq'

// 生命周期模板
const lifecycleTemplates = {
  wx: wxLifecycle.LIFECYCLE,
  ali: aliLifecycle.LIFECYCLE,
  swan: wxLifecycle.LIFECYCLE,
  qq: wxLifecycle.LIFECYCLE,
  tt: wxLifecycle.LIFECYCLE
}
// 根据当前环境获取的默认生命周期信息
const lifecycleInfo = is('ali') ? aliLifecycle : wxLifecycle
const pageMode = is('ali') ? '' : 'blend'

/**
 * 转换规则包含四点
 * lifecycle [object] 生命周期
 * lifecycleProxyMap [object] 代理规则
 * pageMode [string] 页面生命周期合并模式, 目前仅wx支持[blend]
 * support [boolean]当前平台是否支持当前pageMode
 * convert [function] 自定义转换函数, 接收一个options
 */
const defaultConvertRule = {
  lifecycle: mergeLifecycle(lifecycleInfo.LIFECYCLE),
  lifecycleProxyMap: lifecycleInfo.lifecycleProxyMap,
  pageMode,
  support: !!pageMode,
  convert: null
}

const RULEMAPS = {
  local: { ...defaultConvertRule },
  default: defaultConvertRule,
  wxToSwan: { ...defaultConvertRule, ...wxToSwanRule },
  wxToQq: { ...defaultConvertRule, ...wxToQqRule },
  wxToAli: wxToAliRule // 微信转支付宝rule
}

// 外部控制默认转换规则
export function setConvertRule (rule) {
  if (rule.lifecycleTemplate) {
    rule.lifecycle = lifecycleTemplates[rule.lifecycleTemplate]
  }
  if (rule.lifecycle) {
    // 合并内建钩子
    rule.lifecycle = mergeLifecycle(rule.lifecycle)
  }
  Object.keys(defaultConvertRule).forEach(key => {
    if (rule.hasOwnProperty(key)) {
      if (type(defaultConvertRule[key]) === 'Object') {
        defaultConvertRule[key] = Object.assign({}, defaultConvertRule[key], rule[key])
      } else {
        defaultConvertRule[key] = rule[key]
      }
    }
  })
}

export function getConvertRule (convertMode) {
  let rule
  if (typeof convertMode === 'function') {
    rule = convertMode() || {}
    const lifecycle = lifecycleTemplates[rule.lifecycleTemplate] || rule.lifecycle
    // 混入内部钩子
    rule.lifecycle = mergeLifecycle(lifecycle)
  } else {
    rule = RULEMAPS[convertMode]
  }
  if (!rule || !rule.lifecycle) {
    console.error(`no convert rule for ${convertMode}`)
  } else {
    return rule
  }
}
