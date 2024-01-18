import Preview from './Preview'
import { envError } from '../../../common/js'

let preview = null

/**
 * 预览图片
 * @param {Object} options - 预览图片的配置项
 */
const previewImage = (options) => {
  if (!preview) preview = new Preview()
  preview.show(options)
}
const compressImage = envError('compressImage')

export {
  previewImage,
  compressImage
}
