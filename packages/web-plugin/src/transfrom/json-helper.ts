import path, { join } from 'path'
import { ProxyPluginContext, proxyPluginContext } from '@mpxjs/plugin-proxy'
import {
  addQuery,
  toPosix,
  isUrlRequest as isUrlRequestRaw,
  parseRequest
} from '@mpxjs/compile-utils'
import getOutputPath from '../utils/get-output-path'
import loaderUtils, {
  stringifyRequest as _stringifyRequest
} from 'loader-utils'
import { PluginContext } from 'rollup'
import { LoaderContext } from 'webpack'
import { Options } from '../options'

export interface CreateJSONHelper {
  stringifyRequest: (r: string) => string
  emitWarning: (r: string) => void
  processComponent: (
    component: string,
    context: string,
    { tarRoot, outputPath }: { tarRoot?: string; outputPath?: string }
  ) => Promise<
    { resource: string; outputPath: string; packageRoot: string } | undefined
  >
  processPage: (
    page: string | { path: string; src: string },
    context: string,
    tarRoot?: string
  ) => Promise<
    | { resource: string; outputPath: string; packageRoot: string; key: string }
    | undefined
  >
  isUrlRequest: (r: string, root: string) => boolean
  urlToRequest: (r: string, root: string) => string
}

export default function createJSONHelper({
  pluginContext,
  options,
  mode
}: {
  pluginContext: LoaderContext<null> | PluginContext | any
  options: Options
  mode: 'vite' | 'webpack'
}): CreateJSONHelper {
  const externals = options.externals || []
  const root = options.projectRoot
  const mpxPluginContext: ProxyPluginContext = proxyPluginContext(pluginContext)

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
    if (!isUrlRequest(component)) return
    const componentModule = await mpxPluginContext.resolve(component, context)
    if (!componentModule || !componentModule.id) return
    let resource = componentModule.id
    const { resourcePath, queryObj } = parseRequest(resource)
    if (queryObj.root) {
      // 删除root query
      resource = addQuery(resource, {}, false, ['root'])
    }
    if (!outputPath) {
      outputPath = getOutputPath(resourcePath, 'component', options) || ''
    }
    return {
      resource,
      outputPath: toPosix(join(tarRoot, outputPath)),
      packageRoot: tarRoot
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
    if (!isUrlRequest(page)) return
    if (mode === 'vite') {
      page = path.resolve(context, tarRoot, page)
      context = path.join(context, tarRoot)
    }
    const pageModule = await mpxPluginContext.resolve(
      addQuery(page, { isPage: true }),
      context
    )
    if (!pageModule || !pageModule.id) return
    const resource = pageModule.id
    const { resourcePath } = parseRequest(resource)
    let outputPath = ''
    if (aliasPath) {
      outputPath = aliasPath.replace(/^\//, '')
    } else {
      const relative = path.relative(context, resourcePath)
      if (/^\./.test(relative)) {
        // 如果当前page不存在于context中，对其进行重命名
        outputPath = getOutputPath(resourcePath, 'page', options) || ''
        mpxPluginContext.warn(
          `Current page [${resourcePath}] is not in current pages directory [${context}], the page path will be replaced with [${outputPath}], use ?resolve to get the page path and navigate to it!`
        )
      } else {
        const exec = /^(.*?)(\.[^.]*)?$/.exec(relative)
        if (exec) {
          outputPath = exec[1]
        }
      }
    }

    const key = [resourcePath, outputPath, tarRoot].join('|')
    return {
      resource,
      outputPath: toPosix(join(tarRoot, outputPath)),
      packageRoot: tarRoot,
      key
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
