import { createContext, Dispatch, SetStateAction } from 'react';
import { NativeSyntheticEvent } from 'react-native'

export interface GroupValue {
  [key: string]: { checked: boolean; setValue: Dispatch<SetStateAction<boolean>> }
}

export interface CheckboxGroupContextValue {
  groupValue: GroupValue
  notifyChange: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

export interface FormFieldValue {
  getValue: () => any;
  resetValue: ({ newVal, type }: { newVal?: any; type?: string }) => void;
}


export interface FormContextValue {
  formValuesMap: Map<string, FormFieldValue>
}

export const MovableAreaContext = createContext({ width: 0, height: 0 })

export const FormContext = createContext<FormContextValue | null>(null)

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null)