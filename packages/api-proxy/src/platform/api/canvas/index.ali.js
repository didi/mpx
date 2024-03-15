import { ENV_OBJ, changeOpts, envError, handleSuccess } from '../../../common/js'

function canvasToTempFilePath (options = {}) {
  handleSuccess(options, res => {
    return changeOpts(
      res,
      { errMsg: 'canvasToTempFilePath:ok' }
    )
  })

  ENV_OBJ.canvasToTempFilePath(options)
}
const createCanvasContext = envError('createCanvasContext')
const canvasGetImageData = envError('canvasGetImageData')

export {
  createCanvasContext,
  canvasToTempFilePath,
  canvasGetImageData
}
