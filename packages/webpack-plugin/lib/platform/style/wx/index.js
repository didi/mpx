const { hump2dash } = require('../../../utils/hump-dash')

module.exports = function getSpec ({ warn, error }) {
  // React Native 双端都不支持的 CSS property
  const unsupportedPropExp = /^(box-sizing|white-space|text-overflow|animation|transition)$/
  const unsupportedPropMode = {
    // React Native ios 不支持的 CSS property
    ios: /^(vertical-align)$/,
    // React Native android 不支持的 CSS property
    android: /^(text-decoration-style|text-decoration-color|shadow-offset|shadow-opacity|shadow-radius)$/
  }
  const unsupportedPropError = ({ prop, mode }) => {
    error(`Property [${prop}] is not supported in React Native ${mode} environment!`)
  }

  // React 属性支持的枚举值
  const SUPPORTED_PROP_VAL_ARR = {
    overflow: ['visible', 'hidden', 'scroll'],
    'border-style': ['solid', 'dotted', 'dashed'],
    display: ['flex', 'none'],
    'pointer-events': ['auto', 'none'],
    'vertical-align': ['auto', 'top', 'bottom', 'center'],
    position: ['relative', 'absolute'],
    'font-variant': ['small-caps', 'oldstyle-nums', 'lining-nums', 'tabular-nums', 'proportional-nums'],
    'text-align': ['left', 'right', 'center', 'justify'],
    'font-style': ['normal', 'italic'],
    'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    'text-decoration-line': ['none', 'underline', 'line-through', 'underline line-through'],
    'text-transform': ['none', 'uppercase', 'lowercase', 'capitalize'],
    'user-select': ['auto', 'text', 'none', 'contain', 'all'],
    'align-content': ['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'],
    'align-items': ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
    'align-self': ['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
    'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly', 'none'],
    'background-size': ['contain', 'cover', 'auto'],
    'background-repeat': ['no-repeat']
  }
  const propValExp = new RegExp('^(' + Object.keys(SUPPORTED_PROP_VAL_ARR).join('|') + ')$')
  const isIllegalValue = ({ prop, value }) => SUPPORTED_PROP_VAL_ARR[prop]?.length > 0 && !SUPPORTED_PROP_VAL_ARR[prop].includes(value)
  const unsupportedValueError = ({ prop, value }) => {
    error(`Property [${prop}] only support value [${SUPPORTED_PROP_VAL_ARR[prop]?.join(',')}] in React Native environment, the value [${value}] does not support!`)
  }

  // 过滤的不合法的属性
  const delRule = ({ prop, value }, { mode }) => {
    if (unsupportedPropExp.test(prop) || unsupportedPropMode[mode].test(prop)) {
      unsupportedPropError({ prop, mode })
      return false
    }
    if (isIllegalValue({ prop, value })) {
      unsupportedValueError({ prop, value })
      return false
    }
  }

  // color & number 值校验
  const ValueType = {
    number: 'number',
    color: 'color',
    default: 'default' // 不校验
  }
  // number 类型支持的单位(包含auto)
  const numberRegExp = /^\s*((\d+(\.\d+)?)(rpx|px|%)?)|(auto)\s*$/
  // RN 不支持的颜色格式
  const colorRegExp = /^\s*(lab|lch|oklab|oklch|color-mix|color|hwb|lch|light-dark).*$/

  const verifyValues = ({ prop, value, valueType }) => {
    // 校验 value 枚举 是否支持
    switch (valueType) {
      case ValueType.color: {
        const isNumber = numberRegExp.test(value)
        const isUnsupporttedColor = colorRegExp.test(value)
        isNumber && warn(`Property [${prop}] receives a valid color as value, not a number.`)
        isUnsupporttedColor && warn('React Native\'s supported color format does not contain [lab,lch,oklab,oklch,color-mix,color,hwb,lch,light-dark].')
        return !isNumber && !isUnsupporttedColor
      }
      case ValueType.number: {
        const isNumber = numberRegExp.test(value)
        !isNumber && warn(`React Native property [${prop}] unit only supports [rpx,px,%]`)
        return isNumber
      }
      default:
        return true
    }
  }
  // 统一校验 value type 值类型
  const checkCommonValue = (valueType) => ({ prop, value }) => {
    verifyValues({ prop, value, valueType })
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
    'border-left': { // 仅支持 width | style | color 这种排序
      borderLeftWidth: ValueType.number,
      borderLeftStyle: ValueType.default,
      borderLeftColor: ValueType.color
    },
    'border-right': { // 仅支持 width | style | color 这种排序
      borderRightWidth: ValueType.number,
      borderRightStyle: ValueType.default,
      borderRightColor: ValueType.color
    },
    'border-top': { // 仅支持 width | style | color 这种排序
      borderTopWidth: ValueType.number,
      borderTopStyle: ValueType.default,
      borderTopColor: ValueType.color
    },
    'border-bottom': { // 仅支持 width | style | color 这种排序
      borderBottomWidth: ValueType.number,
      borderBottomStyle: ValueType.default,
      borderBottomColor: ValueType.color
    },
    'box-shadow': { // 仅支持 offset-x | offset-y | blur-radius | color 排序
      'shadowOffset.width': ValueType.number,
      'shadowOffset.height': ValueType.number,
      shadowRadius: ValueType.number,
      shadowColor: ValueType.color
    },
    'text-decoration': { // 仅支持 text-decoration-line text-decoration-style text-decoration-color 这种格式
      textDecorationLine: ValueType.default,
      textDecorationStyle: ValueType.default,
      textDecorationColor: ValueType.color
    },
    flex: { // /* Three values: flex-grow | flex-shrink | flex-basis */
      flexGrow: ValueType.number,
      flexShrink: ValueType.number,
      flexBasis: ValueType.number
    },
    'flex-flow': { // 仅支持 flex-flow: <'flex-direction'> or flex-flow: <'flex-direction'> and <'flex-wrap'>
      flexDirection: ValueType.default,
      flexWrap: ValueType.default
    },
    'border-radius': {
      borderTopLeftRadius: ValueType.number,
      borderTopRightRadius: ValueType.number,
      borderBottomRightRadius: ValueType.number,
      borderBottomLeftRadius: ValueType.number
    }
  }
  const formatAbbreviation = ({ value, keyMap }) => {
    const values = value.trim().split(/\s(?![^()]*\))/)
    const cssMap = []
    const props = Object.getOwnPropertyNames(keyMap)
    let idx = 0
    // 按值的个数循环赋值
    while (idx < values.length && idx < props.length) {
      const prop = props[idx]
      const valueType = keyMap[prop]
      const dashProp = hump2dash(prop)
      // 校验 value 类型
      verifyValues({ prop, value: values[idx], valueType })
      const value = values[idx]
      if (isIllegalValue({ prop: dashProp, value })) {
        // 过滤不支持 value
        unsupportedValueError({ prop: dashProp, value })
      } else if (prop.includes('.')) {
        // 多个属性值的prop
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
      } else {
        // 单个值的属性
        cssMap.push({
          prop,
          value
        })
      }
      idx += 1
    }
    return cssMap
  }
  const getAbbreviation = ({ prop, value }) => {
    const keyMap = AbbreviationMap[prop]
    return formatAbbreviation({ prop, value, keyMap })
  }
  // 简写过滤安卓不支持的类型
  const getAbbreviationAndroid = ({ prop, value }, { mode }) => {
    const cssMap = getAbbreviation({ prop, value })
    // android 不支持的 shadowOffset shadowOpacity shadowRadius textDecorationStyle 和 textDecorationStyle
    return cssMap.filter(({ prop }) => { // 不支持的 prop 提示 & 过滤不支持的 prop
      const dashProp = hump2dash(prop)
      if (unsupportedPropMode.android.test(dashProp)) {
        unsupportedPropError({ prop: dashProp, mode })
        return false
      }
      return true
    })
  }

  const formatMargins = ({ prop, value }) => {
    const values = value.trim().split(/\s(?![^()]*\))/)
    // validate
    for (let i = 0; i < values.length; i++) {
      verifyValues({ prop, value: values[i], valueType: ValueType.number })
    }
    // format
    let suffix = []
    switch (values.length) {
      // case 1:
      case 2:
        suffix = ['Vertical', 'Horizontal']
        break
      case 3:
        suffix = ['Top', 'Horizontal', 'Bottom']
        break
      case 4:
        suffix = ['Top', 'Right', 'Bottom', 'Left']
        break
    }
    return values.map((value, index) => {
      return {
        prop: `${prop}${suffix[index] || ''}`,
        value: value
      }
    })
  }

  const formatLineHeight = ({ prop, value }) => {
    if (!verifyValues({ prop, value, valueType: ValueType.number })) return false

    return {
      prop,
      value: /\d+(\.\d+)?$/.test(value) ? `${Math.round(value * 100)}%` : value
    }
  }

  const getFontVariant = ({ prop, value }) => {
    if (/^(font-variant-caps|font-variant-numeric|font-variant-east-asian|font-variant-alternates|font-variant-ligatures)$/.test(prop)) {
      error(`Property [${prop}] is not supported in React Native environment, please replace [font-variant]!`)
    }
    prop = 'font-variant'
    // 校验枚举值
    if (isIllegalValue({ prop, value })) {
      unsupportedValueError({ prop, value })
      return false
    }
    return {
      prop,
      value
    }
  }

  // background 相关属性的处理，仅支持以下属性，不支持其他背景相关的属性：/^((?!(-color)).)*background((?!(-color)).)*$/ 包含background且不包含background-color
  const checkBackgroundImage = ({ prop, value }, { mode }) => {
    const bgPropMap = {
      image: 'background-image',
      color: 'background-color',
      size: 'background-size',
      repeat: 'background-repeat',
      // position: 'background-position',
      all: 'background'
    }
    const urlExp = /url\(["']?(.*?)["']?\)/
    switch (prop) {
      case bgPropMap.color: {
        // background-color 背景色校验一下颜色值
        verifyValues({ prop, value, valueType: ValueType.color })
        return { prop, value }
      }
      case bgPropMap.image: {
        // background-image 仅支持背景图
        const imgUrl = value.match(urlExp)?.[0]
        if (/.*linear-gradient*./.test(value)) {
          error(`<linear-gradient()> is not supported in React Native ${mode} environment!`)
        }
        if (imgUrl) {
          return { prop, value: imgUrl }
        } else {
          error(`[${prop}] only support value <url()>`)
          return false
        }
      }
      case bgPropMap.size: {
        // background-size
        // 不支持逗号分隔的多个值：设置多重背景!!!
        // 支持一个值:这个值指定图片的宽度，图片的高度隐式的为 auto
        // 支持两个值:第一个值指定图片的宽度，第二个值指定图片的高度
        if (value.includes(',')) { // commas are not allowed in values
          error(`background size value[${value}] does not support commas in React Native ${mode} environment!`)
          return false
        }
        const values = []
        value.trim().split(/\s(?![^()]*\))/).forEach(item => {
          if (numberRegExp.test(item) || !isIllegalValue({ prop, value: item })) {
            // 支持 number 值 / container cover auto 枚举
            values.push(item)
          } else {
            error(`background size value[${value}] does not support in React Native ${mode} environment!`)
          }
        })
        // value 无有效值时返回false
        return values.length === 0 ? false : { prop, value: values }
      }
      case bgPropMap.repeat: {
        // background-repeat 仅支持 no-repeat
        if (isIllegalValue({ prop, value })) {
          unsupportedValueError({ prop, value })
          return false
        }
        return { prop, value }
      }
      case bgPropMap.all: {
        // background: 仅支持 background-image & background-color & background-repeat
        const bgMap = []
        const values = value.trim().split(/\s(?![^()]*\))/)
        values.forEach(item => {
          const url = item.match(urlExp)?.[0]
          if (/.*linear-gradient*./.test(item)) {
            error(`<linear-gradient()> is not supported in React Native ${mode} environment!`)
          } else if (url) {
            bgMap.push({ prop: bgPropMap.image, value: url })
          } else if (/^(#[0-9a-f]{3}$|#[0-9a-f]{6}$|rgb|rgba)/i.test(item)) {
            bgMap.push({ prop: bgPropMap.color, value: item })
          } else if (SUPPORTED_PROP_VAL_ARR[bgPropMap.repeat].includes(item)) {
            bgMap.push({ prop: bgPropMap.repeat, value: item })
          }
          // else if (SUPPORTED_PROP_VAL_ARR[bgPropMap.size].includes(item)) {
          //   bgMap.push({ prop: bgPropMap.size, value: item })
          // }
        })
        return bgMap.length ? bgMap : false
      }
    }
    unsupportedPropError({ prop, mode })
    return false
  }

  const getBorderRadius = ({ prop, value }) => {
    const values = value.trim().split(/\s(?![^()]*\))/)
    if (values.length === 1) {
      verifyValues({ prop, value, valueType: ValueType.number })
      return { prop, value }
    } else {
      return getAbbreviation({ prop, value })
    }
  }

  const spec = {
    supportedModes: ['ios', 'android'],
    rules: [
      { // 背景相关属性的处理
        test: /^(background|background-image|background-color|background-size|background-repeat|background-position)$/,
        ios: checkBackgroundImage,
        android: checkBackgroundImage
      },
      { // RN 不支持的 CSS property
        test: unsupportedPropExp,
        ios: delRule,
        android: delRule
      },
      { // React Native android 不支持的 CSS property
        test: unsupportedPropMode.android,
        android: delRule
      },
      { // React Native ios 不支持的 CSS property
        test: unsupportedPropMode.ios,
        ios: delRule
      },
      { // RN 支持的 CSS property value
        test: propValExp,
        ios: delRule,
        android: delRule
      },
      {
        test: 'box-shadow',
        ios: getAbbreviation,
        android: getAbbreviationAndroid
      },
      {
        test: 'text-decoration',
        ios: getAbbreviation,
        android: getAbbreviationAndroid
      },
      {
        test: /^(font-variant|font-variant-caps|font-variant-numeric|font-variant-east-asian|font-variant-alternates|font-variant-ligatures)$/,
        ios: getFontVariant,
        android: getFontVariant
      },
      {
        test: 'border-radius',
        ios: getBorderRadius,
        android: getBorderRadius
      },
      { // margin padding 内外边距的处理
        test: /^(margin|padding)$/,
        ios: formatMargins,
        android: formatMargins
      },
      // 通用的简写格式匹配
      {
        test: new RegExp('^(' + Object.keys(AbbreviationMap).join('|') + ')$'),
        ios: getAbbreviation,
        android: getAbbreviation
      },
      { // line-height 换算
        test: 'line-height',
        ios: formatLineHeight,
        android: formatLineHeight
      },
      // 值类型校验放到最后
      { // color 颜色值校验 color xx-color 等
        test: /^(color|(.+-color))$/,
        ios: checkCommonValue(ValueType.color),
        android: checkCommonValue(ValueType.color)
      },
      { // number 值校验 // width height xx-left xx-top 等
        test: /^((width|height)|(.+-(left|right|top|bottom|radius|spacing|size)))$/,
        ios: checkCommonValue(ValueType.number),
        android: checkCommonValue(ValueType.number)
      }
    ]
  }
  return spec
}
