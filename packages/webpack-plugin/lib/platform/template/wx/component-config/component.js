const { parseMustache } = require('../../../../template-compiler/compiler')
const normalize = require('../../../../utils/normalize')
const TAG_NAME = 'component'

/** is 属性格式化为中划线(-)连接 */
const formatPropIs = (obj, data) => {
  const parsed = parseMustache(obj.value)
  let value = parsed.result
  if (parsed.hasBinding) value = value.slice(1, -1)
  const el = data.el
  if (el) {
    const injectWxsProp = {
      injectWxsPath: '~' + normalize.lib('runtime/utils.wxs'),
      injectWxsModuleName: '__wxsUtils__'
    }
    if (el.injectWxsProps && Array.isArray(el.injectWxsProps)) {
      el.injectWxsProps.push(injectWxsProp)
    } else {
      el.injectWxsProps = [injectWxsProp]
    }
  }
  return {
    name: 'is',
    value: `{{__wxsUtils__.humpToLine(${value})}}`
  }
}

module.exports = function () {
  return {
    test: TAG_NAME,
    props: [
      {
        test: 'is',
        ali (obj, data) {
          return formatPropIs(obj, data)
        },
        swan (obj, data) {
          return formatPropIs(obj, data)
        }
      }
    ]
  }
}
