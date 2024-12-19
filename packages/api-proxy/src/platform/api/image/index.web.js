import Preview from './Preview'
import { isBrowser, throwSSRWarning, envError, defineUnsupportedProps, successHandle, failHandle } from '../../../common/js'

let preview = null

/**
 * 预览图片
 * @param {Object} options - 预览图片的配置项
 */
const previewImage = (options) => {
  if (!isBrowser) {
    throwSSRWarning('previewImage API is running in non browser environments')
    return
  }
  if (!preview) preview = new Preview()
  preview.show(options)
}

const compressImage = envError('compressImage')

const getImageInfo = function (options = {}) {
  const { src, success, fail, complete } = options

  if (src === undefined) {
    const result = {
      errMsg: 'getImageInfo:fail parameter error: parameter.src should be String instead of Undefined;',
      errno: 1001
    }
    failHandle(result, fail, complete)
    return
  }
  if (src === '') {
    return
  }

  const img = new Image()
  img.src = src

  img.onload = function () {
    const width = img.width
    const height = img.height
    const result = {
      errMsg: 'getImageInfo:ok',
      width,
      height
    }
    defineUnsupportedProps(result, ['path', 'orientation', 'type'])
    successHandle(result, success, complete)
  }

  img.onerror = function () {
    const result = {
      errMsg: 'getImageInfo:fail download image fail. '
    }
    failHandle(result, fail, complete)
  }
}

export {
  previewImage,
  compressImage,
  getImageInfo
}
