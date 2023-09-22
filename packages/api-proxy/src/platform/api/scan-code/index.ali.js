import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function scanCode (options = {}) {
  const opts = changeOpts(options, {
    onlyFromCamera: 'hideAlbum'
  })

  handleSuccess(opts, res => {
    return changeOpts(res, { code: 'result' })
  })

  ALI_OBJ.scan(opts)
}

export {
  scanCode
}
