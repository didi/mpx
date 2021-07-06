export function getEnvObj () {
  if (typeof wx !== 'undefined' && typeof wx.getSystemInfo === 'function') {
    return wx
  } else if (typeof my !== 'undefined' && typeof my.getSystemInfo === 'function') {
    return my
  } else if (typeof swan !== 'undefined' && typeof swan.getSystemInfo === 'function') {
    return swan
  } else if (typeof qq !== 'undefined' && typeof qq.getSystemInfo === 'function') {
    return qq
  } else if (typeof jd !== 'undefined' && typeof jd.getSystemInfo === 'function') {
    return jd
  } else if (typeof tt !== 'undefined' && typeof tt.getSystemInfo === 'function') {
    return tt
  }
}
