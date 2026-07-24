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
import { useTransformStyle, splitProps, splitStyle, useLayout, wrapChildren, extendObject, useTextPassThrough } from './utils'
interface FormProps {
  style?: Record<string, any>
  children?: ReactNode
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'enable-text-pass-through'?: boolean
  'parent-width'?: number
  'parent-height'?: number
  bindsubmit?: (evt: {
    detail: {
      value: any
    }
  }) => void
  bindreset?: (evt: Record<string, any>) => void
}

const _Form = forwardRef<HandlerRef<View, FormProps>, FormProps>((fromProps: FormProps, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(fromProps)
  const {
    style,
    'enable-var': enableVar,
    'enable-text-pass-through': enableTextPassThrough,
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
  } = useTransformStyle(style, { enableVar, parentWidth, parentHeight })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)
  const textPassThrough = useTextPassThrough(textStyle, textProps, { enableTextPassThrough })

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
      bindreset && bindreset(getCustomEvent('reset', {}, { layoutRef }, propsRef.current))
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
      props.children,
      {
        hasVarDec,
        varContext: varContextRef.current,
        textPassThrough
      }
    )
  ))
})

_Form.displayName = 'MpxForm'

export default _Form
