import loaderUtils from 'loader-utils'
import mime from 'mime'
import { parseRequest } from '@mpxjs/compile-utils'
import { LoaderDefinition } from 'webpack'

export interface Options {
  name?: string
  publicPathScope?: string
  mimetype?: string
  limit?: number
  publicPath?: string
  fallback?: string
}

const getOptions = loaderUtils.getOptions

const urlLoader: LoaderDefinition = function urlLoader(
  src: string | Buffer
): string {
  let transBase64 = false
  // @ts-ignore
  const options: Options = Object.assign({}, getOptions(this))
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const mimetype = options.mimetype || mime.getType(resourcePath)
  const publicPathScope =
    options.publicPathScope === 'all' ? 'all' : 'styleOnly'
  const limit = options.limit
  const useLocal = !limit || src.length < limit || queryObj.useLocal
  const isStyle = queryObj.isStyle

  if (isStyle) {
    if (options.publicPath) {
      if (useLocal) {
        transBase64 = true
      }
      if (queryObj.fallback) {
        transBase64 = false
      }
    } else {
      transBase64 = true
    }
  } else if (publicPathScope === 'styleOnly' || useLocal) {
    // 如果设置了publicPathScope为styleOnly且当前资源不为style时，则将传递给file-loader的publicPath删除，仅将style中的非local图像资源改为CDN地址
    // 否则全局的非local的图像资源都会被改为CDN地址
    delete options.publicPath
  }

  if (transBase64) {
    if (typeof src === 'string') {
      src = Buffer.from(src)
    }
    return `module.exports = ${JSON.stringify(
      `data:${mimetype || ''};base64,${src.toString('base64')}`
    )}`
  } else {
    const fallback = options.fallback
      ? require(options.fallback)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      : require('./file-loader').default
    return fallback.call(this, src, options)
  }
}

// @ts-ignore
// 设置 raw，获取二进制数据
module.exports.raw = true

export default urlLoader
