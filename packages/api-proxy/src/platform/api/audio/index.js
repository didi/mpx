import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

function createInnerAudioContext (options = {}) {
  if (!ENV_OBJ.createInnerAudioContext) {
    return envError('createInnerAudioContext')()
  }
  return ENV_OBJ.createInnerAudioContext(options)
}

export {
  createInnerAudioContext
}
