import { useEffect, useRef, ReactNode, FunctionComponent, isValidElement } from 'react'
import { ExtendedViewStyle } from './types/common'
import { TextStyle } from 'react-native'

type GroupData = Record<string, Record<string, any>>

export const TEXT_STYLE_REGEX = /color|font.*|text.*|letterSpacing|lineHeight|includeFontPadding|writingDirection/

export const PERCENT_REGEX = /^\s*-?\d+(\.\d+)?%\s*$/

export const IMAGE_STYLE_REGEX = /^background(Image|Size|Repeat|Position)$/

export const TEXT_PROPS_REGEX =  /ellipsizeMode|numberOfLines/

export const DEFAULT_STYLE = {
  fontSize: 16
}

const URL_REGEX = /url\(["']?(.*?)["']?\)/

export function omit<T, K extends string>(obj: T, fields: K[]): Omit<T, K> {
  const shallowCopy: any = Object.assign({}, obj)
  for (let i = 0; i < fields.length; i += 1) {
    const key = fields[i]
    delete shallowCopy[key]
  }
  return shallowCopy
}

/**
 * 用法等同于 useEffect，但是会忽略首次执行，只在依赖更新时执行
 */
export const useUpdateEffect = (effect: any, deps: any) => {
  const isMounted = useRef(false)

  // for react-refresh
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
    } else {
      return effect()
    }
  }, deps)
}

/**
 * 解析行内样式
 * @param inlineStyle
 * @returns
 */
export const parseInlineStyle = (inlineStyle = ''): Record<string, string> => {
  return inlineStyle.split(';').reduce((styleObj, style) => {
    const [k, v, ...rest] = style.split(':')
    if (rest.length || !v || !k) return styleObj
    const key = k.trim().replace(/-./g, c => c.substring(1).toUpperCase())
    return Object.assign(styleObj, { [key]: v.trim() })
  }, {})
}

export const parseUrl = (cssUrl: string = '') => {
  if (!cssUrl) return

  const match = cssUrl.match(URL_REGEX)

  return match?.[1]
}

export const getRestProps = (transferProps: any = {}, originProps: any = {}, deletePropsKey: any = []) => {
  return {
    ...transferProps,
    ...omit(originProps, deletePropsKey)
  }
}

export const isText = (ele: ReactNode) => {
  if (isValidElement(ele)) {
    const displayName = (ele.type as FunctionComponent)?.displayName
    return displayName === 'mpx-text' || displayName === 'Text'  
  }
  return false
}

export const isEmbedded = (ele: ReactNode) => {
  if (isValidElement(ele)) {
    const displayName = (ele.type as FunctionComponent)?.displayName
    return displayName && ['mpx-checkbox', 'mpx-radio', 'mpx-switch'].includes(displayName) 
  }
  return false
}

export function every(children: ReactNode, callback: (children: ReactNode) => boolean ) {
  const childrenArray = Array.isArray(children) ? children : [children];
  return childrenArray.every((child) => callback(child as ReactNode))
}

export function groupBy(obj: Record<string, any>, callback: (key: string, val: string) => string, group:GroupData = {}):GroupData {
  let groupKey = ''
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) { // 确保处理对象自身的属性
      let val: string = obj[key] as string
      groupKey = callback(key, val)
      if (!group[groupKey]) {
        group[groupKey] = {}
      }
      group[groupKey][key] = val
    }
  }
  return group
}

export const normalizeStyle = (style: ExtendedViewStyle = {}) => {
  const { borderRadius } = style
  if (borderRadius && PERCENT_REGEX.test(borderRadius as string)) {
    style.borderTopLeftRadius = borderRadius
    style.borderBottomLeftRadius = borderRadius
    style.borderBottomRightRadius = borderRadius
    style.borderTopRightRadius = borderRadius
    delete style.borderRadius
  }
  ['backgroundSize', 'backgroundPosition'].forEach(name => {
    if (style[name] && typeof style[name] === 'string') {
      if (style[name].trim()) {
        style[name] = style[name].split(' ')
     }
    }
  })
  return style
}

export function splitStyle<T extends Record<string, any>>(styles: T) {
  return groupBy(styles, (key) => {
    if (TEXT_STYLE_REGEX.test(key)) {
      return 'textStyle'
    } else if (IMAGE_STYLE_REGEX.test(key)) {
      return 'imageStyle'
    } else {
      return 'innerStyle'
    }
  }, {})
}

export function splitProps<T extends Record<string, any>>(props: T) {
  return groupBy(props, (key) => {
    if (TEXT_PROPS_REGEX.test(key)) {
      return 'textProps'
    } else {
      return 'innerProps'
    }
  }, {})
}

export const throwReactWarning = (message: string) => {
  setTimeout(() => {
    console.warn(message)
  }, 0)
}

export const transformTextStyle = (styleObj: TextStyle) => {
  let { lineHeight } = styleObj
  if (typeof lineHeight === 'string' && PERCENT_REGEX.test(lineHeight)) {
    lineHeight = (parseFloat(lineHeight) / 100) * (styleObj.fontSize || DEFAULT_STYLE.fontSize)
    styleObj.lineHeight = lineHeight
  }
}
