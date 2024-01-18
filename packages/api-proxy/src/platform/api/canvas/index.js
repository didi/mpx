import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const createCanvasContext = ENV_OBJ.createCanvasContext || envError('createCanvasContext')

const canvasToTempFilePath = ENV_OBJ.canvasToTempFilePath || envError('canvasToTempFilePath')

const canvasGetImageData = ENV_OBJ.canvasGetImageData || envError('canvasGetImageData')

export {
  createCanvasContext,
  canvasToTempFilePath,
  canvasGetImageData
}
