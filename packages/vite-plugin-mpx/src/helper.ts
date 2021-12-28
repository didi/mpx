import { ResolvedOptions } from './options'
import mpxGlobal from './mpx'
import { SFCDescriptor } from './compiler'
import stringify from './utils/stringify'
import addQuery from './utils/addQuery'

export const ENTRY_HELPER_CODE = 'plugin-mpx:entry-helper'
export const APP_HELPER_CODE = 'plugin-mpx:app-helper'

export const renderPageRouteCode = (importer: string): string => {
  return `export default ${stringify(mpxGlobal.pagesMap[importer])}`
}

export const renderEntryCode = (importer: string): string => `
import App from ${stringify(addQuery(importer, { app: true }))}
import Vue from 'vue'
new Vue({
  el: '#app',
  render: function(h){
    return h(App)
  }
})
`

export function renderAppHelpCode(
  descriptor: SFCDescriptor,
  option: ResolvedOptions
): string {
  const { jsonConfig } = descriptor
  const { i18n } = option
  const content = []
  content.unshift(
    `import '@mpxjs/webpack-plugin/lib/runtime/base.styl'`,
    `import Vue from 'vue'`,
    `import VueRouter from 'vue-router'`,
    `import BScroll from '@better-scroll/core'`,
    `import PullDown from '@better-scroll/pull-down'`,
    `import ObserveDOM from '@better-scroll/observe-dom'`
  )
  content.push(
    `Vue.use(VueRouter)`,
    `BScroll.use(ObserveDOM)`,
    `BScroll.use(PullDown)`,
    `global.currentSrcMode = "${option.srcMode}"`,
    `global.BScroll = BScroll`,
    `global.getApp = function(){}`,
    `global.getCurrentPages = function(){
      if(!global.__mpxRouter) return []
      // @ts-ignore
      return global.__mpxRouter.stack.map(item => {
        let page
        const vnode = item.vnode
        if(vnode && vnode.componentInstance) {
          page = vnode.tag.endsWith('mpx-tab-bar-container') ? vnode.componentInstance.$refs.tabBarPage : vnode.componentInstance
        }
        return page || { route: item.path.slice(1) }
      })
    }`,
    `global.__networkTimeout = ${stringify(jsonConfig.networkTimeout)}`,
    `global.__mpxGenericsMap = {}`,
    `global.__style = ${stringify(jsonConfig.style || 'v1')}`,
    `global.__mpxPageConfig = ${stringify(jsonConfig.window || {})}`
  )

  if (i18n && !option.forceDisableInject) {
    content.unshift(`import VueI18n from 'vue-i18n'`)
    content.push(`Vue.use(VueI18n)`)
    const i18nObj = Object.assign({}, i18n)
    const requestObj: Record<string, string> = {}
    const i18nKeys = ['messages', 'dateTimeFormats', 'numberFormats']
    i18nKeys.forEach((key) => {
      const keyPath = `${key}Path`
      if (i18nObj[keyPath]) {
        requestObj[key] = stringify(i18nObj[keyPath])
        delete i18nObj[keyPath]
      }
    })
    content.push(`const i18nCfg = ${stringify(i18nObj)}`)
    Object.keys(requestObj).forEach((key) => {
      content.push(`i18nCfg.${key} = require(${requestObj[key]})`)
    })
    content.push(
      `const i18n = new VueI18n(i18nCfg)`,
      `i18n.mergeMessages = (newMessages) => {
        Object.keys(newMessages).forEach((locale) => {
          i18n.mergeLocaleMessage(locale, newMessages[locale])
        })
      }`,
      `if(global.__mpx) {
        global.__mpx.i18n = i18n
      }`
    )
    content.push(`export { i18n }`)
  }
  return content.join('\n')
}
