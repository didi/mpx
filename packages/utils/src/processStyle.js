import { mergeObjectArray } from './mergeData'
import { dash2hump, hump2dash } from './common'
import { hasOwn } from './processObj'

function parseStyleText (cssText) {
  const res = {}
  const listDelimiter = /;(?![^(]*\))/g
  const propertyDelimiter = /:(.+)/
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      const tmp = item.split(propertyDelimiter)
      tmp.length > 1 && (res[dash2hump(tmp[0].trim())] = tmp[1].trim())
    }
  })
  return res
}

function genStyleText (styleObj) {
  let res = ''
  for (const key in styleObj) {
    if (hasOwn(styleObj, key)) {
      const item = styleObj[key]
      res += `${hump2dash(key)}:${item};`
    }
  }
  return res
}

function normalizeDynamicStyle (value) {
  if (Array.isArray(value)) {
    return mergeObjectArray(value)
  }
  if (typeof value === 'string') {
    return parseStyleText(value)
  }
  return value
}

export {
  genStyleText,
  normalizeDynamicStyle
}
