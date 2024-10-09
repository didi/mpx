/**
 * ✔ bindchange
 */
import {
  JSX,
  useRef,
  forwardRef,
  ReactNode,
  useContext
} from 'react'
import {
  View,
  NativeSyntheticEvent,
  ViewStyle
} from 'react-native'
import { FormContext, FormFieldValue, CheckboxGroupContext, GroupValue, VarContext } from './context'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { throwReactWarning, useTransformStyle } from './utils'

export interface CheckboxGroupProps {
  name: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  children: ReactNode
  bindchange?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

function wrapChildren (props: CheckboxGroupProps, { hasVarDec }: { hasVarDec: boolean }, varContext?: Record<string, any>) {
  let { children } = props

  if (hasVarDec && varContext) {
    children = <VarContext.Provider key='childrenWrap' value={varContext}>{children}</VarContext.Provider>
  }

  return [
    children
  ]
}

const CheckboxGroup = forwardRef<
  HandlerRef<View, CheckboxGroupProps>,
  CheckboxGroupProps
>((props, ref): JSX.Element => {
  const {
    style = {},
    'enable-offset': enableOffset,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    bindchange
  } = props

  const layoutRef = useRef({})
  const formContext = useContext(FormContext)

  let formValuesMap: Map<string, FormFieldValue> | undefined

  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

  const groupValue: GroupValue = useRef({}).current

  const defaultStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
  }

  const styleObj = {
    ...defaultStyle,
    ...style
  }

  const { normalStyle, hasVarDec, varContextRef } = useTransformStyle(styleObj, { enableVar, externalVarContext })

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle
  })

  const onLayout = () => {
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

  const getSelectionValue = (): string[] => {
    const arr: string[] = []
    for (const key in groupValue) {
      if (groupValue[key].checked) {
        arr.push(key)
      }
    }
    return arr
  }

  const getValue = () => {
    return getSelectionValue()
  }

  const resetValue = () => {
    Object.keys(groupValue).forEach((key) => {
      groupValue[key].checked = false
      groupValue[key].setValue(false)
    })
  }

  if (formValuesMap) {
    if (!props.name) {
      throwReactWarning('[Mpx runtime warn]: If a form component is used, the name attribute is required.')
    } else {
      formValuesMap.set(props.name, { getValue, resetValue })
    }
  }

  const notifyChange = (
    evt: NativeSyntheticEvent<TouchEvent>
  ) => {
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
          props
        )
      )
  }

  const innerProps = useInnerProps(
    props,
    {
      ref: nodeRef,
      style: normalStyle,
      ...(enableOffset ? { onLayout } : {})
    },
    ['enable-offset'],
    {
      layoutRef
    }
  )

  return (
    <View {...innerProps}>
      <CheckboxGroupContext.Provider value={{ groupValue, notifyChange }}>
        {
          wrapChildren(
            props,
            {
               hasVarDec
            },
            varContextRef.current
          )
        }
      </CheckboxGroupContext.Provider>
    </View>
  )
})

CheckboxGroup.displayName = 'mpx-checkbox-group'

export default CheckboxGroup
