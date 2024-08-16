import { JSX } from 'react'
import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native'
import { SvgCssUri, WithLocalSvg } from 'react-native-svg/css'
interface SvgProps {
  local?: boolean
  src: string | ImageSourcePropType
  style?: StyleProp<ImageStyle>
  width?: string | number
  height?: string | number
}

const Svg = ({ local = false, src, style, width, height }: SvgProps): JSX.Element => {
  return local ? (
    <WithLocalSvg style={style} asset={src as ImageSourcePropType} width={width} height={height} />
  ) : (
    <SvgCssUri style={style} uri={src as string} width={width} height={height} />
  )
}

export default Svg
