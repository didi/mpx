import Preview from './Preview'
import { isBrowser, throwSSRWarning } from '../../../common/js'

let preview = null

/**
 * 预览图片
 * @param {Object} options - 预览图片的配置项
 */
export const previewImage = (options) => {
  if (!isBrowser) {
    throwSSRWarning('previewImage API is running in non browser environments')
    return
  }
  if (!preview) preview = new Preview()
  preview.show(options)
}
