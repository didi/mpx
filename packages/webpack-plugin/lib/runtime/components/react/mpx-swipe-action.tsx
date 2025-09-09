/**
 * ✔ action-width: 单按钮宽度设置
 * ✔ action-color: 单按钮颜色
 * ✔ action-text: 单按钮文本
 * ✔ action-text-color: 单按钮文本颜色
 * ✔ action-background: 单按钮背景色
 * ✔ action-font-size: 单按钮字体大小
 * ✔ action-font-weight: 单按钮字体粗细
 * ✔ action-style: 单按钮自定义样式
 * ✔ actions: 多按钮配置数组
 * ✔ right-threshold: 右滑阈值
 * ✔ friction: 滑动摩擦系数
 * ✔ disabled: 禁用滑动
 * ✔ auto-close: 自动关闭其他已打开的组件
 * ✔ bindtap: 内容区域点击事件
 * ✔ bindactiontap: 操作按钮点击事件
 * ✔ bindopen: 滑动打开事件
 * ✔ bindclose: 滑动关闭事件
 */

import { View, Text } from 'react-native'
import { useRef, useImperativeHandle, forwardRef, ReactNode, JSX, createElement, useCallback, useEffect } from 'react'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { SharedValue } from 'react-native-reanimated'
import useInnerProps from './getInnerListeners'
import { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, useLayout, wrapChildren, extendObject } from './utils'
import { ExtendedViewStyle } from './types/common'
import Portal from './mpx-portal'

export interface ActionConfig {
  text: string
  color?: string
  textColor?: string
  background?: string
  width?: number
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  style?: ExtendedViewStyle
}

export interface SwipeActionProps {
  children?: ReactNode
  style?: ExtendedViewStyle
  // 单按钮配置（向后兼容）
  'action-width'?: number
  'action-color'?: string
  'action-text'?: string
  'action-text-color'?: string
  'action-background'?: string
  'action-font-size'?: number
  'action-font-weight'?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  'action-style'?: ExtendedViewStyle
  // 多按钮配置
  actions?: ActionConfig[]
  'right-threshold'?: number
  friction?: number
  disabled?: boolean
  'auto-close'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  bindtap?: (event: any) => void
  bindactiontap?: (event: any) => void
  bindopen?: (event: any) => void
  bindclose?: (event: any) => void
}

// 全局状态管理，用于自动关闭其他已打开的组件
const openedInstances: Set<any> = new Set()

// 操作按钮组件
const ActionButton = ({ action, index, actionWidth, onTap }: {
  action: ActionConfig
  index: number
  actionWidth: number
  onTap: (index: number, action: ActionConfig) => void
}) => {
  const backgroundColor = action.background || action.color || '#ff4757'
  const textColor = action.textColor || '#fff'
  const fontSize = action.fontSize || 16
  const fontWeight = action.fontWeight || '500'

  const buttonInnerProps = useInnerProps({
    bindtap: () => onTap(index, action)
  }, [], {})

  const buttonStyle = {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: actionWidth,
    backgroundColor,
    ...action.style
  }

  return createElement(
    View,
    extendObject({
      key: index,
      style: buttonStyle
    }, buttonInnerProps),
    createElement(Text, {
      style: {
        color: textColor,
        fontSize,
        fontWeight
      }
    }, action.text)
  )
}

const _SwipeAction = forwardRef<HandlerRef<View, SwipeActionProps>, SwipeActionProps>((swipeActionProps, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(swipeActionProps)

  const {
    style = {},
    'action-width': actionWidth = 80,
    'action-color': actionColor = '#ff4757',
    'action-text': actionText = '删除',
    'action-text-color': actionTextColor = '#fff',
    'action-background': actionBackground,
    'action-font-size': actionFontSize = 16,
    'action-font-weight': actionFontWeight = '500',
    'action-style': actionStyle = {},
    actions,
    'right-threshold': rightThreshold,
    friction = 1,
    disabled = false,
    'auto-close': autoClose = true,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    bindactiontap,
    bindopen,
    bindclose
  } = props

  // 处理多按钮配置，优先使用 actions，否则使用单按钮配置
  const finalActions: ActionConfig[] = actions || [{
    text: actionText,
    color: actionColor,
    textColor: actionTextColor,
    background: actionBackground,
    width: actionWidth,
    fontSize: actionFontSize,
    fontWeight: actionFontWeight,
    style: actionStyle
  }]

  const totalActionWidth = finalActions.reduce((sum, action) => sum + (action.width || actionWidth), 0)
  const swipeableRef = useRef<any>(null)

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    hasPositionFixed,
    setWidth,
    setHeight
  } = useTransformStyle(style, {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)

  const nodeRef = useRef(null)

  const {
    layoutRef,
    layoutStyle,
    layoutProps
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

  const innerProps = useInnerProps(extendObject(props, layoutProps, { style: extendObject({}, innerStyle, layoutStyle) }), [], {
    layoutRef
  })

  // 注册实例
  const registerInstance = useCallback(() => {
    if (autoClose && swipeableRef.current) {
      openedInstances.add(swipeableRef.current)
    }
  }, [autoClose])

  // 注销实例
  const unregisterInstance = useCallback(() => {
    if (swipeableRef.current) {
      openedInstances.delete(swipeableRef.current)
    }
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      unregisterInstance()
    }
  }, [unregisterInstance])

  // 暴露方法给外部
  useImperativeHandle(ref, () => {
    return {
      open: () => swipeableRef.current?.openRight(),
      close: () => swipeableRef.current?.close(),
      getNodeInstance: () => ({
        props: { current: props },
        nodeRef: nodeRef,
        instance: swipeableRef.current
      })
    }
  })

  // 关闭其他已打开的实例
  const closeOtherInstances = useCallback(() => {
    if (autoClose) {
      openedInstances.forEach(instance => {
        if (instance !== swipeableRef.current) {
          instance.close()
        }
      })
    }
  }, [autoClose])

  // 处理操作按钮点击
  const handleActionTap = useCallback((actionIndex: number, action: ActionConfig) => {
    bindactiontap && bindactiontap({
      detail: {
        actionIndex,
        actionText: action.text,
        actionWidth: action.width || actionWidth,
        action
      }
    })
    // 点击操作按钮后自动关闭
    swipeableRef.current?.close()
  }, [actionWidth])

  // 渲染右侧操作区域
  const renderRightActions = useCallback((
    progress: SharedValue<number>,
    translation: SharedValue<number>
  ) => {
    return createElement(
      View,
      {
        style: {
          flexDirection: 'row',
          width: totalActionWidth
        }
      },
      ...finalActions.map((action, index) => {
        const actionWidth = action.width || 80
        return createElement(ActionButton, {
          key: index,
          action,
          index,
          actionWidth,
          onTap: handleActionTap
        })
      })
    )
  }, [totalActionWidth, finalActions])

  // 处理滑动打开事件
  const handleSwipeableOpen = useCallback((direction: 'left' | 'right') => {
    if (autoClose) {
      closeOtherInstances()
      // 延迟注册，确保 ref 已经准备好
      setTimeout(() => {
        registerInstance()
      }, 0)
    }
    bindopen && bindopen({
      detail: {
        actionWidth: totalActionWidth,
        actions: finalActions,
        actionCount: finalActions.length
      }
    })
  }, [totalActionWidth, finalActions, autoClose])

  // 处理滑动关闭事件
  const handleSwipeableClose = useCallback(() => {
    if (autoClose) {
      unregisterInstance() // 从全局集合中移除当前实例
    }
    bindclose && bindclose({ detail: {} })
  }, [autoClose])

  const childrenWithProps = wrapChildren(props, {
    hasVarDec,
    varContext: varContextRef.current,
    textStyle,
    textProps
  })

  const swipeableProps = {
    ref: swipeableRef,
    renderRightActions,
    rightThreshold: rightThreshold || totalActionWidth / 2,
    friction,
    onSwipeableOpen: handleSwipeableOpen,
    onSwipeableClose: handleSwipeableClose,
    containerStyle: {
      flex: 1
    },
    enabled: !disabled,
    // 限制滑动范围，防止过度滑动
    overshootRight: false, // 禁止向右过度滑动
    overshootLeft: false, // 禁止向左过度滑动
    enableTrackpadTwoFingerGesture: false, // 禁用触控板手势
    useNativeAnimations: true // 使用原生动画提高性能
  }

  const finalComponent = createElement(
    View,
    extendObject({
      ref: nodeRef
    }, innerProps),
    createElement(
      ReanimatedSwipeable,
      swipeableProps,
      childrenWithProps
    )
  )

  if (hasPositionFixed) {
    return createElement(Portal, null, finalComponent)
  }
  return finalComponent
})

_SwipeAction.displayName = 'MpxSwipeAction'

export default _SwipeAction
