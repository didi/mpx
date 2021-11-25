import genComponentTag from '@mpxjs/webpack-plugin/lib/utils/gen-component-tag'
import { TransformPluginContext } from 'rollup'
import { ProcessResult } from './process'
import { ProcessJsonResult } from './processJSON'
import { ProcessTemplateResult } from './processTemplate'
import { ResolvedOptions } from '../../index'
import { SFCDescriptor } from '../../compiler'
import { APP_HELPER_CODE } from '../../helper'
import { resolveMpxRuntime } from '../../utils/resolveMpx'
import resolveScriptFile from '../../utils/resolveScript'
import omit from '../../utils/omit'
import shallowStringify from '../../utils/shallowStringify'
import stringify from '../../utils/stringify'

const optionProcessorPath = resolveMpxRuntime('optionProcessor')
const tabBarContainerPath = resolveMpxRuntime(
  'components/web/mpx-tab-bar-container.vue'
)
const tabBarPath = resolveMpxRuntime('components/web/mpx-tab-bar.vue')
const customBarPath = './custom-tab-bar/index'

export type ProcessScriptResult = ProcessResult

export default async function processScript(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext,
  templateResult: ProcessTemplateResult,
  jsonResult: ProcessJsonResult
): Promise<ProcessScriptResult> {
  const { id: componentId, app, page, jsonConfig, filename } = descriptor
  const ctorType = app ? 'app' : page ? 'page' : 'component'

  const srcMode = options.srcMode
  const isProduction = options.isProduction

  const i18n = options.i18n

  // const forceDisableBuiltInLoader = options.forceDisableBuiltInLoader

  const tabBar = jsonConfig.tabBar
  const componentGenerics = jsonConfig.componentGenerics

  const tabBarMap = jsonResult.tabBarMap
  const tabBarStr = jsonResult.tabBarStr
  const localPagesMap = jsonResult.localPagesMap
  const localComponentsMap = jsonResult.localComponentsMap

  const genericsInfo = templateResult.genericsInfo
  const builtInComponentsMap = templateResult.builtInComponentsMap

  const emitWarning = (msg: string) => {
    pluginContext.warn(
      new Error('[script processor][' + filename + ']: ' + msg)
    )
  }

  const output = []

  let scriptSrcMode = srcMode
  if (descriptor.script) {
    scriptSrcMode = descriptor.script.mode || scriptSrcMode
  } else {
    descriptor.script = {
      tag: 'script',
      content: '',
      attrs: {}
    }
    switch (ctorType) {
      case 'app':
        descriptor.script.content = `
          import { createApp } from "@mpxjs/core"
          createApp({})
        `
        break
      case 'page':
        descriptor.script.content = `
          import { createPage } from "@mpxjs/core"
          createPage({})
        `
        break
      case 'component':
        descriptor.script.content = `
          import { createComponent } from "@mpxjs/core"
          createComponent({})
        `
    }
  }
  const scriptContent = await resolveScriptFile(
    descriptor,
    options,
    pluginContext
  )

  const scriptTagCode = genComponentTag(descriptor.script, {
    attrs(script) {
      const attrs = Object.assign({}, script?.attrs)
      delete attrs.src
      return attrs
    },
    content() {
      const content = []

      const genImport = (
        varString: string,
        resource: string,
        async = false,
        options: unknown = {}
      ) => {
        if (!async) {
          content.push(`import ${varString} from "${resource}"`)
          return `getComponent(${varString}, ${stringify(options)})`
        } else {
          return `() => import("${resource}").then(${varString} =>
            getComponent(${varString}, ${stringify(options)}
          ))`
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

      content.push(`global.currentSrcMode = ${stringify(scriptSrcMode)}`)

      if (!isProduction) {
        content.push(`global.currentResource = ${stringify(filename)}`)
      }

      const pagesMap: Record<string, string> = {}
      const componentsMap: Record<string, string> = {}
      const tabBarPagesMap: Record<string, string> = {}

      if (tabBar && tabBarMap) {
        // 挂载tabBar组件
        tabBarPagesMap['mpx-tab-bar'] = genImport(
          '__mpxTabBar',
          tabBar.custom ? customBarPath : tabBarPath
        )

        // 挂载tabBar页面
        Object.keys(tabBarMap).forEach((tarbarName, index) => {
          const pageCfg = localPagesMap[tarbarName]
          if (pageCfg) {
            tabBarPagesMap[tarbarName] = genImport(
              `__mpx_tabBar__${index}`,
              pageCfg.resource,
              pageCfg.async,
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
          pagesMap[pagePath] = genImport(pageVar, tabBarContainerPath, false, {
            __mpxBuiltIn: true
          })
        } else {
          const pageCfg = localPagesMap[pagePath]
          pagesMap[pagePath] = genImport(
            pageVar,
            pageCfg.resource,
            pageCfg.async,
            {
              __mpxPageRoute: pagePath
            }
          )
        }
      })

      Object.keys(localComponentsMap).forEach((componentName, index) => {
        const componentCfg = localComponentsMap[componentName]
        componentsMap[componentName] = genImport(
          `__mpx__component__${index}`,
          componentCfg.resource,
          componentCfg.async
        )
      })

      Object.keys(builtInComponentsMap).forEach((componentName, index) => {
        const componentCfg = builtInComponentsMap[componentName]
        componentsMap[componentName] = genImport(
          `__mpx__builtInComponent__${index}`,
          componentCfg.resource,
          false,
          { __mpxBuiltIn: true }
        )
      })

      const pageConfig = page
        ? omit(jsonConfig, ['usingComponents', 'style', 'singlePage'])
        : {}

      if (tabBarStr && tabBarPagesMap) {
        content.push(
          `global.__tabBar = ${tabBarStr}`,
          `Vue.observable(global.__tabBar)`,
          `// @ts-ignore`,
          `global.__tabBarPagesMap = ${shallowStringify(tabBarPagesMap)}`
        )
      }

      content.push(scriptContent)

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
  })

  output.push(scriptTagCode)

  return {
    output: output.join('\n')
  }
}
