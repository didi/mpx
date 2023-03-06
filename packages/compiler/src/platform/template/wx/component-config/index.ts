import ad from './ad'
import block from './block'
import button from './button'
import camera from './camera'
import canvas from './canvas'
import checkboxGroup from './checkbox-group'
import checkbox from './checkbox'
import coverImage from './cover-image'
import coverView from './cover-view'
import form from './form'
import HyphenTagName from './hypen-tag-name'
import icon from './icon'
import image from './image'
import input from './input'
import livePlayer from './live-player'
import livePusher from './live-pusher'
import map from './map'
import movableArea from './movable-area'
import movableView from './movable-view'
import navigator from './navigator'
import pickerViewColumn from './picker-view-column'
import pickerView from './picker-view'
import picker from './picker'
import progress from './progress'
import radioGroup from './radio-group'
import radio from './radio'
import richText from './rich-text'
import scrollView from './scroll-view'
import slider from './slider'
import swiperItem from './swiper-item'
import swiper from './swiper'
import switchComponent from './switch'
import template from './template'
import text from './text'
import textarea from './textarea'
import Nonsupport from './unsupported'
import video from './video'
import view from './view'
import webView from './web-view'
import wxs from './wxs'
import component from './component'

interface Attr {
  name: string
  value: any
}

type Test = string | RegExp

export type PropsTransformer = (attr: Attr, params: { el: any }) => any
export type EventTransformer = (event: string, params: { el: any }) => any
export type TagTransformer = (tag: string, params: { el: any }) => any
export type PrintLog = (tag?: Attr | string) => void
export interface Config {
  test?: Test
  supportedModes?: string[]
  [key: string]:
    | Config['props']
    | Config['event']
    | Config['test']
    | TagTransformer
    | string[]
  props?: {
    [key: string]: PropsTransformer | string | undefined | RegExp
    test?: Test
  }[]
  event?: {
    [key: string]: EventTransformer | string | undefined | RegExp
    test?: Test
  }[]
}

export type Print = (params: {
  platform: any
  tag?: any
  type?: string | undefined
  isError?: boolean | undefined
}) => PrintLog

export type DefineConfig = (params: { print: Print }) => Config
export type DefineConfigs = (params: { print: Print }) => Config[]

export default function getComponentConfigs({
  warn,
  error
}: {
  warn: any
  error: any
}) {
  const print: Print =
    ({ platform, tag, type = 'property', isError = false }) =>
    arg => {
      if (type === 'tag') {
        error(`<${arg}> is not supported in ${platform} environment!`)
        return
      }
      let msg
      switch (type) {
        case 'event':
          msg = `<${tag}> does not support [bind${arg}] event in ${platform} environment!`
          break
        case 'property':
          msg = `<${tag}> does not support [${
            arg && (arg as Attr).name
          }] property in ${platform} environment!`
          break
        case 'value':
          msg = `<${tag}>'s property '${
            arg && (arg as Attr).name
          }' does not support '[${
            arg && (arg as Attr).value
          }]' value in ${platform} environment!`
          break
        case 'tagRequiredProps':
          msg = `<${tag}> should have '${arg}' attr in ali environment!`
          break
        case 'value-attr-uniform':
          msg = `The internal attribute name of the <${tag}>'s attribute '${
            arg && (arg as Attr).value
          }' is not supported in the ali environment, Please check!`
          break
        default:
          msg = `<${tag}>'s transform has some error happened!`
      }
      isError ? error(msg) : warn(msg)
    }

  // 转换规则只需以微信为基准配置微信和支付宝的差异部分，比如微信和支付宝都支持但是写法不一致，或者微信支持而支付宝不支持的部分(抛出错误或警告)
  return [
    ...Nonsupport({ print }),
    ad({ print }),
    view({ print }),
    scrollView({ print }),
    swiper({ print }),
    swiperItem({ print }),
    movableView({ print }),
    movableArea({ print }),
    coverView({ print }),
    coverImage({ print }),
    text({ print }),
    richText({ print }),
    progress({ print }),
    button({ print }),
    checkboxGroup({ print }),
    checkbox({ print }),
    radioGroup({ print }),
    radio({ print }),
    form({ print }),
    input({ print }),
    picker({ print }),
    pickerView({ print }),
    pickerViewColumn({ print }),
    slider({ print }),
    switchComponent({ print }),
    textarea({ print }),
    navigator({ print }),
    image({ print }),
    map({ print }),
    canvas({ print }),
    wxs({ print }),
    template({ print }),
    block({ print }),
    icon({ print }),
    webView({ print }),
    video({ print }),
    camera({ print }),
    livePlayer({ print }),
    livePusher({ print }),
    HyphenTagName({ print }),
    component({ print })
  ]
}
