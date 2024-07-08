import { ReactNode } from 'react'

export type SelectorProps = {
  mode: string,
  // 表示选择了 range 中的第几个（下标从 0 开始）
  value: number,
  disabled?: boolean,
  children: ReactNode,
  bindcancel?: Function,
  bindchange: Function,
  // mode 为 selector 或 multiSelector 时，range 有效
  range: Array<number|string|Object>,
  // 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器《显示内容》 对象中的属性
  'range-key': string,
  // bindcolumnchange?: Function
}

export type MultiSelectorProps = {
  mode: string,
  // 表示选择了 range 中的第几个（下标从 0 开始）
  value: Array<number>,
  disabled?: boolean,
  children: ReactNode,
  bindcancel?: Function,
  bindchange: Function,
  // mode 为 selector 或 multiSelector 时，range 有效
  range: Array<Array<any>>,
  // 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器《显示内容》 对象中的属性
  'range-key': string,
}

export type TimeProps =  {
  mode: string,
  // 表示选择了 range 中的第几个（下标从 0 开始）
  value: string,
  disabled?: boolean,
  children: ReactNode,
  bindcancel?: Function,
  bindchange: Function,
  start: string,
  end: string
}

export type DateProps = {
  mode: string,
  // 表示选择了 range 中的第几个（下标从 0 开始）
  value: string,
  fields?: 'day' | 'month' | 'year',
  disabled?: boolean,
  children: ReactNode,
  bindcancel?: Function,
  bindchange: Function,
  start: string,
  end: string
}

export type PickerProps = SelectorProps | MultiSelectorProps | TimeProps | DateProps

export interface BaseState<T> {
  /** 表示当前选中的值 */
  value: T;
  /** 表示上一次选中的值 */
  pValue: T | undefined;
}

export interface SelectorState extends BaseState<number | string> {
  pRange: any[] | undefined;
  range: any[];
  isInOnChangeUpdate: boolean;
}
