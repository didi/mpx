import React from 'react'
import type { ImageSourcePropType } from 'react-native'
import { SvgCssUri, WithLocalSvg } from 'react-native-svg/css'

interface SvgProps {
  local?: boolean
  src: string | ImageSourcePropType
  width: number
  height: number
}

const Svg = ({ local = false, src, width, height }: SvgProps): React.JSX.Element => {
  return local ? (
    <WithLocalSvg asset={src as ImageSourcePropType} width={width} height={height} />
  ) : (
    <SvgCssUri uri={src as string} width={width} height={height} />
  )
}

export default Svg
