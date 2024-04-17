module.exports = function getSpec ({ warn, error }) {
  // react 不支持的 CSS property
  const UNSUPPORTED_PROP_ARR = ['box-sizing'] // 测试用
  // react CSS property 有不支持的 value
  const UNSUPPORTED_PROP_VAL_ARR = {
    'overflow': ['clip', 'auto'],
    'border-style': ['none', 'hidden', 'double', 'groove', 'ridge', 'inset', 'outset'],
    'vertical-align': ['baseline', 'sub', 'text-top'],
  }
  // react 某些属性仅支持部分枚举值
  const SUPPORTED_PROP_VAL_ARR = {
    'display': ['flex', 'none'],
    'pointer-events': ['auto', 'none']
  }
  
  const print = ({ platform, type = 'prop', isError = true }) => ({ prop, value }) => {
    let content = ''
    if (type === 'prop') { // css pro 不支持
      content = `CSS property ${prop} is not supported in ${platform} environment!`
    } else if (type === 'value' && SUPPORTED_PROP_VAL_ARR[prop]?.length > 0 && !SUPPORTED_PROP_VAL_ARR[prop].includes(value)) {
      content = `CSS property ${prop} only support value [${SUPPORTED_PROP_VAL_ARR[prop]?.join(',')}] in ${platform} environment, the value ['${value}'] does not support!`
    } else if (type === 'value' && UNSUPPORTED_PROP_VAL_ARR[prop]?.includes(value)) {
      content = `CSS property ${prop} does not support ['${value}'] value in ${platform} environment!`
    }
    isError ? error({ prop, content }) : warn({ prop, content })
  }
  
  const UnsupportedPropError = print({ platform: 'react', isError: true, type: 'prop' })
  const unsupportedPropExp = new RegExp('^(' + UNSUPPORTED_PROP_ARR.join('|') + ')$')
  
  const propValExp = new RegExp('^(' + (Object.keys(SUPPORTED_PROP_VAL_ARR).concat(Object.keys(UNSUPPORTED_PROP_VAL_ARR))).join('|') + ')$')
  const UnsupportedPropValError = print({ platform: 'react', isError: true, type: 'value'})
  
  const bgSuppotedExp = new RegExp(/^((?!background-color).)*background-((?!background-color).)*$/) // 包含background-且不包含background-color
  // const unsupportedBgError = unsupportedPropExp
  
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
        curVal.forEach(subkey => { // Todo hjw 1.组合内不支持的 prop & value 的校验提示 2.组合样式内的rpx转换
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
      {
        test: bgSuppotedExp, // 背景正则匹配处理
        react: UnsupportedPropError
      },
      { // RN 不支持的 CSS property
        test: unsupportedPropExp,
        react: UnsupportedPropError
      },
      { // RN 支持的 CSS property value
        test: propValExp,
        react: UnsupportedPropValError
      },
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
