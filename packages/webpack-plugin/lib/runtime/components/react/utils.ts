import { useEffect, useRef, ReactNode, ReactElement, FunctionComponent, isValidElement, useContext, useState } from 'react'
import { Dimensions } from 'react-native'
import { isObject, hasOwn, diffAndCloneA, noop } from '@mpxjs/utils'
import { VarContext } from './context'

export const TEXT_STYLE_REGEX = /color|font.*|text.*|letterSpacing|lineHeight|includeFontPadding|writingDirection/
export const PERCENT_REGEX = /^\s*-?\d+(\.\d+)?%\s*$/
export const BACKGROUND_REGEX = /^background(Image|Size|Repeat|Position)$/
export const TEXT_PROPS_REGEX = /ellipsizeMode|numberOfLines/
export const VAR_DEC_REGEX = /^--.*/
export const VAR_USE_REGEX = /var\(([^,]+)(?:,([^)]+))?\)/
export const URL_REGEX = /url\(["']?(.*?)["']?\)/
export const DEFAULT_FONT_SIZE = 16

export const throwReactWarning = (message: string) => {
  setTimeout(() => {
    console.warn(message)
  }, 0)
}

export function rpx (value: number) {
  const { width } = Dimensions.get('screen')
  // rn 单位 dp = 1(css)px =  1 物理像素 * pixelRatio(像素比)
  // px = rpx * (750 / 屏幕宽度)
  return value * width / 750
}

const rpxRegExp = /^\s*(-?\d+(\.\d+)?)rpx\s*$/
const pxRegExp = /^\s*(-?\d+(\.\d+)?)(px)?\s*$/

export function formatValue (value: string) {
  let matched
  if ((matched = pxRegExp.exec(value))) {
    return +matched[1]
  } else if ((matched = rpxRegExp.exec(value))) {
    return rpx(+matched[1])
  }
  return value
}

export function omit<T, K extends string> (obj: T, fields: K[]): Omit<T, K> {
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

export const parseUrl = (cssUrl = '') => {
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

export function isText (ele: ReactNode): ele is ReactElement {
  if (isValidElement(ele)) {
    const displayName = (ele.type as FunctionComponent)?.displayName
    return displayName === 'mpx-text' || displayName === 'Text'
  }
  return false
}

export function isEmbedded (ele: ReactNode): ele is ReactElement {
  if (isValidElement(ele)) {
    const displayName = (ele.type as FunctionComponent)?.displayName || ''
    return ['mpx-checkbox', 'mpx-radio', 'mpx-switch'].includes(displayName)
  }
  return false
}

export function every (children: ReactNode, callback: (children: ReactNode) => boolean) {
  const childrenArray = Array.isArray(children) ? children : [children]
  return childrenArray.every((child) => callback(child))
}

type GroupData = Record<string, Record<string, any>>
export function groupBy (obj: Record<string, any>, callback: (key: string, val: any) => string, group: GroupData = {}): GroupData {
  Object.entries(obj).forEach(([key, val]) => {
    const groupKey = callback(key, val)
    group[groupKey] = group[groupKey] || {}
    group[groupKey][key] = val
  })
  return group
}

export function splitStyle (styleObj: Object) {
  return groupBy(styleObj, (key) => {
    if (TEXT_STYLE_REGEX.test(key)) {
      return 'textStyle'
    } else if (BACKGROUND_REGEX.test(key)) {
      return 'backgroundStyle'
    } else {
      return 'innerStyle'
    }
  })
}

const percentRule: Record<string, string> = {
  translateX: 'width',
  translateY: 'height',
  borderTopLeftRadius: 'width',
  borderBottomLeftRadius: 'width',
  borderBottomRightRadius: 'height',
  borderTopRightRadius: 'height'
}

function transformPercent (styleObj: Record<string, any>, percentKeyPaths: Array<Array<string>>, { width, height }: { width?: number, height?: number }) {
  percentKeyPaths.forEach((percentKeyPath) => {
    setStyle(styleObj, percentKeyPath, ({ target, key, value }) => {
      const percentage = parseFloat(value) / 100
      const type = percentRule[key]
      if (type === 'height' && height) {
        target[key] = percentage * height
      } else if (type === 'width' && width) {
        target[key] = percentage * width
      } else {
        target[key] = 0
      }
    })
  })
}

function transformVar (styleObj: Record<string, any>, varKeyPaths: Array<Array<string>>, varContext: Record<string, string | number>) {
  varKeyPaths.forEach((varKeyPath) => {
    setStyle(styleObj, varKeyPath, ({ target, key, value }) => {
      const matched = VAR_USE_REGEX.exec(value)
      if (matched) {
        const varName = matched[1].trim()
        const fallback = (matched[2] || '').trim()
        if (hasOwn(varContext, varName)) {
          target[key] = varContext[varName]
        } else if (fallback) {
          target[key] = formatValue(fallback)
        } else {
          delete target[key]
        }
      }
    })
  })
}

function transformLineHeight (styleObj: Record<string, any>) {
  let { lineHeight } = styleObj
  if (typeof lineHeight === 'string' && PERCENT_REGEX.test(lineHeight)) {
    const hasFontSize = hasOwn(styleObj, 'fontSize')
    if (!hasFontSize) {
      throwReactWarning('[Mpx runtime warn]: The fontSize property could not be read correctly, so the default fontSize of 16 will be used as the basis for calculating the lineHeight!')
    }
    const fontSize = hasFontSize ? styleObj.fontSize : DEFAULT_FONT_SIZE
    lineHeight = (parseFloat(lineHeight) / 100) * fontSize
    styleObj.lineHeight = lineHeight
  }
}

interface TransformStyleConfig {
  enableVar?: boolean
  externalVarContext?: Record<string, any>
  enablePercent?: boolean
  enableLineHeight?: boolean
}

export function useTransformStyle (styleObj: Record<string, any> = {}, { enableVar, externalVarContext, enablePercent = true, enableLineHeight = true }: TransformStyleConfig) {
  const varStyle: Record<string, any> = {}
  const normalStyle: Record<string, any> = {}
  let hasVarDec = false
  const hasVarUse = false
  let hasPercent = false
  const varKeyPaths: Array<Array<string>> = []
  const percentKeyPaths: Array<Array<string>> = []
  let setContainerWidth = noop
  let setContainerHeight = noop

  function varVisitor ({ key, value, keyPath }: VisitorArg) {
    if (keyPath.length === 1) {
      if (VAR_DEC_REGEX.test(key)) {
        hasVarDec = true
        varStyle[key] = value
      } else {
        // clone对象避免set值时改写到props
        normalStyle[key] = isObject(value) ? diffAndCloneA(value).clone : value
      }
    }
    if (VAR_USE_REGEX.test(value)) {
      hasVarDec = true
      varKeyPaths.push(keyPath.slice())
    }
  }

  function percentVisitor ({ key, value, keyPath }: VisitorArg) {
    if (hasOwn(percentRule, key) && PERCENT_REGEX.test(value)) {
      hasPercent = true
      percentKeyPaths.push(keyPath.slice())
    }
  }

  const visitors = [varVisitor]

  if (enablePercent) visitors.push(percentVisitor)

  // traverse
  traverseStyle(styleObj, visitors)

  hasVarDec = hasVarDec || !!externalVarContext
  enableVar = enableVar || hasVarDec || hasVarUse
  const enableVarRef = useRef(enableVar)
  if (enableVarRef.current !== enableVar) {
    throw new Error('[Mpx runtime error]: css variable use/declare should be stable in the component lifecycle, or you can set [enable-var] with true.')
  }
  // apply var
  const varContextRef = useRef({})
  if (enableVarRef.current) {
    const varContext = useContext(VarContext)
    const newVarContext = Object.assign({}, varContext, externalVarContext, varStyle)
    // 缓存比较newVarContext是否发生变化
    if (diffAndCloneA(varContextRef.current, newVarContext).diff) {
      varContextRef.current = newVarContext
    }
    transformVar(normalStyle, varKeyPaths, varContextRef.current)
  }

  if (enablePercent) {
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    setContainerWidth = setWidth
    setContainerHeight = setHeight
    // apply percent
    if (hasPercent) {
      transformPercent(normalStyle, percentKeyPaths, { width, height })
    }
  }

  if (enableLineHeight) {
    // transform lineHeight
    transformLineHeight(normalStyle)
  }

  return {
    normalStyle,
    hasPercent,
    hasVarDec,
    hasVarUse,
    enableVarRef,
    varContextRef,
    setContainerWidth,
    setContainerHeight
  }
}

export interface VisitorArg {
  target: Record<string, any>
  key: string
  value: any
  keyPath: Array<string>
}

export function traverseStyle (styleObj: Record<string, any>, visitors: Array<(arg: VisitorArg) => void>) {
  const keyPath: Array<string> = []
  function traverse<T extends Record<string, any>> (target: T) {
    if (Array.isArray(target)) {
      target.forEach((value, index) => {
        const key = String(index)
        keyPath.push(key)
        visitors.forEach(visitor => visitor({
          target,
          key,
          value,
          keyPath
        }))
        traverse(value)
        keyPath.pop()
      })
    } else if (isObject(target)) {
      Object.entries(target).forEach(([key, value]) => {
        keyPath.push(key)
        visitors.forEach(visitor => visitor({ target, key, value, keyPath }))
        traverse(value)
        keyPath.pop()
      })
    }
  }
  traverse(styleObj)
}

export function setStyle (styleObj: Record<string, any>, keyPath: Array<string>, setter: (arg: VisitorArg) => void, needClone = false) {
  let target = styleObj
  const firstKey = keyPath[0]
  const lastKey = keyPath[keyPath.length - 1]
  if (needClone) target[firstKey] = diffAndCloneA(target[firstKey]).clone
  for (let i = 0; i < keyPath.length - 1; i++) {
    target = target[keyPath[i]]
    if (!target) return
  }
  setter({
    target,
    key: lastKey,
    value: target[lastKey],
    keyPath
  })
}

export function splitProps<T extends Record<string, any>> (props: T) {
  return groupBy(props, (key) => {
    if (TEXT_PROPS_REGEX.test(key)) {
      return 'textProps'
    } else {
      return 'innerProps'
    }
  })
}
