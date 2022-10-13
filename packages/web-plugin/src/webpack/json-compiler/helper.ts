import path from 'path'
import addQuery from '@mpxjs/compile-utils/add-query'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import loaderUtils from 'loader-utils'
import isUrlRequestRaw from '@mpxjs/compile-utils/is-url-request'
import mpx from '../mpx'
import resolve from '@mpxjs/utils/resolve'
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
  const processComponent = (
    component: string,
    context: string,
    { tarRoot = '', outputPath = '', relativePath = '' },
    callback: (
      err: Error | null,
      entry?: EntryType | string
    ) => void
  ) => {
    if (!isUrlRequest(component)) return callback(null, component)

    resolve(context, component, loaderContext, (err, resource) => {
      if (err) return callback(err)
      if (!resource) return callback(null)
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
      callback(null, entry)
    })
  }

  const processPage = (
    page: string | { path: string; src: string },
    context: string,
    tarRoot = '',
    callback: (
      err: Error | null,
      entry?: EntryType | string,
      data?: {
        isFirst: boolean
        key: string
      }
    ) => void
  ) => {
    let aliasPath = ''
    if (typeof page !== 'string') {
      aliasPath = page.path
      page = page.src
    }
    if (!isUrlRequest(page)) return callback(null, page)
    // 增加 page 标识
    page = addQuery(page, { isPage: true })
    resolve(context, page as string, loaderContext, (err, resource) => {
      if (err) return callback(err)
      if (!resource) return callback(null)
      const {
        resourcePath,
        queryObj: { isFirst }
      } = parseRequest(resource)
      // const ext = path.extname(resourcePath)
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
      callback(null, entry, {
        isFirst,
        key
      })
    })
  }

  return {
    processComponent,
    processPage,
    isUrlRequest,
    urlToRequest
  }
}
