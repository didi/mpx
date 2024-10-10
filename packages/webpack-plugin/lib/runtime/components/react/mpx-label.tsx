/**
 * ✘ for
 */
import { JSX, useRef, forwardRef, ReactNode, Children, cloneElement } from 'react'
import {
  View,
  ViewStyle,
  NativeSyntheticEvent,
  TextStyle,
  LayoutChangeEvent
} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitStyle, splitProps, isText, throwReactWarning, useTransformStyle } from './utils'
import { LabelContext, LabelContextValue, VarContext } from './context'

export interface LabelProps {
  for?: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

function wrapChildren (props: LabelProps, { hasVarDec }: { hasVarDec: boolean }, textStyle?: TextStyle, varContext?: Record<string, any>) {
  const { textProps } = splitProps(props)
  let { children } = props

  if (textStyle || textProps) {
    children = Children.map(children, (child) => {
      if (isText(child)) {
        const style = { ...textStyle, ...child.props.style }
        return cloneElement(child, { ...textProps, style })
      }
      return child
    })
  }

  if (hasVarDec && varContext) {
    children = <VarContext.Provider key='childrenWrap' value={varContext}>{children}</VarContext.Provider>
  }

  return [
    children
  ]
}

const Label = forwardRef<HandlerRef<View, LabelProps>, LabelProps>(
  (props, ref): JSX.Element => {
    const {
      style = {},
      'enable-offset': enableOffset,
      'enable-var': enableVar,
      'external-var-context': externalVarContext,
      bindtap
    } = props

    const defaultStyle = {
      flexDirection: 'row'
    }

    const styleObj = {
      ...defaultStyle,
      ...style
    }

    const { 
      normalStyle,
      hasPercent,
      hasVarDec,
      varContextRef,
      setContainerWidth,
      setContainerHeight
    } = useTransformStyle(styleObj, { enableVar, externalVarContext })

    const { textStyle, backgroundStyle, innerStyle } = splitStyle(normalStyle)

    if (backgroundStyle) {
      throwReactWarning('[Mpx runtime warn]: Label does not support background image-related styles!')
    }

    const contextRef: LabelContextValue = useRef({
      triggerChange: () => { }
    })

    const layoutRef = useRef({})

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle
    })

    const onLayout = (res: LayoutChangeEvent) => {
      if (hasPercent) {
        const { width, height } = res?.nativeEvent?.layout || {}
        setContainerWidth(width || 0)
        setContainerHeight(height || 0)
      }
      nodeRef.current?.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          offsetLeft: number,
          offsetTop: number
        ) => {
          layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
        }
      )
    }

    const onTap = (evt: NativeSyntheticEvent<TouchEvent>) => {
      bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, props))
      contextRef.current.triggerChange?.(evt)
    }

    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef,
        style: innerStyle,
        bindtap: onTap,
        ...(enableOffset ? { onLayout } : {})
      },
      ['enable-offset'],
      {
        layoutRef
      }
    )

    return <View {...innerProps}>
      <LabelContext.Provider value={contextRef}>
        {
          wrapChildren(
            props,
            {
              hasVarDec 
            },
            textStyle,
            varContextRef.current
          )
        }
      </LabelContext.Provider>
    </View>
  }
)

Label.displayName = 'mpx-label'

export default Label
