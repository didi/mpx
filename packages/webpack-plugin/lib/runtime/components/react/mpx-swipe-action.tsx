/**
 * mpx-swipe-action 左滑删除组件
 *
 * 基于 react-native-gesture-handler 的 ReanimatedSwipeable 实现
 *
 * 功能特性：
 * ✔ 左滑显示操作按钮
 * ✔ 支持自定义操作按钮
 * ✔ 高性能动画效果
 * ✔ 支持阈值设置
 * ✔ 自动关闭其他已打开的组件
 * ✔ 基于成熟的手势处理库
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useRef, useImperativeHandle, forwardRef, ReactNode, JSX, createElement, useCallback } from 'react'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation
} from 'react-native-reanimated'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, useLayout, wrapChildren, extendObject } from './utils'
import { ExtendedViewStyle } from './types/common'

export interface ActionConfig {
  text: string
  color?: string
  textColor?: string
  background?: string
  width?: number
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

const _SwipeAction = forwardRef<HandlerRef<View, SwipeActionProps>, SwipeActionProps>((swipeActionProps, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(swipeActionProps)

  const {
    style = {},
    'action-width': actionWidth = 80,
    'action-color': actionColor = '#ff4757',
    'action-text': actionText = '删除',
    'action-text-color': actionTextColor = '#fff',
    'action-background': actionBackground,
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
    bindtap,
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

  // 注册和注销实例
  const registerInstance = useCallback(() => {
    if (autoClose && swipeableRef.current) {
      openedInstances.add(swipeableRef.current)
      return () => {
        if (swipeableRef.current) {
          openedInstances.delete(swipeableRef.current)
        }
      }
    }
  }, [autoClose])

  // 暴露方法给外部
  useImperativeHandle(ref, () => ({
    getNodeInstance: () => ({
      props: { current: props },
      nodeRef,
      instance: {
        open: () => swipeableRef.current?.openRight(),
        close: () => swipeableRef.current?.close(),
        style: normalStyle
      }
    })
  }))

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
  }, [bindactiontap, actionWidth])

  // 处理内容区域点击
  const handleContentTap = useCallback(() => {
    bindtap && bindtap({ detail: {} })
  }, [bindtap])

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
        const backgroundColor = action.background || action.color || '#ff4757'
        const textColor = action.textColor || '#fff'

        return createElement(
          TouchableOpacity,
          {
            key: index,
            style: {
              justifyContent: 'center',
              alignItems: 'center',
              width: actionWidth,
              backgroundColor,
              ...action.style
            },
            onPress: () => handleActionTap(index, action),
            activeOpacity: 0.7
          },
          createElement(Text, {
            style: {
              color: textColor,
              fontSize: 16,
              fontWeight: '500'
            }
          }, action.text)
        )
      })
    )
  }, [totalActionWidth, finalActions, handleActionTap])

  // 处理滑动打开事件
  const handleSwipeableOpen = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      closeOtherInstances()
      registerInstance()
      bindopen && bindopen({
        detail: {
          actionWidth: totalActionWidth,
          actions: finalActions,
          actionCount: finalActions.length
        }
      })
    }
  }, [bindopen, totalActionWidth, finalActions, closeOtherInstances, registerInstance])

  // 处理滑动关闭事件
  const handleSwipeableClose = useCallback(() => {
    bindclose && bindclose({ detail: {} })
  }, [bindclose])

  const {
    layoutRef,
    layoutStyle,
    layoutProps
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

  const viewStyle = extendObject({}, innerStyle, layoutStyle)

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
      ...viewStyle,
      backgroundColor: 'transparent' // 确保容器背景透明
    },
    enabled: !disabled,
    // 限制滑动范围，防止过度滑动
    overshootRight: false, // 禁止向右过度滑动
    overshootLeft: false, // 禁止向左过度滑动
    enableTrackpadTwoFingerGesture: false, // 禁用触控板手势
    useNativeAnimations: true, // 使用原生动画提高性能
    ...layoutProps
  }

  return createElement(
    ReanimatedSwipeable,
    swipeableProps,
    createElement(
      TouchableOpacity,
      {
        style: {
          flex: 1,
          backgroundColor: 'transparent' // 确保内容区域背景透明
        },
        onPress: handleContentTap,
        activeOpacity: 1,
        delayPressIn: 0, // 移除按压延迟
        delayPressOut: 0 // 移除释放延迟
      },
      childrenWithProps
    )
  )
})

_SwipeAction.displayName = 'MpxSwipeAction'

export default _SwipeAction
