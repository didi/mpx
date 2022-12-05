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
import { SFCDescriptor } from '../../types/compiler'
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
  map: SourceMap
}> {
  const { code, id: filename } = await resolveScript(
    descriptor,
    options,
    pluginContext
  )
  const s = new MagicString(code)
  const {
    id: componentId,
    app,
    isPage,
    jsonConfig,
    script,
    wxsModuleMap,
    wxsContentMap,
    tabBarMap,
    builtInComponentsMap,
    genericsInfo,
    localPagesMap,
    localComponentsMap
  } = descriptor
  const ctorType = app ? 'app' : isPage ? 'page' : 'component'

  const { i18n } = options

  const componentGenerics = jsonConfig.componentGenerics

  const pagesMap: Record<string, string> = {}
  const componentsMap: Record<string, string> = {}

  s.trimLines()

  s.prepend('\n')

  s.prepend(
    `\n${genImport(
      addQuery(descriptor.filename, {
        mpx: true,
        type: 'globalDefine'
      })
    )}`
  )

  // import page by page json config
  Object.keys(localPagesMap).forEach((pageName, index) => {
    const pageCfg = localPagesMap[pageName]
    const varName = `__mpx__page__${index}`
    const isTabBar = tabBarMap && tabBarMap[pageName]
    const newPagePath = isTabBar
      ? TAB_BAR_CONTAINER_PATH
      : pageCfg.resource
    const async = pageCfg.async !== undefined
    !async && s.prepend(`\n${genImport(newPagePath, varName)}`)
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
    const componentCfg: {
      resource: string
      async: boolean
    } = localComponentsMap[componentName]
    const componentId = componentCfg.resource
    const varName = `__mpx__component__${index}`
    const async = componentCfg.async !== undefined
    !async && s.prepend(`\n${genImport(componentId, varName)}`)
    componentsMap[componentName] = genComponentCode(varName, componentId, {
      async
    })
  })

  // import runtime component
  Object.keys(builtInComponentsMap).forEach((componentName, index) => {
    const componentCfg = builtInComponentsMap[componentName]
    const varName = `__mpx__builtInComponent__${index}`
    s.prepend(`\n${genImport(componentCfg.resource, varName)}`)
    componentsMap[componentName] = genComponentCode(
      varName,
      componentCfg.resource,
      {},
      { __mpxBuiltIn: true }
    )
  })

  s.prepend(
    `\n${genImport(
      OPTION_PROCESSOR_PATH,
      'processOption, { getComponent, getWxsMixin }'
    )}`
  )

  i18n && s.prepend(`\n${genImport(I18N_HELPER_CODE, '{ i18n }')}`)

  app &&
    s.prepend(
      `\n${genImport(APP_HELPER_CODE)}
  ${genImport(TAB_BAR_PAGE_HELPER_CODE)}
  ${genImport('vue', 'Vue')}
  ${genImport('vue-router', 'VueRouter')}`
    )

  // after source code
  s.append(`\nconst wxsModules = {}`)

  if (wxsModuleMap) {
    const wxsModuleKeys = Object.keys(wxsModuleMap)
    for (let i = 0; i < wxsModuleKeys.length; i++) {
      const key = wxsModuleKeys[i]
      const wxsModuleId = wxsModuleMap[key]
      // inline wxs module, transform to iife
      if (wxsModuleId.startsWith('~')) {
        const mpxWxsPath = wxsModuleId.split('!=!')[1]
        const { resourcePath: filename, queryObj: query } = parseRequest(mpxWxsPath)
        const wxsContent = wxsContentMap[`${filename}~${query.wxsModule}`]
        if (wxsContent) {
          const varName = `__mpx__wxs__${i}`
          const result = await transformWithEsbuild(wxsContent, '', {
            globalName: varName,
            format: 'iife'
          })
          s.append(`\n${result.code}`)
          s.append(`\nwxsModules.${key} = ${varName}\n`)
        }
      } else {
        // wxs file, tranfrom to esm with wxsPlugin
        const resolved = await pluginContext.resolve(wxsModuleId, filename)
        if (resolved) {
          const varName = `__mpx__wxs__${i}`
          s.append(`\n${genImport(resolved.id, varName)}`)
          s.append(`\nwxsModules.${key} = ${varName}\n`)
        }
      }
    }
  }

  s.append(
    `\nconst currentOption = global.__mpxOptionsMap[${stringify(
      descriptor.id
    )}]`
  )

  s.append(
    `\nexport default processOption(
      currentOption,
      ${stringify(ctorType)},
      ${stringify(Object.keys(localPagesMap)[0])},
      ${stringify(componentId)},
      ${stringify(
      isPage ? omit(jsonConfig, ['usingComponents', 'style', 'singlePage']) : {}
      )},
      ${shallowStringify(pagesMap)},
      ${shallowStringify(componentsMap)},
      ${stringify(tabBarMap)},
      ${stringify(componentGenerics)},
      ${stringify(genericsInfo)},
      getWxsMixin(wxsModules),
      ${app ? `Vue, VueRouter` : i18n ? 'i18n' : ''}
    )`
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
      code = `${genImport(resolvedId.id)}\n`
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
