const { hump2dash } = require('../../../utils/hump-dash')
const { parseValues } = require('../../../utils/string')

module.exports = function getSpec ({ warn, error }) {
  // React Native 双端都不支持的 CSS property
  // border-*-style 在 RN 双端都不支持，仅支持统一的 border-style；shorthand 路径会展开到 border-style，长属性写法直接拦截
  const unsupportedPropExp = /^(white-space|text-overflow|animation|font-variant-caps|font-variant-numeric|font-variant-east-asian|font-variant-alternates|font-variant-ligatures|caret-color|float|clear|border-(top|right|bottom|left)-style)$/
  const unsupportedPropMode = {
    // React Native ios 不支持的 CSS property
    ios: /^(vertical-align)$/,
    // React Native android 不支持的 CSS property
    android: /^(text-decoration-style|text-decoration-color|shadow-offset|shadow-opacity|shadow-radius)$/,
    // TODO: rnoh 文档暂未找到 css 属性支持说明，暂时同步 android，同时需要注意此处校验是否有缺失，类似 will-change 之类属性
    harmony: /^(text-decoration-style|text-decoration-color|shadow-offset|shadow-opacity|shadow-radius)$/
  }
  const isNum = (v) => !isNaN(+v)
  // var(xx)
  const cssVariableExp = /var\(/
  // calc(xx)
  const calcExp = /calc\(/
  const envExp = /env\(/
  const silentVerify = 'silent'
  const namedColorSet = new Set(['transparent', 'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'])
  const hexColorExp = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
  const colorFnExp = /^(rgb|rgba|hsl|hsla|hwb)\(.+\)$/
  const valueExp = {
    integer: { test: isNum },
    length: /^((-?(\d+(\.\d+)?|\.\d+))(rpx|px|%|vw|vh)?|hairlineWidth)$/,
    color: { test: (v) => namedColorSet.has(v) || hexColorExp.test(v) || colorFnExp.test(v) }
  }

  // 不支持的属性提示
  const unsupportedPropError = ({ prop, value, selector }, { mode }, isError = true) => {
    const tips = isError ? error : warn
    tips(`Property [${prop}] on ${selector} is not supported in ${mode} environment!`)
  }
  // prop 校验
  const verifyProps = ({ prop, value, selector }, { mode }, isError = true) => {
    prop = prop.trim()
    if (unsupportedPropExp.test(prop) || unsupportedPropMode[mode].test(prop)) {
      unsupportedPropError({ prop, value, selector }, { mode }, isError)
      return false
    }
    return true
  }
  // 值类型
  const ValueType = {
    integer: 'integer',
    length: 'length',
    color: 'color',
    enum: 'enum'
  }
  // 校验失败提示中的示例值（按类型）。enum 依赖具体 prop 的白名单，在 tipsType 内动态拼。
  const valueTypeExample = {
    [ValueType.length]: '2rpx,10%,30rpx',
    [ValueType.color]: 'rgb,rgba,hsl,hsla,hwb,named color,#000000'
  }
  // React 属性支持的枚举值
  const SUPPORTED_PROP_VAL_ARR = {
    'box-sizing': ['border-box', 'content-box'],
    'backface-visibility': ['visible', 'hidden'],
    overflow: ['visible', 'hidden', 'scroll'],
    // RN 实测仅支持 solid/dotted/dashed；none 作为 CSS 合法值保留到运行时统一转换为 borderWidth: 0
    'border-style': ['solid', 'dotted', 'dashed', 'none'],
    'object-fit': ['cover', 'contain', 'fill', 'scale-down'],
    direction: ['inherit', 'ltr', 'rtl'],
    display: ['flex', 'none'],
    'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
    'flex-wrap': ['wrap', 'nowrap', 'wrap-reverse'],
    'pointer-events': ['auto', 'box-none', 'box-only', 'none'],
    'vertical-align': ['auto', 'top', 'bottom', 'middle'],
    position: ['relative', 'absolute', 'fixed'],
    'font-variant': ['small-caps', 'oldstyle-nums', 'lining-nums', 'tabular-nums', 'proportional-nums'],
    'text-align': ['left', 'right', 'center', 'justify'],
    'font-style': ['normal', 'italic'],
    'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    'text-decoration-line': ['none', 'underline', 'line-through', 'underline line-through'],
    'text-decoration-style': ['solid', 'double', 'dotted', 'dashed'],
    'text-transform': ['none', 'uppercase', 'lowercase', 'capitalize'],
    'user-select': ['auto', 'text', 'none', 'contain', 'all'],
    'align-content': ['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around', 'space-evenly'],
    'align-items': ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
    'align-self': ['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
    'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
    'background-size': ['contain', 'cover', 'auto', ValueType.length],
    'background-position': ['left', 'right', 'top', 'bottom', 'center', ValueType.length],
    'background-repeat': ['no-repeat'],
    width: ['auto', ValueType.length],
    height: ['auto', ValueType.length],
    left: ['auto', ValueType.length],
    right: ['auto', ValueType.length],
    top: ['auto', ValueType.length],
    bottom: ['auto', ValueType.length],
    inset: ['auto', ValueType.length],
    'flex-basis': ['auto', ValueType.length],
    margin: ['auto', ValueType.length],
    'margin-top': ['auto', ValueType.length],
    'margin-left': ['auto', ValueType.length],
    'margin-bottom': ['auto', ValueType.length],
    'margin-right': ['auto', ValueType.length],
    'margin-horizontal': ['auto', ValueType.length],
    'margin-vertical': ['auto', ValueType.length],
    // outline-style 走 enum 校验；与 border-style 对齐，不支持 double / groove / ridge
    'outline-style': ['solid', 'dotted', 'dashed', 'none']
  }
  // 获取值类型
  const getValueType = (prop) => {
    const propValueTypeRules = [
      // 重要！！优先判断是不是枚举类型
      [ValueType.enum, new RegExp('^(' + Object.keys(SUPPORTED_PROP_VAL_ARR).join('|') + ')$')],
      [ValueType.length, /^(gap|(.+-(width|height|left|right|top|bottom|radius|spacing|size|gap|offset)))$/],
      [ValueType.integer, /^((opacity|flex-grow|flex-shrink|z-index)|(.+-(index|opacity)))$/],
      [ValueType.color, /^(color|(.+-color))$/]
    ]
    for (const rule of propValueTypeRules) {
      if (rule[1].test(prop)) return rule[0]
    }
  }

  // 从 CSS 变量中提取 fallback 值进行验证
  // 返回值：fallback 值 | null（没有 fallback）| undefined（循环引用）
  const getDefaultValueFromVar = (str, visited = new Set()) => {
    const totalVarExp = /^var\((.+)\)$/
    if (!totalVarExp.test(str)) return str

    // 防止循环引用 - 返回 undefined 表示检测到循环
    if (visited.has(str)) return undefined
    visited.add(str)

    const newVal = parseValues((str.match(totalVarExp)?.[1] || ''), ',')
    if (newVal.length <= 1) return null // 没有 fallback
    // fallback 可能本身包含逗号（如多 font-family 兜底、渐变等），这里取第2段及之后并 join 回去
    const fallback = newVal.slice(1).join(',').trim()
    // 如果 fallback 也是 var()，递归提取
    if (totalVarExp.test(fallback)) return getDefaultValueFromVar(fallback, visited)
    return fallback
  }

  // 属性值校验
  // 返回值：
  // - 通过：返回 true
  // - 失败：返回 false
  const verifyValues = ({ prop, value, selector }, isError = true) => {
    prop = prop.trim()
    const rawValue = value.trim()
    const tips = isError === silentVerify ? () => { } : isError ? error : warn

    // CSS 自定义属性（--xxx）是变量定义，不属于 RN 样式属性：
    // 不能按 `-height/-color` 等后缀推断类型去校验，否则会把变量定义错误过滤，导致运行时 var() 取值失败
    if (/^--/.test(prop)) return true

    // 校验阶段允许使用 fallback 作为最坏情况（避免 RN crash），但输出必须保留 rawValue
    let valueForVerify = rawValue

    if (cssVariableExp.test(valueForVerify)) {
      const fallback = getDefaultValueFromVar(valueForVerify)
      // undefined 表示检测到循环引用
      if (fallback === undefined) {
        tips(`CSS variable circular reference in fallback chain detected in ${selector} for property ${prop}, value: ${rawValue}`)
        return false
      }
      // null 表示没有 fallback，CSS 变量本身是合法的（运行时会解析）
      if (fallback === null) {
        return true
      }
      // 有 fallback 值：使用 fallback 继续做值校验
      valueForVerify = fallback.trim()
    }

    // calc() / env() 跳过值校验，但保留 rawValue 输出
    if (calcExp.test(valueForVerify) || envExp.test(valueForVerify)) return true
    const type = getValueType(prop)
    const tipsType = (type) => {
      const example = type === ValueType.enum
        ? SUPPORTED_PROP_VAL_ARR[prop]?.join(',')
        : valueTypeExample[type]
      tips(`Value of ${prop} in ${selector} should be ${type}${example ? `, eg ${example}` : ''}, received [${rawValue}], please check again!`)
    }
    switch (type) {
      case ValueType.length: {
        if (!valueExp.length.test(valueForVerify)) {
          tipsType(type)
          return false
        }
        return true
      }
      case ValueType.integer: {
        if (!valueExp.integer.test(valueForVerify)) {
          tipsType(type)
          return false
        }
        return true
      }
      case ValueType.color: {
        if (!valueExp.color.test(valueForVerify)) {
          tipsType(type)
          return false
        }
        return true
      }
      case ValueType.enum: {
        // font-variant 长属性允许空格分隔的多值（如 `small-caps tabular-nums`），
        // 走整串比对会误杀多值场景；拆 token 后逐个命中枚举白名单即放行。
        // 输出仍保留 raw value，运行时由 RN `processFontVariant` 自行 `split(' ')` 归一为数组。
        if (prop === 'font-variant') {
          const tokens = parseValues(valueForVerify)
          if (!tokens.length || !tokens.every(t => SUPPORTED_PROP_VAL_ARR[prop].includes(t))) {
            tipsType(type)
            return false
          }
          return true
        }
        const isIn = SUPPORTED_PROP_VAL_ARR[prop].includes(valueForVerify)
        const isType = Object.keys(valueExp).some(item => SUPPORTED_PROP_VAL_ARR[prop].includes(ValueType[item]) && valueExp[item].test(valueForVerify))
        if (!isIn && !isType) {
          tipsType(type)
          return false
        }
        return true
      }
    }
    return true
  }

  // prop & value 校验：过滤的不合法的属性和属性值
  const verification = ({ prop, value, selector }, { mode }) => {
    return verifyProps({ prop, value, selector }, { mode }) && verifyValues({ prop, value, selector }) && ({ prop, value })
  }

  // 简写转换规则
  const AbbreviationMap = {
    'text-shadow': ['textShadowOffset.width', 'textShadowOffset.height', 'textShadowRadius', 'textShadowColor'],
    border: ['borderWidth', 'borderStyle', 'borderColor'],
    // RN 不支持单边 border-*-style，统一展开到 borderStyle
    // 实测 RN 上当 borderStyle 不为 solid 时单边 border-*-color 不生效，
    // 这里把单边 color 也统一展开到 borderColor 规避（width 不能这样做，否则会覆盖其它三边）
    'border-left': ['borderLeftWidth', 'borderStyle', 'borderColor'],
    'border-right': ['borderRightWidth', 'borderStyle', 'borderColor'],
    'border-top': ['borderTopWidth', 'borderStyle', 'borderColor'],
    'border-bottom': ['borderBottomWidth', 'borderStyle', 'borderColor'],
    'text-decoration': ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor'],
    // flex-grow | flex-shrink | flex-basis
    flex: ['flexGrow', 'flexShrink', 'flexBasis'],
    // flex-flow: <'flex-direction'> or flex-flow: <'flex-direction'> and <'flex-wrap'>
    'flex-flow': ['flexDirection', 'flexWrap'],
    'border-radius': ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'],
    'border-width': ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'],
    'border-color': ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
    margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
    padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
    // gap：CSS 2 槽位（row-gap / column-gap），单值复制行列
    gap: ['rowGap', 'columnGap'],
    // inset：4 槽位等价 margin 四值语法；RN inset 长属性不稳定，单值也强制展开
    inset: ['top', 'right', 'bottom', 'left'],
    // outline：RN 0.74 不支持、0.76+ 生效；走无序展开，与 border 共享缺省补齐
    outline: ['outlineWidth', 'outlineStyle', 'outlineColor']
  }

  // 这些简写按 CSS 规范允许 token 顺序自由排列，按值类型识别归位
  const UnorderedAbbreviationMap = {
    'text-shadow': true,
    'text-decoration': true,
    'flex-flow': true,
    border: true,
    'border-left': true,
    'border-right': true,
    'border-top': true,
    'border-bottom': true,
    // outline: <outline-width> || <outline-style> || <outline-color>，顺序不敏感
    outline: true
  }

  // CSS border-width: medium 的实测值（各主流浏览器一致取 3px）
  // CSS 规范允许 medium 实现自定，这里取业界事实标准；调整此值需与运行时同名常量一起改
  const BORDER_MEDIUM_WIDTH = 3
  // 简写槽位缺省值表（数据驱动；新增简写或调整缺省值只改这里）
  // 值即槽位缺省时追加的补齐值；none 清除语义统一保留到运行时处理
  // 注意：borderColor / textShadowRadius 因 RN 有内置缺省值，无需补齐，不进此表
  const ShorthandDefaultMap = {
    border: { borderWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
    'border-top': { borderTopWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
    'border-right': { borderRightWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
    'border-bottom': { borderBottomWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
    'border-left': { borderLeftWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
    // outline 与 border 缺省值完全对齐：缺 width → BORDER_MEDIUM_WIDTH；
    // 缺 style → outlineStyle: none，运行时统一转换为 outlineWidth: 0
    outline: { outlineWidth: BORDER_MEDIUM_WIDTH, outlineStyle: 'none' },
    'text-shadow': {
      // textShadowOffset.height 的「width 存在才补 0」由 formatUnorderedAbbreviation 内既有 fallback 处理
      // 值不带 quote，由后续 style-helper 的 formatValue 统一 JSON.stringify
      textShadowColor: '#000'
    }
    // text-decoration / flex-flow 暂不配置，与 RN 默认一致
  }

  // 通用补齐：扫描完所有 token 后，将 ShorthandDefaultMap 中未被占用（不在 used）的槽位追加到 cssMap
  // used 即主循环的占用记录，key 是完整目标 prop 名（含 textShadowOffset.width 这类 dot 路径）
  const applyShorthandDefaults = (cssMap, prop, used) => {
    const defaults = ShorthandDefaultMap[prop]
    if (!defaults) return cssMap
    for (const target in defaults) {
      if (!used[target]) {
        pushAbbreviationValue(cssMap, target, defaults[target])
      }
    }
    return cssMap
  }

  const pushAbbreviationValue = (cssMap, prop, value) => {
    if (prop.includes('.')) {
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
  }

  const getVerifiedProp = (props, value, selector, mode, used) => {
    return props.find(prop => {
      if (used[prop]) return false
      const newProp = hump2dash(prop.replace(/\..+/, ''))
      return verifyValues({ prop: newProp, value, selector }, silentVerify) &&
        verifyProps({ prop: newProp, value, selector }, { mode }, false)
    })
  }

  const formatUnorderedAbbreviation = ({ prop, value, selector }, { mode }) => {
    const originalValue = value
    const values = Array.isArray(value) ? value : parseValues(value)
    const original = `${prop}:${originalValue}`
    const props = AbbreviationMap[prop]
    const cssMap = []
    const used = {}
    let hasTextDecorationNone = false
    let hasUnderline = false
    let hasLineThrough = false
    // values[0] 而非 originalValue：避免 originalValue 是数组时 toString() 误命中
    if (values.length === 1 && cssVariableExp.test(values[0])) {
      return { prop, value: values[0] }
    }
    values.forEach(value => {
      if (prop === 'text-decoration' && verifyValues({ prop: 'text-decoration-line', value, selector }, silentVerify)) {
        switch (value) {
          case 'underline':
            hasUnderline = true
            return
          case 'line-through':
            hasLineThrough = true
            return
          case 'none':
            hasTextDecorationNone = true
            return
          // verifyValues 通过但分支未处理的 line token：落到通用 getVerifiedProp 流程
        }
      }
      const matchedProp = getVerifiedProp(props, value, selector, mode, used)
      if (!matchedProp) {
        warn(`Value of [${original}] in ${selector} is invalid, received [${value}], please check again!`)
        return
      }
      used[matchedProp] = true
      pushAbbreviationValue(cssMap, matchedProp, value)
    })
    if (prop === 'text-decoration') {
      if (hasUnderline || hasLineThrough) {
        pushAbbreviationValue(cssMap, 'textDecorationLine', hasUnderline && hasLineThrough ? 'underline line-through' : hasUnderline ? 'underline' : 'line-through')
      } else if (hasTextDecorationNone) {
        pushAbbreviationValue(cssMap, 'textDecorationLine', 'none')
      }
    }
    if (prop === 'text-shadow') {
      // text-shadow 至少需要 offset-x 与 offset-y；缺省 height 时按 CSS 默认补 0，避免 RN 上 textShadowOffset.height 缺失
      const shadowOffsetEntry = cssMap.find(item => item.prop === 'textShadowOffset')
      if (shadowOffsetEntry) {
        const offsetVal = shadowOffsetEntry.value
        if (offsetVal && offsetVal.width !== undefined && offsetVal.height === undefined) {
          warn(`Value of [${original}] in ${selector} is missing offset-y, fallback to 0, please check again!`)
          offsetVal.height = 0
        }
      }
    }
    return applyShorthandDefaults(cssMap, prop, used)
  }

  const formatAbbreviation = ({ prop, value, selector }, { mode }) => {
    if (UnorderedAbbreviationMap[prop]) {
      return formatUnorderedAbbreviation({ prop, value, selector }, { mode })
    }
    const original = `${prop}:${value}`
    const props = AbbreviationMap[prop]
    const values = Array.isArray(value) ? value : parseValues(value)
    const cssMap = []
    if (values.length === 1 && cssVariableExp.test(values[0])) {
      return { prop, value: values[0] }
    }
    let idx = 0
    let propsIdx = 0
    const diff = values.length - props.length
    while (idx < values.length) {
      const prop = props[propsIdx]
      if (!prop) {
        warn(`Value of [${original}] in ${selector} has not enough props to assign, please check again!`)
        break
      }
      const value = values[idx]
      const newProp = hump2dash(prop.replace(/\..+/, ''))
      if (!verifyProps({ prop: newProp, value, selector }, { mode }, diff === 0)) {
        // 有 ios or android 不支持的 prop，跳过 prop
        if (diff === 0) {
          propsIdx++
          idx++
        } else {
          propsIdx++
        }
      } else if (!verifyValues({ prop: newProp, value, selector }, diff === 0)) {
        // 值不合法 跳过 value
        if (diff === 0) {
          propsIdx++
          idx++
        } else if (diff < 0) {
          propsIdx++
        } else {
          idx++
        }
      } else {
        pushAbbreviationValue(cssMap, prop, value)
        idx += 1
        propsIdx += 1
      }
    }
    return cssMap
  }

  const formatCompositeVal = ({ prop, value, selector }, { mode }) => {
    // 槽位数由 AbbreviationMap[prop].length 决定（gap=2，inset/margin/padding/border-*=4）
    const count = AbbreviationMap[prop].length
    const values = parseValues(value).splice(0, count)
    // 单值短路：margin / padding / inset / border-* 等 RN 原生支持单值 DimensionValue，原样透传；
    // gap 单值仍需展开（RN gap / rowGap / columnGap 只接受 number，展开后与运行时 runtimeForceExpandCompositeMap 对齐）
    if (values.length === 1 && prop !== 'gap') {
      verifyValues({ prop, value, selector }, false)
      return { prop, value }
    }
    if (count === 2) {
      // gap：单值复制到行列两槽；双值原样
      if (values.length === 1) values.push(values[0])
    } else {
      switch (values.length) {
        // case 1 已被上面单值短路兜走（margin / padding / inset / border-* 四值简写均原样透传单值）
        case 2: values.push(...values); break
        case 3: values.push(values[1]); break
      }
    }
    return formatAbbreviation({ prop, value: values, selector }, { mode })
  }

  // line-height
  const formatLineHeight = ({ prop, value, selector }) => {
    // line-height 0 直接返回
    if (+value === 0) {
      return {
        prop,
        value: 0
      }
    }
    return verifyValues({ prop, value, selector }) && ({
      prop,
      value: isNum(value) ? `${Math.round(value * 100)}%` : value
    })
  }

  // background 相关属性的转换 Todo
  // 仅支持以下属性，不支持其他背景相关的属性
  // /^((?!(-color)).)*background((?!(-color)).)*$/ 包含background且不包含background-color
  const formatBackground = ({ prop, value, selector }, { mode }) => {
    const bgPropMap = {
      image: 'background-image',
      color: 'background-color',
      size: 'background-size',
      repeat: 'background-repeat',
      position: 'background-position',
      all: 'background'
    }
    const urlExp = /url\(["']?(.*?)["']?\)/
    const linearExp = /linear-gradient\(.*\)/
    const formatBackgroundSize = (value) => {
      // 不支持逗号分隔的多个值：设置多重背景!!!
      // 支持一个值:这个值指定图片的宽度，图片的高度隐式的为 auto
      // 支持两个值:第一个值指定图片的宽度，第二个值指定图片的高度
      if (parseValues(value, ',').length > 1) { // commas are not allowed in values
        error(`Value of [${bgPropMap.size}] in ${selector} does not support commas, received [${value}], please check again!`)
        return false
      }
      const values = []
      parseValues(value).forEach(item => {
        if (verifyValues({ prop: bgPropMap.size, value: item, selector })) {
          // 支持 number 值 / container cover auto 枚举
          values.push(item)
        }
      })
      // value 无有效值时返回false
      return values.length === 0 ? false : { prop: bgPropMap.size, value: values }
    }
    const formatBackgroundPosition = (value) => {
      const yAxisKeywords = ['top', 'bottom']
      const values = []
      parseValues(value).forEach(item => {
        if (verifyValues({ prop: bgPropMap.position, value: item, selector })) {
          // 支持 number 值 /  枚举, center与50%等价
          values.push(item === 'center' ? '50%' : item)
        } else {
          // 仅丢这一 token，其它 push 的位置仍输出，按规范使用 warn
          warn(`Value of [${bgPropMap.position}] in ${selector} does not support value [${item}], please check again!`)
        }
      })
      // CSS 允许 y x 顺序的关键字（如 top left），但输出需要 [x, y] 顺序
      if (values.length === 2 && yAxisKeywords.includes(values[0])) {
        ;[values[0], values[1]] = [values[1], values[0]]
      }
      return { prop: bgPropMap.position, value: values }
    }
    switch (prop) {
      case bgPropMap.image: {
        // background-image 支持背景图/渐变/css var
        if (cssVariableExp.test(value) || urlExp.test(value) || linearExp.test(value) || value === 'none') {
          return { prop, value }
        } else {
          error(`Value of ${prop} in ${selector} selector only support value <url()> or <linear-gradient()>, received ${value}, please check again!`)
          return false
        }
      }
      case bgPropMap.size: {
        // background-size
        return formatBackgroundSize(value)
      }
      case bgPropMap.position: {
        return formatBackgroundPosition(value)
      }
      case bgPropMap.all: {
        // background: 支持 image/color/repeat 与 position/size
        if (cssVariableExp.test(value)) {
          return { prop, value }
        }
        // background: none
        if (value === 'none') {
          return [
            { prop: bgPropMap.image, value },
            { prop: bgPropMap.color, value: 'transparent' }
          ]
        }
        const bgMap = []
        const positionValues = []
        const sizeValues = []
        let isSize = false
        const pushPositionOrSize = (item) => {
          if (isSize) {
            if (verifyValues({ prop: bgPropMap.size, value: item, selector }, silentVerify)) {
              sizeValues.push(item)
            } else {
              warn(`Value of [${bgPropMap.all}:${value}] in ${selector} does not support background-size token [${item}], please check again!`)
            }
          } else if (verifyValues({ prop: bgPropMap.position, value: item, selector }, silentVerify)) {
            positionValues.push(item)
          } else {
            warn(`Value of [${bgPropMap.all}:${value}] in ${selector} does not support background-position token [${item}], please check again!`)
          }
        }
        const handlePositionSize = (item) => {
          if (item === '/') {
            isSize = true
            return true
          }
          const parts = parseValues(item, '/')
          if (parts.length > 1) {
            parts.forEach((part, index) => {
              if (index > 0) isSize = true
              part && pushPositionOrSize(part)
            })
            return true
          }
          if (isSize || verifyValues({ prop: bgPropMap.position, value: item, selector }, silentVerify)) {
            pushPositionOrSize(item)
            return true
          }
          return false
        }
        const values = parseValues(value)
        values.forEach(item => {
          const url = item.match(urlExp)?.[0]
          const linerVal = item.match(linearExp)?.[0]
          if (url) {
            bgMap.push({ prop: bgPropMap.image, value: url })
          } else if (linerVal) {
            bgMap.push({ prop: bgPropMap.image, value: linerVal })
          } else if (verifyValues({ prop: bgPropMap.color, value: item, selector }, silentVerify)) {
            bgMap.push({ prop: bgPropMap.color, value: item })
          } else if (verifyValues({ prop: bgPropMap.repeat, value: item, selector }, silentVerify)) {
            bgMap.push({ prop: bgPropMap.repeat, value: item })
          } else if (!handlePositionSize(item)) {
            // 既不是 url / linear-gradient / color / repeat / position-size，也不是合法 position 起头的 token
            // 典型场景：background-attachment / background-origin / background-clip 及拼写错误，RN 均不支持
            warn(`Value of [${bgPropMap.all}:${value}] in ${selector} does not support token [${item}], please check again!`)
          }
        })
        if (positionValues.length) {
          const position = formatBackgroundPosition(positionValues.join(' '))
          position && bgMap.push(position)
        }
        if (sizeValues.length) {
          const size = formatBackgroundSize(sizeValues.join(' '))
          size && bgMap.push(size)
        }
        return bgMap.length ? bgMap : false
      }
    }
    unsupportedPropError({ prop, value, selector }, { mode })
    return false
  }

  // transform 转换
  const formatTransform = ({ prop, value, selector }, { mode }) => {
    // css var & 数组直接返回
    if (Array.isArray(value) || cssVariableExp.test(value)) return { prop, value }
    const values = parseValues(value)
    // Todo 2 RN下顺序不一致转换结果不一致，故这里不处理，动画前后transform排序不一致的问题，由业务调整写法
    // Todo transform 排序不一致时，transform动画会闪烁，故这里同样的排序输出 transform
    // values.sort()
    const transform = []
    values.forEach(item => {
      // const match = item.match(/(\w+)\(([^()]+|\s*var\([^)]+\))\)/)
      const match = item.match(/([/\w]+)\((.+)\)/)
      if (match && match.length >= 3) {
        let key = match[1]
        const val = match[2]
        switch (key) {
          case 'translateX':
          case 'translateY':
          case 'scaleX':
          case 'scaleY':
          case 'rotateX':
          case 'rotateY':
          case 'rotateZ':
          case 'rotate':
          case 'skewX':
          case 'skewY':
          case 'perspective':
            // 单个值处理
            // rotate 处理成 rotateZ
            key = key === 'rotate' ? 'rotateZ' : key
            transform.push({ [key]: val })
            break
          case 'translate':
          case 'scale':
          case 'skew':
          case 'translate3d': // x y 支持 z不支持
          case 'scale3d': // x y 支持 z不支持
            {
              // 2 个以上的值处理
              key = key.replace('3d', '')
              const vals = parseValues(val, ',').splice(0, 3)
              // scale(.5) === scaleX(.5) scaleY(.5)
              if (vals.length === 1 && key === 'scale') {
                vals.push(vals[0])
              }
              const xyz = ['X', 'Y', 'Z']
              vals.forEach((v, index) => {
                if (key !== 'rotate' && index > 1) {
                  // 局部丢弃：仅这一维 (Z) 对应的子项被推出去也是错的，但 X/Y 仍正常输出，按规范使用 warn
                  unsupportedPropError({ prop: `${key}Z`, value, selector }, { mode }, false)
                  return
                }
                // parseValues 内部已 trim，这里不再重复
                transform.push({ [`${key}${xyz[index] || ''}`]: v })
              })
              break
            }
          case 'rotate3d': {
            const parts = parseValues(val, ',')
            if (parts.length === 4) {
              // parseValues 内部已 trim
              const x = +parts[0]
              const y = +parts[1]
              const z = +parts[2]
              const angle = parts[3]
              if (x && !y && !z) transform.push({ rotateX: angle })
              else if (!x && y && !z) transform.push({ rotateY: angle })
              else if (!x && !y && z) transform.push({ rotateZ: angle })
              // 仅丢这一 transform 项，其它项仍输出，按规范使用 warn
              else unsupportedPropError({ prop, value, selector }, { mode }, false)
            } else {
              warn(`Value of [transform] in ${selector} does not support rotate3d with ${parts.length} values, only 4 values are supported, please check again!`)
            }
            break
          }
          case 'matrix':
            {
              const matrixValues = parseValues(val, ',').map(val => +val)
              if (matrixValues.length === 6) {
                const [a, b, c, d, tx, ty] = matrixValues
                transform.push({ matrix: [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1] })
              } else {
                // 仅丢这一 transform 项，其它项仍输出，按规范使用 warn
                warn(`Value of [transform] in ${selector} does not support matrix with ${matrixValues.length} values, only 6 values are supported in ${mode} environment, please check again!`)
              }
              break
            }
          case 'matrix3d':
            {
              const matrixValues = parseValues(val, ',').map(val => +val)
              if (matrixValues.length === 16) {
                transform.push({ matrix: matrixValues })
              } else {
                // 仅丢这一 transform 项，其它项仍输出，按规范使用 warn
                warn(`Value of [transform] in ${selector} does not support matrix3d with ${matrixValues.length} values, only 16 values are supported in ${mode} environment, please check again!`)
              }
              break
            }
          // 不支持的属性处理
          case 'translateZ':
          case 'scaleZ':
          default:
            // 仅丢这一 transform 项，其它项仍输出，按规范使用 warn
            unsupportedPropError({ prop, value, selector }, { mode }, false)
            break
        }
      } else {
        // 仅丢这一 transform 项，其它项仍输出，按规范使用 warn
        warn(`Property [${prop}] is invalid in ${selector}, received [${value}], please check again!`)
      }
    })
    return {
      prop,
      value: transform
    }
  }

  const isNumber = (value) => {
    return !isNaN(+value)
  }

  const getIntegersFlex = ({ prop, value, selector }) => {
    if ((isNumber(value) && value >= 0) || cssVariableExp.test(value)) {
      return { prop, value }
    } else {
      // 仅这一槽位被丢，调用侧 cssMap 仍会输出其它槽位，按规范使用 warn
      warn(`Value of [${prop}] in ${selector} accepts any floating point value >= 0, received [${value}], please check again!`)
      return false
    }
  }

  const formatFlex = ({ prop, value, selector }) => {
    let values = parseValues(value)
    // 值大于3 去前三
    if (values.length > 3) {
      warn(`Value of [flex] in ${selector} supports up to three values, received [${value}], please check again!`)
      values = values.splice(0, 3)
    }
    const cssMap = []
    // 单个css var 直接设置 flex 属性
    if (values.length === 1 && cssVariableExp.test(value)) {
      return { prop, value }
    }
    // 包含枚举值 none initial
    if (values.includes('initial') || values.includes('none')) {
      // css flex: initial ===> flex: 0 1 ===> rn flex 0 1
      // css flex: none ===> css flex: 0 0 ===> rn flex 0 0
      if (values.length === 1) {
        // 添加 basis 和 shrink
        // value=initial 则 flexShrink=1，其他场景都是0
        cssMap.push(...[{ prop: 'flexGrow', value: 0 }, { prop: 'flexShrink', value: +(values[0] === 'initial') }])
      } else {
        error(`Value of [${prop}] in ${selector} is invalid, When setting the value of flex to none or initial, only one value is supported.`)
      }
      return cssMap
    }
    // 只有1-2个值且最后的值是flexBasis 的有效值（auto或者有单位百分比、px等）
    // 在设置 flex basis 有效值的场景下，如果没有设置 grow 和 shrink，则默认为1
    // 单值 flex: 1 1 <flex-basis>
    // 双值 flex: <flex-grow> 1 <flex-basis>
    // 三值 flex: <flex-grow> <flex-shrink> <flex-basis>
    for (let i = 0; i < 3; i++) {
      if (i < 2) {
        // 添加 grow 和 shrink
        const isValid = isNumber(values[0]) || cssVariableExp.test(values[0])
        // 兜底 1
        const val = isValid ? values[0] : 1
        const item = getIntegersFlex({ prop: AbbreviationMap[prop][i], value: val, selector })
        item && cssMap.push(item)
        isValid && values.shift()
      } else {
        // 添加 flexBasis
        // 有单位(百分比、px等) 的 value 赋值 flexBasis，auto 不处理，兜底 0
        const val = values[0] || 0
        if (val !== 'auto') {
          cssMap.push({
            prop: 'flexBasis',
            value: val
          })
        }
      }
    }
    return cssMap
  }

  const formatFontFamily = ({ prop, value, selector }) => {
    // 去掉引号 取逗号分隔后的第一个
    const newVal = value.replace(/"|'/g, '').trim()
    const values = parseValues(newVal, ',')
    if (!newVal || !values.length) {
      error(`Value of [${prop}] is invalid in ${selector}, received [${value}], please check again!`)
      return false
    } else if (values.length > 1) {
      warn(`Value of [${prop}] only supports one in ${selector}, received [${value}], and the first one is used by default.`)
    }
    // parseValues 内部已 trim，这里无需再 trim
    return { prop, value: values[0] }
  }

  // const formatBoxShadow = ({ prop, value, selector }, { mode }) => {
  //   value = value.trim()
  //   if (value === 'none') {
  //     return false
  //   }
  //   const cssMap = formatAbbreviation({ prop, value, selector }, { mode })
  //   if (mode === 'android' || mode === 'harmony') return cssMap
  //   // ios 阴影需要额外设置 shadowOpacity=1
  //   cssMap.push({
  //     prop: 'shadowOpacity',
  //     value: 1
  //   })
  //   return cssMap
  // }

  // font 简写专用 formatter。RN 等效子集语法：
  //   font: [ <font-style> ] [ <font-variant-css2> ] [ <font-weight> ] <font-size> [ / <line-height> ] <font-family>
  // - 必填项：font-size 与 font-family；缺其一整条声明丢弃（error）
  // - 非必填 token（font-stretch / 数字型 font-variant-numeric / system 关键字等）：warn 提示并忽略，保留其余槽位
  // - font-variant 仅支持 small-caps（CSS font 简写规范 <font-variant-css2>），与 RN processFontVariant 同口径（字符串透传，内部 split 为数组）
  const formatFont = ({ prop, value, selector }, { mode }) => {
    value = value.trim()
    // 单 var() 兜底：编译期无法判断内部 token，原样返回交给运行时解析
    if (cssVariableExp.test(value) && parseValues(value).length === 1) {
      return { prop, value }
    }
    const tokens = parseValues(value)
    const cssMap = []
    let sizeIdx = -1
    let lineHeight
    // 1. 定位 font-size（第一个 length 类型 token，可能带 /<line-height>）
    //   注意：unit-less 数字也命中 length 正则，需要先排除 font-weight 数字（100..900 / bold / normal），
    //   否则 `font: small-caps 500 28rpx Arial` 会把 500 误判为 fontSize。
    for (let i = 0; i < tokens.length; i++) {
      let t = tokens[i]
      if (t.endsWith('/') && tokens[i + 1]) {
        t += tokens[i + 1]
        tokens.splice(i + 1, 1)
      } else if (tokens[i + 1] === '/' && tokens[i + 2]) {
        t += `/${tokens[i + 2]}`
        tokens.splice(i + 1, 2)
      } else if (tokens[i + 1]?.startsWith('/') && tokens[i + 1].length > 1) {
        t += tokens[i + 1]
        tokens.splice(i + 1, 1)
      }
      const [sizePart, lhPart] = parseValues(t, '/')
      if (verifyValues({ prop: 'font-weight', value: sizePart, selector }, silentVerify)) continue
      if (verifyValues({ prop: 'font-size', value: sizePart, selector }, silentVerify)) {
        sizeIdx = i
        cssMap.push({ prop: 'fontSize', value: sizePart })
        if (lhPart) lineHeight = lhPart
        break
      }
    }
    if (sizeIdx === -1) {
      // 缺必填 font-size → 整条声明丢弃
      error(`Value of [${prop}:${value}] in ${selector} is missing required <font-size>, please check again!`)
      return false
    }
    // 2. 前导段（font-size 之前）：识别 font-style / font-variant(small-caps) / font-weight，顺序不敏感
    for (let i = 0; i < sizeIdx; i++) {
      const t = tokens[i]
      if (t === 'normal') continue // 默认值跳过
      if (verifyValues({ prop: 'font-style', value: t, selector }, silentVerify)) {
        cssMap.push({ prop: 'fontStyle', value: t })
      } else if (t === 'small-caps') {
        // CSS font 简写的 variant 槽位仅 <font-variant-css2>（normal | small-caps）；
        // 字符串透传，RN processFontVariant 会 split 归一为数组，与 font-variant 长属性同口径
        cssMap.push({ prop: 'fontVariant', value: t })
      } else if (verifyValues({ prop: 'font-weight', value: t, selector }, silentVerify)) {
        cssMap.push({ prop: 'fontWeight', value: t })
      } else {
        // font-stretch / 数字型 font-variant-numeric / system 关键字等 → 非必填槽位，warn 并忽略该 token、保留其余
        warn(`Value of [${prop}:${value}] in ${selector}: token [${t}] is not supported (only font-style / small-caps / font-weight are valid before <font-size>), ignored.`)
      }
    }
    // 3. line-height（数值复用 formatLineHeight 口径换算为百分比）
    if (lineHeight !== undefined) {
      const lh = formatLineHeight({ prop: 'line-height', value: lineHeight, selector })
      if (lh) cssMap.push(lh)
    }
    // 4. font-family（font-size 之后剩余部分）
    const familyStr = tokens.slice(sizeIdx + 1).join(' ').trim()
    if (!familyStr) {
      // 缺必填 font-family → 整条声明丢弃
      error(`Value of [${prop}:${value}] in ${selector} is missing required <font-family>, please check again!`)
      return false
    }
    const family = formatFontFamily({ prop: 'font-family', value: familyStr, selector })
    if (family) cssMap.push({ prop: 'fontFamily', value: family.value })
    return cssMap
  }

  // border / outline 简写只负责按值类型展开和补齐缺省值；
  // none 清除语义不在编译期折叠，统一保留到运行时最终处理。
  const formatBorder = ({ prop, value, selector }, { mode }) => {
    value = value.trim()
    return formatUnorderedAbbreviation({ prop, value, selector }, { mode })
  }

  return {
    supportedModes: ['ios', 'android', 'harmony'],
    rules: [
      { // 背景相关属性的处理
        test: /^(background|background-image|background-size|background-position)$/,
        ios: formatBackground,
        android: formatBackground,
        harmony: formatBackground
      },
      { // margin padding 内外边距 / gap / inset 的处理（统一走复合值展开）
        test: /^(margin|padding|border-radius|border-width|border-color|gap|inset)$/,
        ios: formatCompositeVal,
        android: formatCompositeVal,
        harmony: formatCompositeVal
      },
      { // line-height 换算
        test: 'line-height',
        ios: formatLineHeight,
        android: formatLineHeight,
        harmony: formatLineHeight
      },
      {
        test: 'transform',
        ios: formatTransform,
        android: formatTransform,
        harmony: formatTransform
      },
      {
        test: 'flex',
        ios: formatFlex,
        android: formatFlex,
        harmony: formatFlex
      },
      {
        test: 'font-family',
        ios: formatFontFamily,
        android: formatFontFamily,
        harmony: formatFontFamily
      },
      { // font 简写专用处理：必须置于通用 AbbreviationMap 匹配规则之前
        test: 'font',
        ios: formatFont,
        android: formatFont,
        harmony: formatFont
      },
      // {
      //   test: 'box-shadow',
      //   ios: formatBoxShadow,
      //   android: formatBoxShadow,
      //   harmony: formatBoxShadow
      // },
      { // border / outline 简写共享 formatBorder（按值类型展开 + 缺省补齐；none 清除语义留到运行时处理）
        test: /^(border|border-left|border-right|border-top|border-bottom|outline)$/,
        ios: formatBorder,
        android: formatBorder,
        harmony: formatBorder
      },
      // 通用的简写格式匹配
      {
        test: new RegExp('^(' + Object.keys(AbbreviationMap).join('|') + ')$'),
        ios: formatAbbreviation,
        android: formatAbbreviation,
        harmony: formatAbbreviation
      },
      // 属性&属性值校验
      {
        test: () => true,
        ios: verification,
        android: verification,
        harmony: verification
      }
    ]
  }
}
