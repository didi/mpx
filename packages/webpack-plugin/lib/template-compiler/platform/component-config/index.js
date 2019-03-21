const view = require('./view')
const scrollView = require('./scroll-view')
const swiper = require('./swiper')
const movableView = require('./movable-view')
const movableArea = require('./movable-area')
const coverView = require('./cover-view')
const coverImage = require('./cover-image')
const icon = require('./icon')
const text = require('./text')
const richText = require('./rich-text')
const progress = require('./progress')
const button = require('./button')
const checkbox = require('./checkbox')
const checkboxGroup = require('./checkbox-group')
const form = require('./form')
const input = require('./input')
const picker = require('./picker')
const pickerView = require('./picker-view')
const radio = require('./radio')
const slider = require('./slider')
const switchComponent = require('./switch')
const textarea = require('./textarea')

const map = require('./map')

module.exports = function getComponentConfigs ({ warn, error }) {
  /**
   * universal print for detail component warn or error
   * @param {string} platform
   * @param {string} tagName
   * @return {function(*): Function}
   */
  const print = (platform, tagName) => (isError) => (arg) => {
    const name = typeof arg === 'string' ? `bind${arg}` : arg.name
    const type = typeof arg === 'string' ? 'event' : 'property'
    const msg = `<${tagName}> component does not support '${name}' ${type} in ${platform} environment!`
    isError ? error(msg) : warn(msg)
  }

  // 转换规则只需以微信为基准配置微信和支付宝的差异部分，比如微信和支付宝都支持但是写法不一致，或者微信支持而支付宝不支持的部分(抛出错误或警告)
  return [
    view({ print }),
    scrollView({ print }),
    swiper({ print }),
    movableView({ print }),
    movableArea({ print }),
    coverView({ print }),
    coverImage({ print }),
    icon({ print }),
    text({ print }),
    richText({ print }),
    progress({ print }),
    button({ print }),
    checkbox({ print }),
    checkboxGroup({ print }),
    form({ print }),
    input({ print }),
    picker({ print }),
    pickerView({ print }),
    radio({ print }),
    slider({ print }),
    switchComponent({ print }),
    textarea({ print }),
    map({ print })
  ]
}
