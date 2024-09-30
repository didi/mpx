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
import { FormContext, FormFieldValue, CheckboxGroupContext, GroupValue } from './context'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { throwReactWarning } from './utils'

export interface CheckboxGroupProps {
  name: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
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
    'enable-offset': enableOffset,
    children,
  } = props

  const layoutRef = useRef({})
  const formContext = useContext(FormContext)

  let formValuesMap: Map<string, FormFieldValue> | undefined;

  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

  const groupValue: GroupValue = useRef({}).current

  const defaultStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...style
  }
  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle
  })

  const onLayout = useCallback(() => {
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
  }, [])

  const getSelectionValue = useCallback((): string[] => {
    const arr: string[] = []
    for (let key in groupValue) {
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
      throwReactWarning('[Mpx runtime warn]: If a form component is used, the name attribute is required.')
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
      style: defaultStyle,
      ...(enableOffset ? { onLayout } : {})
    },
    ['enable-offset'],
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
        {children}
      </CheckboxGroupContext.Provider>
    </View>
  )
})

CheckboxGroup.displayName = 'mpx-checkbox-group'

export default CheckboxGroup