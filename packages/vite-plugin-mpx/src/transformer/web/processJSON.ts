import path from 'path'
import { TransformPluginContext } from 'rollup'
import { ProcessResult } from './process'
import { ResolvedOptions } from '../../index'
import { SFCDescriptor } from '../../compiler'
import mpx from '../../mpx'
import { JsonConfig } from '../../utils/resolveJson'
import parseRequest from '../../utils/parseRequest'
import pathHash from '../../utils/pageHash'
import resolveModuleContext from '../../utils/resolveModuleContext'
import addQuery from '../../utils/addQuery'
import normalizePath from '../../utils/normalizePath'

export interface ProcessJsonResult extends ProcessResult {
  localPagesMap: Record<
    string,
    {
      resource: string
      async: boolean
      isFirst: boolean
    }
  >
  localComponentsMap: Record<
    string,
    {
      resource: string
      async: boolean
    }
  >
  tabBarMap: Record<string, unknown>
  tabBarStr: string
}

export default async function processJSON(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<ProcessJsonResult> {
  const { filename, jsonConfig } = descriptor
  const { pagesMap, componentsMap, pagesEntryMap } = mpx
  const localPagesMap: ProcessJsonResult['localPagesMap'] = {}
  const localComponentsMap: ProcessJsonResult['localComponentsMap'] = {}

  const context = resolveModuleContext(descriptor.filename)

  const output = '/* json */\n'
  let tabBarMap: Record<string, unknown> = {}
  let tabBarStr = ''

  const defaultTabbar = {
    borderStyle: 'black',
    position: 'bottom',
    custom: false,
    isShow: true
  }

  function emitWarning(msg: string) {
    pluginContext.warn(new Error('[json processor][' + filename + ']: ' + msg))
  }

  /**
   * ./page/index/index.mpx = page/index/index
   * @param page - pagePath
   */
  function genPageName(page: string) {
    const relative = path.relative(context, page)
    return normalizePath(
      path.join('', /^(.*?)(\.[^.]*)?$/.exec(relative)?.[1] || '')
    )
  }

  const processTabBar = async (tabBar: JsonConfig['tabBar']) => {
    if (tabBar) {
      tabBar = Object.assign({}, defaultTabbar, tabBar)
      tabBarMap = {}
      jsonConfig?.tabBar?.list?.forEach(({ pagePath }) => {
        tabBarMap[pagePath] = true
      })
      tabBarStr = JSON.stringify(tabBar)
      tabBarStr = tabBarStr.replace(
        /"(iconPath|selectedIconPath)":"([^"]+)"/g,
        function (matched) {
          return matched
        }
      )
    }
  }

  const processPages = async (pages: JsonConfig['pages'] = []) => {
    for (const page of pages) {
      const pageModule = await pluginContext.resolve(
        addQuery(page, { page: true }), // skip entry valid
        filename
      )
      if (pageModule) {
        const { filename: pageFileName, query } = parseRequest(pageModule.id)
        const pageName = genPageName(pageFileName)
        const pageId = pageModule.id
        if (localPagesMap[pageName]) {
          emitWarning(
            `Current page [${page}] which is imported from [${filename}] has been registered in pagesMap already, it will be ignored, please check it and remove the redundant page declaration!`
          )
          return
        }
        pagesMap[pageId] = pageName
        pagesEntryMap[pageId] = filename
        localPagesMap[pageName] = {
          resource: pageId,
          async: !!query.async,
          isFirst: query.isFirst || false
        }
      } else {
        emitWarning(
          `Current page [${page}] is not in current pages directory [${context}]`
        )
      }
    }
  }

  const processComponent = async (component: string, componentName: string) => {
    if (component) {
      const componetModule = await pluginContext.resolve(
        addQuery(component, {
          component: true
        }),
        filename
      )
      if (componetModule) {
        const componentId = componetModule.id
        const { filename: componentFileName, query } = parseRequest(componentId)
        componentsMap[componentFileName] =
          componentFileName + pathHash(componentFileName)
        localComponentsMap[componentName] = {
          resource: componentId,
          async: !!query.async
        }
      }
    }
  }

  const processComponents = async (
    components: JsonConfig['usingComponents']
  ) => {
    return components
      ? Promise.all(
          Object.keys(components).map((key) => {
            return processComponent(components[key], key)
          }) || []
        )
      : Promise.resolve()
  }

  const processGenerics = (generics: JsonConfig['componentGenerics']) => {
    return generics
      ? Promise.all(
          Object.keys(generics).map((key) => {
            const generic = generics[key]
            if (generic.default) {
              return processComponent(generic.default, `${key}default`)
            } else {
              return Promise.resolve()
            }
          }) || []
        )
      : Promise.resolve()
  }

  try {
    await processPages(jsonConfig.pages)
    await processComponents(jsonConfig.usingComponents)
    await processGenerics(jsonConfig.componentGenerics)
    await processTabBar(jsonConfig.tabBar)
    return {
      output,
      localPagesMap,
      localComponentsMap,
      tabBarMap,
      tabBarStr
    }
  } catch (error) {
    pluginContext.error('[mpx loader] process json error')
  }
}
