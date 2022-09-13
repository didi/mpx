import genComponentTag from '@mpxjs/utils/gen-component-tag'
import fs from 'fs'
import MagicString from 'magic-string'
import path from 'path'
import { SourceMap, TransformPluginContext } from 'rollup'
import { transformWithEsbuild } from 'vite'
import { OPTION_PROCESSOR_PATH, TAB_BAR_CONTAINER_PATH } from '../../constants'
import { ResolvedOptions } from '../../options'
import { genImport } from '../../utils/genCode'
import omit from '../../utils/omit'
import parseRequest from '../../utils/parseRequest'
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

  const ctorType = app ? 'app' : page ? 'page' : 'component'

  const { i18n, isProduction } = options

  const componentGenerics = jsonConfig.componentGenerics

  const pagesMap: Record<string, string> = {}
  const componentsMap: Record<string, string> = {}

  Object.keys(localPagesMap).forEach((pageName, index) => {
    const varName = `__mpx__page__${index}`
    const isTabBar = tabBarMap && tabBarMap[pageName]
    const newPagePath = isTabBar
      ? TAB_BAR_CONTAINER_PATH
      : localPagesMap[pageName]
    const { query } = parseRequest(newPagePath)
    const async = query.async !== undefined
    !async && s.append(genImport(newPagePath, varName))
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

  Object.keys(localComponentsMap).forEach((componentName, index) => {
    const componentId = localComponentsMap[componentName]
    const { query } = parseRequest(componentId)
    const varName = `__mpx__component__${index}`
    const async = query.async !== undefined
    !async && s.append(genImport(componentId, varName))
    componentsMap[componentName] = genComponentCode(varName, componentId, {
      async
    })
  })

  Object.keys(builtInComponentsMap).forEach((componentName, index) => {
    const componentCfg = builtInComponentsMap[componentName]
    const varName = `__mpx__builtInComponent__${index}`
    s.append(genImport(componentCfg.resource, varName))
    componentsMap[componentName] = genComponentCode(
      varName,
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
      !isProduction && `global.currentResource = ${stringify(filename)}`,
      app &&
        `${genImport(APP_HELPER_CODE)}
        ${genImport(TAB_BAR_PAGE_HELPER_CODE)}
        ${genImport('vue', 'Vue')}
        ${genImport('vue-router', 'VueRouter')}`,
      i18n && genImport(I18N_HELPER_CODE, '{ i18n }'),
      genImport(
        OPTION_PROCESSOR_PATH,
        'processOption, { getComponent, getWxsMixin }'
      )
    ]
      .filter(Boolean)
      .join('\n') + '\n'
  )

  s.append(`\nconst wxsModules = {}\n`)

  if (wxsModuleMap) {
    const wxsModuleKeys = Object.keys(wxsModuleMap)
    for (let i = 0; i < wxsModuleKeys.length; i++) {
      const key = wxsModuleKeys[i]
      const wxsModuleId = wxsModuleMap[key]
      // inline wxs module, transform to iife
      if (wxsModuleId.startsWith('~')) {
        const mpxWxsPath = wxsModuleId.split('!=!')[1]
        const { filename, query } = parseRequest(mpxWxsPath)
        const wxsContent = wxsContentMap[`${filename}~${query.wxsModule}`]
        if (wxsContent) {
          const varName = `__mpx__wxs__${i}`
          const result = await transformWithEsbuild(wxsContent, '', {
            globalName: varName,
            format: 'iife'
          })
          s.append(result.code)
          s.append(`wxsModules.${key} = ${varName}\n`)
        }
      } else {
        // wxs file, tranfrom to esm with wxsPlugin
        const resolved = await pluginContext.resolve(wxsModuleId, filename)
        if (resolved) {
          const varName = `__mpx__wxs__${i}`
          s.append(genImport(resolved.id, varName))
          s.append(`wxsModules.${key} = ${varName}\n`)
        }
      }
    }
  }

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
      `  getWxsMixin(wxsModules),`,
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
