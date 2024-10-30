import { createContext, Dispatch, MutableRefObject, SetStateAction } from 'react'
import { NativeSyntheticEvent } from 'react-native'

export type LabelContextValue = MutableRefObject<{
  triggerChange: (evt: NativeSyntheticEvent<TouchEvent>) => void
}>

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

export const MovableAreaContext = createContext({ width: 0, height: 0 })

export const FormContext = createContext<FormContextValue | null>(null)

export const CheckboxGroupContext = createContext<GroupContextValue | null>(null)

export const RadioGroupContext = createContext<GroupContextValue | null>(null)

export const LabelContext = createContext<LabelContextValue | null>(null)

export const PickerContext = createContext(null)

export const VarContext = createContext({})

export const IntersectionObserverContext = createContext<IntersectionObserver | null>(null)
