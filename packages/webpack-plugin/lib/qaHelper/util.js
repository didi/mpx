/**
 * 快应用props传值不支持驼峰式，需转换成连字符形式，如propObj,父组件传值时应为pro-obj
 * 另外自定义属性也不支持驼峰式命名
*/
function camelToHyphen (str) {
  return str && str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

module.exports = {
  camelToHyphen
}
