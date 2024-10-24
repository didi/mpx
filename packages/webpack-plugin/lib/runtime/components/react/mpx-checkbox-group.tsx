/**
 * ✔ bindchange
 */
import {
  JSX,
  useRef,
  forwardRef,
  ReactNode,
  useContext,
  useCallback,
  useMemo
} from 'react'
import {
  View,
  NativeSyntheticEvent,
  ViewStyle
} from 'react-native'
import { warn } from '@mpxjs/utils'
import { FormContext, FormFieldValue, CheckboxGroupContext, GroupValue } from './context'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { useLayout, useTransformStyle, wrapChildren } from './utils'

export interface CheckboxGroupProps {
  name: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  children: ReactNode
  bindchange?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const CheckboxGroup = forwardRef<
  HandlerRef<View, CheckboxGroupProps>,
  CheckboxGroupProps
>((props, ref): JSX.Element => {
  const propsRef = useRef({} as CheckboxGroupProps)
  propsRef.current = props
  const {
    style = {},
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const formContext = useContext(FormContext)

  let formValuesMap: Map<string, FormFieldValue> | undefined

  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

  const groupValue: GroupValue = useRef({}).current

  const defaultStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }

  const styleObj = {
    ...defaultStyle,
    ...style
  }

  const {
    hasSelfPercent,
    normalStyle,
    hasVarDec,
    varContextRef,
    setWidth,
    setHeight
  } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const nodeRef = useRef(null)

  useNodesRef(nodeRef, props, ref, { defaultStyle })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

  const getSelectionValue = useCallback((): string[] => {
    const arr: string[] = []
    for (const key in groupValue) {
      if (groupValue[key].checked) {
        arr.push(key)
      }
    }
    return arr
  }, [])

  const getValue = useCallback(() => {
    return getSelectionValue()
  }, [getSelectionValue])

  const resetValue = useCallback(() => {
    Object.keys(groupValue).forEach((key) => {
      groupValue[key].checked = false
      groupValue[key].setValue(false)
    })
  }, [])

  if (formValuesMap) {
    if (!props.name) {
      warn('If a form component is used, the name attribute is required.')
    } else {
      formValuesMap.set(props.name, { getValue, resetValue })
    }
  }

  const notifyChange = useCallback((
    evt: NativeSyntheticEvent<TouchEvent>
  ) => {
    const { bindchange } = propsRef.current
    bindchange &&
      bindchange(
        getCustomEvent(
          'tap',
          evt,
          {
            layoutRef,
            detail: {
              value: getSelectionValue()
            }
          },
          propsRef.current
        )
      )
  }, [])

  const innerProps = useInnerProps(
    props,
    {
      ref: nodeRef,
      style: { ...normalStyle, ...layoutStyle },
      ...layoutProps
    },
    [],
    {
      layoutRef
    }
  )

  const contextValue = useMemo(() => {
    return {
      groupValue,
      notifyChange
    }
  }, [notifyChange])
  return (
    <View {...innerProps}>
      <CheckboxGroupContext.Provider value={contextValue}>
        {
          wrapChildren(
            props,
            {
              hasVarDec,
              varContext: varContextRef.current
            }
          )
        }
      </CheckboxGroupContext.Provider>
    </View>
  )
})

CheckboxGroup.displayName = 'MpxCheckboxGroup'

export default CheckboxGroup
