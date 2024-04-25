module.exports = function getSpec ({ warn, error }) {
  const print = ({ platform, type = 'prop', isError = true }) => ({ prop, value }) => {
    let content = ''
    if (type === 'prop') {
      content = `CSS property ${prop} is not supported in ${platform} environment!`
    } else if (type === 'value' && SUPPORTED_PROP_VAL_ARR[prop]?.length > 0 && !SUPPORTED_PROP_VAL_ARR[prop].includes(value)) {
      content = `CSS property ${prop} only support value [${SUPPORTED_PROP_VAL_ARR[prop]?.join(',')}] in ${platform} environment, the value ['${value}'] does not support!`
    }
    isError ? error(content) : warn(content)
  }
  // React Native 不支持的 CSS property
  const unsupportedPropExp = new RegExp('^(box-sizing|white-space|text-overflow)$') // box-sizing|white-space|text-overflow 替换用法待确认
  // property background 的校验  包含background且不包含background-color
  const bgSuppotedExp = new RegExp(/^((?!background-color).)*background((?!background-color).)*$/)
  const UnsupportedPropError = print({ platform: 'react', isError: true, type: 'prop' })
  
  // React Native 某些属性仅支持部分枚举值
  const SUPPORTED_PROP_VAL_ARR = {
    'overflow': ['visible', 'hidden', 'scroll'],
    'border-style': ['solid', 'dotted', 'dashed'],
    'display': ['flex', 'none'],
    'pointer-events': ['auto', 'none'],
    'vertical-align': ['auto', 'top', 'bottom', 'center']
  }
  const propValExp = new RegExp('^(' + Object.keys(SUPPORTED_PROP_VAL_ARR).join('|') + ')$')
  const UnsupportedPropValError = print({ platform: 'react', isError: true, type: 'value'})
  
  // 简写格式化 Todo 待确认
  const textShadowMap = { // 仅支持 offset-x | offset-y | blur-radius | color 排序
    textShadowOffset: ['width','height'],
    textShadowRadius: 0,
    textShadowColor: 0
  }
  
  // const textShadowMap = 'textShadowOffset.width:number textShadowOffset.height:number textShadowRadius:number textShadowColor:color '
  const borderMap = {  // 仅支持 width | style | color 这种排序
    borderWidth: 0,
    borderStyle: 0,
    borderColor: 0
  }
  
  const shadowMap  = {
    shadowOffset: ['width', 'height'],
    shadowRadius: 0,
    shadowColor: 0
  }
  // todo: check 此处看起来是完全依赖shadowMap里面的map属性的编写顺序？
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
          error(`React Native property ${curProp} need ${curVal.length} value, but value only remain ${values.length - idx}`)
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
      },
      {
        text: 'box-shadow',
        react ({ prop, value}) { // offset-x | offset-y | blur-radius | color
          // TODO 还需要基于Andorid/iOS平台来进行区分编写，后续补齐
          return formatAbbreviation({ prop, value, keyMap: shadowMap })
        }
      }
    ]
  }
  return spec
}
