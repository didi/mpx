import { error, warn } from '@mpxjs/utils'
import { extendObject, parseUrl } from './utils'

export type LinearInfo = {
  colors: Array<string>,
  locations: Array<number>,
  direction?: string
}

// CSS <angle> supports deg/turn/rad/grad.
export const angleRegExp = /^\s*(-?\d+(?:\.\d+)?)(deg|turn|rad|grad)\b/
const gradientToRegExp = /^to\b\s*/
const linearGradientRegExp = /linear-gradient\((.*)\)/
const topLevelCommaRegExp = /,(?![^(#]*\))/
const stopWhitespaceRegExp = /(?<!,)\s+/
const validStopPosRegExp = /^-?\d+(?:\.\d+)?%$|^0$/
const colorHintLeadingRegExp = /^[-+.\d]/

function calcSteps (startVal: number, endVal: number, len: number) {
  const diffVal = endVal - startVal
  const step = diffVal / len
  const newArr: Array<number> = []
  for (let i = 1; i < len; i++) {
    const val = startVal + step * i
    newArr.push(+val.toFixed(2))
  }

  return newArr
}

function parseLinearGradient (text: string): LinearInfo | null | undefined {
  let linearText = text.trim().match(linearGradientRegExp)?.[1]
  if (!linearText) return

  if (linearText.includes('linear-gradient(')) {
    error(`[mpx-view] background-image 暂不支持多重渐变 (multi gradients)，已丢弃，原值: ${text}`)
    return null
  }

  if (gradientToRegExp.test(linearText)) {
    linearText = linearText.replace(gradientToRegExp, '')
  } else if (!angleRegExp.test(linearText)) {
    linearText = '180deg ,' + linearText
  }
  const [direction, ...colorList] = linearText.split(topLevelCommaRegExp)
  let startIdx = 0; let startVal = 0
  const linearInfo = colorList
    .map(item => item.trim().split(stopWhitespaceRegExp))
    .reduce<string[][]>((acc, parts) => {
      if (parts.length === 1 && colorHintLeadingRegExp.test(parts[0])) {
        warn(`[mpx-view] linear-gradient 暂不支持 color hint 写法 [${parts[0]}]，已丢弃该色标`)
        return acc
      }
      const [color, ...positions] = parts
      if (positions.length === 0) {
        acc.push([color])
      } else {
        for (const pos of positions) {
          if (!validStopPosRegExp.test(pos)) {
            warn(`[mpx-view] linear-gradient 色标位置仅支持百分比 [${color} ${pos}] 已丢弃位置，仅保留颜色`)
            acc.push([color])
          } else {
            acc.push([color, pos])
          }
        }
      }
      return acc
    }, [])
    .reduce<LinearInfo>((prev, cur, idx, self) => {
      const { colors, locations } = prev
      const [color, val] = cur
      let numberVal: number = parseFloat(val) / 100

      if (idx === 0) {
        numberVal = isNaN(numberVal) ? 0 : numberVal
      } else if (self.length - 1 === idx) {
        numberVal = isNaN(numberVal) ? 1 : numberVal
      }

      if (idx - startIdx > 1 && !isNaN(numberVal)) {
        locations.push(...calcSteps(startVal, numberVal, idx - startIdx))
      }

      if (!isNaN(numberVal)) {
        startIdx = idx
        startVal = numberVal
      }

      colors.push(color.trim())

      !isNaN(numberVal) && locations.push(numberVal)
      return prev
    }, { colors: [], locations: [] })

  if (linearInfo.colors.length < 2) {
    error(`[mpx-view] linear-gradient 至少需要 2 个有效色标，已丢弃，原值: ${text}`)
    return null
  }

  return extendObject({}, linearInfo, {
    direction: direction.trim()
  })
}

export function parseBgImage (text?: string): {
  linearInfo?: LinearInfo
  direction?: string
  type?: 'image' | 'linear'
  src?: string
} {
  if (!text || text === 'none') return {}

  const src = parseUrl(text)
  if (src) return { src, type: 'image' }

  const linearInfo = parseLinearGradient(text)
  if (!linearInfo) {
    if (linearInfo === undefined) {
      error(`[mpx-view] background-image 暂不支持 ${text}，已丢弃，仅支持 url(...) / linear-gradient(...)。`)
    }
    return {}
  }
  return {
    linearInfo,
    type: 'linear'
  }
}
