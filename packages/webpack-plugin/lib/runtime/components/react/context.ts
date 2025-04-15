import { createContext, Dispatch, MutableRefObject, SetStateAction } from 'react'
import { NativeSyntheticEvent, Animated } from 'react-native'
import { noop } from '@mpxjs/utils'

export type LabelContextValue = MutableRefObject<{
  triggerChange: (evt: NativeSyntheticEvent<TouchEvent>) => void
}>

export type KeyboardAvoidContextValue = MutableRefObject<
  { cursorSpacing: number, ref: MutableRefObject<any> } | null
>

export interface GroupValue {
  [key: string]: { checked: boolean; setValue: Dispatch<SetStateAction<boolean>> }
}

export interface GroupContextValue {
  groupValue: GroupValue
  notifyChange: (evt: NativeSyntheticEvent<TouchEvent>) => void
}

export interface FormFieldValue {
  getValue: () => any
  resetValue: ({ newVal, type }: { newVal?: any; type?: string }) => void
}

export interface FormContextValue {
  formValuesMap: Map<string, FormFieldValue>
  submit: () => void
  reset: () => void
}

export interface IntersectionObserver {
  [key: number]: {
    throttleMeasure: () => void
  }
}

export interface PortalContextValue {
  mount: (children: React.ReactNode, key?: number | null, id?: number| null) => number| undefined
  update: (key: number, children: React.ReactNode) => void
  unmount: (key: number) => void
}

export interface ScrollViewContextValue {
  gestureRef: React.RefObject<any> | null,
  scrollOffset: Animated.Value
}

export interface RouteContextValue {
  pageId: number
  navigation: Record<string, any>
}

export interface StickyContextValue {
  registerStickyHeader: Function,
  unregisterStickyHeader: Function
}

export const MovableAreaContext = createContext({ width: 0, height: 0 })

export const FormContext = createContext<FormContextValue | null>(null)

export const CheckboxGroupContext = createContext<GroupContextValue | null>(null)

export const RadioGroupContext = createContext<GroupContextValue | null>(null)

export const LabelContext = createContext<LabelContextValue | null>(null)

export const PickerContext = createContext(null)

export const VarContext = createContext({})

export const IntersectionObserverContext = createContext<IntersectionObserver | null>(null)

export const RouteContext = createContext<RouteContextValue | null>(null)

export const SwiperContext = createContext({})

export const KeyboardAvoidContext = createContext<KeyboardAvoidContextValue | null>(null)

export const ScrollViewContext = createContext<ScrollViewContextValue>({ gestureRef: null, scrollOffset: new Animated.Value(0) })

export const PortalContext = createContext<PortalContextValue>(null as any)

export const StickyContext = createContext<StickyContextValue>({ registerStickyHeader: noop, unregisterStickyHeader: noop })
