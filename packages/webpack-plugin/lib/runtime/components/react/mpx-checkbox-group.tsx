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
  isValidElement
} from 'react'
import {
  View,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
  StyleSheet
} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from '../../useNodesRef'

interface Selection {
  value: string
  checked: boolean
}

export interface CheckboxGroupProps {
  style?: StyleProp<ViewStyle>
  'enable-offset'?: boolean
  children: ReactNode
  bindchange?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
  _setGroupData?: (values: string[]) => void
}

const CheckboxGroup = forwardRef<
  HandlerRef<View, CheckboxGroupProps>,
  CheckboxGroupProps
>((props, ref): JSX.Element => {
  const {
    style = [],
    'enable-offset': enableOffset,
    children,
    bindchange,
    _setGroupData
  } = props

  const layoutRef = useRef({})

  const refs = useRef<{ index: number; selections: Selection[] }>({
    index: 0,
    selections: []
  })

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
    return refs.current.selections.reduce<string[]>(
      (acc, { value, checked }) => {
        checked && acc.push(value)
        return acc
      },
      []
    )
  }

  const onChange = (
    evt: NativeSyntheticEvent<TouchEvent>,
    selection: Selection,
    index: number
  ) => {
    refs.current.selections[index] = selection

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
    return Children.toArray(children).map((child) => {
      if (!isValidElement(child)) return child

      const displayName = (child.type as FunctionComponent)?.displayName

      if (displayName === 'mpx-checkbox') {
        const index = refs.current.index++
        const { value, checked } = child.props
        refs.current.selections[index] = { value, checked: !!checked }
        return cloneElement(child, {
          ...child.props,
          _onChange: (
            evt: NativeSyntheticEvent<TouchEvent>,
            selection: Selection
          ) => onChange(evt, selection, index)
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

  _setGroupData && _setGroupData(getSelectionValue())

  return <View {...innerProps}>{wrapChildren(children)}</View>
})

CheckboxGroup.displayName = 'mpx-checkbox-group'

export default CheckboxGroup
