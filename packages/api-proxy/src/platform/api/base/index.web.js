import { fromByteArray, toByteArray } from './base64'

function base64ToArrayBuffer (base64) {
  return toByteArray(base64)
}

function arrayBufferToBase64 (arrayBuffer) {
  return fromByteArray(arrayBuffer)
}

export {
  base64ToArrayBuffer,
  arrayBufferToBase64
}
