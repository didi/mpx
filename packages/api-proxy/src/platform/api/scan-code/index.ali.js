import { changeOpts, handleSuccess } from '../../../common/js'

function scanCode (options = {}) {
  const opts = changeOpts(options, {
    onlyFromCamera: 'hideAlbum'
  })

  handleSuccess(opts, res => {
    return changeOpts(res, { code: 'result' })
  })

  my.scan(opts)
}

export {
  scanCode
}
