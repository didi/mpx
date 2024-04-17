const unsupported = require('./unsupported')

module.exports = function getSpec ({ warn, error }) {

  const print = ({ platform, type = 'prop', isError = true, unsupportedMap = {} }) => ({ prop, value }) => {
    let content = ''
    if (type === 'prop') { // css pro 不支持
      content = `CSS property ${prop} is not supported in ${platform} environment!`
    } else if (type === 'value' && unsupportedMap[prop]?.includes(value)) { // css value 不支持
      content = `CSS property ${prop} does not support ['${value}'] value in ${platform} environment!`
    }
    isError ? error({ prop, content }) : warn({ prop, content })
  }
  
  // 简写格式化
  const textShadowMap = { // 仅支持 offset-x | offset-y | blur-radius | color 排序
    textShadowOffset: ['width','height'],
    textShadowRadius: 0,
    textShadowColor: 0
  }
  
  const borderMap = {  // 仅支持 width | style | color 这种排序
    borderWidth: 0,
    borderStyle: 0,
    borderColor: 0
  }
  
  const formatAbbreviation = ({ prop, value, keyMap }) => {
    const values = value.trim().split(/\s+/)
    let idx = 0
    let keyIdx = 0
    const cssMap = []
    const props = Object.keys(keyMap)
    let curProp
    while (idx < values.length) { // 按值的个数循环赋值
      curProp = props[keyIdx]
      // 多个值的属性
      if (Array.isArray(keyMap[curProp])) {
        const curVal = keyMap[curProp]
        if (values.length - idx < curVal.length) {
          error({ curProp, content: `RN prop ${curProp} need ${curVal.length} value, but value only remain ${values.length - idx}` })
          return cssMap.length ? cssMap : { prop, value }
        }
        const newVal = {}
        curVal.forEach(subkey => { // Todo hjw 简写内不支持的 value 的校验提示
          newVal[subkey] = values[idx]
          idx += 1
        })
        cssMap.push({
          prop: curProp,
          value: newVal
        })
        keyIdx = idx - curVal.length + 1
      }
      // 单个值的属性
      if (!keyMap[curProp]){
        cssMap.push({
          prop: curProp,
          value: values[idx]
        })
        idx += 1
        keyIdx += 1
      }
    }
    return cssMap
  }
  
  const spec = {
    supportedModes: ['react'],
    rules: [
      // unsupportedProps()
      ...unsupported({ print }),
      {
        test: 'text-shadow',
        react ({ prop, value }) { // 仅支持 offset-x | offset-y | blur-radius | color 这种排序
          return formatAbbreviation({ prop, value, keyMap: textShadowMap })
        }
      },
      {
        test: 'border',
        react ({ prop, value }) { // 仅支持 width | style | color 这种排序
          return formatAbbreviation({ prop, value, keyMap: borderMap })
        }
      }
    ]
  }
  return spec
}
