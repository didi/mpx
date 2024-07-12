/**
 * ✔ bindchange
 */
import {
  JSX,
  useRef,
  forwardRef,
  ReactNode,
  Children,
  cloneElement,
  FunctionComponent,
  isValidElement,
  useContext
} from 'react'
import {
  View,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
  StyleSheet
} from 'react-native'
import { FormContext, CheckboxGroupContext } from './context'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'

interface Selection {
  value: string
  checked: boolean
}

export interface CheckboxGroupProps {
  name: string
  style?: StyleProp<ViewStyle>
  'enable-offset'?: boolean
  children: ReactNode
  bindchange?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const CheckboxGroup = forwardRef<
  HandlerRef<View, CheckboxGroupProps>,
  CheckboxGroupProps
>((props, ref): JSX.Element => {
  const {
    style = [],
    'enable-offset': enableOffset,
    children,
    bindchange
  } = props

  const layoutRef = useRef({})
  const { formValuesMap } = useContext(FormContext)

  const groupValue = useRef({}).current

  const defaultStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...StyleSheet.flatten(style)
  }
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
    const arr: any = []
    for (let key in groupValue) {
      if (groupValue[key].checked) {
        arr.push(key)
      }
    }
    return arr
  }

  const getValue = () => {
    return getSelectionValue()
  }

  const setValue = ({ newVal = [], type }) => {
    if (type === 'reset') {
      Object.keys(groupValue).forEach((key) => {
        groupValue[key].checked = false
        groupValue[key].setValue(false)
      })
    }
  }

  if (formValuesMap) {
    if (!props.name) {
      console.warn('[Mpx runtime warn]: If a form component is used, the name attribute is required.')
      return
    }
    formValuesMap.set(props.name, { getValue, setValue })
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

  const wrapChildren = (children: ReactNode) => {
    const newChild = Children.toArray(children).map((child) => {
      if (!isValidElement(child)) return child
      const displayName = (child.type as FunctionComponent)?.displayName

      if (displayName === 'mpx-checkbox') {
        return cloneElement(child, {
          ...child.props
        })
      } else {
        return cloneElement(child, {}, wrapChildren(child.props.children))
      }
    })
    return newChild
  }

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
      <CheckboxGroupContext.Provider value={{ groupValue, notifyChange }}>
        {wrapChildren(children)}
      </CheckboxGroupContext.Provider>
    </View>
  )
})

CheckboxGroup.displayName = 'mpx-checkbox-group'

export default CheckboxGroup