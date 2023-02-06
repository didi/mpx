import { ParseHtmlNode } from '@mpxjs/compiler'
import { proxyPluginContext } from '@mpxjs/plugin-proxy'
import { addQuery } from '@mpxjs/compile-utils'
import { Options } from '../options'
import { Mpx } from '../mpx'
import { templateCompiler } from '@mpxjs/compiler'
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

export type TemplateTransformResult = {
  templateContent: string
  builtInComponentsMap: Record<
    string,
    {
      resource: string
    }
  >
  genericsInfo?: Record<string, unknown>
  wxsModuleMap: {
    [key: string]: string
  }
  wxsContentMap: {
    [key: string]: string
  }
}

export default function templateTransform({
  template,
  options,
  pluginContext,
  jsonConfig,
  resource,
  moduleId,
  app
}: {
  template: Record<string, any>
  options: Options
  pluginContext: LoaderContext<null> | PluginContext | any
  jsonConfig: JsonConfig
  resource: string
  moduleId: string
  app: boolean
}) {
  const mpxPluginContext = proxyPluginContext(pluginContext)
  const { usingComponents = {}, componentGenerics = {} } = jsonConfig
  const builtInComponentsMap: TemplateTransformResult['builtInComponentsMap'] =
    {}
  let genericsInfo: TemplateTransformResult['genericsInfo']
  let wxsModuleMap: TemplateTransformResult['wxsModuleMap'] = {}
  let templateContent = ''
  const {
    mode = 'web',
    srcMode,
    defs = {},
    decodeHTMLText = false,
    externalClasses = [],
    checkUsingComponents = false
  } = options
  const wxsContentMap: Mpx['wxsContentMap'] = {}
  const addBuildComponent = (name: string, resource: string) => {
    builtInComponentsMap[name] = {
      resource: addQuery(resource, { isComponent: true })
    }
  }
  if (app) {
    addBuildComponent(
      'mpx-keep-alive',
      '@mpxjs/web-plugin/src/runtime/components/web/mpx-keep-alive.vue'
    )
    templateContent = template.content
  } else {
    const { root, meta } = templateCompiler.parse(template.content, {
      warn: msg => {
        mpxPluginContext?.warn('[template compiler]: ' + msg)
      },
      error: msg => {
        mpxPluginContext?.error('[template compiler]: ' + msg)
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
      // todo 后续输出web也采用mpx的scoped处理
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
      Object.entries(meta.builtInComponentsMap).forEach(([name, resource]) =>
        addBuildComponent(name, resource)
      )
    }
    if (meta.wxsModuleMap) {
      wxsModuleMap = meta.wxsModuleMap
    }

    if (meta.wxsContentMap) {
      for (const module in meta.wxsContentMap) {
        wxsContentMap[`${resource}~${module}`] = meta.wxsContentMap[module]
      }
    }

    if (meta.genericsInfo) {
      genericsInfo = meta.genericsInfo
    }

    if (root.tag === 'temp-node') {
      const childLen = calculateRootEleChild(root.children)
      if (childLen >= 2) {
        root.tag = 'div'
        templateCompiler.addAttrs(root, [
          {
            name: 'class',
            value: 'mpx-root-view'
          }
        ])
      }
    }
    templateContent = templateCompiler.serialize(root)
  }
  return {
    templateContent,
    wxsModuleMap,
    wxsContentMap,
    genericsInfo,
    builtInComponentsMap
  }
}
