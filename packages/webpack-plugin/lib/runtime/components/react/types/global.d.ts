declare let __mpx_mode__: 'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'web' | 'dd' | 'qa' | 'jd' | 'android' | 'ios' | 'harmony'

declare let global: {
  __formatValue (value: string): string | number
} & Record<string, any>

declare module '@react-navigation/native' {
   export function useNavigation (): Record<string, any>
   export function usePreventRemove(
    enabled: boolean,
    callback: (e: { data: { action: any } }) => void
  ): void;
  export interface PreventRemoveEvent {
    data: {
      action: NavigationAction;
      route: {
        key: string;
        name: string;
        params?: unknown;
      };
    };
    preventDefault(): void;
  }
}

declare module '*.png'
