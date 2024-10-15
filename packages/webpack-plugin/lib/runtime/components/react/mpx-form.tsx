/**
 * ✘ report-submit
 * ✘ report-submit-timeout
 * ✔ bindsubmit
 * ✔ bindreset
 */

import { View, LayoutChangeEvent } from 'react-native'
import { JSX, useRef, forwardRef, ReactNode } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { FormContext } from './context'
import { useTransformStyle, splitProps, splitStyle } from './utils'

import { wrapChildren } from './common'

interface FormProps {
  style?: Record<string, any>;
  children: ReactNode;
  'enable-offset'?: boolean;
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  bindsubmit?: (evt: {
    detail: {
      value: any;
    };
  }) => void;
  bindreset?: () => void;
}

const _Form = forwardRef<HandlerRef<View, FormProps>, FormProps>((fromProps: FormProps, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(fromProps)
  const layoutRef = useRef({})
  const formValuesMap = useRef(new Map()).current
  const {
    style,
    'enable-offset': enableOffset,
    'enable-var': enableVar,
    'external-var-context': externalVarContext
  } = props

  const {
    hasPercent,
    normalStyle,
    hasVarDec,
    varContextRef,
    setContainerWidth,
    setContainerHeight
  } = useTransformStyle(style, { enableVar, externalVarContext })

  const { textStyle, innerStyle } = splitStyle(normalStyle)

  const { nodeRef: formRef } = useNodesRef(props, ref)

  const onLayout = (e: LayoutChangeEvent) => {
    if (hasPercent) {
      const { width, height } = e?.nativeEvent?.layout || {}
      setContainerWidth(width || 0)
      setContainerHeight(height || 0)
    }
    if (enableOffset) {
      formRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
        layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      })
    }
  }

  const submit = () => {
    const { bindsubmit } = props
    const formValue: Record<string, any> = {}
    for (const name of formValuesMap.keys()) {
      if (formValuesMap.get(name).getValue) {
        formValue[name] = formValuesMap.get(name).getValue()
      }
    }
    bindsubmit && bindsubmit(getCustomEvent(
      'submit',
      {},
      {
        detail: {
          value: formValue
        },
        layoutRef
      },
      props
    ))
  }

  const needLayout = enableOffset || hasPercent

  const reset = () => {
    const { bindreset } = props
    bindreset && bindreset()
    formValuesMap.forEach(item => item.resetValue())
  }

  const innerProps = useInnerProps(props, {
    style: innerStyle,
    ref: formRef,
    ...needLayout ? { onLayout } : null
  }, [
    'children',
    'style',
    'bindsubmit',
    'bindreset'
  ], { layoutRef })

  return (
    <View
      {...innerProps}
    >
      <FormContext.Provider value={{ formValuesMap, submit, reset }}>
        {
          wrapChildren(
            props,
            {
              hasVarDec,
              varContext: varContextRef.current
            },
            {
              textStyle,
              textProps
            }
          )
      }
      </FormContext.Provider>
    </View>
  )
})

_Form.displayName = 'mpx-form'

export default _Form
