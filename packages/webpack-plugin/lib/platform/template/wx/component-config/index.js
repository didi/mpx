const view = require('./view')
const scrollView = require('./scroll-view')
const swiper = require('./swiper')
const movableView = require('./movable-view')
const movableArea = require('./movable-area')
const coverView = require('./cover-view')
const coverImage = require('./cover-image')
const text = require('./text')
const richText = require('./rich-text')
const progress = require('./progress')
const button = require('./button')
const checkboxGroup = require('./checkbox-group')
const form = require('./form')
const input = require('./input')
const picker = require('./picker')
const pickerView = require('./picker-view')
const slider = require('./slider')
const switchComponent = require('./switch')
const textarea = require('./textarea')
const navigator = require('./navigator')
const image = require('./image')
const map = require('./map')
const canvas = require('./canvas')
const wxs = require('./wxs')
const Nonsupport = require('./unsupported')

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
    if (type === 'tag') return error(`<${arg}> is not supported in ${platform} environment!`)
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
    }
    isError ? error(msg) : warn(msg)
  }

  // 转换规则只需以微信为基准配置微信和支付宝的差异部分，比如微信和支付宝都支持但是写法不一致，或者微信支持而支付宝不支持的部分(抛出错误或警告)
  return [
    ...Nonsupport({ print }),
    view({ print }),
    scrollView({ print }),
    swiper({ print }),
    movableView({ print }),
    movableArea({ print }),
    coverView({ print }),
    coverImage({ print }),
    text({ print }),
    richText({ print }),
    progress({ print }),
    button({ print }),
    checkboxGroup({ print }),
    form({ print }),
    input({ print }),
    picker({ print }),
    pickerView({ print }),
    slider({ print }),
    switchComponent({ print }),
    textarea({ print }),
    navigator({ print }),
    image({ print }),
    map({ print }),
    canvas({ print }),
    wxs()
  ]
}
