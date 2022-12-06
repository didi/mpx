import { ParseHtmlNode } from '@mpxjs/compiler';
import { proxyPluginContext } from '../pluginContextProxy'
import addQuery from '@mpxjs/compile-utils/add-query'
import { Mpx } from '../types/mpx'
import templateCompiler, { SFCDescriptor } from '../types/compiler'
import { JsonConfig } from '../types/json-config'
import { PluginContext } from 'rollup'
import { LoaderContext } from 'webpack'

const calculateRootEleChild = (arr: ParseHtmlNode[]) => {
  if (!arr) return 0
  return arr.reduce((total: number, item: ParseHtmlNode) => {
    if (item.type === 1) {
      if (item.tag === 'template') {
        total += calculateRootEleChild(item.children)
      } else {
        total += 1
      }
    }
    return total
  }, 0)
}

export default function templateTransform ({ template, mpx, pluginContext, jsonConfig, resource, moduleId, app}: {
  template: Record<string, any>
  mpx: Mpx,
  pluginContext: LoaderContext<null> | PluginContext | any,
  jsonConfig: JsonConfig,
  resource: string,
  moduleId: string,
  app: boolean
}){
  const mpxPluginContext = pluginContext
  const { usingComponents = {}, componentGenerics = {} } = jsonConfig
  const builtInComponentsMap: SFCDescriptor['builtInComponentsMap'] = {}
  let genericsInfo: SFCDescriptor['genericsInfo']
  const wxsContentMap: SFCDescriptor['wxsContentMap'] = {}
  let wxsModuleMap: SFCDescriptor['wxsModuleMap'] = {}
  const templateInfo: Record<string, any> = {}
  const {
    mode,
    srcMode,
    defs,
    decodeHTMLText,
    externalClasses,
    checkUsingComponents
  } = mpx
  const addBuildComponent = (name: string, resource: string) => {
    builtInComponentsMap[name] = {
      resource: addQuery(resource, { isComponent: true })
    }
  }
  if (app) {
    addBuildComponent('mpx-keep-alive', '@mpxjs/web-plugin/src/runtime/components/web/mpx-keep-alive.vue')
    templateInfo.content = template.content
  } else {
    const { root, meta } = templateCompiler.parse(template.content, {
      warn: msg => {
        mpxPluginContext.warn('[template compiler]: ' + msg)
      },
      error: msg => {
        mpxPluginContext.error('[template compiler]: ' + msg)
      },
      usingComponents: Object.keys(usingComponents),
      hasComment: !!template?.attrs?.comments,
      isNative: false,
      isComponent: !app,
      mode,
      srcMode: template.mode || srcMode,
      defs,
      decodeHTMLText,
      externalClasses,
      hasScoped: false,
      moduleId,
      filePath: resource,
      i18n: null,
      checkUsingComponents,
      // web模式下全局组件不会被合入usingComponents中，故globalComponents可以传空
      globalComponents: [],
      // web模式下实现抽象组件
      componentGenerics
    })

    if (meta.builtInComponentsMap) {
      Object.entries(meta.builtInComponentsMap).forEach(
        ([name, resource]) => addBuildComponent(name, resource)
      )
    }

    genericsInfo = meta.genericsInfo

    if (root.tag === 'temp-node') {
      const childLen = calculateRootEleChild(root.children)
      if (childLen >= 2) {
        root.tag = 'div'
        templateCompiler.addAttrs(root, [{
          name: 'class',
          value: 'mpx-root-view'
        }])
      }
    }

    if (meta.wxsModuleMap) {
      wxsModuleMap = meta.wxsModuleMap
    }

    if (meta.wxsContentMap) {
      for (const module in meta.wxsContentMap) {
        wxsContentMap[`${resource}~${module}`] =
          meta.wxsContentMap[module]
      }
    }
    templateInfo.root = root
    templateInfo.content = templateCompiler.serialize(root)
  }
  return {
    ...templateInfo,
    wxsModuleMap,
    wxsContentMap,
    genericsInfo,
    builtInComponentsMap
  }
}
