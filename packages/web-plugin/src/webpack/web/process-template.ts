import { genComponentTag, parseRequest } from '@mpxjs/compile-utils'
import { CompilerResult } from '@mpxjs/compiler'
import { LoaderContext } from 'webpack'
import { templateProcess } from '../../processor/template-process'
import { JsonConfig } from '@mpxjs/compiler'
import mpx, { getOptions } from '../mpx'

export default function (
  template: CompilerResult['template'],
  {
    loaderContext,
    moduleId,
    ctorType,
    jsonConfig
  }: {
    loaderContext: LoaderContext<null>
    moduleId: string
    ctorType: string
    jsonConfig: JsonConfig
  },
  callback: (err?: Error | null, result?: any) => void
) {
  const { resourcePath } = parseRequest(loaderContext.resource)
  let builtInComponentsMap = {}
  let wxsModuleMap
  let genericsInfo
  let templateContent
  let wxsContentMap
  let output = '/* template */\n'
  const app = ctorType === 'app'

  if (app) {
    template = {
      type: 'template',
      attrs: {},
      tag: 'template',
      content:
        '<div class="app"><mpx-keep-alive><router-view class="page"></router-view></mpx-keep-alive></div>'
    }
  }
  if (template) {
    // 由于远端src template资源引用的相对路径可能发生变化，暂时不支持。
    if (template.src) {
      return callback(
        new Error(
          '[mpx loader][' +
            loaderContext.resource +
            ']: ' +
            'template content must be inline in .mpx files!'
        )
      )
    }
    if (template.lang) {
      return callback(
        new Error(
          '[mpx loader][' +
            loaderContext.resource +
            ']: ' +
            'template lang is not supported in trans web mode temporarily, we will support it in the future!'
        )
      )
    }
    ({
      wxsModuleMap,
      genericsInfo,
      builtInComponentsMap,
      templateContent,
      wxsContentMap
    } = templateProcess({
      template,
      options: getOptions(),
      pluginContext: loaderContext,
      jsonConfig,
      app,
      resource: resourcePath,
      moduleId
    }))
    Object.assign(mpx.wxsContentMap, wxsContentMap)
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
