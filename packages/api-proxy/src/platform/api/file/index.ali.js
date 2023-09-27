import { changeOpts, handleSuccess } from '../../../common/js'

function downloadFile (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { apFilePath: 'tempFilePath' })
  })

  return my.downloadFile(opts)
}

function uploadFile (options = {}) {
  const opts = changeOpts(options, { name: 'fileName' })

  return my.uploadFile(opts)
}

function saveFile (options = {}) {
  const opts = changeOpts(options, {
    tempFilePath: 'apFilePath'
  })

  handleSuccess(opts, res => {
    return changeOpts(res, { apFilePath: 'savedFilePath' })
  })

  my.saveFile(opts)
}

export {
  downloadFile,
  uploadFile,
  saveFile
}
