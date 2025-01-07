import React from 'react'

export const enum PickerMode {
  SELECTOR = 'selector',
  MULTI_SELECTOR = 'multiSelector',
  TIME = 'time',
  DATE = 'date',
  REGION = 'region',
}

export type PickerValue = number
export type Obj = Record<string, any>
export type RangeItem = Obj | number | string

/** 通用属性 */
export interface BasePickerProps {
  /** --- 小程序属性 --- */
  /** 选择器类型, 默认值 selector */
  mode?: PickerMode
  /** 是否禁用, 默认值 false */
  disabled?: boolean
  /** 点击取消按钮时触发 */
  bindcancel?: Function
  /** 头部标题 */
  'header-text'?: string
  /** --- 内部组件属性 --- */
  /** 作为表单组件时的名称 */
  name?: string
  style?: Record<string, any>
  children?: React.ReactNode
  remove?: Function
  range?: RangeItem[]
  ref?: any
}

export interface SelectorProps extends BasePickerProps {
  mode: PickerMode.SELECTOR
  /**  默认值 0 */
  value?: number
  /** 默认值 [] */
  range?: RangeItem[]
  'range-key'?: string
  /** 点击确认按钮后触发 change 事件, event.detail = {value} */
  bindchange?: Function
}

export interface MultiSelectorProps extends BasePickerProps {
  mode: PickerMode.MULTI_SELECTOR
  /** 默认值 [] */
  value?: number[]
  range?: RangeItem[]
  'range-key'?: string
  bindchange?: Function
  bindcolumnchange?: Function
}

export interface TimeProps extends BasePickerProps {
  mode: PickerMode.TIME
  /** 表示选中的时间，格式为"hh:mm" */
  value?: string
  start?: string
  end?: string
  bindchange?: Function
}

export interface DateProps extends BasePickerProps {
  mode: PickerMode.DATE
  /** 默认值 '' */
  value?: string
  start?: string
  end?: string
  /** 有效值 year,month,day，表示选择器的粒度 */
  fields?: 'day' | 'month' | 'year'
  bindchange?: Function
}

export interface RegionProps extends BasePickerProps {
  mode: PickerMode.REGION
  /** 表示选中的省市区，默认选中每一列的第一个值, 默认值 [] */
  value?: string[]
  /** 默认值 region */
  level?: 'province' | 'city' | 'region' | 'sub-district'
  /** 可为每一列的顶部添加一个自定义的项 */
  'custom-item'?: string
  /** value 改变时触发 change 事件, event.detail = {value, code, postcode},
   * 其中字段 code 是统计用区划代码, postcode 是邮政编码 */
  bindchange?: Function
}

export interface RegionObj {
  value: string
  code: string
  postcode?: string
  children?: RegionObj[]
}

export interface PickerData {
  value: string
  label: string
  children?: Object[]
}

export interface EventType {
  detail: {
    value: PickerValue[]
  }
}

export interface LayoutType {
  nativeEvent: {
    layout: Obj
  }
}

export interface FormType {
  name: string
}

export type PickerProps =
  | SelectorProps
  | MultiSelectorProps
  | TimeProps
  | DateProps
  | RegionProps

type mode = PickerProps['mode']

export type ValueType = string | number | number[] | string[]
