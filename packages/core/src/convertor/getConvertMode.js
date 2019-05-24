const CONVERTMODES = {
  'wx-ali': 'wxToAli'
}
export function getConvertMode (srcMode, mode) {
  return CONVERTMODES[srcMode + '-' + mode]
}
