import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function downloadFile (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { apFilePath: 'tempFilePath' })
  })

  return ALI_OBJ.downloadFile(opts)
}

function uploadFile (options = {}) {
  const opts = changeOpts(options, { name: 'fileName' })

  return ALI_OBJ.uploadFile(opts)
}

function saveFile (options = {}) {
  const opts = changeOpts(options, {
    tempFilePath: 'apFilePath'
  })

  handleSuccess(opts, res => {
    return changeOpts(res, { apFilePath: 'savedFilePath' })
  })

  ALI_OBJ.saveFile(opts)
}

export {
  downloadFile,
  uploadFile,
  saveFile
}
