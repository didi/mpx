import { isObject, isArray, dash2hump } from '@mpxjs/utils'

function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

function stringifyArray (value) {
  let res = ''
  let classString
  for (let i = 0; i < value.length; i++) {
    if ((classString = stringifyDynamicClass(value[i]))) {
      if (res) res += ' '
      res += classString
    }
  }
  return res
}

function stringifyObject (value) {
  let res = ''
  const keys = Object.keys(value)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (value[key]) {
      if (res) res += ' '
      res += key
    }
  }
  return res
}

function stringifyDynamicClass (value) {
  if (isArray(value)) {
    value = stringifyArray(value)
  } else if (isObject(value)) {
    value = stringifyObject(value)
  }
  return value
}

const listDelimiter = /;(?![^(]*[)])/g
const propertyDelimiter = /':(.+)'/
const rpxRegExp = /^\s*(\d+(\.\d+)?)rpx\s*$/
const pxRegExp = /^\s*(\d+(\.\d+)?)(px)?\s*$/

function parseStyleText (cssText) {
  const res = {}
  const arr = cssText.split(listDelimiter)
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (item) {
      const tmp = item.split(propertyDelimiter)
      if (tmp.length > 1) {
        const k = dash2hump(tmp[0].trim())
        res[k] = tmp[1].trim()
      }
    }
  }
  return res
}

function normalizeDynamicStyle (value) {
  if (!value) return {}
  if (isArray(value)) {
    return mergeObjectArray(value)
  }
  if (typeof value === 'string') {
    return parseStyleText(value)
  }
  return value
}

function mergeObjectArray (arr) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    Object.assign(res, arr[i])
  }
  return res
}

function transformStyleObj (context, styleObj) {
  const keys = Object.keys(styleObj)
  const transformed = {}
  keys.forEach((prop) => {
    // todo 检测不支持的prop
    let value = styleObj[prop]
    let matched
    if ((matched = pxRegExp.exec(value))) {
      value = +matched[1]
    } else if ((matched = rpxRegExp.exec(value))) {
      value = context.__rpx(+matched[1])
    }
    // todo 检测不支持的value
    transformed[prop] = value
  })
  return transformed
}

export default function styleHelperMixin () {
  return {
    methods: {
      __rpx (value) {
        return value
      },
      __getStyle (staticClass, dynamicClass, staticStyle, dynamicStyle, show) {
        const result = []
        if (staticClass || dynamicClass) {
          const classMap = this.__getClassMap()
          const classString = concat(staticClass, stringifyDynamicClass(dynamicClass))
          classString.split(' ').forEach((className) => {
            if (classMap[className]) {
              result.push(classMap[className])
            }
          })
        }

        if (staticStyle || dynamicStyle) {
          const styleObj = Object.assign(parseStyleText(staticStyle), normalizeDynamicStyle(dynamicStyle))
          result.push(transformStyleObj(this, styleObj))
        }

        if (show === false) {
          result.push({
            display: 'none'
          })
        }
        return result
      }
    }
  }
}
