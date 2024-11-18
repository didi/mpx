import { ENV_OBJ, envError } from '../../../common/js'

const createVideoContext = ENV_OBJ.createVideoContext || envError('createVideoContext')

export {
  createVideoContext
}
