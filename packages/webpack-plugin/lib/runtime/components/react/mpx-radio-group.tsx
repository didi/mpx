/**
 * ✔ bindchange
 */
import React, {
  JSX,
  useRef,
  forwardRef,
  ReactNode,
  Children,
  cloneElement,
  FunctionComponent,
  isValidElement,
  useState
} from 'react'
import {
  View,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
  StyleSheet
} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'

export interface radioGroupProps {
  style?: StyleProp<ViewStyle>
  'enable-offset'?: boolean
  children: ReactNode
  bindchange?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
  _setGroupData?: (value: string) => void
}

const radioGroup = forwardRef<
  HandlerRef<View, radioGroupProps>,
  radioGroupProps
>((props, ref): JSX.Element => {
  const {
    style = [],
    'enable-offset': enableOffset,
    children,
    bindchange,
    _setGroupData
  } = props

  const layoutRef = useRef({})

  const [checkedValue, setCheckedValue] = useState<string>()

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

  const onChange = (evt: NativeSyntheticEvent<TouchEvent>, value: string) => {
    setCheckedValue(value)

    bindchange &&
      bindchange(
        getCustomEvent(
          'tap',
          evt,
          {
            layoutRef,
            detail: {
              value
            }
          },
          props
        )
      )
  }

  const wrapChildren = (children: ReactNode) => {
    return Children.toArray(children).map((child) => {
      if (!isValidElement(child)) return child

      const displayName = (child.type as FunctionComponent)?.displayName

      if (displayName === 'mpx-radio') {
        const { value, checked } = child.props

        if (!checkedValue && checked && _setGroupData) {
          _setGroupData(value)
        }

        return cloneElement(child, {
          ...child.props,
          checked: checkedValue ? checkedValue === value : !!checked,
          _onChange: onChange
        })
      } else {
        return cloneElement(child, {}, wrapChildren(child.props.children))
      }
    })
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

  return <View {...innerProps}>{wrapChildren(children)}</View>
})

radioGroup.displayName = 'mpx-radio-group'

export default radioGroup
