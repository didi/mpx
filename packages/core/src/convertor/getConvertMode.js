export function getConvertMode (srcMode) {
  return srcMode + 'To' + __mpx_mode__.replace(/^./, str => str.toUpperCase())
}
