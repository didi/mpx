import { ENV_OBJ, changeOpts, handleSuccess } from '../../../common/js'

function downloadFile (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { apFilePath: 'tempFilePath' })
  })

  return ENV_OBJ.downloadFile(opts)
}

function uploadFile (options = {}) {
  const opts = changeOpts(options, { name: 'fileName' })

  return ENV_OBJ.uploadFile(opts)
}

function saveFile (options = {}) {
  const opts = changeOpts(options, {
    tempFilePath: 'apFilePath'
  })

  handleSuccess(opts, res => {
    return changeOpts(res, { apFilePath: 'savedFilePath' })
  })

  return ENV_OBJ.saveFile(opts)
}

export {
  downloadFile,
  uploadFile,
  saveFile
}
