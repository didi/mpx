/**
 * ✘ report-submit
 * ✘ report-submit-timeout
 * ✔ bindsubmit
 * ✔ bindreset
 */
import { View } from 'react-native'
import { JSX, useRef, forwardRef, ReactNode, useMemo, useCallback } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { FormContext } from './context'
import { useTransformStyle, splitProps, splitStyle, useLayout, wrapChildren } from './utils'
interface FormProps {
  style?: Record<string, any>;
  children?: ReactNode;
  'enable-offset'?: boolean;
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  bindsubmit?: (evt: {
    detail: {
      value: any;
    };
  }) => void;
  bindreset?: () => void;
}

const _Form = forwardRef<HandlerRef<View, FormProps>, FormProps>((fromProps: FormProps, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(fromProps)
  const formValuesMap = useRef(new Map()).current
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

  const { textStyle, innerStyle } = splitStyle(normalStyle)

  const { nodeRef: formRef } = useNodesRef(props, ref)

  const propsRef = useRef<FormProps>({})
  propsRef.current = props

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: formRef })

  const submit = useCallback(() => {
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
  }, [])

  const reset = useCallback(() => {
    const { bindreset } = propsRef.current
    bindreset && bindreset()
    formValuesMap.forEach(item => item.resetValue())
  }, [])

  const innerProps = useInnerProps(props, {
    style: { ...innerStyle, ...layoutStyle },
    ref: formRef,
    ...layoutProps
  }, [
    'bindsubmit',
    'bindreset'
  ], { layoutRef })

  const contextValue = useMemo(() => {
    return {
      formValuesMap,
      submit,
      reset
    }
  }, [submit, reset])
  return (
    <View
      {...innerProps}
    >
      <FormContext.Provider value={contextValue}>
        {
          wrapChildren(
            props,
            {
              hasVarDec,
              varContext: varContextRef.current,
              textStyle,
              textProps
            }
          )
      }
      </FormContext.Provider>
    </View>
  )
})

_Form.displayName = 'MpxForm'

export default _Form
