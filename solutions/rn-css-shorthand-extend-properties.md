# RN 扩展简写属性支持技术方案（gap / inset / outline / place / font）

## 背景

当前 Mpx2RN 已支持一批 CSS 简写属性的跨端展开，编译期与运行时分别由：

- 编译期：`packages/webpack-plugin/lib/platform/style/wx/index.js`（`AbbreviationMap` + `formatAbbreviation` / `formatUnorderedAbbreviation` / `formatCompositeVal` / `formatBorder` / `formatFlex` / `formatBackground`）。
- 运行时：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`（`runtimeAbbreviationMap` + `transformShorthand` / `expandUnorderedAbbreviation` / `expandCompositeValues` / `transformFlex` / `transformBackground`）。

无序类型展开与缺省值补齐机制详见 [rn-css-shorthand-order-alignment.md](./rn-css-shorthand-order-alignment.md)，本方案复用其已落地的 `formatUnorderedAbbreviation` / `expandUnorderedAbbreviation` / `ShorthandDefaultMap` 等能力，不再重复说明。

目前仍有若干常见简写属性未支持，用户书写后会因不命中任何简写规则而走 `verification` 兜底，被当作非法属性值过滤（如 `gap: 10rpx 20rpx`、`inset: 0`、`place-content: center space-between`）或整体丢弃：

- `gap`（含双值 `gap: <row> <column>`）
- `inset`
- `outline`
- `place-items` / `place-content`
- `font`

本方案设计这几个简写属性的 RN 跨端展开方案，编译期与运行时同口径落地。

## 目标

1. 让 RN 编译期与运行时支持 `gap` / `inset` / `outline` / `place-items` / `place-content` / `font` 这几个简写属性的展开。
2. 最大化复用现有数据驱动结构（`AbbreviationMap` / `runtimeAbbreviationMap` / 复合值展开 / 无序类型展开 / 缺省补齐），不引入大规模重构。
3. 编译期继续复用 `verifyProps` / `verifyValues`，运行时继续保持轻量判断。
4. 对 RN 无等效能力的子槽位（`justify-items`、`font-stretch`、system 字体关键字等）明确丢弃并文档化，不静默产出错误样式。

## 非目标

1. 不补齐 RN 本身完全没有的语义（如 `outline-offset` 的精确表现、`grid` 相关 `place-*` 的 grid 语义）。
2. 不实现完整 CSS `font` 规范（不含 `font-stretch`、`font-variant` 全集、`caption/icon/menu/message-box/small-caption/status-bar` 等 system 字体关键字、`line-height` 之外的多值组合）。
3. 不改变样式覆盖优先级：展开出的长属性仍遵循「不覆盖已存在的同名长属性」原则。
4. 不为 `outline` 引入 border 那套「整体短路为 width:0」的特殊语义（理由见下文 outline 小节）。

## RN 支持现状（基于 `react-native@0.74.6`，peer `^0.74.5`）

| 简写 | 目标长属性 | RN 原生支持情况 |
| --- | --- | --- |
| `gap` | `rowGap` / `columnGap`（及 `gap` 本身） | ✅ `FlexStyle` 原生支持 `gap` / `rowGap` / `columnGap`（均为 `number`，单值原生可用） |
| `inset` | `top` / `right` / `bottom` / `left` | ⚠️ `inset` 仅在 `experimental.d.ts` 标注，**非稳定**；`top/right/bottom/left` 稳定支持 → 必须展开到四个长属性 |
| `outline` | `outlineWidth` / `outlineStyle` / `outlineColor` | ❌ 0.74 **不支持**（`outline*` 系 RN 0.76 才加入）；peer 允许 0.76+ → 0.74 静默忽略、升级后自动生效 |
| `place-items` | `alignItems`（+ `justifyItems`✖） | 部分：`alignItems` 支持；RN flexbox **无 `justifyItems`** → 丢弃 |
| `place-content` | `alignContent` / `justifyContent` | ✅ 两者均原生支持 |
| `font` | `fontStyle` / `fontWeight` / `fontSize` / `lineHeight` / `fontFamily` | 子集：上述目标均支持；无 `fontStretch`，`fontVariant` 语义为数组、与 CSS `font` 简写差异较大 |

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

### 3. `outline`（无序类型展开，复用 `formatUnorderedAbbreviation`）

CSS：`outline: <outline-width> || <outline-style> || <outline-color>`，顺序不敏感。

| 写法 | 展开 |
| --- | --- |
| `outline: 1px solid red` | `outlineWidth:1 / outlineStyle:'solid' / outlineColor:'red'` |
| `outline: red solid 2px` | 同上（顺序无关） |
| `outline: solid` | `outlineStyle:'solid'`（width / color 不补，见下） |

- **不进入 `ShorthandDefaultMap`，不做缺省补齐，不做 border 式短路**：outline 在 RN 不占布局空间，且 0.74 整体被忽略，没有「缺 style 即整体清零」的布局语义需要表达。保持「写什么展开什么」即可，最小实现、最小心智负担。
- `outline-style` 取值与 `border-style` 对齐（`solid` / `dotted` / `dashed`）；本方案不支持 `double` / `groove` / `ridge` 等 RN 无对应的样式。

### 4. `place-items`（有序，仅取 align 槽位）

CSS：`place-items: <align-items> <justify-items>?`，单值时两者同值。

| 写法 | 展开 |
| --- | --- |
| `place-items: center` | `alignItems: 'center'`（`justify-items` 丢弃） |
| `place-items: center flex-start` | `alignItems: 'center'`（第二槽位 `justify-items` 无 RN 等效，丢弃） |

- 第一个 token 视为 `align-items`，按 `align-items` 枚举校验（`flex-start/flex-end/center/stretch/baseline`）。
- 第二个 token（`justify-items`）在 RN flexbox 无对应能力，直接丢弃（编译期可 warn 提示，运行时静默）。

### 5. `place-content`（有序 2 槽位，单值填双槽，按各自枚举校验）

CSS：`place-content: <align-content> <justify-content>?`，单值时两者同值。

| 写法 | 展开 |
| --- | --- |
| `place-content: center` | `alignContent:'center'` / `justifyContent:'center'` |
| `place-content: space-between center` | `alignContent:'space-between'` / `justifyContent:'center'` |
| `place-content: stretch` | `alignContent:'stretch'`（`justifyContent` 无 `stretch` → 丢弃该槽位） |

- 第一个 token → `align-content`（枚举 `flex-start/flex-end/center/stretch/space-between/space-around/space-evenly`）。
- 第二个 token → `justify-content`（枚举 `flex-start/flex-end/center/space-between/space-around/space-evenly`，**无 `stretch`**）。
- 单值时两槽位都尝试填入，但各按自身枚举校验：对单槽位非法的值（如 `justify-content: stretch`）跳过该槽位、不报错。

### 6. `font`（专用解析，RN 等效子集）

CSS 完整 `font` 极复杂。本方案只支持 RN 可等效的子集：

```
font: [ <font-style> ] [ <font-weight> ] <font-size> [ / <line-height> ] <font-family>
```

| 写法 | 展开 |
| --- | --- |
| `font: 16px PingFang SC` | `fontSize:16` / `fontFamily:'PingFang SC'` |
| `font: italic bold 16px/1.5 Arial` | `fontStyle:'italic'` / `fontWeight:'bold'` / `fontSize:16` / `lineHeight:'150%'` / `fontFamily:'Arial'` |
| `font: 500 28rpx/40rpx "PingFangSC-Regular"` | `fontWeight:'500'` / `fontSize:28rpx` / `lineHeight:40rpx` / `fontFamily:'PingFangSC-Regular'` |

解析口径：

- **必填**：`font-size` 与 `font-family`。缺任一则视为非法，编译期 warn 并丢弃，运行时静默丢弃。
- **前导可选段**（`font-size` 之前）：按类型识别 `font-style`（`italic`，`normal` 为默认跳过）与 `font-weight`（`bold` / `100`~`900`，`normal` 跳过）。顺序在前导段内不敏感。
- **`font-size`**：第一个 length 类型 token（可带 `/<line-height>`）。
- **`line-height`**：仅在与 `font-size` 同 token 内以 `/` 分隔时识别（如 `16px/1.5`）。数值型 line-height 复用 `formatLineHeight` 口径换算为百分比（`1.5` → `150%`）。
- **`font-family`**：`font-size` 之后的剩余部分，复用 `formatFontFamily`（多字体取首值、去引号）。
- **不支持**：`font-stretch`、`font-variant`（RN 为数组语义）、system 字体关键字（`caption` / `icon` / `menu` / `message-box` / `small-caption` / `status-bar`）。命中这些 token 时按非法处理（缺 size/family 会自然落到 warn/丢弃）。

## 编译期方案

文件：`packages/webpack-plugin/lib/platform/style/wx/index.js`

### 1. 扩展 `AbbreviationMap`

```js
const AbbreviationMap = {
  // ……现有项……
  gap: ['rowGap', 'columnGap'],
  inset: ['top', 'right', 'bottom', 'left'],
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor']
  // place-items / place-content / font 走专用 formatter，不入 AbbreviationMap
}
```

- `gap` / `inset` 走复合值（`formatCompositeVal`）链路。
- `outline` 加入 `UnorderedAbbreviationMap`，复用 `formatUnorderedAbbreviation`。
- `place-*` / `font` 用专用 formatter，规则需排在通用 `AbbreviationMap` 规则之前。

### 2. `gap` / `inset` 接入复合值链路（`formatCompositeVal` 槽位数泛化）

现有 `formatCompositeVal` 写死按 4 槽位补齐（`splice(0, 4)` + 1→4 / 2→4 / 3→4），且 4 槽位单值场景直接返回 `{ prop, value }`（RN 原生支持 `margin` / `padding` 单值 `DimensionValue`，无需展开）。

`gap` / `inset` 接入要点：

- `gap` 是 2 槽位，把「补齐到几槽」改为由 `AbbreviationMap[prop].length` 决定。
- `gap` / `inset` 单值都**不能走 4 槽位「单值直接返回」分支**：`inset` 原样返回会输出 RN 不稳定的 `inset` key；`gap` 需展开为 `rowGap` / `columnGap` 才能做行列显式化与 `rpx` 换算。因此「单值直接返回」捷径只保留给 `margin` / `padding` 等 RN 原生支持单值的属性。

```js
// 单值直接返回（RN 原生支持单值）的属性：margin / padding / border-* 四值简写，
// 不含 gap / inset（它们单值也要展开）
const compositeSingleValuePassthrough = (prop) => prop !== 'gap' && prop !== 'inset'

const formatCompositeVal = ({ prop, value, selector }, { mode }) => {
  const count = AbbreviationMap[prop].length // gap=2，inset/margin/padding/border-*=4
  const values = parseValues(value).splice(0, count)
  if (count === 2) {
    // gap：单值复制到行列两槽；双值原样
    if (values.length === 1) values.push(values[0])
  } else {
    switch (values.length) {
      case 1:
        // margin/padding 单值原样透传；gap/inset 复制为四值（此处仅 inset 命中 4 槽位）
        if (compositeSingleValuePassthrough(prop)) {
          return verifyValues({ prop, value, selector }, false) && { prop, value }
        }
        values.push(values[0], values[0], values[0])
        break
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

### 3. `outline` 接入无序类型展开

```js
const UnorderedAbbreviationMap = {
  // ……现有项……
  outline: true
}
```

新增 `outline-style` 枚举，使 `outline-style` token 走 `getValueType` 的 enum 分支被正确校验：

```js
const SUPPORTED_PROP_VAL_ARR = {
  // ……现有项……
  'outline-style': ['solid', 'dotted', 'dashed']
}
```

`formatAbbreviation` 开头已有 `if (UnorderedAbbreviationMap[prop]) return formatUnorderedAbbreviation(...)`，`outline` 自动命中。`outlineWidth` → `outline-width`（length）、`outlineColor` → `outline-color`（color）、`outlineStyle` → `outline-style`（新增 enum），三槽位均可由现有 `getVerifiedProp` 正确归位。

- `outline` **不加入 `ShorthandDefaultMap`**（不补缺省）。
- `outline` **不进入 `formatBorder`**（不做短路）。
- `outlineWidth` / `outlineStyle` / `outlineColor` 未列入任何 `unsupportedProp` 名单，`verifyProps` 默认放行（0.74 RN 忽略、0.76+ 生效，编译产物无需感知版本）。

### 4. `place-items` / `place-content` 专用 formatter

```js
const formatPlace = ({ prop, value, selector }, { mode }) => {
  const values = parseValues(value)
  const cssMap = []
  if (prop === 'place-items') {
    // 仅取 align-items；justify-items 无 RN 等效，丢弃（多余 token 提示）
    const align = values[0]
    if (verifyValues({ prop: 'align-items', value: align, selector }, false)) {
      cssMap.push({ prop: 'alignItems', value: align })
    }
    if (values.length > 1) {
      warn(`Value of [${prop}:${value}] in ${selector}: justify-items is not supported in React Native and will be ignored.`)
    }
    return cssMap
  }
  // place-content: 单值填双槽，按各自枚举校验
  const alignVal = values[0]
  const justifyVal = values.length > 1 ? values[1] : values[0]
  if (verifyValues({ prop: 'align-content', value: alignVal, selector }, false)) {
    cssMap.push({ prop: 'alignContent', value: alignVal })
  }
  // 单值时若该值对 justify-content 非法（如 stretch）则静默跳过，不报错
  const justifyIsError = values.length > 1
  if (verifyValues({ prop: 'justify-content', value: justifyVal, selector }, justifyIsError ? false : silentVerify)) {
    cssMap.push({ prop: 'justifyContent', value: justifyVal })
  }
  return cssMap
}
```

规则（排在通用 `AbbreviationMap` 规则之前）：

```js
{
  test: /^(place-items|place-content)$/,
  ios: formatPlace,
  android: formatPlace,
  harmony: formatPlace
}
```

### 5. `font` 专用 formatter

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
    warn(`Value of [${prop}:${value}] in ${selector} is missing required <font-size>, please check again!`)
    return false
  }

  // 2. 前导段（font-size 之前）：识别 font-style / font-weight，顺序不敏感
  for (let i = 0; i < sizeIdx; i++) {
    const t = tokens[i]
    if (t === 'normal') continue // 默认值，跳过
    if (verifyValues({ prop: 'font-style', value: t, selector }, silentVerify)) {
      cssMap.push({ prop: 'fontStyle', value: t })
    } else if (verifyValues({ prop: 'font-weight', value: t, selector }, silentVerify)) {
      cssMap.push({ prop: 'fontWeight', value: t })
    } else {
      // font-variant / font-stretch / system 关键字等 → 不支持，提示并忽略
      warn(`Value of [${prop}:${value}] in ${selector}: leading token [${t}] is not supported (only font-style / font-weight), ignored.`)
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
    warn(`Value of [${prop}:${value}] in ${selector} is missing required <font-family>, please check again!`)
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

运行时只处理 inline `style={{ ... }}`（class 样式已在编译期展开）；key 为驼峰式：`gap` / `inset` / `outline` / `placeItems` / `placeContent` / `font`。

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

### 2. `outline` 接入无序展开

```ts
const runtimeUnorderedAbbreviationMap = {
  // ……现有项……
  outline: true
}
```

`matchRuntimeShorthandProp` 中 `outlineStyle`、`outlineColor`、`outlineWidth` 复用现有后缀判定即可：

- `prop.endsWith('Width')` → `isLengthValue`（命中 `outlineWidth`）
- `prop.endsWith('Style')` → `borderStyleMap`（命中 `outlineStyle`；`solid/dotted/dashed` 与 outline 对齐，`none` 也会被收集但 outline 无短路、无害）
- `prop.endsWith('Color')` → `isColorValue`（命中 `outlineColor`）

`outline` 不入 `runtimeShorthandDefaultMap`、不入 `borderShorthandMap`，因此不触发缺省补齐与 border 短路，行为与编译期一致。

### 3. `placeItems` / `placeContent` / `font` 专用 transform（沿用 `transformFlex` 的标志位模式）

这三者不进 `runtimeAbbreviationMap`（不走 `shorthandKeys` 通用链路），而是仿照 `hasFlex` / `transformFlex`：在 `collectTopLevelFlags` 设标志，`useTransformStyle` 末尾按标志调用专用 transform。

```ts
// collectTopLevelFlags 内新增
case 'placeItems':
case 'placeContent':
  needTransformPlace = true
  break
case 'font':
  hasFont = true
  break
```

```ts
function transformPlace (styleObj: Record<string, any>) {
  // placeItems → alignItems（justify-items 丢弃）
  if (typeof styleObj.placeItems === 'string') {
    const align = parseValues(styleObj.placeItems)[0]
    delete styleObj.placeItems
    if (align && !hasOwn(styleObj, 'alignItems')) styleObj.alignItems = align
  }
  // placeContent → alignContent / justifyContent（单值填双槽，justify 不支持 stretch 时跳过）
  if (typeof styleObj.placeContent === 'string') {
    const vals = parseValues(styleObj.placeContent)
    const alignVal = vals[0]
    const justifyVal = vals.length > 1 ? vals[1] : vals[0]
    delete styleObj.placeContent
    if (alignVal && !hasOwn(styleObj, 'alignContent')) styleObj.alignContent = alignVal
    if (justifyVal && justifyVal !== 'stretch' && !hasOwn(styleObj, 'justifyContent')) {
      styleObj.justifyContent = justifyVal
    }
  }
}
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
  if (sizeIdx === -1) return // 缺 font-size，非法，保留原值由 RN 兜底（或忽略）
  // 2. 前导段 font-style / font-weight
  for (let i = 0; i < sizeIdx; i++) {
    const t = tokens[i]
    if (t === 'normal') continue
    if (t === 'italic') result.push(['fontStyle', t])
    else if (hasOwn(fontWeightMap, t)) result.push(['fontWeight', t])
    // 其余（variant / stretch / system 关键字）忽略
  }
  // 3. line-height（数值转百分比，复用运行时口径）
  if (lineHeight !== undefined) {
    const lh = isNum(lineHeight) ? `${Math.round(+lineHeight * 100)}%` : global.__formatValue(lineHeight)
    result.push(['lineHeight', lh])
  }
  // 4. font-family
  const familyStr = tokens.slice(sizeIdx + 1).join(' ').trim()
  if (!familyStr) return
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
if (needTransformPlace) transformPlace(normalStyle)
if (hasFont) transformFont(normalStyle)
if (shorthandKeys.length) transformShorthand(normalStyle, shorthandKeys)
```

> 注意调用顺序：`transformFont` 产出的 `fontSize` / `lineHeight` 等若含 `%`（如 `lineHeight: '150%'`），需在 `percent` 阶段之后即时换算或保留字符串由后续阶段处理。由于 `transformFont` 在 `percentKeyPaths` 收集（`styleVisitor` 遍历原始 styleObj）之后才运行，`font` 内联展开出的百分比 `lineHeight` **不会**被 percent 阶段收集。`lineHeight` 百分比在 RN 上由 `fontSize` 推导，运行时 `resolvePercent` 依赖 percentConfig；为简化，`transformFont` 产出的 `lineHeight` 百分比保持与编译期一致（字符串 `'150%'`），交由下游文本样式继承与 RN 行高解析。若需严格数值化，可在 `transformFont` 内直接用 `fontSize` 数值乘算（见风险小节）。

## 缺省值与短路

| 简写 | 缺省补齐 | 短路 |
| --- | --- | --- |
| `gap` | 无（单值复制行列已是 CSS 语义） | 无 |
| `inset` | 无（同 margin 四值复制语义） | 无 |
| `outline` | **不补**（RN 忽略 / 非布局，缺槽位即不输出） | 无 |
| `place-items` | 无（`justify-items` 直接丢弃，不补） | 无 |
| `place-content` | 无（单值填双槽即 CSS 语义） | 无 |
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
| `place-items: center` | `{ alignItems:'center' }` | 全 |
| `place-items: center start` | `{ alignItems:'center' }` + warn（justify-items 丢弃） | 全 |
| `place-content: center` | `{ alignContent:'center', justifyContent:'center' }` | 全 |
| `place-content: space-between center` | `{ alignContent:'space-between', justifyContent:'center' }` | 全 |
| `place-content: stretch` | `{ alignContent:'stretch' }`（justify 无 stretch，跳过） | 全 |
| `font: italic bold 16px/1.5 Arial` | `{ fontStyle:'italic', fontWeight:'bold', fontSize:16, lineHeight:'150%', fontFamily:'Arial' }` | 全 |
| `font: 28rpx PingFangSC-Regular` | `{ fontSize:28rpx, fontFamily:'PingFangSC-Regular' }` | 全 |
| `font: caption` / `font: 16px`（缺 family） | 丢弃 + warn | 全 |

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

test('should expand place-items (drop justify-items) and place-content', () => {
  const css = '.a { place-items: center; } .b { place-items: center flex-start; } .c { place-content: space-between center; } .d { place-content: center; }'
  const config = createConfig()
  const result = getClassMap({ content: css, filename: 'test.css', ...config })
  expect(result.a).toEqual({ alignItems: '"center"' })
  expect(result.b).toEqual({ alignItems: '"center"' }) // justify-items 丢弃
  expect(result.c).toEqual({ alignContent: '"space-between"', justifyContent: '"center"' })
  expect(result.d).toEqual({ alignContent: '"center"', justifyContent: '"center"' })
})

test('should expand font shorthand subset', () => {
  const css = '.a { font: italic bold 16px/1.5 Arial; } .b { font: 28rpx PingFangSC-Regular; }'
  const result = getClassMap({ content: css, filename: 'test.css', ...createConfig() })
  expect(result.a).toEqual({
    fontStyle: '"italic"', fontWeight: '"bold"', fontSize: '16px',
    lineHeight: '150%', fontFamily: '"Arial"'
  })
  expect(result.b).toEqual({ fontSize: '28rpx', fontFamily: '"PingFangSC-Regular"' })
})

test('should warn and drop font without size or family', () => {
  const css = '.a { font: 16px; }'
  const config = createConfig()
  getClassMap({ content: css, filename: 'test.css', ...config })
  expect(config.warn).toHaveBeenCalled()
})
```

> 上表中字符串/引号形态以实际 `getClassMap` 产物为准（数值如 `'1'`、颜色与枚举如 `'"red"'` / `'"solid"'`、带单位如 `'16px'`），编写时按现有 `Unordered shorthand` 用例的形态对齐微调。

### 运行时单测

按现有 runtime 测试方式补充核心用例：

1. `style={{ gap: '10rpx 20rpx' }}` → `{ rowGap, columnGap }`（均 number）；`style={{ gap: '20rpx' }}`（单值字符串）→ `{ rowGap, columnGap }` 均换算为 number；`style={{ gap: 8 }}`（number）→ 保留 `gap`（RN 原生）。
2. `style={{ inset: '0' }}` → `{ top:0, right:0, bottom:0, left:0 }`。
3. `style={{ outline: 'red solid 2px' }}` → `{ outlineColor, outlineStyle, outlineWidth }`。
4. `style={{ placeItems: 'center start' }}` → `{ alignItems: 'center' }`。
5. `style={{ placeContent: 'space-between center' }}` → `{ alignContent, justifyContent }`；`placeContent: 'stretch'` → 仅 `alignContent`。
6. `style={{ font: 'italic bold 16px/1.5 Arial' }}` → `{ fontStyle, fontWeight, fontSize, lineHeight, fontFamily }`。
7. 长属性不被覆盖：`{ inset: '0', top: 8 }` → `top` 仍为 `8`（普通展开「长属性不覆盖」原则）。

## 文档与 Skill 同步

1. `docs-vitepress/guide/rn/style.md`
   - 间距章节：补 `gap` 双值展开说明。
   - 定位章节：新增 `inset`（展开到 `top/right/bottom/left`）。
   - 新增 `outline`（标注 RN 0.76+ 生效，0.74 静默忽略）。
   - 弹性/对齐章节：新增 `place-items`（仅 `align-items`，`justify-items` 丢弃）、`place-content`（`align-content` + `justify-content`）。
   - 文本字体章节：新增 `font` 简写子集说明与不支持项（`font-stretch` / `font-variant` / system 关键字）。
2. `.claude/skills/mpx2rn/references/rn-style-reference.md`
   - 同步上述属性的支持范围与边界（沿用现有「值类型 / 默认值 / 说明 / 示例」表格列）。
   - 明确标注 `justify-items` / `font-stretch` / system 字体关键字为不支持。
3. changelog
   - 列出新增支持的简写：`gap`（双值）、`inset`、`outline`、`place-items`、`place-content`、`font`（子集）。

## 实施步骤

1. 编译期 `wx/index.js`：
   - `AbbreviationMap` 增 `gap` / `inset` / `outline`；`UnorderedAbbreviationMap` 增 `outline`；`SUPPORTED_PROP_VAL_ARR` 增 `outline-style`。
   - `formatCompositeVal` 泛化槽位数（`AbbreviationMap[prop].length`），`inset` 单值强制展开；复合值规则 regex 增 `gap|inset`。
   - 新增 `formatPlace` / `formatFont` 与对应规则（置于通用 `AbbreviationMap` 规则之前）。
2. 运行时 `utils.tsx`：
   - `runtimeAbbreviationMap` 增 `gap` / `inset` / `outline`；`runtimeCompositeStyleMap` 增 `gap` / `inset`；新增 `runtimeForceExpandCompositeMap`（`inset`）；`runtimeUnorderedAbbreviationMap` 增 `outline`。
   - `collectTopLevelFlags` 增 `placeItems` / `placeContent` / `font` 标志；新增 `transformPlace` / `transformFont` 及 `fontWeightMap`；在 `useTransformStyle` 末尾按标志调用。
3. 补充编译期与运行时单测。
4. 同步文档、skill、changelog。
5. 同步运行时 dist：修改 `utils.tsx` 后执行 `npm run build -w @mpxjs/webpack-plugin`，由构建产物生成 `lib/runtime/components/react/dist/**`。
6. 校验：运行相关 eslint 与 `style-rn.spec.js` jest。

## 风险与边界

1. **`outline` 的 RN 版本依赖**：0.74 完全忽略 `outline*`，升级到 0.76+ 自动生效。编译产物不感知版本，行为差异由运行环境决定，文档需显式说明「低版本不渲染、非 bug」。
2. **`justify-items` / `font-stretch` / system 字体关键字丢弃**：RN 无等效能力，编译期 warn、运行时静默丢弃。用户若依赖这些子能力需自行用条件编译在原平台保留。
3. **`font` 的 `line-height` 百分比**：`transformFont` 运行在 percent 收集阶段之后，`font` 内联展开出的 `lineHeight: '150%'` 不会被 percent 阶段数值化，与编译期一致地以字符串透传，由 RN/文本继承解析。若后续需要严格数值化，可在 `transformFont` 内基于已解析的 `fontSize` 直接乘算（需保证 `fontSize` 已为 number）。
4. **`gap` 严格 number 约束**：RN `gap` / `rowGap` / `columnGap` 只接受 `number`（不同于 `margin` 的 `DimensionValue`）。inline 样式的 `rpx`→number 换算只在展开链路的 `__formatValue` 里发生（class 样式的 `transformStyleObj` 不覆盖 inline），故 `gap` 单值字符串也强制展开换算，不能透传原字符串；百分比 `gap`（CSS 合法但 RN 不接受）不在支持范围。
5. **`inset` 与显式单边长属性混用**：`inset` 展开遵循「长属性不覆盖」原则，`{ inset:'0', top:8 }` 中 `top` 保留 `8`，与 CSS 源码顺序语义在 RN 无法表达，约定显式单边优先。
6. **两端口径镜像**：编译期 `formatPlace` / `formatFont` / 复合泛化与运行时 `transformPlace` / `transformFont` / `expandCompositeValues` 必须保持同口径（丢弃项、缺省项、校验顺序一致），避免 class 与 inline 输出分叉。
