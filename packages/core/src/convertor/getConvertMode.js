const CONVERTMODES = {
  'wx-ali': 'wxToAli',
  'wx-swan': 'wxToSwan',
  'wx-qq': 'wxToQq'
}
export function getConvertMode (srcMode, mode) {
  return CONVERTMODES[srcMode + '-' + mode]
}
