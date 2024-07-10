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
  useContext,
  useState
} from 'react'
import {
  View,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
  StyleSheet
} from 'react-native'
import { FormContext } from './context'
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
  const [resetCount, setResetCount] = useState(0)

  const selections: Record<string, Selection> = useRef({}).current

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
    return Object.values(selections).reduce<string[]>((acc, { value, checked }) => {
      checked && acc.push(value)
      return acc
    }, [])
  }

  const getValue = () => {
    return getSelectionValue()
  }

  const setValue = ({ newVal = [], type }) => {
    if (type === 'reset') {
      Object.keys(selections).forEach((key) => {
        selections[key].checked = false
      })
      refresh()
    }
  }

  const refresh = () => {
    setResetCount((count) => {
      return count + 1
    })
  }
  formValuesMap.current.set(props.name, { getValue, setValue })

  const onChange = (
    evt: NativeSyntheticEvent<TouchEvent>,
    selection: Selection
  ) => {
    const { value, checked } = selection
    selections[value] = { value, checked }
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
        const { value, checked = false } = child.props
        let selection: any = {}
        if (selections[value]) {
          selection = selections[value]
        } else {
          selection = { value, checked }
          selections[value] = selection
        }
        return cloneElement(child, {
          ...child.props,
          checked: selection.checked,
          _onChange: (
            evt: NativeSyntheticEvent<TouchEvent>,
            selection: Selection
          ) => onChange(evt, selection)
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

  return <View {...innerProps} key={resetCount}>{wrapChildren(children)}</View>
})

CheckboxGroup.displayName = 'mpx-checkbox-group'

export default CheckboxGroup