import {
  addQuery,
  genImport,
  isUrlRequest,
  parseRequest,
  shallowStringify,
  stringify
} from '@mpxjs/compile-utils'
import { PluginContext } from 'rollup'
import { OPTION_PROCESSOR_PATH, TAB_BAR_PATH } from '../constants'
import { Options } from '../options'
import { TabBarItem } from '@mpxjs/compiler'
import { resolvedConfig } from './config'
import mpxGlobal from './mpx'
import { genComponentCode } from './transformer/script'
import { SFCDescriptor } from './utils/descriptor-cache'

export const ENTRY_HELPER_CODE = '\0/vite/mpx-entry-helper'
export const APP_HELPER_CODE = '\0/vite/mpx-app-helper'
export const I18N_HELPER_CODE = '\0/vite/mpx-i18n-helper'
export const TAB_BAR_PAGE_HELPER_CODE = '\0/vite/mpx-tab-bar-page-helper'

export const renderPageRouteCode = (
  options: Options,
  importer: string
): string => {
  return `export default ${stringify(
    resolvedConfig.base + mpxGlobal.pagesMap[importer]
  )}`
}

export const renderEntryCode = async (
  importer: string,
  options: Options
): Promise<string> => {
  return `
    ${genImport(addQuery(importer, { app: true }), 'App')}
    ${genImport('@mpxjs/web-plugin/src/runtime/base.styl')}
    ${genImport('vue', 'Vue')}
    ${genImport('vue-router', 'VueRouter')}
    ${genImport('@better-scroll/core', 'BScroll')}
    ${genImport('@better-scroll/pull-down', 'PullDown')}
    ${genImport('@better-scroll/observe-dom', 'ObserveDOM')}
    Vue.use(VueRouter)
    BScroll.use(ObserveDOM)
    BScroll.use(PullDown)
    global.BScroll = BScroll
    new Vue({
      el: ${options.webConfig?.el || '"#app"'},
      render: function(h){
        return h(App)
      }
    })
  `
}

export function renderI18nCode(options: Options): string {
  const content = []
  const { i18n } = options
  if (i18n) {
    content.push(
      genImport('vue', 'Vue'),
      genImport('vue-i18n', 'VueI18n'),
      genImport(`vue-i18n-bridge`, '{ createI18n }'),
      genImport('@mpxjs/core', 'Mpx'),
      `Vue.use(VueI18n, { bridge: true })`
    )
    const i18nObj = { ...i18n }
    const requestObj: Record<string, string> = {}
    const i18nKeys = ['messages', 'dateTimeFormats', 'numberFormats']
    i18nKeys.forEach(key => {
      const keyPath = `${key}Path` as keyof typeof i18nObj
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
      `i18nCfg.legacy = false`,
      `const i18n = createI18n(i18nCfg, VueI18n)`,
      `Vue.use(i18n)`,
      `Mpx.i18n = i18n`
    )
  }
  return content.join('\n')
}

/**
 * app初始化代码，主要是初始化所有的global对象
 * @param descriptor - SFCDescriptor
 * @returns
 */
export async function renderAppHelpCode(
  options: Options,
  descriptor: SFCDescriptor,
  pluginContext: PluginContext
) {
  const { jsonConfig } = descriptor
  const content = []
  const tabBar = {
    ...jsonConfig.tabBar
  }
  const list = tabBar.list || []
  const newList = []
  const needReplaceName: string[] = []
  async function resolveTabBarItemIcon(
    item: TabBarItem,
    key: 'iconPath' | 'selectedIconPath'
  ) {
    const iconPath = item[key]
    if (
      iconPath &&
      isUrlRequest(iconPath, jsonConfig.path, options.externals)
    ) {
      const varName = `__mpx_icon_${needReplaceName.length}__`
      needReplaceName.push(varName)
      const resolveIcon = await pluginContext.resolve(iconPath, jsonConfig.path)
      if (resolveIcon) {
        item[key] = varName
        content.push(`import ${varName} from "${resolveIcon.id}"`)
      }
    }
  }
  for (let i = 0; i < list.length; i++) {
    const item = {
      ...list[i]
    }
    await resolveTabBarItemIcon(item, 'iconPath')
    await resolveTabBarItemIcon(item, 'selectedIconPath')
    newList.push(item)
  }
  tabBar.list = newList
  let tabBarStr = stringify(tabBar)
  needReplaceName.forEach(v => {
    tabBarStr = tabBarStr.replace(`"${v}"`, v)
  })
  content.push(
    `global.__networkTimeout = ${stringify(jsonConfig.networkTimeout)}`,
    `global.__style = ${stringify(jsonConfig.style || 'v1')}`,
    `global.__mpxPageConfig = ${stringify(jsonConfig.window || {})}`,
    `global.__tabBar = ${tabBarStr}`,
    `global.currentSrcMode = "${options.srcMode}"`,
    `global.getApp = function(){ return {} }`,
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
  options: Options,
  descriptor: SFCDescriptor,
  pluginContext: PluginContext
): Promise<string> => {
  const customBarPath = './custom-tab-bar/index?isComponent'
  const tabBars: string[] = []
  const { filename, jsonConfig, tabBarMap, localPagesMap } = descriptor
  const { tabBar } = jsonConfig

  const tabBarPagesMap: Record<string, string> = {}

  const emitWarning = (msg: string) => {
    pluginContext.warn('[script processor]: ' + msg)
  }

  if (tabBar && tabBarMap) {
    const varName = '__mpxTabBar'
    let tabBarPath = TAB_BAR_PATH
    if (tabBar.custom) {
      const customBarPathResolved = await pluginContext.resolve(
        customBarPath,
        filename
      )
      tabBarPath = customBarPathResolved?.id || TAB_BAR_PATH
    }
    tabBars.push(genImport(tabBarPath, varName))
    tabBarPagesMap['mpx-tab-bar'] = genComponentCode(varName, tabBarPath)
    Object.keys(tabBarMap).forEach((tarbarName, index) => {
      const tabBarId = localPagesMap[tarbarName].resource
      if (tabBarId) {
        const varName = `__mpx_tabBar__${index}`
        const { queryObj: query } = parseRequest(tabBarId)
        const async = !!query.async
        !async && tabBars.push(genImport(tabBarId, varName))
        tabBarPagesMap[tarbarName] = genComponentCode(
          varName,
          tabBarId,
          {
            async
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
    genImport('vue', 'Vue'),
    genImport(OPTION_PROCESSOR_PATH, 'processOption, { getComponent }'),
    tabBars.join('\n'),
    `global.__tabBar && Vue.observable(global.__tabBar)`,
    tabBarPagesMap &&
      `// @ts-ignore
      global.__tabBarPagesMap = ${shallowStringify(tabBarPagesMap)}`
  ]
  return content.join('\n')
}
