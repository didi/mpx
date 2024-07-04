import { ReactNode } from 'react'

type CommonPickerProps = {
  mode: string,
  // 表示选择了 range 中的第几个（下标从 0 开始）
  value: number,
  disabled?: boolean,
  children: ReactNode,
  bindcancel?: Function,
  bindchange: Function,
}

export type SelectorProps = CommonPickerProps & {
  // mode 为 selector 或 multiSelector 时，range 有效
  range: Array<number|string|Object>,
  // 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器《显示内容》 对象中的属性
  'range-key': string,
  // bindcolumnchange?: Function
}

export type TimeProps = CommonPickerProps & {

}

export type PickerProps = SelectorProps | TimeProps

export type InnerSelectorProps = {
  mode: string,
  value: number | Array<any>
  range: Array<number|string|Object>,
  rangeKey: string,
  handlePickerConfirm: Function,
  handlePickerCancel: Function
}

