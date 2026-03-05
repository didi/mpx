import { hump2dash, dash2hump, isString } from '@mpxjs/utils'
import { steps, linear, cubicBezier } from 'react-native-reanimated'

/**
 * 解析 style 对象中的 animation 属性，转换为子属性并合并
 *
 * animation简写格式: name duration timing-function delay iteration-count direction fill-mode play-state
 * 支持逗号分隔的多个动画
 *
 * @param {Object} style - CSS style 对象
 * @returns {Object} 合并后的 animation 子属性对象
 * @throws {Error} 当缺少 animation-name 或 animation-duration 时抛出错误
 */
export function parseStyleAnimation(style) {
  return parseAnimation(style, 'animation')
}
/**
 * 解析 style 对象中的 transition 属性，转换为子属性并合并
 *
 * transition简写格式: property duration timing-function delay
 * 支持逗号分隔的多个过渡
 *
 * @param {Object} style - CSS style 对象
 * @returns {Object} 合并后的 transition 子属性对象
 * @throws {Error} 当缺少 transition-property 或 transition-duration 时抛出错误
 */
export function parseStyleTransition(style) {
  return parseAnimation(style, 'transition')
}

function parseAnimation(style, keywords = 'animation') {
  if (!style || typeof style !== 'object' || Array.isArray(style)) {
    const fnName = keywords === 'transition' ? 'parseStyleTransition' : 'parseStyleAnimation'
    throw new Error(`${fnName} 参数必须是对象`)
  }
  const result = {}

  // 按照对象属性顺序处理，后面的覆盖前面的
  for (const [prop, value] of Object.entries(style)) {
    if (prop === keywords) {
      // 解析 animation 简写属性
      const animationGroups = parseValues(value, ',')

      animationGroups.forEach((group, index) => {
        const parsed = keywords === 'transition' ? parseSingleTransition(group) : keywords === 'animation' ? parseSingleAnimation(group) : {}

        for (const [p, v] of Object.entries(parsed)) {
          if (!result[p]) {
            result[p] = []
          }
          result[p][index] = v
        }
      })
    } else if (prop.startsWith(keywords)) {
      // 处理子属性，覆盖简写解析的值
      const values = Array.isArray(value) ? value : parseValues(value, ',')
      result[prop] = []
      values.forEach((v, i) => {
        if (TIMING_FUNCTIONS_EXP.test(v)) {
          v = formatTimingFunction(v)
        }
        if (prop === 'transitionProperty') {
          // transitionProperty value 转驼峰
          v = dash2hump(v)
        }
        result[prop][i] = v
      })
    }
  }

  // 以 animation-name 的长度为标准处理其他属性
  const nameCount = result[`${keywords === 'transition' ? 'transitionProperty' : 'animationName'}`]?.length || 0
  if (nameCount > 0) {
    for (const [prop, value] of Object.entries(result)) {
      if (Array.isArray(value) && value.length !== nameCount) {
        if (value.length < nameCount) {
          // 补齐：用最后一个值填充
          const lastValue = value[value.length - 1]
          while (value.length < nameCount) {
            value.push(lastValue)
          }
        } else {
          // 截断到 nameCount 长度
          result[prop] = value.slice(0, nameCount)
        }
      }
    }
  }

  // 将单元素数组转为单值
  for (const [prop, value] of Object.entries(result)) {
    if (Array.isArray(value) && value.length === 1) {
      result[prop] = value[0]
    }
  }

  return result
}

/**
 * 解析单个animation值
 * @param {string} animationStr - 单个animation字符串
 * @returns {Object} 解析后的属性对象
 */
function parseSingleAnimation(animationStr) {
  const result = {}
  const values = parseValues(animationStr, ' ')
  const timeValues = []

  for (const val of values) {
    // 1. timing-function
    if (isTimingFunction(val)) {
      result.animationTimingFunction = TIMING_FUNCTIONS_EXP.test(val) ? formatTimingFunction(val) : val
      continue
    }

    // 2. 时间值 (duration 或 delay)
    if (isTime(val)) {
      timeValues.push(val)
      continue
    }

    // 3. iteration-count
    if (isIterationCount(val)) {
      result.animationIterationCount = val
      continue
    }

    // 4. direction
    if (isDirection(val)) {
      result.animationDirection = val
      continue
    }

    // 5. fill-mode
    if (isFillMode(val)) {
      result.animationFillMode = val
      continue
    }

    // 6. play-state
    if (isPlayState(val)) {
      result.animationPlayState = val
      continue
    }

    // 7. animation-name
    if (!result.animationName) {
      result.animationName = val
    }
  }

  // 处理时间值：第一个是 duration，第二个是 delay
  if (timeValues.length >= 1) {
    result.animationDuration = timeValues[0]
  }
  if (timeValues.length >= 2) {
    result.animationDelay = timeValues[1]
  }

  // 校验必需属性
  if (!result.animationName) {
    throw new Error('animation 缺少必需属性 animationName')
  }
  if (!result.animationDuration) {
    throw new Error(`动画 "${result.animationName}" 缺少必需属性 animationDuration`)
  }

  return result
}

/**
 * 解析单个 transition 值
 * @param {string} transitionStr - 单个 transition 字符串
 * @returns {Object} 解析后的属性对象
 */
function parseSingleTransition(transitionStr) {
  const result = {}
  const values = parseValues(transitionStr, ' ')
  const timeValues = []

  for (const val of values) {
    // 1. timing-function
    if (isTimingFunction(val)) {
      result.transitionTimingFunction = TIMING_FUNCTIONS_EXP.test(val) ? formatTimingFunction(val) : val
      continue
    }

    // 2. 时间值 (duration 或 delay)
    if (isTime(val)) {
      timeValues.push(val)
      continue
    }

    // 3. behavior
    if (isBehavior(val)) {
      result.transitionBehavior = val
      continue
    }

    // 4. transition-property (剩下的就是属性名)
    if (!result.transitionProperty) {
      result.transitionProperty = dash2hump(val)
    }
  }

  // 处理时间值：第一个是 duration，第二个是 delay
  if (timeValues.length >= 1) {
    result.transitionDuration = timeValues[0]
  }
  if (timeValues.length >= 2) {
    result.transitionDelay = timeValues[1]
  }

  // 校验必需属性
  if (!result.transitionProperty) {
    throw new Error('transition 缺少必需属性 transitionProperty')
  }
  if (!result.transitionDuration) {
    throw new Error(`过渡 "${result.transitionProperty}" 缺少必需属性 transitionDuration`)
  }

  return result
}

/**
 * 解析值字符串，支持括号内的内容作为一个整体
 * @param {string} str - 要解析的字符串
 * @param {string} char - 分隔符，默认为空格
 * @returns {string[]} 解析后的值数组
 */
function parseValues(str, char = ' ') {
  const result = []
  let temp = ''
  let depth = 0

  for (const c of str) {
    if (c === '(') depth++
    else if (c === ')') depth--

    if (c === char && depth === 0) {
      if (temp) result.push(temp.trim())
      temp = ''
    } else {
      temp += c
    }
  }

  if (temp) result.push(temp.trim())
  return result
}

const TIMING_FUNCTIONS = ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end']
const DIRECTIONS = ['normal', 'reverse', 'alternate', 'alternate-reverse']
const FILL_MODES = ['none', 'forwards', 'backwards', 'both']
const PLAY_STATES = ['running', 'paused']
const BEHAVIOR = ['allow-discrete', 'normal']
// 匹配包含参数形式的 timing-function，例如 cubic-bezier() / steps() / linear()
const TIMING_FUNCTIONS_EXP = /(cubic-bezier\s*\()|(steps\s*\()|(linear\s*\()/

function formatTimingFunction(val) {
  if (!val || !isString(val)) return val

  const raw = val.trim()
  const lower = raw.toLowerCase()

  // cubic-bezier(x1, y1, x2, y2)
  if (lower.startsWith('cubic-bezier(')) {
    const inner = raw.slice(raw.indexOf('(') + 1, raw.lastIndexOf(')'))
    const parts = inner.split(',').map(item => item.trim())
    if (parts.length !== 4) return raw
    const nums = parts.map(p => Number(p))
    if (nums.some(n => Number.isNaN(n))) return raw
    return cubicBezier(nums[0], nums[1], nums[2], nums[3])
  }

  // steps(stepsNumber, modifier?)
  if (lower.startsWith('steps(')) {
    const inner = raw.slice(raw.indexOf('(') + 1, raw.lastIndexOf(')'))
    if (!inner) return raw
    const parts = inner.split(',').map(item => item.trim()).filter(Boolean)
    const count = Number.parseInt(parts[0], 10)
    if (!Number.isFinite(count) || count <= 0) return raw
    const modifier = parts[1]
      ? parts[1].replace(/^['"]|['"]$/g, '').trim()
      : undefined
    return modifier ? steps(count, modifier) : steps(count)
  }

  // linear(...points)
  if (lower.startsWith('linear(')) {
    const inner = raw.slice(raw.indexOf('(') + 1, raw.lastIndexOf(')'))
    if (!inner) return raw
    const parts = inner.split(',').map(item => item.trim()).filter(Boolean)
    if (!parts.length) return raw

    const args = parts.map(part => {
      // 处理形如 "0.25 75%" 的写法
      const tokens = part.split(/\s+/).filter(Boolean)
      if (tokens.length === 2) {
        const num = Number(tokens[0])
        const percent = tokens[1]
        if (!Number.isNaN(num)) {
          return [num, percent]
        }
      }
      const num = Number(part)
      if (!Number.isNaN(num)) return num
      return part
    })

    return linear(...args)
  }

  return raw
}

function isTimingFunction(val) {
  const lower = val.toLowerCase()
  // 支持函数形式: cubic-bezier(), steps(), linear()
  if (TIMING_FUNCTIONS.includes(lower) || TIMING_FUNCTIONS_EXP.test(lower)) return true
  return false
}

function isTime(val) {
  // 支持负数时间值
  return /^-?[\d.]+(s|ms)$/i.test(val)
}

function isIterationCount(val) {
  return val === 'infinite' || /^[\d.]+$/.test(val)
}

function isDirection(val) {
  return DIRECTIONS.includes(val.toLowerCase())
}

function isFillMode(val) {
  return FILL_MODES.includes(val.toLowerCase())
}

function isPlayState(val) {
  return PLAY_STATES.includes(val.toLowerCase())
}
// 判断是否是 transition-behavior 值
function isBehavior(val) {
  // val === 'allow-discrete' || val === 'normal'
  return BEHAVIOR.includes(val.toLowerCase())
}
