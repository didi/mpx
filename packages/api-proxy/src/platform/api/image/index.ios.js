import { envError, defineUnsupportedProps, successHandle, failHandle } from '../../../common/js'
import { Image } from 'react-native'

const previewImage = envError('previewImage')

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
    const result = {
      errMsg: 'getImageInfo:fail image not found'
    }
    failHandle(result, fail, complete)
    return
  }
  let path = ''
  if (src.toLowerCase().startsWith("http")) {
    path = src
  }
  Image.getSize(src, (width, height) => {
    const result = {
      errMsg: 'getImageInfo:ok',
      width,
      height,
      path
    }
    defineUnsupportedProps(result, ['orientation', 'type'])
    successHandle(result, success, complete)
  }, (err) => {
    const result = {
      errMsg: 'getImageInfo:fail download image fail. reason: ' + err
    }
    failHandle(result, fail, complete)
  })
}

const chooseMedia = envError('chooseMedia')

export {
  previewImage,
  compressImage,
  getImageInfo,
  chooseMedia
}
