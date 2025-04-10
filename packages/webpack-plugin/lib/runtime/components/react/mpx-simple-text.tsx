import { Text, TextProps } from 'react-native'
import { JSX, createElement } from 'react'
import useInnerProps from './getInnerListeners'

const SimpleText = (props: TextProps): JSX.Element => {
  const {
    allowFontScaling = false,
    children
  } = props

  const innerProps = useInnerProps(props, {
    allowFontScaling
  }, [])

  return createElement(Text, innerProps, children)
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
