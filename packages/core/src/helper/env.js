const env = {}
env.wx = typeof wx !== 'undefined' && typeof wx.getSystemInfo === 'function'
env.ali = typeof my !== 'undefined' && typeof my.getSystemInfo === 'function'
env.swan = typeof swan !== 'undefined' && typeof swan.getSystemInfo === 'function'

export function is (type) {
  return !!env[type]
}
