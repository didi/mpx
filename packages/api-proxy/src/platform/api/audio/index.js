import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const createInnerAudioContext = ENV_OBJ.createInnerAudioContext || envError('createInnerAudioContext')

export {
  createInnerAudioContext
}
