import { fromByteArray, toByteArray } from 'base64-js'

function base64ToArrayBuffer (base64: string) {
  return toByteArray(base64)
}

function arrayBufferToBase64 (arrayBuffer: ArrayBuffer) {
  return fromByteArray(arrayBuffer)
}

export {
  base64ToArrayBuffer,
  arrayBufferToBase64
}
