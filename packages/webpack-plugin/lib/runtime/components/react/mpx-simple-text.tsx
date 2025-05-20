import { Text, TextProps } from 'react-native'
import { JSX, createElement } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject } from './utils'

const SimpleText = (props: TextProps): JSX.Element => {
  const {
    allowFontScaling = false,
    children
  } = props

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        allowFontScaling
      }
    )
  )

  return createElement(Text, innerProps, children)
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
