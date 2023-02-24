import { templateCompiler } from '@mpxjs/compiler'
import {
  addQuery,
  matchCondition,
  parseRequest,
  getEntryName
} from '@mpxjs/compile-utils'
import RecordResourceMapDependency from '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency'
import RecordVueContentDependency from '@mpxjs/webpack-plugin/lib/dependencies/RecordVueContentDependency'
import async from 'async'
import loaderUtils from 'loader-utils'
import path from 'path'
import { LoaderContext } from 'webpack'
import { MPX_APP_MODULE_ID } from '../../constants'
import mpx, { getOptions } from '../mpx'
import processJSON from '../web/processJSON'
import processScript from '../web/processScript'
import processStyles from '../web/processStyles'
import processTemplate from '../web/processTemplate'
import pathHash from '../../utils/pathHash'
import { tsWatchRunLoaderFilter } from '@mpxjs/compile-utils'
import getOutputPath from '../../utils/get-output-path'
import { Dependency } from 'webpack'
import { jsonCompiler } from '@mpxjs/compiler'
import { proxyPluginContext } from '@mpxjs/plugin-proxy'

export default function (
  this: LoaderContext<null>,
  content: string
): string | undefined {
  this.cacheable()

  // 兼容处理处理ts-loader中watch-run/updateFile逻辑，直接跳过当前loader及后续的loader返回内容
  const pathExtname = path.extname(this.resourcePath)
  if (!['.vue', '.mpx'].includes(pathExtname)) {
    this.loaderIndex = tsWatchRunLoaderFilter(this.loaders, this.loaderIndex)
    return content
  }

  if (!mpx) {
    return content
  }
  const { resourcePath, queryObj } = parseRequest(this.resource)

  const packageRoot = queryObj.packageRoot || mpx.currentPackageRoot
  const packageName = packageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const mode = mpx.mode
  const env = mpx.env
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  let ctorType = 'app'
  if (pagesMap[resourcePath]) {
    // page
    ctorType = 'page'
  } else if (componentsMap[resourcePath]) {
    // component
    ctorType = 'component'
  }
  // 支持资源query传入isPage或isComponent支持页面/组件单独编译
  if (ctorType === 'app' && (queryObj.isComponent || queryObj.isPage)) {
    const entryName =
      getEntryName(this) ||
      getOutputPath(
        resourcePath,
        queryObj.isComponent ? 'component' : 'page',
        mpx
      ) ||
      ''
    ctorType = queryObj.isComponent ? 'component' : 'page'
    this._module?.addPresentationalDependency(
      <Dependency>(
        new RecordResourceMapDependency(
          resourcePath,
          ctorType,
          entryName,
          packageRoot!
        )
      )
    )
  }

  if (ctorType === 'app') {
    if (!mpx.appInfo?.name) {
      mpx.appInfo = {
        resourcePath,
        name: getEntryName(this)
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const loaderContext: any = this
  const stringifyRequest = (r: string) =>
    loaderUtils.stringifyRequest(loaderContext, r)
  const filePath = this.resourcePath
  const moduleId =
    ctorType === 'app'
      ? MPX_APP_MODULE_ID
      : 'm' + ((pathHash && pathHash(filePath)) || '')

  // 将mpx文件 分成四部分
  const parts = templateCompiler.parser(content, {
    filePath,
    needMap: this.sourceMap,
    mode,
    env
  })

  let output = ''
  const callback = this.async()

  jsonCompiler
    .parse(
      parts,
      loaderContext.context,
      proxyPluginContext(loaderContext),
      getOptions(),
      loaderContext._compilation?.inputFileSystem
    )
    .then(jsonConfig => {
      let componentGenerics = {}
      if (jsonConfig.componentGenerics) {
        componentGenerics = Object.assign({}, jsonConfig.componentGenerics)
      }
      // 处理mode为web时输出vue格式文件
      if (ctorType === 'app' && !queryObj.isApp) {
        const request = addQuery(this.resource, { isApp: true })
        const el = (mpx.webConfig && mpx.webConfig.el) || '#app'
        output += `
import App from ${stringifyRequest(request)}
import Vue from 'vue'
new Vue({
  el: '${el}',
  render: function(h){
    return h(App)
  }
})\n
`
        // 直接结束loader进入parse
        this.loaderIndex = -1
        return callback(null, output)
      }
      // 通过RecordVueContentDependency和vueContentCache确保子request不再重复生成vueContent
      const cacheContent =
        mpx.vueContentCache && mpx.vueContentCache.get(filePath)
      if (cacheContent) return callback(null, cacheContent)
      return async.waterfall(
        [
          (callback: (err?: Error | null, result?: any) => void) => {
            async.parallel(
              [
                callback => {
                  processTemplate(
                    parts.template,
                    {
                      loaderContext,
                      moduleId,
                      ctorType,
                      jsonConfig
                    },
                    callback
                  )
                },
                callback => {
                  processStyles(
                    parts.styles,
                    {
                      ctorType,
                      autoScope,
                      moduleId
                    },
                    callback
                  )
                },
                callback => {
                  processJSON(
                    jsonConfig,
                    {
                      loaderContext
                    },
                    callback
                  )
                }
              ],
              (err, res) => {
                callback(err, res)
              }
            )
          },
          (
            [templateRes, stylesRes, jsonRes]: any,
            callback: (err?: Error | null, result?: any) => void
          ) => {
            output += templateRes.output
            output += stylesRes.output
            output += jsonRes.output
            if (
              ctorType === 'app' &&
              jsonRes.jsonConfig.window &&
              jsonRes.jsonConfig.window.navigationBarTitleText
            ) {
              mpx.appTitle = jsonRes.jsonConfig.window.navigationBarTitleText
            }

            processScript(
              parts.script!,
              {
                loaderContext,
                ctorType,
                moduleId,
                componentGenerics,
                jsonConfig: jsonRes.jsonConfig,
                outputPath: queryObj.outputPath || '',
                tabBarMap: jsonRes.tabBarMap,
                builtInComponentsMap: templateRes.builtInComponentsMap,
                genericsInfo: templateRes.genericsInfo,
                wxsModuleMap: templateRes.wxsModuleMap,
                localComponentsMap: jsonRes.localComponentsMap,
                localPagesMap: jsonRes.localPagesMap
              },
              callback
            )
          }
        ],
        (err, scriptRes: any) => {
          if (err) return callback(err)
          output += scriptRes.output
          this._module &&
            this._module.addPresentationalDependency(
              <Dependency>new RecordVueContentDependency(filePath, output)
            )
          callback(null, output)
        }
      )
    })
}
