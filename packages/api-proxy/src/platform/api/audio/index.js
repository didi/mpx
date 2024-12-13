import { ENV_OBJ, envError } from '../../../common/js'

const createInnerAudioContext = ENV_OBJ.createInnerAudioContext || envError('createInnerAudioContext')

export {
  createInnerAudioContext
}
