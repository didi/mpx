import { ViewStyle, ImageResizeMode} from 'react-native'

export type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: Array<ImageResizeMode | string> | ImageResizeMode | string
  borderRadius?: string | number
  [key: string]: any
}