import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const createVideoContext = ENV_OBJ.createVideoContext || envError('createVideoContext')

export {
  createVideoContext
}
