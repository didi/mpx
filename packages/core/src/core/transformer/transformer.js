import * as wxLifecycle from '../../platform/patch/wx/lifecycle'
import * as aliLifecycle from '../../platform/patch/ali/lifecycle'
import { is } from '../../helper/env'
// 生命周期模板
const lifecycleTemplates = {
  wx: wxLifecycle.LIFECYCLE,
  ali: aliLifecycle.LIFECYCLE,
  swan: wxLifecycle.LIFECYCLE
}
// 默认环境下的生命周期信息
const lifecycleInfo = is('ali') ? aliLifecycle : wxLifecycle
const mode = is('wx') || is('swan') ? 'blend' : ''
// 默认转换规则包含
// APP_HOOKS、PAGE_HOOKS、COMPONENT_HOOKS 生命周期
// lifecycleProxyMap 代理规则
// mode 生命周期合并模式
// support 当前平台是否支持当前mode
export const transformRule = {
  lifecycle: lifecycleInfo.LIFECYCLE,
  lifecycleProxyMap: lifecycleInfo.lifecycleProxyMap,
  mode,
  support: !!mode
}

export function setTransformRule (rule) {
  if (rule.lifecycleTemplate) {
    rule.lifecycle = lifecycleTemplates[rule.lifecycleTemplate]
    delete rule.lifecycleTemplate
  }
  Object.assign(transformRule, rule)
}
