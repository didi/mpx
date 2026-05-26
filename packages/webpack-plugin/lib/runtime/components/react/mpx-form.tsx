/**
 * ✘ report-submit
 * ✘ report-submit-timeout
 * ✔ bindsubmit
 * ✔ bindreset
 */
import { View } from 'react-native'
import { JSX, useRef, forwardRef, ReactNode, useMemo, createElement } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { FormContext } from './context'
import { useTransformStyle, splitProps, splitStyle, useLayout, wrapChildren, extendObject } from './utils'
interface FormProps {
  style?: Record<string, any>
  children?: ReactNode
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  bindsubmit?: (evt: {
    detail: {
      value: any
    }
  }) => void
  bindreset?: () => void
}

const _Form = forwardRef<HandlerRef<View, FormProps>, FormProps>((fromProps: FormProps, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(fromProps)
  const {
    style,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const {
    hasSelfPercent,
    normalStyle,
    hasVarDec,
    varContextRef,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)

  const formRef = useRef(null)
  useNodesRef(props, ref, formRef, {
    style: normalStyle
  })

  const propsRef = useRef<FormProps>({})
  propsRef.current = props

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: formRef })

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      layoutProps,
      {
        style: extendObject({}, innerStyle, layoutStyle),
        ref: formRef
      }
    )
    , [
      'bindsubmit',
      'bindreset'
    ], { layoutRef })

  const contextValue = useMemo(() => {
    const formValuesMap = new Map()
    const submit = () => {
      const { bindsubmit } = propsRef.current
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
        propsRef.current
      ))
    }

    const reset = () => {
      const { bindreset } = propsRef.current
      bindreset && bindreset()
      formValuesMap.forEach(item => item.resetValue())
    }
    return {
      formValuesMap,
      submit,
      reset
    }
  }, [])

  return createElement(View, innerProps, createElement(
    FormContext.Provider,
    { value: contextValue },
    wrapChildren(
      props,
      {
        hasVarDec,
        varContext: varContextRef.current,
        textStyle,
        textProps
      }
    )
  ))
})

_Form.displayName = 'MpxForm'

export default _Form
