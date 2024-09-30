import { isObject, isArray, dash2hump, isFunction, cached } from '@mpxjs/utils'
import { Dimensions } from 'react-native'

function concat (a = '', b = '') {
  return a ? b ? (a + ' ' + b) : a : b
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
const propertyDelimiter = /:(.+)/
const rpxRegExp = /^\s*(-?\d+(\.\d+)?)rpx\s*$/
const pxRegExp = /^\s*(-?\d+(\.\d+)?)(px)?\s*$/
const varRegExp = /^--.*/

const parseStyleText = cached((cssText = '') => {
  const res = {}
  const arr = cssText.split(listDelimiter)
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (item) {
      const tmp = item.split(propertyDelimiter)
      if (tmp.length > 1) {
        let k = tmp[0].trim()
        k = varRegExp.test(k) ? k : dash2hump(k)
        res[k] = tmp[1].trim()
      }
    }
  }
  return res
})

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

export default function styleHelperMixin (type) {
  return {
    methods: {
      __rpx (value) {
        const { width } = Dimensions.get('screen')
        // rn 单位 dp = 1(css)px =  1 物理像素 * pixelRatio(像素比)
        // px = rpx * (750 / 屏幕宽度)
        return value * width / 750
      },
      __getClass (staticClass, dynamicClass) {
        return concat(staticClass, stringifyDynamicClass(dynamicClass))
      },
      __getStyle (staticClass, dynamicClass, staticStyle, dynamicStyle, show) {
        // todo 每次返回新对象会导致react memo优化失效，需要考虑优化手段
        const result = {}
        const classMap = {}
        if (type === 'page' && isFunction(global.__getAppClassMap)) {
          Object.assign(classMap, global.__getAppClassMap.call(this))
        }
        if (isFunction(this.__getClassMap)) {
          Object.assign(classMap, this.__getClassMap())
        }
        if (staticClass || dynamicClass) {
          const classString = concat(staticClass, stringifyDynamicClass(dynamicClass))
          classString.split(/\s+/).forEach((className) => {
            if (classMap[className]) {
              Object.assign(result, classMap[className])
            } else if (this.props[className] && isObject(this.props[className])) {
              // externalClasses必定以对象形式传递下来
              Object.assign(result, this.props[className])
            }
          })
        }

        if (staticStyle || dynamicStyle) {
          const styleObj = Object.assign(parseStyleText(staticStyle), normalizeDynamicStyle(dynamicStyle))
          Object.assign(result, transformStyleObj(this, styleObj))
        }

        if (show === false) {
          Object.assign(result, {
            display: 'none'
          })
        }
        return result
      }
    }
  }
}
