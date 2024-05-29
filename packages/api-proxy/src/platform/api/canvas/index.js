import { ENV_OBJ, envError } from '../../../common/js'

const canvasToTempFilePath = ENV_OBJ.canvasToTempFilePath || envError('canvasToTempFilePath')

const canvasGetImageData = ENV_OBJ.canvasGetImageData || envError('canvasGetImageData')

export {
  canvasToTempFilePath,
  canvasGetImageData
}
