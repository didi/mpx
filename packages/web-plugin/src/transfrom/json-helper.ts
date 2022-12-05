import path, { join } from 'path'
import addQuery from '@mpxjs/compile-utils/add-query'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import loaderUtils, { stringifyRequest as _stringifyRequest } from 'loader-utils'
import isUrlRequestRaw from '@mpxjs/compile-utils/is-url-request'
import toPosix from '@mpxjs/compile-utils/to-posix'
import { ProxyPluginContext, proxyPluginContext } from '../pluginContextProxy'
import { PluginContext } from 'rollup'
import { LoaderContext } from 'webpack'
import getOutputPath from '../utils/get-output-path'
import { Mpx } from '../types/mpx'

export default function createJSONHelper({ pluginContext, mpx, mode }: {
  pluginContext: LoaderContext<null> | PluginContext | any,
  mpx: Mpx
  mode: 'vite'| 'webpack'
}): {
  stringifyRequest: any
  emitWarning: any
  processComponent: any
  processPage: any
  isUrlRequest: any
  urlToRequest: any
} {
  const externals = mpx.externals || []
  const root = mpx.projectRoot
  const mpxPluginContext:ProxyPluginContext = proxyPluginContext(pluginContext)

  const isUrlRequest = (r: string) => isUrlRequestRaw(r, root, externals)
  const urlToRequest = (r: string) => loaderUtils.urlToRequest(r)
  const stringifyRequest = (r: string) => _stringifyRequest(pluginContext, r)
  const emitWarning = (msg: string | Error) => {
    mpxPluginContext.warn('[json processor]: ' + msg)
  }

  const processComponent = async (
    component: string,
    context: string,
    { tarRoot = '', outputPath = '' }
  ) => {
    if (!isUrlRequest(component)) return { entry: component }
    const componentModule = await mpxPluginContext.resolve(component, context)
    if (!componentModule) return null
    let resource = componentModule.id
    const { resourcePath, queryObj } = parseRequest(resource)
    if (queryObj.root) {
      // 删除root query
      resource = addQuery(resource, {}, false, ['root'])
    }
    if (!outputPath) {
      outputPath = (getOutputPath(resourcePath, 'component', mpx)) || ''
    }

    const entry = {
      resource,
      outputPath: toPosix(join(tarRoot, outputPath)),
      packageRoot: tarRoot
    }
    return {
      entry
    }
  }

  const processPage = async (
    page: string | { path: string; src: string },
    context: string,
    tarRoot = ''
  ) => {
    let aliasPath = ''
    if (typeof page !== 'string') {
      aliasPath = page.path
      page = page.src
    }
    if (!isUrlRequest(page)) return { entry: page }
    if (mode === 'vite') {
      page = path.resolve(context, tarRoot, page)
      context = path.join(context, tarRoot)
    }
    const pageModule = await mpxPluginContext.resolve(addQuery(page, { isPage: true }), context)
    if (pageModule) {
      const resource = pageModule.id
      const { resourcePath } = parseRequest(resource)
      let outputPath = ''
      if (aliasPath) {
        outputPath = aliasPath.replace(/^\//, '')
      } else {
        const relative = path.relative(context, resourcePath)
        if (/^\./.test(relative)) {
          // 如果当前page不存在于context中，对其进行重命名
          outputPath = (getOutputPath(resourcePath, 'page', mpx)) || ''
          mpxPluginContext.warn(
            `Current page [${ resourcePath }] is not in current pages directory [${ context }], the page path will be replaced with [${ outputPath }], use ?resolve to get the page path and navigate to it!`
          )
        } else {
          const exec = /^(.*?)(\.[^.]*)?$/.exec(relative)
          if (exec) {
            outputPath = exec[1]
          }
        }
      }
      const entry = {
        resource,
        outputPath: toPosix(join(tarRoot, outputPath)),
        packageRoot: tarRoot
      }
      const key = [resourcePath, outputPath, tarRoot].join('|')
      return {
        entry,
        key
      }
    }
  }

  return {
    stringifyRequest,
    emitWarning,
    processComponent,
    processPage,
    isUrlRequest,
    urlToRequest
  }
}
