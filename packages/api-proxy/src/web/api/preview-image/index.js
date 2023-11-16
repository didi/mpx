import Preview from './Preview'

let preview = null

/**
 * 预览图片
 * @param {Object} options - 预览图片的配置项
 */
export const previewImage = (options) => {
  if (!preview) preview = new Preview()
  preview.show(options)
}
