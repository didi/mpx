import { fromByteArray, toByteArray } from './base64'

function base64ToArrayBuffer (base64) {
  if (__mpx_mode__ === 'web') {
    return toByteArray(base64)?.buffer
  }
  return toByteArray(base64)
}

function arrayBufferToBase64 (arrayBuffer) {
  return fromByteArray(arrayBuffer)
}

export {
  base64ToArrayBuffer,
  arrayBufferToBase64
}
