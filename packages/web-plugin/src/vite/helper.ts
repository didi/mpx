import { ResolvedOptions } from '../options'
import mpxGlobal from './mpx'
import { SFCDescriptor } from './compiler'
import stringify from '../utils/stringify'
import addQuery from '../utils/addQuery'

export const ENTRY_HELPER_CODE = 'plugin-mpx:entry-helper'
export const APP_HELPER_CODE = 'plugin-mpx:app-helper'
export const I18N_HELPER_CODE = 'plugin-mpx:i18n-helper'

export const renderPageRouteCode = (importer: string): string => {
  return `export default ${stringify(mpxGlobal.pagesMap[importer])}`
}

export const renderEntryCode = (
  importer: string,
  options: ResolvedOptions
): string => {
  const content = []
  content.unshift(
    `import App from ${stringify(addQuery(importer, { app: true }))}`,
    `import '@mpxjs/web-plugin/src/runtime/base.styl'`,
    `import Vue from 'vue'`,
    `import { i18n } from ${stringify(I18N_HELPER_CODE)}`,
    `import VueRouter from 'vue-router'`,
    `import BScroll from '@better-scroll/core'`,
    `import PullDown from '@better-scroll/pull-down'`,
    `import ObserveDOM from '@better-scroll/observe-dom'`
  )
  content.push(
    `Vue.use(VueRouter)`,
    `BScroll.use(ObserveDOM)`,
    `BScroll.use(PullDown)`,
    `global.currentSrcMode = "${options.srcMode}"`,
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
    `global.__mpxGenericsMap = {}`
  )
  content.push(`new Vue({
    el: '#app',
    ${options.i18n && !options.forceDisableInject ? `i18n,` : ''}
    render: function(h){
      return h(App)
    }
  })`)
  return content.join('\n')
}

export function renderI18nCode(options: ResolvedOptions): string {
  const content = []
  const { i18n } = options
  if (i18n && !options.forceDisableInject) {
    content.unshift(`import Vue from 'vue'`)
    content.unshift(`import VueI18n from 'vue-i18n'`)
    content.push(`Vue.use(VueI18n)`)
    const i18nObj = { ...i18n }
    const requestObj: Record<string, string> = {}
    const i18nKeys = ['messages', 'dateTimeFormats', 'numberFormats']
    i18nKeys.forEach(key => {
      const keyPath = `${key}Path`
      if (i18nObj[keyPath]) {
        requestObj[key] = stringify(i18nObj[keyPath])
        delete i18nObj[keyPath]
      }
    })
    Object.keys(requestObj).forEach(key => {
      content.push(`import __mpx__i18n__${key} from ${requestObj[key]}`)
    })
    content.push(`const i18nCfg = ${stringify(i18nObj)}`)
    Object.keys(requestObj).forEach(key => {
      content.push(`i18nCfg.${key} = __mpx__i18n__${key}`)
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
    content.push(`export { i18n } `)
  }
  return content.join('\n')
}

export function renderAppHelpCode(descriptor: SFCDescriptor): string {
  const { jsonConfig } = descriptor
  const content = []
  content.push(
    `global.__networkTimeout = ${stringify(jsonConfig.networkTimeout)}`,
    `global.__style = ${stringify(jsonConfig.style || 'v1')}`,
    `global.__mpxPageConfig = ${stringify(jsonConfig.window || {})}`
  )
  return content.join('\n')
}
