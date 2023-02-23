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

export default function getComponentConfigs ({ warn, error }) {
  /**
   * universal print for detail component warn or error
   * @param {object} config
   *  @param {string} config.platform
   *  @param {string} config.tag
   *  @param {string} config.type 可填tag/property/value/event
   * @return {function(*): Function}
   */
  const print = ({ platform, tag, type = 'property', isError = false }) => (arg) => {
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
        msg = `<${tag}> does not support [${arg && arg.name}] property in ${platform} environment!`
        break
      case 'value':
        msg = `<${tag}>'s property '${arg && arg.name}' does not support '[${arg && arg.value}]' value in ${platform} environment!`
        break
      case 'tagRequiredProps':
        msg = `<${tag}> should have '${arg}' attr in ali environment!`
        break
      case 'value-attr-uniform':
        msg = `The internal attribute name of the <${tag}>'s attribute '${arg && arg.value}' is not supported in the ali environment, Please check!`
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
    template(),
    block(),
    icon(),
    webView({ print }),
    video({ print }),
    camera({ print }),
    livePlayer({ print }),
    livePusher({ print }),
    HyphenTagName({ print }),
    component()
  ]
}
