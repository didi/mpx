declare let __mpx_mode__: 'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'web' | 'dd' | 'qa' | 'jd' | 'android' | 'ios' | 'harmony'

declare let global: {
  __formatValue (value: string): string | number
} & Record<string, any>

declare module '@react-navigation/native' {
   export function useNavigation (): Record<string, any>
}

declare module '*.png'
