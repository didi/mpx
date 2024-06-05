import { useEffect, useRef, Children, ReactNode, isValidElement, FunctionComponent } from 'react'
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native'

export const TEXT_STYLE_REGEX = /color|font.*|text.*|letterSpacing|lineHeight|includeFontPadding|writingDirection/

export const PERCENT_REGX = /\d+(\.\d+)?%$/

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
 * 从 style 中提取 TextStyle
 * @param style
 * @returns
 */
export const extractTextStyle = (style: StyleProp<ViewStyle & TextStyle>): TextStyle => {
  return Object.entries(StyleSheet.flatten(style)).reduce((textStyle, [key, value]) => {
    TEXT_STYLE_REGEX.test(key) && Object.assign(textStyle, { [key]: value })
    return textStyle
  }, {})
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

export function every(children: ReactNode, callback: (children: ReactNode) => boolean ) {
  return Children.toArray(children).every((child) => callback(child as ReactNode))
}