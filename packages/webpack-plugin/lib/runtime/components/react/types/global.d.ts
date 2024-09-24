declare module 'react-native-svg/css' {
  import type { ImageSourcePropType, StyleProp, ImageStyle } from 'react-native'
  import type { SvgProps as SvgCssUriProps } from 'react-native-svg'

  export const SvgCssUri: React.ComponentType<SvgCssUriProps & { uri?: string }>

  export interface WithLocalSvgProps {
    asset: ImageSourcePropType
    style?: StyleProp<ImageStyle>
    width?: string | number
    height?: string | number
  }

  export const WithLocalSvg: React.ComponentType<WithLocalSvgProps>
}

declare module '@mpxjs/utils' {
  export function isEmptyObject(obj: Record<string, any>): boolean;
}