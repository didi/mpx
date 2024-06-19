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
import { View, NativeSyntheticEvent } from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from '../../useNodesRef'

interface Selection {
  value: string
  checked: boolean
}

export interface CheckboxGroupProps {
  'enable-offset'?: boolean
  children: ReactNode
  bindchange?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const CheckboxGroup = forwardRef<
  HandlerRef<View, CheckboxGroupProps>,
  CheckboxGroupProps
>((props, ref): JSX.Element => {
  const { 'enable-offset': enableOffset, children, bindchange } = props

  const layoutRef = useRef({})

  const refs = useRef<{ index: number; selections: Selection[] }>({
    index: 0,
    selections: []
  })

  const { nodeRef } = useNodesRef(props, ref)

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

  const onChange = (
    evt: NativeSyntheticEvent<TouchEvent>,
    selection: Selection,
    index: number
  ) => {
    refs.current.selections[index] = selection
    const values = refs.current.selections.reduce<string[]>(
      (acc, { value, checked }) => {
        checked && acc.push(value)
        return acc
      },
      []
    )

    bindchange &&
      bindchange(
        getCustomEvent(
          'tap',
          evt,
          {
            layoutRef,
            detail: {
              values
            }
          },
          props
        )
      )
  }

  function wrapChildren(children: ReactNode) {
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
      ...(enableOffset ? { onLayout } : {})
    },
    ['enable-offset'],
    {
      layoutRef
    }
  )

  return <View {...innerProps}>{wrapChildren(children)}</View>
})

CheckboxGroup.displayName = 'mpx-checkbox-group'

export default CheckboxGroup
