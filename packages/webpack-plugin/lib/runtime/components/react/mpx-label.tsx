/**
 * ✘ for
 */
import { JSX, useRef, forwardRef, ReactNode, useCallback, createElement } from 'react'
import { View, ViewStyle, NativeSyntheticEvent } from 'react-native'
import { noop, warn } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useLayout, useTransformStyle, wrapChildren, extendObject, useTextPassThrough } from './utils'
import { LabelContext, LabelContextValue } from './context'
import Portal from './mpx-portal'

export interface LabelProps {
  for?: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'enable-text-pass-through'?: boolean
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const Label = forwardRef<HandlerRef<View, LabelProps>, LabelProps>(
  (labelProps, ref): JSX.Element => {
    const { textProps, innerProps: props = {} } = splitProps(labelProps)
    const propsRef = useRef<any>({})

    const {
      style = {},
      'enable-var': enableVar,
      'enable-text-pass-through': enableTextPassThrough,
      'parent-font-size': parentFontSize,
      'parent-width': parentWidth,
      'parent-height': parentHeight
    } = props

    propsRef.current = props

    const defaultStyle = {
      flexDirection: 'row'
    }

    const styleObj = extendObject({}, defaultStyle, style)

    const {
      hasPositionFixed,
      hasSelfPercent,
      normalStyle,
      hasVarDec,
      varContextRef,
      setWidth,
      setHeight
    } = useTransformStyle(styleObj, { enableVar, parentFontSize, parentWidth, parentHeight })

    const nodeRef = useRef(null)
    useNodesRef(props, ref, nodeRef, { style: normalStyle })

    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

    const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)
    const textPassThrough = useTextPassThrough(textStyle, textProps, { enableTextPassThrough })

    if (backgroundStyle) {
      warn('Label does not support background image-related styles!')
    }

    const contextRef: LabelContextValue = useRef({
      triggerChange: noop
    })

    const onTap = useCallback((evt: NativeSyntheticEvent<TouchEvent>) => {
      const { bindtap } = propsRef.current
      bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, { props: propsRef.current }))
      contextRef.current.triggerChange(evt)
    }, [])

    const innerProps = useInnerProps(
      extendObject(
        {},
        props,
        layoutProps,
        {
          ref: nodeRef,
          style: extendObject({}, innerStyle, layoutStyle),
          bindtap: onTap
        }
      ),
      [
        'for'
      ],
      {
        layoutRef
      }
    )

    const finalComponent = createElement(View, innerProps, createElement(
      LabelContext.Provider,
      { value: contextRef },
      wrapChildren(
        props.children,
        {
          hasVarDec,
          varContext: varContextRef.current,
          textPassThrough
        }
      )
    ))

    if (hasPositionFixed) {
      return createElement(Portal, null, finalComponent)
    }

    return finalComponent
  }
)

Label.displayName = 'MpxLabel'

export default Label
