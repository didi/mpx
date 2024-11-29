module.exports = function (style) {
  const defaultTransRpxFn = function (match, $1) {
    const rpx2vwRatio = +(100 / 750).toFixed(8)
    return '' + ($1 * rpx2vwRatio) + 'vw'
  }
  const transRpxFn = global.__mpxTransRpxFn || defaultTransRpxFn
  const parsedStyleObj = {}
  const rpxRegExpG = /\b(-?\d+(\.\d+)?)rpx\b/g
  const parseStyleText = (cssText) => {
    const listDelimiter = /;(?![^(]*\))/g
    const propertyDelimiter = /:(.+)/
    if (typeof cssText === 'string') {
      cssText.split(listDelimiter).forEach((item) => {
        if (item) {
          const tmp = item.split(propertyDelimiter)
          tmp.length > 1 && (parsedStyleObj[tmp[0].trim()] = tmp[1].trim())
        }
      })
    } else if (typeof cssText === 'object') {
      if (Array.isArray(cssText)) {
        cssText.forEach(cssItem => {
          parseStyleText(cssItem)
        })
      } else {
        Object.assign(parsedStyleObj, cssText)
      }
    }
  }
  const transRpxStyleFn = (val) => {
    if (typeof val === 'string' && val.indexOf('rpx') > 0) {
      return val.replace(rpxRegExpG, transRpxFn).replace(/"/g, '')
    }
    return val
  }
  if (style) {
    style.forEach(item => {
      parseStyleText(item)
      for (const key in parsedStyleObj) {
        parsedStyleObj[key] = transRpxStyleFn(parsedStyleObj[key])
      }
    })
  }
  return parsedStyleObj
}
