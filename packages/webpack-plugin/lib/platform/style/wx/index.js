module.exports = function getSpec ({ warn, error }) {
  const print = ({ platform, type = 'prop', isError = true }) => ({ prop, value }) => {
    let content = ''
    if (type === 'prop') { // css pro 不支持
      content = `CSS property [${prop}] is not supported in ${platform} environment!`
    } else if (type === 'value' && SUPPORTED_PROP_VAL_ARR[prop]?.length > 0 && !SUPPORTED_PROP_VAL_ARR[prop].includes(value)) {
      content = `CSS property [${prop}] only support value [${SUPPORTED_PROP_VAL_ARR[prop]?.join(',')}] in ${platform} environment, the value ['${value}'] does not support!`
    }
    isError ? error(content) : warn(content)
  }

  // react 不支持的 CSS property
  const unsupportedPropExp = /^(box-sizing|white-space|text-overflow)$/ // box-sizing|white-space|text-overflow 替换用法待确认
  // property background 的校验  包含background且不包含background-color
  const bgSuppotedExp = /^((?!background-color).)*background((?!background-color).)*$/
  const UnsupportedPropError = print({ platform: 'react', isError: true, type: 'prop' })

  // react 某些属性仅支持部分枚举值
  const SUPPORTED_PROP_VAL_ARR = {
    overflow: ['visible', 'hidden', 'scroll'],
    'border-style': ['solid', 'dotted', 'dashed'],
    display: ['flex', 'none'],
    'pointer-events': ['auto', 'none'],
    'vertical-align': ['auto', 'top', 'bottom', 'center']
  }
  const propValExp = new RegExp('^(' + Object.keys(SUPPORTED_PROP_VAL_ARR).join('|') + ')$')
  const UnsupportedPropValError = print({ platform: 'react', isError: true, type: 'value' })

  const ValueType = {
    number: 'number',
    color: 'color',
    default: 'default' // 不校验
  }
  // number 类型支持的单位
  const numberRegExp = /^\s*(\d+(\.\d+)?)(rpx|px|%)?\s*$/
  // RN 不支持的颜色格式
  const colorRegExp = /^\s*(lab|lch|oklab|oklch|color-mix|color|hwb|lch|light-dark).*$/

  function verifyValues ({ prop, value, valueType }) {
    switch (valueType) {
      case ValueType.color:
        (numberRegExp.test(value)) && error(`React Native property [${prop}]'s valueType is ${valueType}, we does not set type number`)
        colorRegExp.test(value) && error('React Native color does not support type [lab,lch,oklab,oklch,color-mix,color,hwb,lch,light-dark]')
        return value
      case ValueType.number:
        (!numberRegExp.test(value)) && error(`React Native property [${prop}]'s value only supports unit [rpx,px,%]`)
        return value
      default:
        return value
    }
  }

  // 简写转换规则
  const AbbreviationMap = {
    'text-shadow': { // 仅支持 offset-x | offset-y | blur-radius | color 排序
      'textShadowOffset.width': ValueType.number,
      'textShadowOffset.height': ValueType.number,
      textShadowRadius: ValueType.number,
      textShadowColor: ValueType.color
    },
    border: { // 仅支持 width | style | color 这种排序
      borderWidth: ValueType.number,
      borderStyle: ValueType.default,
      borderColor: ValueType.color
    },
    'box-shadow': { // 仅支持 offset-x | offset-y | blur-radius | color 排序
      'shadowOffset.width': ValueType.number,
      'shadowOffset.height': ValueType.number,
      shadowRadius: ValueType.number,
      shadowColor: ValueType.color
    }
  }

  const formatAbbreviation = ({ prop, value, keyMap }) => {
    const values = value.trim().split(/\s(?![^()]*\))/)
    const cssMap = []
    const props = Object.getOwnPropertyNames(keyMap)
    let idx = 0
    // 按值的个数循环赋值
    while (idx < values.length && idx < props.length) {
      const prop = props[idx]
      const valueType = keyMap[prop]
      const value = verifyValues({ prop, value: values[idx], valueType })
      if (prop.includes('.')) { // 多个属性值的prop
        const [main, sub] = prop.split('.')
        const cssData = cssMap.find(item => item.prop === main)
        if (cssData) { // 设置过
          cssData.value[sub] = value
        } else { // 第一次设置
          cssMap.push({
            prop: main,
            value: {
              [sub]: value
            }
          })
        }
      } else { // 单个值的属性
        cssMap.push({
          prop,
          value
        })
      }
      idx += 1
    }
    return cssMap
  }

  const commonAbbreviationExp = /^(text-shadow|border)$/
  const getAbbreviation = ({ prop, value }) => {
    const keyMap = AbbreviationMap[prop]
    return formatAbbreviation({ prop, value, keyMap })
  }

  const spec = {
    supportedModes: ['ios', 'android'],
    rules: [
      { // RN不支持的背景相关的属性
        test: bgSuppotedExp,
        ios: UnsupportedPropError,
        android: UnsupportedPropError
      },
      { // RN 不支持的 CSS property
        test: unsupportedPropExp,
        ios: UnsupportedPropError,
        android: UnsupportedPropError
      },
      { // RN 支持的 CSS property value
        test: propValExp,
        ios: UnsupportedPropValError,
        android: UnsupportedPropValError
      },
      { // 通用的简写格式匹配
        test: commonAbbreviationExp,
        ios: getAbbreviation,
        android: getAbbreviation
      },
      {
        test: 'box-shadow',
        ios: getAbbreviation,
        // Todo android 阴影转换要单独写
        android({ prop, value }) {
          return { prop, value }
        }
      }
    ]
  }
  return spec
}
