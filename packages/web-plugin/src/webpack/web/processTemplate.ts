import genComponentTag from '@mpxjs/compile-utils/gen-component-tag'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import mpx from '../mpx'
import templateTransform from '../../transfrom/template-helper'
import { LoaderContext } from 'webpack'
import { JsonConfig } from '../../types/json-config'

export default function (template: { content: string, tag: string, attrs: Record<string, string> | null, src?: string, lang?: string}, {
  loaderContext,
  hasScoped,
  moduleId,
  ctorType,
  usingComponents,
  componentGenerics
}: {
  loaderContext: LoaderContext<null>
  hasScoped: boolean,
  moduleId: string,
  ctorType: 'app' | 'component',
  usingComponents: JsonConfig['usingComponents'],
  componentGenerics: JsonConfig['componentGenerics']
}, callback: (err?: Error | null, result?: any) => void) {
  const { resourcePath } = parseRequest(loaderContext.resource)
  let builtInComponentsMap = {}
  let wxsModuleMap
  let genericsInfo
  let templateContent
  let output = '/* template */\n'
  const app = ctorType === 'app'

  if (app) {
    template = {
      attrs: null,
      tag: 'template',
      content: '<div class="app"><mpx-keep-alive><router-view class="page"></router-view></mpx-keep-alive></div>'
    }
  }
  if (template) {
    // 由于远端src template资源引用的相对路径可能发生变化，暂时不支持。
    if (template.src) {
      return callback(new Error('[mpx loader][' + loaderContext.resource + ']: ' + 'template content must be inline in .mpx files!'))
    }
    if (template.lang) {
      return callback(new Error('[mpx loader][' + loaderContext.resource + ']: ' + 'template lang is not supported in trans web mode temporarily, we will support it in the future!'))
    }
    ({wxsModuleMap, genericsInfo, builtInComponentsMap, templateContent} = templateTransform({ template,
      mpx,
      pluginContext: loaderContext,
      jsonConfig: {
        usingComponents,
        componentGenerics
      },
      hasScoped,
      app,
      resource: resourcePath,
      moduleId,
      compileMode: 'webpack'
    }))
    template.content = templateContent
    output += `${genComponentTag(template)}\n\n`
  }
  callback(null, {
    output,
    builtInComponentsMap,
    genericsInfo,
    wxsModuleMap
  })
}
