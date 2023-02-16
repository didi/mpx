function isType (a) {
  return Object.prototype.toString.call(a).slice(8, -1)
}

function strToHtml (str = '', hightlightColor = '#ff7e33', style = '') {
  if (!str) return ''
  str = str + ''
  return str.replace(/\{(.+?)\}/g, (match, $1) => {
    return `<span class="hightlight" style="color: ${hightlightColor};${style}">${$1}</span>`
  })
}
const getProperty = (obj, key) => {
  if (isType(obj) === 'Object') {
    const keys = key.split('.')
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]]
      if (typeof obj !== 'object' || !obj) return
    }
    const lastKey = keys.pop()
    if (typeof obj[lastKey] === 'function') {
      return function () {
        return obj[lastKey].apply(obj, arguments)
      }
    } else {
      return obj[lastKey]
    }
  }
}

const camelizeRE = /_(\w)/g
function camelize (str) {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}

function extendKeys (keys = [], data = {}, usingCamel) {
  let res = {}
  keys.map(key => {
    res[usingCamel ? camelize(key) : key] = data[key]
  })
  return res
}

const ifApngSupport = function () {
  let ua
  if (__mpx_mode__ === 'web') {
    ua = window.navigator.userAgent.toLowerCase()
  }
  if (__mpx_mode__ === 'wx') {
    try {
      const res = wx.getSystemInfoSync()
      ua = res.system.toLowerCase()
    } catch (e) {
      console.log('getSystemInfoSync error ...', e)
    }
  }
  const androidReg = /android\s([\d.]+)/
  const isAndroid = androidReg.test(ua)
  const iosReg = /(iphone\sos)\s([\d_]+)/
  const isIos = iosReg.test(ua)
  if (isAndroid) {
    const match = androidReg.exec(ua)
    const version = match[1].split('.')[0]
    if (version < 5) return false
    return true
  } else if (isIos) {
    const match = iosReg.exec(ua)
    const version = match[1].split('.')[0]
    if (version < 9) return false
    return true
  }
  return true
}

export {
  strToHtml,
  isType,
  getProperty,
  extendKeys,
  ifApngSupport
}
