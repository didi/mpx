import path, { join } from 'path'
import addQuery from '@mpxjs/compile-utils/add-query'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import loaderUtils from 'loader-utils'
import isUrlRequestRaw from '@mpxjs/compile-utils/is-url-request'
import toPosix from '@mpxjs/compile-utils/to-posix'
import { LoaderContext } from 'webpack'

export default function createJSONHelper({ pluginContext, mpx, type }: {
  pluginContext: LoaderContext<null>
  mpx: any,
  type: 'vite'| 'webpack'
}): {
  processComponent: any
  processPage: any
  isUrlRequest: any
  urlToRequest: any
} {
  const externals = mpx.externals || []
  const root = mpx.projectRoot
  const getOutputPath = mpx.getOutputPath

  const isUrlRequest = (r: string) => isUrlRequestRaw(r, root, externals)
  const urlToRequest = (r: string) => loaderUtils.urlToRequest(r)

  const processComponent = async (
    component: string,
    context: string,
    { tarRoot = '', outputPath = '', relativePath = '' }
  ) => {
    if (!isUrlRequest(component)) return { entry: component }
    let componetModule = await pluginContext.resolve(component, context)
    if (!componetModule) return null
    const componentId = componetModule.id
    const { resourcePath, queryObj } = parseRequest(componentId)
    if (queryObj.root) {
      // 删除root query
      componentId = addQuery(componentId, {}, false, ['root'])
    }
    if (!outputPath) {
      outputPath = (getOutputPath && getOutputPath(resourcePath, 'component')) || ''
    }

    const entry = {
      resource: componentId,
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
    if (type === 'vite') {
      page = path.resolve(context, tarRoot, page)
      context = path.join(context, tarRoot)
    }
    const pageModule = await pluginContext.resolve(addQuery(page, { isPage: true }), context)
    console.log('23', page, context)
    if (pageModule) {
      const pageId = pageModule.id
      const { resourcePath } = parseRequest(pageId)
      let outputPath
      if (aliasPath) {
        outputPath = aliasPath.replace(/^\//, '')
      } else {
        const relative = path.relative(context, resourcePath)
        if (/^\./.test(relative)) {
          // 如果当前page不存在于context中，对其进行重命名
          outputPath = (getOutputPath && getOutputPath(resourcePath, 'page')) || ''
          pluginContext.warn(
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
        resource: pageId,
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
    processComponent,
    processPage,
    isUrlRequest,
    urlToRequest
  }
}
