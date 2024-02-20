import { changeOpts, handleSuccess } from '../../../common/js'

function previewImage (options = {}) {
  const opts = changeOpts(options)

  if (opts.current) {
    const idx = options.urls.indexOf(opts.current)
    opts.current = idx !== -1 ? idx : 0
  }

  my.previewImage(opts)
}

function compressImage (options = {}) {
  const opts = changeOpts(options, {
    quality: ''
  }, {
    compressLevel: Math.round(options.quality / 100 * 4), // 支付宝图片压缩质量为 0 ~ 4，微信是 0 ~ 100
    apFilePaths: [options.src]
  })

  handleSuccess(opts, res => {
    return changeOpts(
      res,
      { apFilePaths: '' },
      { tempFilePath: res.apFilePaths[0] }
    )
  })

  my.compressImage(opts)
}

export {
  previewImage,
  compressImage
}
