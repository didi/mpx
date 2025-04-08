import { View, ViewProps, TextStyle } from 'react-native'
import { createElement } from 'react'
import { splitProps, splitStyle, wrapChildren } from './utils'
import useInnerProps from './getInnerListeners'

const SimpleView = (simpleViewProps: ViewProps): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)

  const { textStyle, innerStyle = {} } = splitStyle(props.style || {})

  const innerProps = useInnerProps(props, {
    style: innerStyle
  }, [])

  return createElement(View, innerProps, wrapChildren(
    props,
    {
      hasVarDec: false,
      textStyle: textStyle as TextStyle,
      textProps
    }
  ))
}

SimpleView.displayName = 'MpxSimpleView'

export default SimpleView
