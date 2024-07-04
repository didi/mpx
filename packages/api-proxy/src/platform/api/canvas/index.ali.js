import { ENV_OBJ, changeOpts, envError, handleSuccess } from '../../../common/js'

function canvasToTempFilePath (options = {}) {
  handleSuccess(options, res => {
    return changeOpts(
      res,
      { errMsg: 'canvasToTempFilePath:ok' }
    )
  })

  return ENV_OBJ.canvasToTempFilePath(options)
}

const canvasGetImageData = envError('canvasGetImageData')

export {
  canvasToTempFilePath,
  canvasGetImageData
}
