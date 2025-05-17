/**
 * Constants
 */
export const arrayProtoAugment: boolean
export const extend: typeof Object.assign
export const hasProto: boolean
export const isBrowser: boolean
export const isDev: boolean
export const isReact: boolean
export const isWeb: boolean

/**
 * Functions
 */
export function aIsSubPathOfB(a: string, b: string): string | void

export function aliasReplace<T extends Record<string, any>>(
  options: T,
  alias: string,
  target: string
): T

export function buildUrl(
  url: string,
  params?: Record<string, any>,
  serializer?: (params: Record<string, any>) => string
): string

export function cached<T extends (...args: any[]) => any>(fn: T): T

export function callWithErrorHandling<T = any>(
  fn: (...args: any[]) => T,
  instance: { options?: { mpxFileResource?: string } } | null | undefined,
  info?: string,
  args?: any[]
): T | undefined

export function collectDataset(
  props: Record<string, any>,
  needParse?: boolean
): Record<string, any>

export function dash2hump(value: string): string

export function def<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
  val: any,
  enumerable?: boolean
): void

export function diffAndCloneA<A, B>(
  a: A,
  b?: B
): {
  clone: A
  diff: boolean
  diffData: Object | null
}

export function doGetByPath(
  context: Record<string, any>,
  pathStrOrArr: string | string[],
  transfer?: (
    value: any,
    key: string,
    meta: { isEnd: boolean; stop: boolean }
  ) => any
): any

export function enumerableKeys(obj: Record<string, any>): string[]

export function error(msg: string, location?: string, e?: any): void

export function findItem(arr: any[], key: string | RegExp): boolean

export function forEach<T>(
  obj: T | T[],
  fn: (value: any, key: string | number, obj: T | T[]) => void
): void

export function getByPath<T = any>(
  data: Record<string, any>,
  pathStrOrArr: string | string[],
  defaultVal?: T,
  errTip?: any
): T

export function getEnvObj(): any

export function getFirstKey(path: string): string

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

export function hasChanged<T>(value: T, oldValue: T): boolean

export function hasOwn(
  obj: object,
  key: string | symbol
): key is keyof typeof obj

export function hump2dash(value: string): string

export function isBoolean(bool: unknown): bool is boolean

export function isEmptyObject(obj: unknown): boolean

export function isFunction(fn: unknown): boolean

export function isNumber(num: unknown): boolean

export function isNumberStr(str: unknown): boolean

export function isObject(value: any): boolean

export function isPlainObject(obj: unknown): boolean

export function isPromise<T = any>(val: unknown): val is Promise<T>

export function isString(str: unknown): str is string

export function isValidArrayIndex(value: any): value is number

export function isValidIdentifierStr(str: unknown): boolean

export function makeMap<T extends string>(arr: T[]): Record<T, true>

export function mergeData<T extends Record<string, any>>(
  target: T,
  ...sources: Array<Record<string, any> | undefined>
): T

export function mergeObj<T extends Record<string, any>>(
  target: T,
  ...sources: Array<Record<string, any> | undefined>
): T

export function mergeObjectArray(
  arr: Array<Record<string, any> | null | undefined>
): Record<string, any>

export function noop(...arg: any): void

export function parseDataset(dataset: Record<string, any>): Record<string, any>

export function parseQuery(query: string): Record<string, any>

export function parseSelector(selector: string): Array<{
  id?: string
  classes: string[]
}>

export function parseUrl(url: string): {
  fullUrl: string
  baseUrl: string
  protocol: string
  hostname: string
  port: string
  host: string
  path: string
  search: string
  hash: string
}

export function parseUrlQuery(url: string): {
  path: string
  queryObj: Record<string, any>
}

export function processUndefined(obj: Record<string, any>): Record<string, any>

export function proxy(
  target: Record<string, any>,
  source: Record<string, any>,
  keys?: string[],
  readonly?: boolean,
  onConflict?: (key: string) => boolean | void
): Record<string, any>

export function remove<T>(arr: T[], item: T): T[] | void

export function serialize(params: Record<string, any> | URLSearchParams): string

export function setByPath(
  data: Record<string, any>,
  pathStrOrArr: string | string[],
  value: any
): void

export function spreadProp<T extends Record<string, any>>(
  obj: T,
  key: string
): T

export function type(n: unknown): string

export function walkChildren(
  vm: any,
  selectorGroups: Array<{ id?: string; classes: string[] }>,
  context: any,
  result: any[],
  all?: boolean
): void

export function warn(msg: string, location?: string, e?: any): void

export function wrapMethodsWithErrorHandling(
  methods: Record<string, any>,
  instance?: {
    options?: { mpxFileResource?: string }
    __mpxProxy?: any
  }
): Record<string, any>
