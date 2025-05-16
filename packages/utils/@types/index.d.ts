export const extend: typeof Object.assign

export function isEmptyObject(obj: Object): boolean
export function isFunction(fn: unknown): boolean
export function isNumber(num: unknown): boolean
export function isPlainObject(obj: unknown): boolean
export function isObject(value: any): value is Object
export function isValidArrayIndex(value: any): value is number

export function hasOwn(obj: Object, key: PropertyKey): boolean
export function noop(...arg: any): void
export function error(msg: string, location?: string, e?: any): void
export function warn(msg: string, location?: string, e?: any): void
export function collectDataset(
  props: Record<string, any>,
  needParse?: boolean
): Record<string, any>

export function diffAndCloneA<A, B>(
  a: A,
  b?: B
): {
  clone: A
  diff: boolean
  diffData: Object | null
}

export function getFocusedNavigation():
  | {
      insets: {
        top: number
        bottom: number
        left: number
        right: number
      }
      setOptions: (params: Record<string, any>) => void
      addListener: (eventName: string, callback: (e: Event) => void) => void
      removeListener: (eventName: string, callback: (e: Event) => void) => void
      dispatch: (eventName: string) => void
      pageId: number
      layout: {
        x: number
        y: number
        width: number
        height: number
      }
    }
  | undefined

export function def<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
  val: any,
  enumerable?: boolean
): void
