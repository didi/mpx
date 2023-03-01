import {
  genComponentTag,
  genImport,
  omit,
  parseRequest,
  shallowStringify,
  stringify
} from '@mpxjs/compile-utils'
import { scriptSetupCompiler } from '@mpxjs/compiler'
import MagicString from 'magic-string'
import { SourceMap, TransformPluginContext } from 'rollup'
import { Options } from 'src/options'
import remapping, { SourceMapInput } from '@ampproject/remapping'
import { transformWithEsbuild } from 'vite'
import { OPTION_PROCESSOR_PATH, TAB_BAR_CONTAINER_PATH } from '../../constants'
import { resolvedConfig } from '../config'
import {
  APP_HELPER_CODE,
  I18N_HELPER_CODE,
  TAB_BAR_PAGE_HELPER_CODE
} from '../helper'
import { setDescriptor, SFCDescriptor } from '../utils/descriptor-cache'

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
 * transform mpx script
 * @param code - mpx script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 * @returns script content
 */
export async function transformScript(
  descriptor: SFCDescriptor,
  options: Options,
  pluginContext: TransformPluginContext
): Promise<{
  code: string
  map?: SourceMap
}> {
  const {
    id: componentId,
    filename,
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

  if (!script?.content) {
    return {
      code: ''
    }
  }

  const mappings: SourceMapInput[] = []
  const ctorType = app ? 'app' : isPage ? 'page' : 'component'
  const { i18n } = options
  const componentGenerics = jsonConfig.componentGenerics
  const pagesMap: Record<string, string> = {}
  const componentsMap: Record<string, string> = {}

  if (script.setup) {
    const res = scriptSetupCompiler(
      script,
      descriptor.app ? 'app' : descriptor.isPage ? 'page' : '',
      descriptor.filename
    )
    script.content = res.content
    mappings.push(res.map as SourceMapInput)
  }

  const s = new MagicString(script.content)

  if (script.src) {
    s.prepend(`${genImport(script.src)}\n`)
    const resolvedId = await pluginContext.resolve(script.src, filename)
    if (resolvedId?.id) setDescriptor(resolvedId.id, descriptor)
  }

  !resolvedConfig.isProduction &&
    s.prepend(`global.currentResource = ${stringify(filename)}\n`)
  s.prepend(`global.currentModuleId = ${stringify(descriptor.id)}\n`)

  // import page by page json config
  Object.keys(localPagesMap).forEach((pageName, index) => {
    const pageCfg = localPagesMap[pageName]
    const varName = `__mpx__page__${index}`
    const isTabBar = tabBarMap && tabBarMap[pageName]
    const newPagePath = isTabBar ? TAB_BAR_CONTAINER_PATH : pageCfg.resource
    const async = pageCfg.async
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
    const componentCfg: {
      resource: string
      async: boolean
    } = localComponentsMap[componentName]
    const componentId = componentCfg.resource
    const varName = `__mpx__component__${index}`
    const async = componentCfg.async
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
    s.prepend(`${genImport(I18N_HELPER_CODE, '')}\n`)
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
  s.append(`\nconst wxsModules = {}\n`)

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
    `export default processOption({
      option: currentOption,
      ctorType: ${stringify(ctorType)},
      firstPage: ${stringify(Object.keys(localPagesMap)[0])},
      outputPath: ${stringify(componentId)},
      pageConfig: ${stringify(
        isPage
          ? omit(jsonConfig, ['usingComponents', 'style', 'singlePage'])
          : {}
      )},
      pagesMap: ${shallowStringify(pagesMap)},
      componentsMap: ${shallowStringify(componentsMap)},
      tabBarMap: ${stringify(tabBarMap)},
      componentGenerics: ${stringify(componentGenerics)},
      genericsInfo: ${stringify(genericsInfo)},
      mixin: getWxsMixin(wxsModules),
      ...${app ? `{ Vue: Vue, VueRouter: VueRouter }` : '{}'}
   })\n`
  )

  // transform ts
  if (script?.attrs.lang === 'ts' && !script.src && !script.setup) {
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

  let index = 0
  return {
    code: s.toString(),
    map: remapping(
      [
        s.generateMap({
          file: filename + '.map',
          source: filename
        }) as SourceMapInput
      ],
      () => {
        return mappings[index++] || null
      },
      true
    ) as SourceMap
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
      attrs(script: { attrs: { src?: string; setup?: boolean } }) {
        const attrs = Object.assign({}, script.attrs)
        delete attrs.src
        delete attrs.setup
        return attrs
      },
      content() {
        return code
      }
    })
  }
}
