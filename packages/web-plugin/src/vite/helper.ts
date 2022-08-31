import { PluginContext } from 'rollup'
import parseRequest from '../utils/parseRequest'
import { ResolvedOptions } from '../options'
import addQuery from '../utils/addQuery'
import { resolveMpxRuntime } from '../utils/resolveMpxRuntime'
import stringify, { shallowStringify } from '../utils/stringify'
import { SFCDescriptor } from './compiler'
import mpxGlobal from './mpx'
import { getResource } from './transformer/script'

export const ENTRY_HELPER_CODE = '\0/vite/mpx-entry-helper'
export const APP_HELPER_CODE = '\0/vite/mpx-app-helper'
export const I18N_HELPER_CODE = '\0/vite/mpx-i18n-helper'
export const TAB_BAR_PAGE_HELPER_CODE = '\0/vite/mpx-tab-bar-page'

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
    `global.BScroll = BScroll`
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

/**
 * app初始化代码，主要是初始化所有的global对象
 * @param descriptor - SFCDescriptor
 * @returns
 */
export function renderAppHelpCode(
  options: ResolvedOptions,
  descriptor: SFCDescriptor
): string {
  const { jsonConfig, tabBarStr } = descriptor
  const content = []
  content.push(
    `global.__networkTimeout = ${stringify(jsonConfig.networkTimeout)}`,
    `global.__style = ${stringify(jsonConfig.style || 'v1')}`,
    `global.__mpxPageConfig = ${stringify(jsonConfig.window || {})}`,
    `global.__tabBar = ${tabBarStr}`,
    `global.currentSrcMode = "${options.srcMode}"`,
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
  return content.join('\n')
}

/**
 * TabBar，mpx-tab-bar-container依赖global.__tabBarPagesMap
 * @param options - 
 * @param descriptor -
 * @param pluginContext -
 * @returns
 */
export const renderTabBarPageCode = async (
  options: ResolvedOptions,
  descriptor: SFCDescriptor,
  pluginContext: PluginContext
): Promise<string> => {
  const optionProcessorPath = resolveMpxRuntime('optionProcessor')
  const tabBarPath = resolveMpxRuntime('components/web/mpx-tab-bar.vue')
  const customBarPath = './custom-tab-bar/index?component'
  const tabBars: string[] = []
  const isProduction = options.isProduction
  const {
    filename,
    tabBarStr,
    jsonConfig,
    tabBarMap,
    pagesMap: localPagesMap
  } = descriptor
  const { tabBar } = jsonConfig

  const tabBarPagesMap: Record<string, string> = {}
  const getTabBar = getResource(tabBars)

  const emitWarning = (msg: string) => {
    pluginContext.warn(
      new Error('[script processor][' + filename + ']: ' + msg)
    )
  }

  if (tabBar && tabBarMap) {
    const customBarPathResolved = await pluginContext.resolve(customBarPath)
    tabBarPagesMap['mpx-tab-bar'] = getTabBar(
      '__mpxTabBar',
      tabBar.custom && customBarPathResolved
        ? customBarPathResolved.id
        : tabBarPath
    )

    Object.keys(tabBarMap).forEach((tarbarName, index) => {
      const tabBarId = localPagesMap[tarbarName]
      if (tabBarId) {
        const { query } = parseRequest(tabBarId)
        tabBarPagesMap[tarbarName] = getTabBar(
          `__mpx_tabBar__${index}`,
          tabBarId,
          {
            async: !!query.async
          },
          {
            __mpxPageroute: tarbarName
          }
        )
      } else {
        emitWarning(
          `TabBar page path ${tarbarName} is not exist in local page map, please check!`
        )
      }
    })
  }

  const content = [
    `import Vue from 'vue'`,
    `import processOption, { getComponent, getWxsMixin } from "${optionProcessorPath}"`,
    tabBars.join('\n'),
    !isProduction && `global.currentResource = ${stringify(filename)}`,
    tabBarStr &&
      tabBarPagesMap &&
      [
        `Vue.observable(global.__tabBar)`,
        `// @ts-ignore`,
        `global.__tabBarPagesMap = ${shallowStringify(tabBarPagesMap)}`
      ].join('\n')
  ]
  return content.join('\n')
}
