import { error, dash2hump } from '@mpxjs/utils'
import { Easing } from 'react-native-reanimated'
// ms s 单位匹配
const secondRegExp = /^\s*(\d*(?:\.\d+)?)(s|ms)\s*$/
const cubicBezierExp = /cubic-bezier\(["']?(.*?)["']?\)/
const behaviorExp = /^(allow-discrete|normal)$/
// const percentExp = /^((-?(\d+(\.\d+)?|\.\d+))%)$/
const defaultValueExp = /^(inherit|initial|revert|revert-layer|unset)$/
// Todo linear() https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear
const timingFunctionExp = /^(step-start|step-end|steps|(linear\())/
const directionExp = /^(normal|reverse|alternate|alternate-reverse)$/
const fillModeExp = /^(none|forwards|backwards|both)$/
const easingKey = {
  linear: Easing.linear,
  ease: Easing.inOut(Easing.ease),
  'ease-in': Easing.in(Easing.poly(3)),
  'ease-in-out': Easing.inOut(Easing.poly(3)),
  'ease-out': Easing.out(Easing.poly(3))
  // 'step-start': '',
  // 'step-end': ''
}
// cubic-bezier 参数解析
function getBezierParams (str) {
  // ease 0.25, 0.1, 0.25, 1.0
  return str.match(cubicBezierExp)?.[1]?.split(',').map(item => +item)
}
// 解析动画时长
function getUnit (duration) {
  const match = secondRegExp.exec(duration)
  return match ? match[2] === 's' ? +match[1] * 1000 : +match[1] : 0
}
// 多value解析
function parseValues (str, char = ' ') {
  let stack = 0
  let temp = ''
  const result = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') {
      stack++
    } else if (str[i] === ')') {
      stack--
    }
    // 非括号内 或者 非分隔字符且非空
    if (stack !== 0 || str[i] !== char) {
      temp += str[i]
    }
    if ((stack === 0 && str[i] === char) || i === str.length - 1) {
      result.push(temp.trim())
      temp = ''
    }
  }
  return result
}
// 解析 animation-prop
function parseAnimationSingleProp (vals, property = '') {
  let setDuration = false
  return vals.map(value => {
    // global values
    if (defaultValueExp.test(value)) {
      error('[Mpx runtime error]: global values is not supported')
      return undefined
    }
    if (timingFunctionExp.test(value)) {
      error('[Mpx runtime error]: the timingFunction in step-start,step-end,steps(),liner() is not supported')
      return undefined
    }
    // timingFunction
    if (Object.keys(easingKey).includes(value) || cubicBezierExp.test(value)) {
      const bezierParams = getBezierParams(value)
      return {
        prop: 'animationTimingFunction',
        value: bezierParams?.length
            ? Easing.bezier(bezierParams[0], bezierParams[1], bezierParams[2], bezierParams[3])
            : easingKey[value] || Easing.inOut(Easing.ease)
      }
    }
    // direction
    if (directionExp.test(value)) {
      return {
        prop: 'animationDirection',
        value
      }
    }
    // fill-mode
    if (fillModeExp.test(value)) {
      return {
        prop: 'animationFillMode',
        value
      }
    }
    // duration & delay
    if (secondRegExp.test(value)) {
      const newProperty = property || (!setDuration ? 'animationDuration' : 'animationDelay')
      setDuration = true
      return {
        prop: newProperty,
        value: getUnit(value)
      }
    }
    if (!isNaN(+value)) {
      return {
        prop: 'animationIterationCount',
        value: +value
      }
    }
    // name
    return {
      prop: 'animationName',
      value
    }
  }).filter(item => item !== undefined)
}
// 解析 transition-prop
function parseTransitionSingleProp (vals, property = '') {
  let setDuration = false
  return vals.map(value => {
    // global values
    if (defaultValueExp.test(value)) {
      error('[Mpx runtime error]: global values is not supported')
      return undefined
    }
    if (timingFunctionExp.test(value)) {
      error('[Mpx runtime error]: the timingFunction in step-start,step-end,steps() is not supported')
      return undefined
    }
    // timingFunction
    if (Object.keys(easingKey).includes(value) || cubicBezierExp.test(value)) {
      const bezierParams = getBezierParams(value)
      return {
        prop: 'transitionTimingFunction',
        value: bezierParams?.length ? Easing.bezier(bezierParams[0], bezierParams[1], bezierParams[2], bezierParams[3]) : easingKey[val] || Easing.inOut(Easing.ease)
      }
    }
    // behavior
    if (behaviorExp.test(value)) {
      return {
        prop: 'transitionBehavior',
        value
      }
    }
    // duration & delay
    if (secondRegExp.test(value)) {
      const newProperty = property || (!setDuration ? 'transitionDuration' : 'transitionDelay')
      setDuration = true
      return {
        prop: newProperty,
        value: getUnit(value)
      }
    }
    // property
    return {
      prop: 'transitionProperty',
      value: dash2hump(value)
    }
  }).filter(item => item !== undefined)
}
// animation & transition 解析
export function parseAnimationStyle (originalStyle, cssProp = 'animation') {
  let animationData = {}
  Object.entries(originalStyle).forEach(([propName, value]) => {
    if (!propName.includes(cssProp)) return
    if (propName === cssProp) {
      const vals = parseValues(value, ',').reduce((map, item, idx) => {
        (cssProp === 'animation' ? parseAnimationSingleProp(parseValues(item)) : parseTransitionSingleProp(parseValues(item))).forEach(({ prop, value }) => {
          if (map[prop]) {
            map[prop].push(value)
          } else {
            map[prop] = [value]
          }
        })
        return map
      }, {})
      Object.entries(vals).forEach(([prop, vals]) => {
        if (animationData[prop]?.length) {
          (animationData[prop].length >= vals.length ? animationData[prop] : vals).forEach((item,idx) => {
            if (animationData[prop][idx] && vals[idx]) {
              animationData[prop][idx] = vals[idx]
            } else if (vals[idx]) {
              animationData[prop].push(vals[idx])
            }
          })
        } else {
          console.error(prop, vals, 999333)
          animationData[prop] = vals
        }
      })
      console.error('animation style, ', vals)
    } else {
      const vals = (cssProp === 'transition' ? parseTransitionSingleProp(parseValues(value, ','), propName) : parseAnimationSingleProp(parseValues(value, ','), propName)).reduce((acc, { prop, value }) => {
        acc.push(value)
        return acc
      }, [])
      console.error(`${propName} style, `, vals)
      if (animationData[propName]?.length) {
        (animationData[propName].length >= vals.length ? animationData[propName] : vals).forEach((item,idx) => {
          if (animationData[propName][idx] && vals[idx]) {
            animationData[propName][idx] = vals[idx]
          } else if (vals[idx]) {
            animationData[propName].push(vals[idx])
          }
        })
        // console.error(animationData[prop], 999111)
      } else {
        animationData[propName] = vals
      }
    }
  })
  return animationData
}
