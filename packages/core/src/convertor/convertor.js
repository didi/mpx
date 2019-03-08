import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as aliLifecycle from '../platform/patch/ali/lifecycle'
import { INNER_LIFECYCLES } from '../core/innerLifecycle'
import { is } from '../helper/env'
import { type } from '../helper/utils'

function mergeLifecycle (lifecycle) {
  const pageHooks = (lifecycle.PAGE_HOOKS || []).concat(INNER_LIFECYCLES)
  const componentHooks = (lifecycle.COMPONENT_HOOKS || []).concat(INNER_LIFECYCLES)
  return {
    'app': lifecycle.APP_HOOKS || [],
    'page': pageHooks,
    'component': componentHooks,
    'blend': pageHooks.concat(componentHooks)
  }
}
// 生命周期模板
const lifecycleTemplates = {
  wx: wxLifecycle.LIFECYCLE,
  ali: aliLifecycle.LIFECYCLE,
  swan: wxLifecycle.LIFECYCLE
}
// 根据当前环境获取的默认生命周期信息
const lifecycleInfo = is('ali') ? aliLifecycle : wxLifecycle
const mode = is('wx') || is('swan') ? 'blend' : ''

/**
 * 转换规则包含四点
 * lifecycle [object] 生命周期
 * lifecycleProxyMap [object] 代理规则
 * mode [string] 生命周期合并模式, 目前仅支持[blend]
 * support [boolean]当前平台是否支持当前mode
 * convert [function] 自定义转换函数, 接收一个options
 */
export const convertRule = {
  lifecycle: mergeLifecycle(lifecycleInfo.LIFECYCLE),
  lifecycleProxyMap: lifecycleInfo.lifecycleProxyMap,
  mode,
  support: !!mode,
  convert: null
}

// 外部控制规则
export function setConvertRule (rule) {
  if (rule.lifecycleTemplate) {
    rule.lifecycle = lifecycleTemplates[rule.lifecycleTemplate]
  }
  if (rule.lifecycle) {
    // 合并内建钩子
    rule.lifecycle = mergeLifecycle(rule.lifecycle)
  }
  Object.keys(convertRule).forEach(key => {
    if (rule.hasOwnProperty(key)) {
      if (type(convertRule[key]) === 'Object') {
        Object.assign(convertRule[key], rule[key])
      } else {
        convertRule[key] = rule[key]
      }
    }
  })
}
