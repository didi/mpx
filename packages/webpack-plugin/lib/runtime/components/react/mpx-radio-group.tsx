/**
 * ✔ bindchange
 */
import {
  JSX,
  useRef,
  forwardRef,
  ReactNode,
  useContext,
  useMemo,
  useCallback
} from 'react'
import {
  View,
  NativeSyntheticEvent,
  ViewStyle
} from 'react-native'
import { FormContext, FormFieldValue, RadioGroupContext, GroupValue } from './context'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { throwReactWarning } from './utils'

export interface radioGroupProps {
  name: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  children: ReactNode
  bindchange?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const radioGroup = forwardRef<
  HandlerRef<View, radioGroupProps>,
  radioGroupProps
>((props, ref): JSX.Element => {
  const {
    style = {},
    'enable-offset': enableOffset,
    children
  } = props

  const propsRef = useRef({} as radioGroupProps)

  propsRef.current = props

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

  const getSelectionValue = useCallback((): string | undefined => {
    for (const key in groupValue) {
      if (groupValue[key].checked) {
        return key
      }
    }
  }, [])

  const getValue = useCallback(() => {
    return getSelectionValue()
  }, [getSelectionValue])

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


  const contextValue = useMemo(() => {
    return {
      groupValue,
      notifyChange
    }
  }, [notifyChange])


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

  return (
    <View {...innerProps}>
      <RadioGroupContext.Provider value={contextValue}>
        {children}
      </RadioGroupContext.Provider>
    </View>
  )
})

radioGroup.displayName = 'MpxRadioGroup'

export default radioGroup
