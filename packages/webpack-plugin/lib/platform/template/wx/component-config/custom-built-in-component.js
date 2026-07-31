const CUSTOM_BUILTIN_MODES = ['web', 'ios', 'android', 'harmony']

function testCustomBuiltInTag (tag, meta, data) {
  const map = data && data.customBuiltInComponents
  return !!(map && map[tag])
}

/**
 * 命中后不再走后续常规 component-config（无 waterfall，run-rules 直接 break）。
 * 从 runRules 的 data.customBuiltInComponents 读取配置；先写入 originalTag，再 mpx- 前缀。
 */
function applyCustomBuiltin (el, data) {
  const map = data && data.customBuiltInComponents
  if (!map || !map[el.tag]) return el
  el.originalTag = el.tag
  el.isBuiltIn = true
  el.tag = 'mpx-' + el.originalTag
  return el
}

/**
 * @returns {object}
 */
module.exports = function customBuiltInComponent () {
  return {
    skipNormalize: true,
    supportedModes: CUSTOM_BUILTIN_MODES,
    test: testCustomBuiltInTag,
    web: applyCustomBuiltin,
    ios: applyCustomBuiltin,
    android: applyCustomBuiltin,
    harmony: applyCustomBuiltin
  }
}
