const CONVERTMODES = {
  'wx-ali': 'wxToAli',
  'wx-web': 'wxToWeb',
  'wx-swan': 'wxToSwan',
  'wx-qq': 'wxToQq',
  'wx-tt': 'wxToTt',
  'wx-qa': 'wxToQa'
}

export function getConvertMode (srcMode) {
  return CONVERTMODES[srcMode + '-' + __mpx_mode__]
}
