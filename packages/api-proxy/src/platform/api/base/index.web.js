import { fromByteArray, toByteArray } from './base64'

function base64ToArrayBuffer (base64) {
  return toByteArray(base64)?.buffer // 判断了一下，RN下也是要.buffer才是buffer类型
}

function arrayBufferToBase64 (arrayBuffer) {
  return fromByteArray(arrayBuffer)
}

export {
  base64ToArrayBuffer,
  arrayBufferToBase64
}
