function getEnvObj () {
  if (typeof wx !== 'undefined' && typeof wx.getSystemInfo === 'function') {
    return wx
  } else if (typeof my !== 'undefined' && typeof my.getSystemInfo === 'function') {
    return my
  } else if (typeof swan !== 'undefined' && typeof swan.getSystemInfo === 'function') {
    return swan
  }
}

export default getEnvObj()
