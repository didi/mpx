import fs from 'fs'
import genComponentTag from '@mpxjs/webpack-plugin/lib/utils/gen-component-tag'
import { TransformPluginContext } from 'rollup'
import { ResolvedOptions } from '../options'
import { SFCDescriptor } from '../compiler'
import { APP_HELPER_CODE } from '../helper'
import { resolveMpxRuntime } from '../utils/resolveMpx'
import omit from '../utils/omit'
import stringify, { shallowStringify } from '../utils/stringify'
import parseRequest from '../utils/parseRequest'

const optionProcessorPath = resolveMpxRuntime('optionProcessor')
const tabBarContainerPath = resolveMpxRuntime(
  'components/web/mpx-tab-bar-container.vue'
)
const tabBarPath = resolveMpxRuntime('components/web/mpx-tab-bar.vue')
const customBarPath = './custom-tab-bar/index'

/**
 * transfrom mpx script to vue script
 * @param code - mpx script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 * @returns vue content
 */
export function transformScript(
  code: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): string {
  const { id: componentId, app, page, jsonConfig, filename } = descriptor
  const tabBarMap = descriptor.tabBarMap
  const tabBarStr = descriptor.tabBarStr
  const localPagesMap = descriptor.pagesMap
  const localComponentsMap = descriptor.componentsMap
  const builtInComponentsMap = descriptor.builtInComponentsMap
  const genericsInfo = descriptor.genericsInfo

  const ctorType = app ? 'app' : page ? 'page' : 'component'

  const isProduction = options.isProduction
  const i18n = options.i18n

  const tabBar = jsonConfig.tabBar
  const componentGenerics = jsonConfig.componentGenerics

  const emitWarning = (msg: string) => {
    pluginContext.warn(
      new Error('[script processor][' + filename + ']: ' + msg)
    )
  }

  const content = []

  const getComponent = (
    varString: string,
    resource: string,
    async = false,
    options: unknown = {}
  ) => {
    if (!async) {
      content.push(`import ${varString} from ${stringify(resource)}`)
      return `getComponent(${varString}, ${stringify(options)})`
    } else {
      return `() => import("${resource}").then(${varString} => getComponent(${varString}.default, ${stringify(
        options
      )})
      )`
    }
  }

  if (app) {
    content.push(`import "${APP_HELPER_CODE}"`)
    content.push(`import Vue from "vue"`)
    content.push(`import VueRouter from "vue-router"`)
  }

  if (i18n) {
    content.push(`import { i18n } from "${APP_HELPER_CODE}"`)
  }

  content.push(
    `import processOption, { getComponent, getWxsMixin } from "${optionProcessorPath}"`
  )

  const pagesMap: Record<string, string> = {}
  const componentsMap: Record<string, string> = {}
  const tabBarPagesMap: Record<string, string> = {}

  if (tabBar && tabBarMap) {
    // 挂载tabBar组件
    tabBarPagesMap['mpx-tab-bar'] = getComponent(
      '__mpxTabBar',
      tabBar.custom ? customBarPath : tabBarPath
    )

    // 挂载tabBar页面
    Object.keys(tabBarMap).forEach((tarbarName, index) => {
      const tabBarId = localPagesMap[tarbarName]
      if (tabBarId) {
        const { query } = parseRequest(tabBarId)
        tabBarPagesMap[tarbarName] = getComponent(
          `__mpx_tabBar__${index}`,
          tabBarId,
          !!query.async,
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

  Object.keys(localPagesMap).forEach((pagePath, index) => {
    const pageVar = `__mpx__page__${index}`
    if (tabBarMap && tabBarMap[pagePath]) {
      pagesMap[pagePath] = getComponent(pageVar, tabBarContainerPath, false, {
        __mpxBuiltIn: true
      })
    } else {
      const pageId = localPagesMap[pagePath]
      const { query } = parseRequest(pageId)
      pagesMap[pagePath] = getComponent(pageVar, pageId, !!query.async, {
        __mpxPageRoute: pagePath
      })
    }
  })

  Object.keys(localComponentsMap).forEach((componentName, index) => {
    const componentId = localComponentsMap[componentName]
    const { query } = parseRequest(componentId)
    componentsMap[componentName] = getComponent(
      `__mpx__component__${index}`,
      componentId,
      !!query.async
    )
  })

  Object.keys(builtInComponentsMap).forEach((componentName, index) => {
    const componentCfg = builtInComponentsMap[componentName]
    componentsMap[componentName] = getComponent(
      `__mpx__builtInComponent__${index}`,
      componentCfg.resource,
      false,
      { __mpxBuiltIn: true }
    )
  })

  const pageConfig = page
    ? omit(jsonConfig, ['usingComponents', 'style', 'singlePage'])
    : {}

  if (!isProduction) {
    content.push(`global.currentResource = ${stringify(filename)}`)
  }

  if (tabBarStr && tabBarPagesMap) {
    content.push(
      `global.__tabBar = ${tabBarStr}`,
      `Vue.observable(global.__tabBar)`,
      `// @ts-ignore`,
      `global.__tabBarPagesMap = ${shallowStringify(tabBarPagesMap)}`
    )
  }

  content.push(code)

  content.push(
    `export default processOption(`,
    `  global.currentOption,`,
    `  ${stringify(ctorType)},`,
    `  ${stringify(Object.keys(localPagesMap)[0])},`,
    `  ${stringify(componentId)},`,
    `  ${stringify(pageConfig)},`,
    `  ${shallowStringify(pagesMap)},`,
    `  ${shallowStringify(componentsMap)},`,
    `  ${stringify(tabBarMap)},`,
    `  ${stringify(componentGenerics)},`,
    `  ${stringify(genericsInfo)},`,
    `  getWxsMixin({}),`,
    `  ${app ? `Vue, VueRouter` : i18n ? ',i18n' : ''}`,
    `)`
  )

  return `\n${content.join('\n')}\n`
}

/**
 * resolve script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 * @returns script content
 */
export async function resolveScript(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<string> {
  const { script } = descriptor
  let content = script?.content || ''
  if (script?.src) {
    const resolveId = await pluginContext.resolve(
      script.src,
      descriptor.filename
    )
    if (resolveId) {
      pluginContext.addWatchFile(resolveId.id)
      content = fs.readFileSync(resolveId.id, 'utf-8')
    }
  }
  return content
}

/**
 * generate script block and transform script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export async function genScriptBlock(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<{ output: string }> {
  const scriptContent = await resolveScript(descriptor, options, pluginContext)
  return {
    output: genComponentTag(descriptor.script, {
      attrs(script) {
        const attrs = Object.assign({}, script?.attrs)
        delete attrs.src
        return attrs
      },
      content() {
        return transformScript(
          scriptContent,
          descriptor,
          options,
          pluginContext
        )
      }
    })
  }
}
