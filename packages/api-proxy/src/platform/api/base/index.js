import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

function base64ToArrayBuffer (base64) {
  if (!ENV_OBJ.base64ToArrayBuffer) {
    return envError('base64ToArrayBuffer')()
  }
  return ENV_OBJ.base64ToArrayBuffer(base64)
}

function arrayBufferToBase64 (arrayBuffer) {
  if (!ENV_OBJ.arrayBufferToBase64) {
    return envError('arrayBufferToBase64')()
  }
  return ENV_OBJ.arrayBufferToBase64(arrayBuffer)
}

export {
  base64ToArrayBuffer,
  arrayBufferToBase64
}
