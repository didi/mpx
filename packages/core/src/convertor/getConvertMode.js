const CONVERTMODES = {
  'wx-ali': 'wxToAli',
  'wx-web': 'wxToWeb'
}

export function getConvertMode (srcMode) {
  return CONVERTMODES[srcMode + '-' + __mpx_mode__]
}
