const ad = require('./ad')
const block = require('./block')
const button = require('./button')
const camera = require('./camera')
const canvas = require('./canvas')
const checkboxGroup = require('./checkbox-group')
const checkbox = require('./checkbox')
const coverImage = require('./cover-image')
const coverView = require('./cover-view')
const form = require('./form')
const hyphenTagName = require('./hypen-tag-name')
const icon = require('./icon')
const image = require('./image')
const input = require('./input')
const livePlayer = require('./live-player')
const livePusher = require('./live-pusher')
const map = require('./map')
const movableArea = require('./movable-area')
const movableView = require('./movable-view')
const navigator = require('./navigator')
const pickerViewColumn = require('./picker-view-column')
const pickerView = require('./picker-view')
const picker = require('./picker')
const progress = require('./progress')
const radioGroup = require('./radio-group')
const radio = require('./radio')
const richText = require('./rich-text')
const scrollView = require('./scroll-view')
const slider = require('./slider')
const swiperItem = require('./swiper-item')
const swiper = require('./swiper')
const switchComponent = require('./switch')
const template = require('./template')
const text = require('./text')
const textarea = require('./textarea')
const unsupported = require('./unsupported')
const video = require('./video')
const view = require('./view')
const webView = require('./web-view')
const label = require('./label')
const wxs = require('./wxs')
const component = require('./component')
const fixComponentName = require('./fix-component-name')
const rootPortal = require('./root-portal')
const recycleView = require('./recycle-view')

module.exports = function getComponentConfigs ({ warn, error }) {
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
    fixComponentName({ print }),
    ...unsupported({ print }),
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
    hyphenTagName({ print }),
    label({ print }),
    component(),
    rootPortal({ print }),
    recycleView({ print })
  ]
}
