/**
*@file 基础API
**/

function base64ToArrayBuffer(base64) {
  try {
    let base64Str = global.atob(base64),
        length = base64Str.length,
        bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
        bytes[i] = base64Str.charCodeAt(i)
    }
    return bytes.buffer
  } catch (e) {
    console.log('base64ToArrayBuffer error', e)
  }
}

function arrayBufferToBase64(arrayBuffer) {
  try {
    let binary = '',
        bytes = new Uint8Array(arrayBuffer),
        length = bytes.byteLength
    for (var i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return global.btoa(binary)
  } catch (e) {
    console.log('arrayBufferToBase64 error', e)
  }
}

export {
  base64ToArrayBuffer,
  arrayBufferToBase64
}