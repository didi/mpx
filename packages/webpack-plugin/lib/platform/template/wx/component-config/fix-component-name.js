const { isOriginTag, isBuildInTag } = require('../../../../utils/dom-tag-config')

module.exports = function () {
  const handleComponentTag = (el, data) => {
    const newTag = `mpx-com-${el.tag}`
    const usingComponents = data.usingComponents || []
    // 当前组件名与原生tag或内建tag同名，对组件名进行转义
    // json转义见：platform/json/wx/index.js fixComponentName
    if (usingComponents.includes(newTag)) {
      el.tag = newTag
    }
    return el
  }

  return {
    waterfall: true,
    skipNormalize: true,
    supportedModes: ['web', 'ios', 'android'],
    test: (input) => isOriginTag(input) || isBuildInTag(input),
    web: handleComponentTag,
    ios: handleComponentTag,
    android: handleComponentTag
  }
}
