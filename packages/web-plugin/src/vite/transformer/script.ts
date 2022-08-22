import fs from 'fs'
import genComponentTag from '@mpxjs/webpack-plugin/lib/utils/gen-component-tag'
import { SourceMap, TransformPluginContext } from 'rollup'
import MagicString from 'magic-string'
import { transformWithEsbuild } from 'vite'
import path from 'path'
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

const APP_CODE = [
  `import "${APP_HELPER_CODE}"`,
  `import Vue from "vue"`,
  `import VueRouter from "vue-router"`
].join('\n')

const I18N_CODE = `import { i18n } from "${APP_HELPER_CODE}"`

const OPTION_PROCESSOR_CODE = `import processOption, { getComponent, getWxsMixin } from "${optionProcessorPath}"`

/**
 * transfrom mpx script
 * @param code - mpx script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 * @returns script content
 */
export async function transformScript(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<{
  code: string
  map: SourceMap
}> {
  const { code, id: filename } = await resolveScript(
    descriptor,
    options,
    pluginContext
  )
  const s = new MagicString(code)
  const { id: componentId, app, page, jsonConfig, script } = descriptor
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

  const components: string[] = []

  const getComponent = (
    varString: string,
    resource: string,
    async = false,
    options: unknown = {}
  ) => {
    if (!async) {
      components.push(`import ${varString} from ${stringify(resource)}`)
      return `getComponent(${varString}, ${stringify(options)})`
    } else {
      return `() => import("${resource}").then(${varString} => getComponent(${varString}.default, ${stringify(
        options
      )})
      )`
    }
  }

  const pagesMap: Record<string, string> = {}
  const componentsMap: Record<string, string> = {}
  const tabBarPagesMap: Record<string, string> = {}

  if (tabBar && tabBarMap) {
    tabBarPagesMap['mpx-tab-bar'] = getComponent(
      '__mpxTabBar',
      tabBar.custom ? customBarPath : tabBarPath
    )

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

  s.trimLines()

  s.prepend(
    [
      app && APP_CODE,
      i18n && I18N_CODE,
      OPTION_PROCESSOR_CODE,
      components.join('\n'),
      !isProduction && `global.currentResource = ${stringify(filename)}`,
      tabBarStr &&
        tabBarPagesMap &&
        [
          `global.__tabBar = ${tabBarStr}`,
          `Vue.observable(global.__tabBar)`,
          `// @ts-ignore`,
          `global.__tabBarPagesMap = ${shallowStringify(tabBarPagesMap)}`
        ].join('\n')
    ]
      .filter(Boolean)
      .join('\n') + '\n'
  )

  s.append(
    [
      `\nexport default processOption(`,
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
      `  ${app ? `Vue, VueRouter` : i18n ? 'i18n' : ''}`,
      `)`
    ].join('\n')
  )

  // transform ts
  if (
    (script?.src && path.extname(filename) === '.ts') ||
    script?.attrs.lang === 'ts'
  ) {
    const result = transformWithEsbuild(
      s.toString(),
      filename,
      { loader: 'ts' },
      s.generateMap({
        file: filename + '.map',
        source: filename
      })
    )
    return result
  }

  return {
    code: s.toString(),
    map: s.generateMap({
      file: filename + '.map',
      source: filename
    })
  }
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
): Promise<{
  code: string
  id: string
}> {
  const { script } = descriptor
  let code = script?.content || ''
  if (script?.src) {
    const resolvedId = await pluginContext.resolve(
      script.src,
      descriptor.filename
    )
    if (resolvedId) {
      pluginContext.addWatchFile(resolvedId.id)
      code = fs.readFileSync(resolvedId.id, 'utf-8')
      return {
        code,
        id: resolvedId.id
      }
    }
  }
  return {
    code,
    id: descriptor.filename
  }
}

/**
 * generate script block and transform script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export async function genScriptBlock(
  descriptor: SFCDescriptor,
  code: string
): Promise<{ output: string }> {
  return {
    output: genComponentTag(descriptor.script, {
      attrs() {
        return {}
      },
      content() {
        return code
      }
    })
  }
}
