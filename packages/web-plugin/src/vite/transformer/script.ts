import fs from 'fs'
import { SourceMap, TransformPluginContext } from 'rollup'
import MagicString from 'magic-string'
import { transformWithEsbuild } from 'vite'
import path from 'path'
import genComponentTag from '@mpxjs/utils/gen-component-tag'
import { ResolvedOptions } from '../../options'
import { SFCDescriptor } from '../compiler'
import {
  APP_HELPER_CODE,
  I18N_HELPER_CODE,
  TAB_BAR_PAGE_HELPER_CODE
} from '../helper'
import { resolveMpxRuntime } from '../../utils/resolveMpxRuntime'
import omit from '../../utils/omit'
import stringify, { shallowStringify } from '../../utils/stringify'
import parseRequest from '../../utils/parseRequest'

const optionProcessorPath = resolveMpxRuntime('optionProcessor')
const tabBarContainerPath = resolveMpxRuntime(
  'components/web/mpx-tab-bar-container.vue'
)

export const getResource =
  (resourceMap: string[] = []) =>
  (
    varString: string,
    resource: string,
    { async = false } = {},
    params: unknown = {}
  ): string => {
    if (!async) {
      resourceMap.push(`import ${varString} from ${stringify(resource)}`)
      return `getComponent(${varString}, ${stringify(params)})`
    } else {
      return `() => import("${resource}").then(${varString} => getComponent(${varString}.default, ${stringify(
        params
      )})
  )`
    }
  }

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
  const localPagesMap = descriptor.pagesMap
  const localComponentsMap = descriptor.componentsMap
  const builtInComponentsMap = descriptor.builtInComponentsMap
  const genericsInfo = descriptor.genericsInfo

  const ctorType = app ? 'app' : page ? 'page' : 'component'

  const i18n = options.i18n

  const componentGenerics = jsonConfig.componentGenerics

  const components: string[] = []

  const getComponent = getResource(components)

  const pagesMap: Record<string, string> = {}
  const componentsMap: Record<string, string> = {}

  Object.keys(localPagesMap).forEach((pagePath, index) => {
    const pageVar = `__mpx__page__${index}`
    if (tabBarMap && tabBarMap[pagePath]) {
      pagesMap[pagePath] = getComponent(
        pageVar,
        tabBarContainerPath,
        {
          async: false
        },
        {
          __mpxBuiltIn: true
        }
      )
    } else {
      const pageId = localPagesMap[pagePath]
      const { query } = parseRequest(pageId)
      pagesMap[pagePath] = getComponent(
        pageVar,
        pageId,
        {
          async: !!query.async
        },
        {
          __mpxPageRoute: pagePath
        }
      )
    }
  })

  Object.keys(localComponentsMap).forEach((componentName, index) => {
    const componentId = localComponentsMap[componentName]
    const { query } = parseRequest(componentId)
    componentsMap[componentName] = getComponent(
      `__mpx__component__${index}`,
      componentId,
      {
        async: !!query.async
      }
    )
  })

  Object.keys(builtInComponentsMap).forEach((componentName, index) => {
    const componentCfg = builtInComponentsMap[componentName]
    componentsMap[componentName] = getComponent(
      `__mpx__builtInComponent__${index}`,
      componentCfg.resource,
      {},
      { __mpxBuiltIn: true }
    )
  })

  const pageConfig = page
    ? omit(jsonConfig, ['usingComponents', 'style', 'singlePage'])
    : {}

  s.trimLines()

  s.prepend(
    [
      app &&
        `import "${APP_HELPER_CODE}"
      import Vue from "vue"
      import VueRouter from "vue-router"`,
      i18n && `import { i18n } from "${I18N_HELPER_CODE}"`,
      `import ${stringify(TAB_BAR_PAGE_HELPER_CODE)}`,
      `import processOption, { getComponent, getWxsMixin } from "${optionProcessorPath}"`,
      components.join('\n')
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
