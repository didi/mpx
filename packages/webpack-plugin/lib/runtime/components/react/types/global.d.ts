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
  export function isEmptyObject (obj: Object): boolean
  export function isFunction (fn: unknown): boolean
  export function isNumber (num: unknown): boolean
  export function hasOwn (obj: Object, key: string): boolean
  export function noop (...arg: any): void
  export function diffAndCloneA<A, B> (a: A, b?: B): {
    clone: A
    diff: boolean
    diffData: Object | null
  }
  export function isObject (value): value is Object
  export function error (msg: string, location?: string, e?: any): void
  export function warn (msg: string, location?: string, e?: any): void
  export function collectDataset (props: Record<string, any>, needParse?: boolean): Record<string, any>
  export function getFocusedNavigation (): {
    insets: {
      top: number
      bottom: number
      left: number
      right: number
    }
  } | undefined
}

declare let global: {
  __formatValue (value: string): string | number
} & Record<string, any>
