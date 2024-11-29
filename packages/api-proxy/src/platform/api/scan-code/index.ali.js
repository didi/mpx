import { ENV_OBJ, changeOpts, handleSuccess } from '../../../common/js'

function scanCode (options = {}) {
  const opts = changeOpts(options, {
    onlyFromCamera: 'hideAlbum'
  })

  handleSuccess(opts, res => {
    return changeOpts(res, { code: 'result' })
  })

  return ENV_OBJ.scan(opts)
}

export {
  scanCode
}
