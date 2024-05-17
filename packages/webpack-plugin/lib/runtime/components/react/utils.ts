import { useEffect, useRef } from 'react'
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native'

const TEXT_STYLE_REGEX = /color|font.*|text.*|letterSpacing|lineHeight|includeFontPadding|writingDirection/

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
export const extracteTextStyle = (style: StyleProp<ViewStyle & TextStyle>): TextStyle => {
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


export const getRestProps = (transferProps: any = {}, originProps: any = {}, deleteProps: any = []) => {
  return {
    ...transferProps,
    ...omit(originProps, deleteProps)
  }
}
