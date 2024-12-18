import { envError } from '../../../common/js'
import { Image } from 'react-native'

const previewImage = envError('previewImage')

const compressImage = envError('compressImage')

const getImageInfo = function(options = {}) {
  const { src, success, fail, complete } = options
  let getImage
  if (src !== undefined) {
    result = {
      errMsg: 'getImageInfo:fail parameter error: parameter.src should be String instead of Undefined;',
      errno: 1001
    }
    fail(result)
    complete(result)
  }
  if (src === '') {
    return
  }
  Image.getSize(src, function(res) {
    console.log(res, 'test')
  }, function (err) {
    console.log(err, '=====')
  })
}

export {
  previewImage,
  compressImage,
  getImageInfo
}
