import { ENV_OBJ, envError } from '../../../common/js'

const createCameraContext = ENV_OBJ.createCameraContext || envError('createCameraContext')

export {
  createCameraContext
}
