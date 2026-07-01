# RN 扩展简写属性支持技术方案（gap / inset / outline / font）

> 2026-06-25 修订：`border` / `outline` / `border-style` / `outline-style` 中的 `none` 不再在编译期折叠为 `*Width: 0`。编译期仅做合法性校验、简写展开与缺省补齐（缺 style 补 `none`），最终由运行时在变量解析与简写展开之后统一将 `borderStyle: 'none'` / `outlineStyle: 'none'` 转换为对应 width 0。本文旧段落中关于“入口短路 / 展开后短路”的描述以本修订说明为准。

## 背景

当前 Mpx2RN 已支持一批 CSS 简写属性的跨端展开，编译期与运行时分别由：

- 编译期：`packages/webpack-plugin/lib/platform/style/wx/index.js`（`AbbreviationMap` + `formatAbbreviation` / `formatUnorderedAbbreviation` / `formatCompositeVal` / `formatBorder` / `formatFlex` / `formatBackground`）。
- 运行时：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`（`runtimeAbbreviationMap` + `transformShorthand` / `expandUnorderedAbbreviation` / `expandCompositeValues` / `transformFlex` / `transformBackground`）。

无序类型展开与缺省值补齐机制详见 [rn-css-shorthand-order-alignment.md](./rn-css-shorthand-order-alignment.md)，本方案复用其已落地的 `formatUnorderedAbbreviation` / `expandUnorderedAbbreviation` / `ShorthandDefaultMap` 等能力，不再重复说明。

目前仍有若干常见简写属性未支持，用户书写后会因不命中任何简写规则而走 `verification` 兜底，被当作非法属性值过滤（如 `gap: 10rpx 20rpx`、`inset: 0`、`outline: 1px solid red`）或整体丢弃：

- `gap`（含双值 `gap: <row> <column>`）
- `inset`
- `outline`
- `font`

本方案设计这几个简写属性的 RN 跨端展开方案，编译期与运行时同口径落地。

## 目标

1. 让 RN 编译期与运行时支持 `gap` / `inset` / `outline` / `font` 这几个简写属性的展开。
2. 最大化复用现有数据驱动结构（`AbbreviationMap` / `runtimeAbbreviationMap` / 复合值展开 / 无序类型展开 / 缺省补齐），不引入大规模重构。
3. 编译期继续复用 `verifyProps` / `verifyValues`，运行时继续保持轻量判断。
4. 对 RN 无等效能力或不在简写语法内的取值（`font-stretch`、system 字体关键字等）明确处理并文档化，不静默产出错误样式：`font` 的丢弃原则仅针对**缺必填项**（`font-size` / `font-family`），缺则整条声明丢弃（编译期与运行时均 error）；非必填的不支持 token 仅 warn 并忽略、保留其余槽位（编译期与运行时同口径）。

## 非目标

1. 不补齐 RN 本身完全没有的语义（如 `outline-offset` 的精确表现）。
2. 不支持 `place-items` / `place-content`（`justify-items` 在 RN flexbox 无等效；`place-*` 的 grid 语义无法表达），用户如需对齐能力请直接书写 `align-items` / `align-content` / `justify-content` 长属性。
3. 不实现完整 CSS `font` 规范（不含 `font-stretch`、`font-variant` 的数字型取值——它们属于 `font-variant-numeric`，不在 `font` 简写语法内、`caption/icon/menu/message-box/small-caption/status-bar` 等 system 字体关键字、`line-height` 之外的多值组合）。`font` 简写内的 `font-variant` 仅支持规范定义的 `small-caps`。
3. 不改变样式覆盖优先级：展开出的长属性仍遵循「不覆盖已存在的同名长属性」原则。
4. `outline` 与 `border` 简写在 RN 上**缺省值处理与短路完全等价**：共享 `formatBorder` / 运行时 `borderShorthandMap`，缺 width 由 `ShorthandDefaultMap` 补 `BORDER_MEDIUM_WIDTH`，缺 style 走「展开后 styleProp 缺省即整体清零」短路。理由：RN 0.76+ 上 outline 与 border 的渲染语义在「缺值→默认值」这块对齐，给 outline 一套独立的「写什么展开什么」反而与 border 不一致、心智负担更大；既然实现可以复用，行为也保持一致。

## RN 支持现状（基于 `react-native@0.74.6`，peer `^0.74.5`）

| 简写 | 目标长属性 | RN 原生支持情况 |
| --- | --- | --- |
| `gap` | `rowGap` / `columnGap`（及 `gap` 本身） | ✅ `FlexStyle` 原生支持 `gap` / `rowGap` / `columnGap`（均为 `number`，单值原生可用） |
| `inset` | `top` / `right` / `bottom` / `left` | ⚠️ `inset` 仅在 `experimental.d.ts` 标注，**非稳定**；`top/right/bottom/left` 稳定支持 → 必须展开到四个长属性 |
| `outline` | `outlineWidth` / `outlineStyle` / `outlineColor` | ❌ 0.74 **不支持**（`outline*` 系 RN 0.76 才加入）；peer 允许 0.76+ → 0.74 静默忽略、升级后自动生效 |
| `font` | `fontStyle` / `fontVariant` / `fontWeight` / `fontSize` / `lineHeight` / `fontFamily` | 子集：上述目标均支持（`fontVariant` 仅 `small-caps`，见下）；无 `fontStretch` |

## 支持范围与展开语义

### 1. `gap`（有序 2 槽位复合，类型同 margin）

CSS：`gap: <row-gap> <column-gap>?`，单值时行列同值。

| 写法 | 展开 |
| --- | --- |
| `gap: 20rpx` | `rowGap` / `columnGap` 均为 `20rpx` |
| `gap: 10rpx 20rpx` | `rowGap: 10rpx` / `columnGap: 20rpx` |

- `row-gap` / `column-gap` 为长属性，经驼峰化为 `rowGap` / `columnGap`，**已被现有 `verification`（length）链路支持**，无需改造。
- 本方案只新增 `gap` 简写的展开。

### 2. `inset`（有序 4 槽位复合，完全等价 margin/padding 四值语法）

CSS：`inset: <top> <right>? <bottom>? <left>?`，四值顺序语义。

| 写法 | 展开 |
| --- | --- |
| `inset: 0` | `top/right/bottom/left = 0` |
| `inset: 10rpx 20rpx` | `top/bottom = 10rpx`，`right/left = 20rpx` |
| `inset: 1px 2px 3px 4px` | `top:1 right:2 bottom:3 left:4` |

- 因 RN `inset` 长属性本身不稳定，**单值也必须展开**到 `top/right/bottom/left`，不能像 `gap` 那样保留原 key 透传。

### 3. `outline`（与 `border` 简写完全等价：共享 `formatBorder` / 同一套缺省与短路）

CSS：`outline: <outline-width> || <outline-style> || <outline-color>`，顺序不敏感。

| 写法 | 展开 |
| --- | --- |
| `outline: 1px solid red` | `outlineWidth:1 / outlineStyle:'solid' / outlineColor:'red'` |
| `outline: red solid 2px` | 同上（顺序无关） |
| `outline: solid` | `outlineStyle:'solid' / outlineWidth: 3`（缺 width 补 `BORDER_MEDIUM_WIDTH`，与 `border: solid` 同口径） |
| `outline: solid red` | `outlineStyle:'solid' / outlineColor:'red' / outlineWidth: 3`（同上） |
| `outline: 2px` | `outlineWidth: 0`（缺 style → 展开后 styleProp 缺省整体清零，与 `border: 2px` 同口径） |
| `outline: none` | `outlineWidth: 0`（入口短路） |
| `outline: 0` | `outlineWidth: 0`（含 number 0 / `0` / `-0`） |
| `outline: 1px none red` | `outlineWidth: 0`（混合 none token 同样短路） |
| `outline-style: none`（长属性） | `outlineWidth: 0`（与简写同口径短路；`border-style: none` 同理 → `borderWidth: 0`） |
| `outline-style: solid`（长属性） | `outlineStyle:'solid'`（白名单内取值原样保留） |

- **与 `border` 简写完全等价**：outline 进入 `AbbreviationMap` / `UnorderedAbbreviationMap` / `ShorthandDefaultMap`（缺 width 补 `BORDER_MEDIUM_WIDTH`）、`borderShorthandMap`（运行时短路标记）。编译期与运行时**复用同一份 `formatBorder` / 入口短路 / 展开后 styleProp 缺省短路逻辑**，仅在 rule 的 `test` 正则上加入 `outline`、并扩展 `AbbreviationMap[prop]` / `runtimeAbbreviationMap[key]` 的槽位映射。
- **`border-style` / `outline-style` 长属性的 `none` 短路（同口径）**：与各自简写 `border: none` / `outline: none` 对齐，CSS 规范 `*-style: none` 等价无边框 / 无轮廓 → 整体落 `*-width: 0`。两者由同一个 `formatBorderStyle` 处理：`none` 走短路，其余值（`solid` / `dotted` / `dashed`）继续走通用 verification 校验白名单；`double` / `groove` / `ridge` 不支持。
- **CSS 顺序在 RN 不可表达，约定长属性 > 简写**：若同时写 `outline: 1px solid red` 简写与 `outline-style: none` 长属性，运行时长属性末尾的短路改写会撤销简写展开的结果（最终落 `outlineWidth: 0`）。

### 4. `font`（专用解析，RN 等效子集）

CSS 完整 `font` 极复杂。本方案只支持 RN 可等效的子集：

```
font: [ <font-style> ] [ <font-variant-css2> ] [ <font-weight> ] <font-size> [ / <line-height> ] <font-family>
```

| 写法 | 展开 |
| --- | --- |
| `font: 16px PingFang SC` | `fontSize:16` / `fontFamily:'PingFang SC'` |
| `font: italic bold 16px/1.5 Arial` | `fontStyle:'italic'` / `fontWeight:'bold'` / `fontSize:16` / `lineHeight:'150%'` / `fontFamily:'Arial'` |
| `font: small-caps 500 28rpx/40rpx "PingFangSC-Regular"` | `fontVariant:'small-caps'` / `fontWeight:'500'` / `fontSize:28rpx` / `lineHeight:40rpx` / `fontFamily:'PingFangSC-Regular'` |

解析口径：

- **丢弃原则 = 缺必填项**：`font` 的必填项是 `font-size` 与 `font-family`。**只有缺失其一**时才视为整条声明非法，**编译期与运行时均 error 提醒并整体丢弃 / 不展开**（缺 size/family 的 font 无意义，不产出残缺样式）。
- **非必填项不触发丢弃**：前导段出现不支持的 token（`font-stretch` / 数字型 `font-variant-numeric` / system 关键字等）属于可选槽位，**编译期与运行时均 warn 提醒并忽略该 token、保留其余**；不会因此丢掉整条 `font`。
- **前导可选段**（`font-size` 之前）：按类型识别 `font-style`（`italic`，`normal` 为默认跳过）、`font-variant`（`small-caps`，`normal` 跳过）与 `font-weight`（`bold` / `100`~`900`，`normal` 跳过）。顺序在前导段内不敏感。
- **`font-size`**：第一个 length 类型 token（可带 `/<line-height>`）。
- **`line-height`**：仅在与 `font-size` 同 token 内以 `/` 分隔时识别（如 `16px/1.5`）。数值型 line-height 复用 `formatLineHeight` 口径换算为百分比（`1.5` → `150%`）。
- **`font-family`**：`font-size` 之后的剩余部分，复用 `formatFontFamily`（多字体取首值、去引号）。
- **`font-variant`**：CSS `font` 简写中的 variant 槽位是 `<font-variant-css2>`，规范上**仅 `normal | small-caps`**。命中 `small-caps` 时展开为 `fontVariant: 'small-caps'`（字符串）；RN 的 `processFontVariant` 对字符串做 `split(' ')` 归一为数组，与现有 `font-variant` 长属性同口径，无需在简写里额外构造数组。`oldstyle-nums` / `tabular-nums` 等数字型取值属于 `font-variant-numeric`，**不在 `font` 简写语法内**，用户如需请单独书写 `font-variant` 长属性。
- **不支持**：`font-stretch`、system 字体关键字（`caption` / `icon` / `menu` / `message-box` / `small-caption` / `status-bar`）。这些 token 命中时编译期与运行时均 warn 并忽略、保留其余槽位，**不触发整体丢弃**——整体丢弃仅在缺 `font-size` / `font-family` 时发生。

## 编译期方案

文件：`packages/webpack-plugin/lib/platform/style/wx/index.js`

### 1. 扩展 `AbbreviationMap`

```js
const AbbreviationMap = {
  // ……现有项……
  gap: ['rowGap', 'columnGap'],
  inset: ['top', 'right', 'bottom', 'left'],
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor']
  // font 走专用 formatter，不入 AbbreviationMap
}
```

- `gap` / `inset` 走复合值（`formatCompositeVal`）链路。
- `outline` 加入 `UnorderedAbbreviationMap`，复用 `formatUnorderedAbbreviation`。
- `font` 用专用 formatter，规则需排在通用 `AbbreviationMap` 规则之前。

### 2. `gap` / `inset` 接入复合值链路（`formatCompositeVal` 槽位数泛化）

现有 `formatCompositeVal` 写死按 4 槽位补齐（`splice(0, 4)` + 1→4 / 2→4 / 3→4），且 4 槽位单值场景直接返回 `{ prop, value }`（RN 原生支持 `margin` / `padding` 单值 `DimensionValue`，无需展开）。

`gap` / `inset` 接入要点：

- `gap` 是 2 槽位，把「补齐到几槽」改为由 `AbbreviationMap[prop].length` 决定。
- `gap` / `inset` 单值都**不能走 4 槽位「单值直接返回」分支**：`inset` 原样返回会输出 RN 不稳定的 `inset` key；`gap` 需展开为 `rowGap` / `columnGap` 才能做行列显式化与 `rpx` 换算。因此「单值直接返回」捷径只保留给 `margin` / `padding` 等 RN 原生支持单值的属性。

```js
// 单值直接返回（RN 原生支持单值 DimensionValue）的属性：margin / padding / border-* 四值简写，
// 不含 gap / inset（它们单值也要展开）
const compositeSingleValuePassthrough = (prop) => prop !== 'gap' && prop !== 'inset'

const formatCompositeVal = ({ prop, value, selector }, { mode }) => {
  const count = AbbreviationMap[prop].length // gap=2，inset/margin/padding/border-*=4
  const values = parseValues(value).splice(0, count)
  // 单值短路：margin/padding 等 RN 原生支持单值，原样透传；gap/inset 单值也要展开，不走此捷径
  if (values.length === 1 && compositeSingleValuePassthrough(prop)) {
    return verifyValues({ prop, value, selector }, false) && { prop, value }
  }
  if (count === 2) {
    // gap：单值复制到行列两槽；双值原样
    if (values.length === 1) values.push(values[0])
  } else {
    switch (values.length) {
      case 1: values.push(values[0], values[0], values[0]); break // 仅 inset 命中（margin/padding 已被上面短路）
      case 2: values.push(...values); break
      case 3: values.push(values[1]); break
    }
  }
  return formatAbbreviation({ prop, value: values, selector }, { mode })
}
```

并在复合值规则中加入 `gap` / `inset`：

```js
{
  test: /^(margin|padding|border-radius|border-width|border-color|gap|inset)$/,
  ios: formatCompositeVal,
  android: formatCompositeVal,
  harmony: formatCompositeVal
}
```

校验说明：`rowGap` / `columnGap` / `top` / `right` / `bottom` / `left` 经 `getValueType` 均判定为 `length`，`formatAbbreviation` 内 `verifyValues` 正常校验，无需新增类型规则。

### 3. `outline` 直接共享 `formatBorder` + 与 `border` 等价的缺省与短路

```js
const AbbreviationMap = {
  // ……现有项……
  // 与 border 槽位形状一致：[widthProp, styleProp, colorProp]
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor']
}

const UnorderedAbbreviationMap = {
  // ……现有项……
  outline: true
}

const ShorthandDefaultMap = {
  border: { borderWidth: BORDER_MEDIUM_WIDTH },
  'border-top': { borderTopWidth: BORDER_MEDIUM_WIDTH },
  // ……
  // outline 与 border 完全对齐：缺 width → BORDER_MEDIUM_WIDTH；缺 style 走 formatBorder 展开后短路
  outline: { outlineWidth: BORDER_MEDIUM_WIDTH }
}
```

新增 `outline-style` 枚举，使 `outline-style` token 走 `getValueType` 的 enum 分支被正确校验（同样不含 `none`，`none` 由专用 formatter / 入口短路截掉）：

```js
const SUPPORTED_PROP_VAL_ARR = {
  // ……现有项……
  'outline-style': ['solid', 'dotted', 'dashed']
}
```

**`outline` 简写直接复用 `formatBorder`**（rule `test` 正则扩展为 `/^(border|border-left|border-right|border-top|border-bottom|outline)$/`）：

```js
const formatBorder = ({ prop, value, selector }, { mode }) => {
  value = value.trim()
  // 槽位顺序约定（见 AbbreviationMap）：[widthProp, styleProp, colorProp]
  const [widthProp, styleProp] = AbbreviationMap[prop]
  // 入口短路：整体 none / 0 / 含 none token → widthProp = 0
  if (value === 'none' || +value === 0 || parseValues(value).includes('none')) {
    return { prop: widthProp, value: 0 }
  }
  const cssMap = formatUnorderedAbbreviation({ prop, value, selector }, { mode })
  if (!Array.isArray(cssMap)) return cssMap  // 单 token var() 兜底
  // 展开后短路：styleProp 缺省 → 等价 *-style: none → 整体短路为 widthProp = 0
  // 覆盖 border: 2px / 0px / red、outline: 2px 等无 style token 的写法
  if (!cssMap.some(item => item.prop === styleProp)) {
    return { prop: widthProp, value: 0 }
  }
  return cssMap
}
```

- 入口短路、`ShorthandDefaultMap` 补宽度缺省、展开后 styleProp 缺省整体清零三段逻辑**完全等价于 `border` 简写**。

**长属性 `border-style: none` / `outline-style: none` 共享 `formatBorderStyle`**（rule `test` 为 `/^(border-style|outline-style)$/`，排在最后 verification rule 前）：

```js
// style longhand → 短路要落的 widthProp
const borderStyleClearMap = {
  'border-style': 'borderWidth',
  'outline-style': 'outlineWidth'
}
const formatBorderStyle = ({ prop, value, selector }, { mode }) => {
  if (value.trim() === 'none') return { prop: borderStyleClearMap[prop], value: 0 }
  // 非 none：走通用 verification，按 SUPPORTED_PROP_VAL_ARR['*-style'] 校验
  return verification({ prop, value, selector }, { mode })
}
```

- 之前 `border-style: none` 长属性会落到通用 `verification` 走 `SUPPORTED_PROP_VAL_ARR['border-style']` 的 enum 校验报错被拒，与简写 `border: none` 的清除语义割裂；现在两者口径完全一致。
- `outlineWidth` / `outlineStyle` / `outlineColor` 未列入任何 `unsupportedProp` 名单，`verifyProps` 默认放行（0.74 RN 忽略、0.76+ 生效，编译产物无需感知版本）。

### 4. `font` 专用 formatter

```js
const formatFont = ({ prop, value, selector }, { mode }) => {
  value = value.trim()
  // 单 var() 兜底，交给运行时
  if (cssVariableExp.test(value) && parseValues(value).length === 1) {
    return { prop, value }
  }
  const tokens = parseValues(value)
  const cssMap = []
  let sizeIdx = -1
  let lineHeight

  // 1. 定位 font-size（第一个 length，可能带 /line-height）
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const [sizePart, lhPart] = parseValues(t, '/')
    if (verifyValues({ prop: 'font-size', value: sizePart, selector }, silentVerify)) {
      sizeIdx = i
      cssMap.push({ prop: 'fontSize', value: sizePart })
      if (lhPart) lineHeight = lhPart
      break
    }
  }
  if (sizeIdx === -1) {
    error(`Value of [${prop}:${value}] in ${selector} is missing required <font-size>, please check again!`)
    return false
  }

  // 2. 前导段（font-size 之前）：识别 font-style / font-variant(small-caps) / font-weight，顺序不敏感
  for (let i = 0; i < sizeIdx; i++) {
    const t = tokens[i]
    if (t === 'normal') continue // 默认值，跳过
    if (verifyValues({ prop: 'font-style', value: t, selector }, silentVerify)) {
      cssMap.push({ prop: 'fontStyle', value: t })
    } else if (t === 'small-caps') {
      // CSS font 简写的 variant 槽位仅 <font-variant-css2>（normal | small-caps）；
      // 字符串透传，RN processFontVariant 会 split 归一为数组，与 font-variant 长属性同口径
      cssMap.push({ prop: 'fontVariant', value: t })
    } else if (verifyValues({ prop: 'font-weight', value: t, selector }, silentVerify)) {
      cssMap.push({ prop: 'fontWeight', value: t })
    } else {
      // font-stretch / 数字型 font-variant-numeric / system 关键字等 → 不在 font 简写语法内：
      // 非必填槽位，warn 提示并忽略该 token、保留其余（不触发整体丢弃——丢弃只发生在缺必填项时）
      warn(`Value of [${prop}:${value}] in ${selector}: token [${t}] is not supported (only font-style / small-caps / font-weight are valid before <font-size>), ignored.`)
    }
  }

  // 3. line-height（复用 formatLineHeight 口径）
  if (lineHeight !== undefined) {
    const lh = formatLineHeight({ prop: 'line-height', value: lineHeight, selector })
    if (lh) cssMap.push(lh)
  }

  // 4. font-family（font-size 之后剩余部分）
  const familyStr = tokens.slice(sizeIdx + 1).join(' ').trim()
  if (!familyStr) {
    error(`Value of [${prop}:${value}] in ${selector} is missing required <font-family>, please check again!`)
    return false
  }
  const family = formatFontFamily({ prop: 'font-family', value: familyStr, selector })
  if (family) cssMap.push({ prop: 'fontFamily', value: family.value })

  return cssMap
}
```

规则（排在通用 `AbbreviationMap` 规则之前）：

```js
{
  test: 'font',
  ios: formatFont,
  android: formatFont,
  harmony: formatFont
}
```

> `font-weight` 数值（`500` 等）经 `verifyValues('font-weight')` 命中 `SUPPORTED_PROP_VAL_ARR['font-weight']`，运行时 `transformStringify` 会把 number 化 `fontWeight` 转回 string，跨端一致。

## 运行时方案

文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

> 运行时的 `error` / `warn` 复用文件顶部已有的 `import { ... error, warn } from '@mpxjs/utils'`，无需新增依赖。`transformFont` 的提示信息**与现有 runtime transform 的口径对齐**：整体丢弃沿用 `transformFlex` 的 `Xxx shorthand value [...] ..., dropped.`；忽略子 token 沿用 `transformBackground` 的 `Token [...] in [xxx: ...] ..., dropped.`。运行时无 `selector`，故不携带选择器信息（与 `transformFlex` / `transformBackground` 一致）。

运行时只处理 inline `style={{ ... }}`（class 样式已在编译期展开）；key 为驼峰式：`gap` / `inset` / `outline` / `font`。

### 1. `gap` / `inset` 接入复合展开

```ts
const runtimeAbbreviationMap = {
  // ……现有项……
  gap: ['rowGap', 'columnGap'],
  inset: ['top', 'right', 'bottom', 'left'],
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor']
}
const runtimeCompositeStyleMap = {
  // ……现有项……
  gap: true,
  inset: true
}
// 即使单值也必须展开（不走「单值透传」捷径）：
// - inset：RN inset 长属性不稳定，单值透传会留下不可靠的 inset key
// - gap：RN gap/rowGap/columnGap 严格要求 number，单值字符串透传（如 '20rpx'）不会被 __formatValue 换算
//   （inline 样式的 rpx→number 换算仅发生在展开链路里的 __formatValue，class 样式的 transformStyleObj 不覆盖 inline）
const runtimeForceExpandCompositeMap: Record<string, boolean> = {
  inset: true,
  gap: true
}
```

`transformShorthand` 中调整单值短路条件，并让 `expandCompositeValues` 支持 2 槽位（`gap`）：

```ts
// 单值短路：composite 且单值 → 通常透传（RN 原生支持 margin/padding 单值 DimensionValue）；
// 但 inset / gap 必须展开（理由见 runtimeForceExpandCompositeMap 注释）
if (hasOwn(runtimeCompositeStyleMap, key) && values.length === 1 && !hasOwn(runtimeForceExpandCompositeMap, key)) continue
```

`expandCompositeValues` 现状固定返回 4 值；`gap` 走 `expandAbbreviation` 时 `props.length === 2` 会自然截断为前 2 个，即 `[a,b,a,b]` → `rowGap:a / columnGap:b`，且每个值都过 `__formatValue`（`'20rpx'` → number），满足 RN gap 的 number 约束。`inset` 4 槽位直接适配。

> `gap` 单值 number（如 `style={{ gap: 8 }}`）：`typeof value !== 'string'` → `continue`，RN 原生 `gap` 承接；`gap` 单值字符串（`style={{ gap: '20rpx' }}`）→ 强制展开为 `rowGap`/`columnGap` 并经 `__formatValue` 换算为 number。`inset` 单值字符串 → 强制展开为四边。

### 2. `outline` 直接进入 `borderShorthandMap` / `runtimeShorthandDefaultMap`

```ts
const runtimeAbbreviationMap = {
  // ……现有项……
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor']
}
const runtimeUnorderedAbbreviationMap = {
  // ……现有项……
  outline: true
}
const runtimeShorthandDefaultMap = {
  border: { borderWidth: BORDER_MEDIUM_WIDTH },
  // ……
  // 与 border 完全对齐
  outline: { outlineWidth: BORDER_MEDIUM_WIDTH }
}
const borderShorthandMap = {
  // ……现有 border 系……
  // 共享入口短路 + 展开后 styleProp 缺省短路（widthProp / styleProp 由 runtimeAbbreviationMap[key] 的前两个槽位决定）
  outline: true
}
```

`matchRuntimeShorthandProp` 中 `outlineStyle`、`outlineColor`、`outlineWidth` 复用现有后缀判定：

- `prop.endsWith('Width')` → `isLengthValue`（命中 `outlineWidth`）
- `prop.endsWith('Style')` → `borderStyleMap`（命中 `outlineStyle`；`solid/dotted/dashed` 与 outline 对齐，`none` 已被入口短路截掉不会进展开）
- `prop.endsWith('Color')` → `isColorValue`（命中 `outlineColor`）

**`transformShorthand` 主循环的两段 border 分支同时承接 outline**：

```ts
// 入口短路：整体 0 / 含 none token → widthProp = 0（强制覆盖任何已存在的同名宽度长属性）
if (hasOwn(borderShorthandMap, key)) {
  if (value === 'none' || +value === 0 || /* 含 none token */) {
    const widthProp = runtimeAbbreviationMap[key][0]
    delete styleObj[key]
    styleObj[widthProp] = 0
    continue
  }
}

// 展开后短路：styleProp（borderStyle / outlineStyle）槽位缺省 → 等价 *-style: none → 整体短路
if (hasOwn(borderShorthandMap, key)) {
  const [widthProp, styleProp] = runtimeAbbreviationMap[key]
  if (!pairs.some(([p]) => p === styleProp)) {
    delete styleObj[key]
    styleObj[widthProp] = 0
    continue
  }
}
```

不为 outline 写新分支，仅把 `'borderStyle'` 写死改成从 `runtimeAbbreviationMap[key]` 取 `[widthProp, styleProp]`。

**长属性 `borderStyle: 'none'` / `outlineStyle: 'none'`**：在 `collectTopLevelFlags` 内分别设 `hasBorderStyleNone` / `hasOutlineStyleNone` 标志，`useTransformStyle` 末尾（`transformShorthand` 之后）改写为对应的 `*-width: 0`，并 `delete` 对应的 styleProp。放在 `transformShorthand` 之后是为了保证「长属性 > 简写」的覆盖优先级：若用户同时写 `border: 1px solid red` 简写 + `border-style: none` 长属性，最终落 `borderWidth: 0`（撤销简写展开结果），outline 同理。

### 3. `font` 专用 transform（沿用 `transformFlex` 的标志位模式）

`font` 不进 `runtimeAbbreviationMap`（不走 `shorthandKeys` 通用链路），而是仿照 `hasFlex` / `transformFlex`：在 `collectTopLevelFlags` 设标志，`useTransformStyle` 末尾按标志调用专用 transform。

```ts
// collectTopLevelFlags 内新增
case 'font':
  hasFont = true
  break
```

```ts
function transformFont (styleObj: Record<string, any>) {
  const value = styleObj.font
  if (typeof value !== 'string') return
  const tokens = parseValues(value)
  let sizeIdx = -1
  let lineHeight: string | undefined
  const result: Array<[string, any]> = []
  // 1. 定位 font-size（第一个 length，可能带 /line-height）
  for (let i = 0; i < tokens.length; i++) {
    const [sizePart, lhPart] = parseValues(tokens[i], '/')
    if (isLengthValue(sizePart)) {
      sizeIdx = i
      result.push(['fontSize', global.__formatValue(sizePart)])
      if (lhPart) lineHeight = lhPart
      break
    }
  }
  if (sizeIdx === -1) {
    // 缺必填 font-size：整体丢弃；与 transformFlex 「Flex shorthand value [...] ..., dropped.」同口径
    error(`Font shorthand value [${value}] is missing required <font-size>, dropped.`)
    return
  }
  // 2. 前导段 font-style / font-variant(small-caps) / font-weight
  for (let i = 0; i < sizeIdx; i++) {
    const t = tokens[i]
    if (t === 'normal') continue
    if (t === 'italic') result.push(['fontStyle', t])
    else if (t === 'small-caps') result.push(['fontVariant', t]) // RN processFontVariant 接受字符串，内部 split 为数组
    else if (hasOwn(fontWeightMap, t)) result.push(['fontWeight', t])
    // 其余（font-stretch / 数字型 font-variant-numeric / system 关键字）→ 非必填：与 transformBackground「Token [...] in [background: ...] ..., dropped.」同口径，warn + 忽略该 token、保留其余
    else warn(`Token [${t}] in [font: ${value}] is not supported (only font-style / small-caps / font-weight are valid before <font-size>), dropped.`)
  }
  // 3. line-height（数值转百分比，复用运行时口径）
  if (lineHeight !== undefined) {
    const lh = isNum(lineHeight) ? `${Math.round(+lineHeight * 100)}%` : global.__formatValue(lineHeight)
    result.push(['lineHeight', lh])
  }
  // 4. font-family
  const familyStr = tokens.slice(sizeIdx + 1).join(' ').trim()
  if (!familyStr) {
    // 缺必填 font-family：整体丢弃；与 transformFlex 同口径
    error(`Font shorthand value [${value}] is missing required <font-family>, dropped.`)
    return
  }
  const family = parseValues(familyStr.replace(/["']/g, ''), ',')[0]?.trim()
  if (family) result.push(['fontFamily', family])

  delete styleObj.font
  for (const [prop, val] of result) {
    if (!hasOwn(styleObj, prop)) styleObj[prop] = val
  }
}
```

需要新增的运行时小表 / 判断：

```ts
const fontWeightMap: Record<string, boolean> = {
  bold: true, normal: true,
  100: true, 200: true, 300: true, 400: true, 500: true,
  600: true, 700: true, 800: true, 900: true
}
const isNum = (v: string) => !isNaN(+v)
```

`useTransformStyle` 末尾按标志调用（与 `transformFlex` / `transformBackground` 并列）：

```ts
if (hasFlex) transformFlex(normalStyle)
if (hasFont) transformFont(normalStyle)
if (shorthandKeys.length) transformShorthand(normalStyle, shorthandKeys)
```

> 注意调用顺序：`transformFont` 产出的 `fontSize` / `lineHeight` 等若含 `%`（如 `lineHeight: '150%'`），需在 `percent` 阶段之后即时换算或保留字符串由后续阶段处理。由于 `transformFont` 在 `percentKeyPaths` 收集（`styleVisitor` 遍历原始 styleObj）之后才运行，`font` 内联展开出的百分比 `lineHeight` **不会**被 percent 阶段收集。`lineHeight` 百分比在 RN 上由 `fontSize` 推导，运行时 `resolvePercent` 依赖 percentConfig；为简化，`transformFont` 产出的 `lineHeight` 百分比保持与编译期一致（字符串 `'150%'`），交由下游文本样式继承与 RN 行高解析。若需严格数值化，可在 `transformFont` 内直接用 `fontSize` 数值乘算（见风险小节）。

## 缺省值与短路

| 简写 | 缺省补齐 | 短路 |
| --- | --- | --- |
| `gap` | 无（单值复制行列已是 CSS 语义） | 无 |
| `inset` | 无（同 margin 四值复制语义） | 无 |
| `outline` | 与 border 等价：缺 width → `BORDER_MEDIUM_WIDTH`；色不补；缺 style 走短路 | **入口短路**：`none / 0 / 含 none` → `outlineWidth: 0`（覆盖已存在的 outlineWidth）；**展开后短路**：缺 outlineStyle → `outlineWidth: 0`；**长属性 `outline-style: none`** → `outlineWidth: 0` |
| `font` | 无（缺 size/family 视为非法丢弃） | 无 |

这几个属性均不需要进入 `ShorthandDefaultMap` / `runtimeShorthandDefaultMap`，与现有 border / text-shadow 缺省补齐机制互不影响。

## 目标行为对照表

| 输入 | 目标输出 | 平台/版本 |
| --- | --- | --- |
| `gap: 20rpx` | `{ rowGap, columnGap }` | 全 |
| `gap: 10rpx 20rpx` | `{ rowGap: 10rpx, columnGap: 20rpx }` | 全 |
| `inset: 0` | `{ top:0, right:0, bottom:0, left:0 }` | 全 |
| `inset: 10rpx 20rpx` | `{ top/bottom:10, right/left:20 }` | 全 |
| `outline: 1px solid red` | `{ outlineWidth:1, outlineStyle:'solid', outlineColor:'red' }` | 0.76+ 生效，0.74 静默忽略 |
| `outline: red solid 2px` | 同上（顺序无关） | 同上 |
| `outline: solid` | `{ outlineStyle:'solid', outlineWidth: 3 }`（缺 width 补 BORDER_MEDIUM_WIDTH） | 同上 |
| `outline: 2px` | `{ outlineWidth: 0 }`（缺 style 短路） | 同上 |
| `outline: none` / `outline: 0` / `outline: 1px none red` | `{ outlineWidth: 0 }`（入口短路；强制覆盖已存在的 outlineWidth） | 同上 |
| `outline-style: none`（长属性） | `{ outlineWidth: 0 }`（与简写同口径短路） | 同上 |
| `font: italic bold 16px/1.5 Arial` | `{ fontStyle:'italic', fontWeight:'bold', fontSize:16, lineHeight:'150%', fontFamily:'Arial' }` | 全 |
| `font: small-caps 16px Arial` | `{ fontVariant:'small-caps', fontSize:16, fontFamily:'Arial' }`（RN 内部 split 为 `['small-caps']`） | 全 |
| `font: 28rpx PingFangSC-Regular` | `{ fontSize:28rpx, fontFamily:'PingFangSC-Regular' }` | 全 |
| `font: 16px`（缺 family）/ `font: italic Arial`（缺 size） | 整体丢弃 + error（编译期与运行时均提醒） | 全 |
| `font: condensed 16px Arial`（含不支持 token，但 size/family 齐全） | `{ fontSize:16, fontFamily:'Arial' }` + warn（`condensed` 忽略，不整体丢弃；编译期与运行时均提醒） | 全 |

## 测试方案

### 编译期单测

文件：`packages/webpack-plugin/test/platform/wx/style/style-rn.spec.js`，新增 `describe('Extended shorthand')`：

```js
test('should expand gap shorthand', () => {
  const css = '.a { gap: 20rpx; } .b { gap: 10rpx 20rpx; }'
  const result = getClassMap({ content: css, filename: 'test.css', ...createConfig() })
  expect(result.a).toEqual({ rowGap: '20rpx', columnGap: '20rpx' })
  expect(result.b).toEqual({ rowGap: '10rpx', columnGap: '20rpx' })
})

test('should expand inset shorthand to four sides', () => {
  const css = '.a { inset: 0; } .b { inset: 10rpx 20rpx; } .c { inset: 1px 2px 3px 4px; }'
  const result = getClassMap({ content: css, filename: 'test.css', ...createConfig() })
  expect(result.a).toEqual({ top: '0', right: '0', bottom: '0', left: '0' })
  expect(result.b).toEqual({ top: '10rpx', right: '20rpx', bottom: '10rpx', left: '20rpx' })
  expect(result.c).toEqual({ top: '1px', right: '2px', bottom: '3px', left: '4px' })
})

test('should expand unordered outline shorthand', () => {
  const css = '.a { outline: 1px solid red; } .b { outline: red solid 2px; }'
  const result = getClassMap({ content: css, filename: 'test.css', ...createConfig() })
  expect(result.a).toEqual({ outlineWidth: '1', outlineStyle: '"solid"', outlineColor: '"red"' })
  expect(result.b).toEqual({ outlineColor: '"red"', outlineStyle: '"solid"', outlineWidth: '2' })
})

test('should expand outline shorthand with same defaults / short-circuit as border', () => {
  // 与 border 共享 formatBorder + ShorthandDefaultMap：
  // - 缺 width → 补 BORDER_MEDIUM_WIDTH(3)；缺 style → 整体短路为 outlineWidth: 0
  const css = [
    '.a { outline: 1px solid red; }',
    '.b { outline: solid; }',
    '.c { outline: 2px; }',
    '.d { outline: none; }',
    '.e { outline: 1px none red; }',
    '.f { outline-style: none; }'
  ].join(' ')
  const result = getClassMap({ content: css, filename: 'test.css', ...createConfig() })
  expect(result.a).toEqual({ outlineWidth: '1', outlineStyle: '"solid"', outlineColor: '"red"' })
  expect(result.b).toEqual({ outlineStyle: '"solid"', outlineWidth: '3' })
  expect(result.c).toEqual({ outlineWidth: '0' })
  expect(result.d).toEqual({ outlineWidth: '0' })
  expect(result.e).toEqual({ outlineWidth: '0' })
  expect(result.f).toEqual({ outlineWidth: '0' })
})

test('should expand font shorthand subset', () => {
  const css = '.a { font: italic bold 16px/1.5 Arial; } .b { font: 28rpx PingFangSC-Regular; } .c { font: small-caps 16px Arial; }'
  const result = getClassMap({ content: css, filename: 'test.css', ...createConfig() })
  expect(result.a).toEqual({
    fontStyle: '"italic"', fontWeight: '"bold"', fontSize: '16px',
    lineHeight: '150%', fontFamily: '"Arial"'
  })
  expect(result.b).toEqual({ fontSize: '28rpx', fontFamily: '"PingFangSC-Regular"' })
  expect(result.c).toEqual({ fontVariant: '"small-caps"', fontSize: '16px', fontFamily: '"Arial"' })
})

test('should error and drop whole font when required size/family missing', () => {
  // 缺必填项（family / size）→ 整体丢弃 + error
  const css = '.a { font: 16px; } .b { font: italic Arial; }'
  const config = createConfig()
  const result = getClassMap({ content: css, filename: 'test.css', ...config })
  expect(result.a).toEqual({})
  expect(result.b).toEqual({})
  expect(config.error).toHaveBeenCalled()
})

test('should warn and ignore unsupported token but keep the rest of font', () => {
  // 含不支持 token（condensed=font-stretch），但 size/family 齐全 → 忽略该 token、保留其余，不丢弃整体
  const css = '.a { font: condensed 16px Arial; }'
  const config = createConfig()
  const result = getClassMap({ content: css, filename: 'test.css', ...config })
  expect(result.a).toEqual({ fontSize: '16px', fontFamily: '"Arial"' })
  expect(config.warn).toHaveBeenCalled()
})
```

> 上表中字符串/引号形态以实际 `getClassMap` 产物为准（数值如 `'1'`、颜色与枚举如 `'"red"'` / `'"solid"'`、带单位如 `'16px'`），编写时按现有 `Unordered shorthand` 用例的形态对齐微调。

### 运行时单测

按现有 runtime 测试方式补充核心用例：

1. `style={{ gap: '10rpx 20rpx' }}` → `{ rowGap, columnGap }`（均 number）；`style={{ gap: '20rpx' }}`（单值字符串）→ `{ rowGap, columnGap }` 均换算为 number；`style={{ gap: 8 }}`（number）→ 保留 `gap`（RN 原生）。
2. `style={{ inset: '0' }}` → `{ top:0, right:0, bottom:0, left:0 }`。
3. `style={{ outline: 'red solid 2px' }}` → `{ outlineColor, outlineStyle, outlineWidth }`。
4. `style={{ font: 'italic bold 16px/1.5 Arial' }}` → `{ fontStyle, fontWeight, fontSize, lineHeight, fontFamily }`；`style={{ font: 'small-caps 16px Arial' }}` → `{ fontVariant: 'small-caps', fontSize, fontFamily }`。
5. `font` 缺必填项整体丢弃：`style={{ font: '16px' }}`（缺 family）→ `font` 被删除且不展开出任何 `font*` 长属性，并 error 提醒（与编译期同口径）。
6. `font` 含不支持 token 但 size/family 齐全：`style={{ font: 'condensed 16px Arial' }}` → 忽略 `condensed` 并 warn 提醒，仍展开 `{ fontSize, fontFamily }`（不整体丢弃）。
7. 长属性不被覆盖：`{ inset: '0', top: 8 }` → `top` 仍为 `8`（普通展开「长属性不覆盖」原则）。

## 文档与 Skill 同步

1. `docs-vitepress/guide/rn/style.md`
   - 间距章节：补 `gap` 双值展开说明。
   - 定位章节：新增 `inset`（展开到 `top/right/bottom/left`）。
   - 新增 `outline`（标注 RN 0.76+ 生效，0.74 静默忽略；`outline: none / 0` 与 `outline-style: none` 短路为 `outlineWidth: 0`）。
   - 文本字体章节：新增 `font` 简写子集说明（含 `font-variant` 仅 `small-caps`）与不支持项（`font-stretch` / 数字型 `font-variant-numeric` / system 关键字）。
2. `.claude/skills/mpx2rn/references/rn-style-reference.md`
   - 同步上述属性的支持范围与边界（沿用现有「值类型 / 默认值 / 说明 / 示例」表格列）。
   - 明确标注 `font-stretch` / system 字体关键字为不支持；`place-items` / `place-content` 不支持，建议直接使用 `align-items` / `align-content` / `justify-content`。
3. changelog
   - 列出新增支持的简写：`gap`（双值）、`inset`、`outline`、`font`（子集）。

## 实施步骤

1. 编译期 `wx/index.js`：
   - `AbbreviationMap` 增 `gap` / `inset` / `outline`；`UnorderedAbbreviationMap` 增 `outline`；`ShorthandDefaultMap` 增 `outline: { outlineWidth: BORDER_MEDIUM_WIDTH }`；`SUPPORTED_PROP_VAL_ARR` 增 `outline-style`。
   - `formatCompositeVal` 泛化槽位数（`AbbreviationMap[prop].length`），`inset` 单值强制展开；复合值规则 regex 增 `gap|inset`。
   - `formatBorder` 把入口短路与展开后短路所用的 `[widthProp, styleProp]` 改为从 `AbbreviationMap[prop]` 解构（原先 styleProp 写死 `'borderStyle'`），rule `test` 正则扩展 `outline` 一起命中；新增 `formatBorderStyle`（`border-style` / `outline-style` 长属性 `none` → 对应 `*-width: 0`，由 `borderStyleClearMap` 驱动）。
   - 新增 `formatFont` 与对应规则（置于通用 `AbbreviationMap` 规则之前）。
2. 运行时 `utils.tsx`：
   - `runtimeAbbreviationMap` 增 `gap` / `inset` / `outline`；`runtimeCompositeStyleMap` 增 `gap` / `inset`；新增 `runtimeForceExpandCompositeMap`（`inset`）；`runtimeUnorderedAbbreviationMap` 增 `outline`；`runtimeShorthandDefaultMap` 增 `outline`；`borderShorthandMap` 增 `outline`。
   - `transformShorthand` 的入口短路与展开后短路两段 border 分支自动承接 outline；展开后短路把写死的 `'borderStyle'` 改为 `runtimeAbbreviationMap[key]` 的 `[widthProp, styleProp]` 解构。
   - `collectTopLevelFlags` 增 `font` / `borderStyle === 'none'` / `outlineStyle === 'none'` 三个标志；新增 `transformFont` 及 `fontWeightMap`；`useTransformStyle` 末尾按标志调用 `transformFont`，并在 `transformShorthand` 之后改写 `borderStyle: 'none'` / `outlineStyle: 'none'` → 对应 `*-width: 0`（确保长属性优先级 > 简写）。
3. 补充编译期与运行时单测。
4. 同步文档、skill、changelog。
5. 同步运行时 dist：修改 `utils.tsx` 后执行 `npm run build -w @mpxjs/webpack-plugin`，由构建产物生成 `lib/runtime/components/react/dist/**`。
6. 校验：运行相关 eslint 与 `style-rn.spec.js` jest。

## 风险与边界

1. **`outline` 的 RN 版本依赖**：0.74 完全忽略 `outline*`，升级到 0.76+ 自动生效。编译产物不感知版本，行为差异由运行环境决定，文档需显式说明「低版本不渲染、非 bug」。
2. **`font-stretch` / system 字体关键字**：RN 无等效能力，且不在 `font` 简写语法内。属于**非必填槽位**——命中时编译期与运行时均 warn 并忽略该 token、保留其余，不丢弃整条 `font`。整体丢弃仅在缺必填项（`font-size` / `font-family`）时发生（编译期与运行时均 error）。用户若依赖这些子能力需自行用条件编译在原平台保留。
3. **`font` 的 `line-height` 数值化**：RN `lineHeight` 不接受百分比字符串；`transformFont` 又跑在 percent 收集阶段之后，留 `'150%'` 不会再被解析。运行时必须当场用已解析的 `fontSize`（number）乘算无单位 `line-height`（如 `16px/1.5` → `lineHeight: 24`）；带单位的 `line-height` 走 `__formatValue` 换算；`fontSize` 不是 number（如 `var()` 未解析）时放弃乘算、原样透传以避免 NaN。编译期 `formatLineHeight` 仍走 `1.5` → `'150%'` 路径，因为 class 样式的 fontSize 在编译期未知，由运行时 percent 阶段（`useTransformStyle` 内）按实际 fontSize 解析 —— 两端口径不同但都能到达正确数值。
4. **`gap` 严格 number 约束**：RN `gap` / `rowGap` / `columnGap` 只接受 `number`（不同于 `margin` 的 `DimensionValue`）。inline 样式的 `rpx`→number 换算只在展开链路的 `__formatValue` 里发生（class 样式的 `transformStyleObj` 不覆盖 inline），故 `gap` 单值字符串也强制展开换算，不能透传原字符串；百分比 `gap`（CSS 合法但 RN 不接受）不在支持范围。
5. **`inset` 与显式单边长属性混用**：`inset` 展开遵循「长属性不覆盖」原则，`{ inset:'0', top:8 }` 中 `top` 保留 `8`，与 CSS 源码顺序语义在 RN 无法表达，约定显式单边优先。
6. **两端口径镜像**：编译期 `formatFont` / 复合泛化与运行时 `transformFont` / `expandCompositeValues` 必须保持同口径（丢弃项、缺省项、校验顺序一致），避免 class 与 inline 输出分叉。
