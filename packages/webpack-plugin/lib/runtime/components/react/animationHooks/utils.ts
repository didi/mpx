import type { ExtendedViewStyle } from '../types/common'

// 多value解析
export function parseValues (str: string, char = ' ') {
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

// parsestring transform, eg: transform: 'rotateX(45deg) rotateZ(0.785398rad)'
export function parseTransform (transformStr: string) {
  const values = parseValues(transformStr)
  const transform: {[propName: string]: string|number|number[]}[] = []
  values.forEach(item => {
    const match = item.match(/([/\w]+)\((.+)\)/)
    if (match && match.length >= 3) {
      let key = match[1]
      const val = match[2]
      switch (key) {
        case 'translateX':
        case 'translateY':
        case 'scaleX':
        case 'scaleY':
        case 'rotateX':
        case 'rotateY':
        case 'rotateZ':
        case 'rotate':
        case 'skewX':
        case 'skewY':
        case 'perspective':
          // rotate 处理成 rotateZ
          key = key === 'rotate' ? 'rotateZ' : key
          // 单个值处理
          transform.push({ [key]: global.__formatValue(val) })
          break
        case 'matrix':
          transform.push({ [key]: parseValues(val, ',').map(val => +val) })
          break
        case 'translate':
        case 'scale':
        case 'skew':
        case 'translate3d': // x y 支持 z不支持
        case 'scale3d': // x y 支持 z不支持
        {
          // 2 个以上的值处理
          key = key.replace('3d', '')
          const vals = parseValues(val, ',').splice(0, 3)
          // scale(.5) === scaleX(.5) scaleY(.5)
          if (vals.length === 1 && key === 'scale') {
            vals.push(vals[0])
          }
          const xyz = ['X', 'Y', 'Z']
          transform.push(...vals.map((v, index) => {
            return { [`${key}${xyz[index] || ''}`]: global.__formatValue(v.trim()) }
          }))
          break
        }
      }
    }
  })
  return transform
}
// format style
export function formatStyle (style: ExtendedViewStyle): ExtendedViewStyle {
  if (!style.transform || Array.isArray(style.transform)) return style
  return Object.assign({}, style, {
    transform: parseTransform(style.transform)
  })
}
// transform 数组转对象
export function getTransformObj (transforms: { [propName: string]: string | number }[]) {
  'worklet'
  return transforms.reduce((transformObj, item) => {
    return Object.assign(transformObj, item)
  }, {} as { [propName: string]: string | number })
}
