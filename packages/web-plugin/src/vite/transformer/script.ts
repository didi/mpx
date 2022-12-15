import genComponentTag from '@mpxjs/compile-utils/gen-component-tag'
import MagicString from 'magic-string'
import { SourceMap, TransformPluginContext } from 'rollup'
import addQuery from '@mpxjs/compile-utils/add-query'
import { transformWithEsbuild } from 'vite'
import { OPTION_PROCESSOR_PATH, TAB_BAR_CONTAINER_PATH } from '../../constants'
import { ResolvedOptions } from '../../options'
import { genImport } from '../../utils/genCode'
import omit from '../../utils/omit'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import stringify, { shallowStringify } from '../../utils/stringify'
import { SFCDescriptor } from '../compiler'
import {
  APP_HELPER_CODE,
  I18N_HELPER_CODE,
  TAB_BAR_PAGE_HELPER_CODE
} from '../helper'

export const genComponentCode = (
  varName: string,
  resource: string,
  { async = false } = {},
  params: unknown = {}
): string => {
  if (!async) {
    return `getComponent(${varName}, ${stringify(params)})`
  } else {
    return `() => import(${stringify(resource)}).then(${varName} =>
          getComponent(${varName}.default, ${stringify(params)})
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
  map?: SourceMap
}> {
  const {
    id: componentId,
    filename,
    app,
    page,
    jsonConfig,
    script,
    wxsModuleMap,
    wxsContentMap,
    tabBarMap,
    builtInComponentsMap,
    genericsInfo,
    pagesMap: localPagesMap,
    componentsMap: localComponentsMap
  } = descriptor

  if (!script?.content) {
    return {
      code: ''
    }
  }

  const s = new MagicString(script.content)

  const ctorType = app ? 'app' : page ? 'page' : 'component'

  const { i18n } = options

  const componentGenerics = jsonConfig.componentGenerics

  const pagesMap: Record<string, string> = {}
  const componentsMap: Record<string, string> = {}

  if (script.src) {
    s.prepend(`${genImport(script.src)}\n`)
  }

  s.prepend(
    `${genImport(
      addQuery(descriptor.filename, {
        vue: true,
        type: 'globalDefine'
      })
    )}\n`
  )

  // import page by page json config
  Object.keys(localPagesMap).forEach((pageName, index) => {
    const varName = `__mpx__page__${index}`
    const isTabBar = tabBarMap && tabBarMap[pageName]
    const newPagePath = isTabBar
      ? TAB_BAR_CONTAINER_PATH
      : localPagesMap[pageName]
    const { queryObj: query } = parseRequest(newPagePath)
    const async = query.async !== undefined
    !async && s.prepend(`${genImport(newPagePath, varName)}\n`)
    pagesMap[pageName] = genComponentCode(
      varName,
      newPagePath,
      {
        async
      },
      isTabBar
        ? { __mpxBuiltIn: true }
        : {
            __mpxPageRoute: pageName
          }
    )
  })

  // import component by component json config
  Object.keys(localComponentsMap).forEach((componentName, index) => {
    const componentId = localComponentsMap[componentName]
    const { queryObj: query } = parseRequest(componentId)
    const varName = `__mpx__component__${index}`
    const async = query.async !== undefined
    !async && s.prepend(`${genImport(componentId, varName)}\n`)
    componentsMap[componentName] = genComponentCode(varName, componentId, {
      async
    })
  })

  // import runtime component
  Object.keys(builtInComponentsMap).forEach((componentName, index) => {
    const componentCfg = builtInComponentsMap[componentName]
    const varName = `__mpx__builtInComponent__${index}`
    s.prepend(`${genImport(componentCfg.resource, varName)}\n`)
    componentsMap[componentName] = genComponentCode(
      varName,
      componentCfg.resource,
      {},
      { __mpxBuiltIn: true }
    )
  })

  s.prepend(
    `${genImport(
      OPTION_PROCESSOR_PATH,
      'processOption, { getComponent, getWxsMixin }'
    )}\n`
  )

  if (i18n) {
    s.prepend(`${genImport(I18N_HELPER_CODE, '{ i18n }')}\n`)
  }

  if (app) {
    s.prepend(
      `${genImport(APP_HELPER_CODE)}
  ${genImport(TAB_BAR_PAGE_HELPER_CODE)}
  ${genImport('vue', 'Vue')}
  ${genImport('vue-router', 'VueRouter')}\n`
    )
  }

  // after source code
  s.append(`const wxsModules = {}\n`)

  if (wxsModuleMap) {
    const wxsModuleKeys = Object.keys(wxsModuleMap)
    for (let i = 0; i < wxsModuleKeys.length; i++) {
      const key = wxsModuleKeys[i]
      const wxsModuleId = wxsModuleMap[key]
      // inline wxs module, transform to iife
      if (wxsModuleId.startsWith('~')) {
        const mpxWxsPath = wxsModuleId.split('!=!')[1]
        const { resourcePath: filename, queryObj: query } =
          parseRequest(mpxWxsPath)
        const wxsContent = wxsContentMap[`${filename}~${query.wxsModule}`]
        if (wxsContent) {
          const varName = `__mpx__wxs__${i}`
          const result = await transformWithEsbuild(wxsContent, '', {
            globalName: varName,
            format: 'iife'
          })
          s.append(`${result.code}\n`)
          s.append(`wxsModules.${key} = ${varName}\n`)
        }
      } else {
        // wxs file, tranfrom to esm with wxsPlugin
        const varName = `__mpx__wxs__${i}`
        s.append(`${genImport(wxsModuleId, varName)}\n`)
        s.append(`wxsModules.${key} = ${varName}\n`)
      }
    }
  }

  s.append(
    `const currentOption = global.__mpxOptionsMap[${stringify(
      descriptor.id
    )}]\n`
  )

  s.append(
    `export default processOption(
      currentOption,
      ${stringify(ctorType)},
      ${stringify(Object.keys(localPagesMap)[0])},
      ${stringify(componentId)},
      ${stringify(
        page ? omit(jsonConfig, ['usingComponents', 'style', 'singlePage']) : {}
      )},
      ${shallowStringify(pagesMap)},
      ${shallowStringify(componentsMap)},
      ${stringify(tabBarMap)},
      ${stringify(componentGenerics)},
      ${stringify(genericsInfo)},
      getWxsMixin(wxsModules),
      ${app ? `Vue, VueRouter` : i18n ? 'i18n' : ''}
    )\n`
  )

  // transform ts
  if (script?.attrs.lang === 'ts' && !script.src) {
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    output: genComponentTag(descriptor.script!, {
      attrs() {
        return {}
      },
      content() {
        return code
      }
    })
  }
}
