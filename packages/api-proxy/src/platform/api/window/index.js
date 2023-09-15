import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

function onWindowResize (callback) {
  if (!ENV_OBJ.onWindowResize) {
    envError('onWindowResize')
    return
  }
  ENV_OBJ.onWindowResize(callback)
}

function offWindowResize (callback) {
  if (!ENV_OBJ.offWindowResize) {
    envError('offWindowResize')
    return
  }
  ENV_OBJ.offWindowResize(callback)
}

export {
  onWindowResize,
  offWindowResize
}
