import path from 'path'
import addQuery from '@mpxjs/compile-utils/add-query'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import loaderUtils from 'loader-utils'
import isUrlRequestRaw from '@mpxjs/compile-utils/is-url-request'
import mpx from '../mpx'
import resolve from '@mpxjs/compile-utils/resolve'
import { LoaderContext } from 'webpack'

interface EntryType {
  resource: string
  outputPath: string
  packageRoot: string
}

export default function createJSONHelper({
  loaderContext,
  emitWarning,
  customGetDynamicEntry
}: {
  loaderContext: LoaderContext<null>
  emitWarning: (msg: string) => void
  customGetDynamicEntry: (
    resource: string | false | undefined,
    type: string,
    outputPath: string,
    packageRoot: string,
    relativePath: string,
    context: string
  ) => EntryType
}): {
  processComponent: any
  processPage: any
  isUrlRequest: any
  urlToRequest: any
} {
  const externals = mpx.externals || []
  const root = mpx.projectRoot
  const publicPath =
    (loaderContext._compilation &&
      loaderContext._compilation.outputOptions.publicPath) ||
    ''
  const getOutputPath = mpx.getOutputPath

  const isUrlRequest = (r: string) => isUrlRequestRaw(r, root, externals)
  const urlToRequest = (r: string) => loaderUtils.urlToRequest(r)
  const getDynamicEntry = (
    request: string | false | undefined,
    type = '',
    outputPath = '',
    packageRoot = '',
    relativePath = '',
    context = ''
  ) => {
    if (typeof customGetDynamicEntry === 'function')
      return customGetDynamicEntry(
        request,
        type,
        outputPath,
        packageRoot,
        relativePath,
        context
      )
  }
  const processComponent = async (
    component: string,
    context: string,
    { tarRoot = '', outputPath = '', relativePath = '' }
  ) => {
    if (!isUrlRequest(component)) return { entry: component}
    let { resource } = await resolve(context, component, loaderContext)
    if (!resource) return null
    const { resourcePath, queryObj } = parseRequest(resource)
    if (queryObj.root) {
      // 删除root query
      resource = addQuery(resource, {}, false, ['root'])
    }
    if (!outputPath) {
      outputPath = (getOutputPath && getOutputPath(resourcePath, 'component')) || ''
    }
    const entry = getDynamicEntry(
      resource,
      'component',
      outputPath,
      tarRoot,
      relativePath
    )
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
    console.log(page, context)
    if (!isUrlRequest(page)) return { entry: page }
    const { resource } = await resolve(context, addQuery(path.resolve(context, tarRoot, page), { isPage: true }), loaderContext)
    console.log(123, resource)
    if (resource) {
      const { resourcePath, queryObj: { isFirst } } = parseRequest(resource)
      let outputPath
      if (aliasPath) {
        outputPath = aliasPath.replace(/^\//, '')
      } else {
        const relative = path.relative(context, resourcePath)
        if (/^\./.test(relative)) {
          // 如果当前page不存在于context中，对其进行重命名
          outputPath = (getOutputPath && getOutputPath(resourcePath, 'page')) || ''
          emitWarning(
            `Current page [${resourcePath}] is not in current pages directory [${context}], the page path will be replaced with [${outputPath}], use ?resolve to get the page path and navigate to it!`
          )
        } else {
          const exec = /^(.*?)(\.[^.]*)?$/.exec(relative)
          if (exec) {
            outputPath = exec[1]
          }
        }
      }
      const entry = getDynamicEntry(
        resource,
        'page',
        outputPath,
        tarRoot,
        publicPath + tarRoot
      )
      const key = [resourcePath, outputPath, tarRoot].join('|')
      return {
        entry,
        isFirst,
        key
      }
    }
  }

  return {
    processComponent,
    processPage,
    isUrlRequest,
    urlToRequest
  }
}
