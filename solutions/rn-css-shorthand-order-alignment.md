# RN 简写属性 CSS 规范对齐技术方案

## 背景

当前 Mpx2RN 对部分简写属性的展开依赖固定值顺序：

- 编译期 class 样式：`packages/webpack-plugin/lib/platform/style/wx/index.js` 中 `formatAbbreviation` 通过 `AbbreviationMap[prop]` 的位置顺序展开。
- 运行时内联样式：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx` 中 `transformShorthand` / `expandAbbreviation` 通过 `runtimeAbbreviationMap[key]` 的位置顺序展开。

这会要求用户必须按特定顺序书写，例如：

```css
border: 1px solid red;
border-top: 1px solid red;
text-decoration: underline solid red;
```

但 CSS 规范中不少简写属性不要求固定顺序，而是按值类型匹配。例如 `border: red solid 1px` 与 `border: 1px solid red` 都是合法写法。当前实现会把 `red` 先尝试分配给 `borderWidth`，导致编译失败或运行时展开错误。

## 目标

1. 让 RN 编译期与运行时支持 CSS 规范中合法的无序简写写法。
2. 保持现有 `AbbreviationMap` / `runtimeAbbreviationMap` 数据驱动结构，不引入大规模重构。
3. 编译期继续复用现有 `verifyProps` / `verifyValues` 校验能力。
4. 运行时保持轻量处理，不引入完整 CSS parser。
5. 不改变四值类简写的顺序语义，例如 `margin`、`padding`、`border-width`、`border-color`、`border-radius`。

## 非目标

1. 不强制编译期和运行时复用同一个公共模块。两端可以各自在当前文件中实现同口径逻辑，贴近现有结构。
2. 不补齐 RN 本身不支持的能力，例如 `border-style: solid dashed` 的多值语法。
3. 不实现完整 `background`、`font` 等复杂 CSS 简写规范；本方案只覆盖当前 RN 链路已支持的简写属性。
4. 不改变样式覆盖优先级：展开出的长属性仍不覆盖已存在的同名长属性。

## 现状问题

### 编译期

`formatAbbreviation` 当前算法按 `propsIdx` 和 `idx` 同步向前推进：

```js
border: ['borderWidth', 'borderStyle', 'borderColor']
```

因此只有 `width | style | color` 这种顺序能稳定展开。虽然函数内部在值不匹配时有跳过逻辑，但它本质仍围绕“当前位置”做纠偏，无法完整表达“每个 token 根据类型归位”的 CSS 语义。

典型问题：

```css
.a { border: red solid 1px; }
```

期望：

```js
{
  borderColor: '"red"',
  borderStyle: '"solid"',
  borderWidth: 1
}
```

当前会先把 `red` 尝试匹配到 `borderWidth`，后续匹配依赖跳过逻辑，容易丢值或告警。

### 运行时

`transformShorthand` 当前逻辑更直接：

```ts
const pairs = expandAbbreviation(expandedValues, props)
```

运行时不会做值类型校验，因此 `style={{ border: 'red solid 1px' }}` 会被错误展开为：

```js
{
  borderWidth: 'red',
  borderStyle: 'solid',
  borderColor: 1
}
```

## 支持范围

### 需要改为按值类型解析的简写

| 属性 | CSS 语义 | 目标展开 |
| --- | --- | --- |
| `border` | `<line-width>`（RN 支持子集）\|\| `<line-style>` \|\| `<color>` | `borderWidth` / `borderStyle` / `borderColor` |
| `border-top` | `<line-width>`（RN 支持子集）\|\| `<line-style>` \|\| `<color>` | `borderTopWidth` / `borderTopStyle` / `borderTopColor` |
| `border-right` | 同上 | `borderRightWidth` / `borderRightStyle` / `borderRightColor` |
| `border-bottom` | 同上 | `borderBottomWidth` / `borderBottomStyle` / `borderBottomColor` |
| `border-left` | 同上 | `borderLeftWidth` / `borderLeftStyle` / `borderLeftColor` |
| `text-decoration` | `<text-decoration-line>` \|\| `<text-decoration-style>` \|\| `<text-decoration-color>` | `textDecorationLine` / `textDecorationStyle` / `textDecorationColor` |
| `flex-flow` | `<flex-direction>` \|\| `<flex-wrap>` | `flexDirection` / `flexWrap` |
| `text-shadow` | `<color>? && <length>{2,3}` | `textShadowOffset.width` / `textShadowOffset.height` / `textShadowRadius` / `textShadowColor` |

说明：`text-shadow` 属于混合语义，`color` 可以出现在长度组前后任意位置，但长度组内部仍有顺序含义：第一个长度是 `offset-x`，第二个长度是 `offset-y`，第三个长度才是 `blur-radius`。

### 继续保持顺序解析的简写

| 属性 | 原因 |
| --- | --- |
| `margin` / `padding` | CSS 四值语法本身是顺序语义 |
| `border-width` / `border-color` / `border-radius` | CSS 四值语法本身是顺序语义 |
| `text-shadow` 的长度组 | offset-x / offset-y / blur-radius 依赖顺序，但 color 不依赖顺序 |
| `flex` | 当前已有独立 `formatFlex` / `expandFlex`，按 flex 规范处理 |
| `background` | 已有独立 `formatBackground` / `transformBackground` |

## 编译期方案

文件：`packages/webpack-plugin/lib/platform/style/wx/index.js`

### 1. 保留 `AbbreviationMap`

继续保留现有映射，作为目标属性列表：

```js
border: ['borderWidth', 'borderStyle', 'borderColor']
'border-left': ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor']
'text-decoration': ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor']
'flex-flow': ['flexDirection', 'flexWrap']
'text-shadow': ['textShadowOffset.width', 'textShadowOffset.height', 'textShadowRadius', 'textShadowColor']
```

不把映射抽到公共文件，减少对现有调用链和构建产物的影响。

### 2. 增加无序简写分发规则

在同文件内新增一个轻量规则表，用于标记哪些简写需要按值类型分发：

```js
const UnorderedAbbreviationMap = {
  'text-decoration': true,
  'flex-flow': true,
  'text-shadow': true,
  border: true,
  'border-left': true,
  'border-right': true,
  'border-top': true,
  'border-bottom': true
}
```

`border` 系也纳入该表：分发口径需与 `formatBorder` 保持一致，否则 `formatAbbreviation` 入口判断与 `formatBorder` 中实际调用 `formatUnorderedAbbreviation` 会出现“目录与实现不一致”的隐患。

在 `formatAbbreviation` 开头分流：

```js
if (UnorderedAbbreviationMap[prop]) {
  return formatUnorderedAbbreviation({ prop, value, selector }, { mode })
}
```

当前规则表中 `text-decoration` 不需要单独规则。保留在 `AbbreviationMap` 后，会自然命中通用简写规则，并由 `formatAbbreviation` 开头的 `UnorderedAbbreviationMap` 分流到 `formatUnorderedAbbreviation`，避免额外维护一条等价调用链。

四值类简写继续走当前 `formatCompositeVal -> formatAbbreviation` 的路径。

### 3. 新增 `formatUnorderedAbbreviation`

核心思路：对每个 token 依次尝试目标属性，找到第一个“属性支持且值合法且尚未被占用”的属性。对于 `text-shadow`，该逻辑可以表达“color 任意位置 + 长度组顺序分配”：颜色 token 会跳过 `textShadowOffset.width` / `height` / `textShadowRadius` 并匹配到 `textShadowColor`，长度 token 在 `used` 限制下按出现顺序填入 offset-x、offset-y、blur-radius。

伪代码：

```js
const formatUnorderedAbbreviation = ({ prop, value, selector }, { mode }) => {
  const original = `${prop}:${value}`
  const props = AbbreviationMap[prop]
  const values = Array.isArray(value) ? value : parseValues(value)
  const cssMap = []
  const used = {}
  let hasTextDecorationNone = false
  let hasUnderline = false
  let hasLineThrough = false

  if (values.length === 1 && cssVariableExp.test(value)) {
    return { prop, value }
  }

  values.forEach((value) => {
    if (prop === 'text-decoration' && verifyValues({ prop: 'text-decoration-line', value, selector }, silentVerify)) {
      if (value === 'underline') {
        hasUnderline = true
      } else if (value === 'line-through') {
        hasLineThrough = true
      } else {
        hasTextDecorationNone = true
      }
      return
    }

    const matchedProp = props.find((prop) => {
      if (used[prop]) return false
      const newProp = hump2dash(prop.replace(/\..+/, ''))
      if (prop === 'textDecorationStyle') {
        return verifyValues({ prop: newProp, value, selector }, silentVerify) &&
          verifyProps({ prop: newProp, value, selector }, { mode }, false)
      }
      if (/Style$/.test(prop)) {
        return SUPPORTED_PROP_VAL_ARR['border-style'].includes(value) &&
          verifyProps({ prop: newProp, value, selector }, { mode }, false)
      }
      return verifyValues({ prop: newProp, value, selector }, silentVerify) &&
        verifyProps({ prop: newProp, value, selector }, { mode }, false)
    })

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

  return cssMap
}
```

编译期 `text-decoration` 的 line token 也在主循环中处理，合法输出与运行时一致：只支持 `none`、`underline`、`line-through`、`underline line-through`，其中 `none` 只在没有 `underline` / `line-through` 时生效。识别 line token 时通过白名单 `{ underline, line-through, none }` 命中（不复用 `verifyValues('text-decoration-line', ...)`），避免 `text-decoration: overline` 这类未知 line 值被误归为 `none`。

`text-shadow` 在主循环结束后做一次后置校验：CSS 规范要求至少给出 `<offset-x>` 与 `<offset-y>`；如果只填了 `offset-x`（即 `textShadowOffset.width` 已写入而 `height` 缺失），编译期与运行时都会发出 warn 并把 `height` 兜底为 `0`，避免 RN 上 `textShadowOffset.height` 缺失导致渲染异常。

其中 `pushAbbreviationValue` 可以从当前 `formatAbbreviation` 的 `prop.includes('.')` 分支抽出一个本地 helper，保持原有 `textShadowOffset.width` 这类点路径写法：

```js
const pushAbbreviationValue = (cssMap, prop, value) => {
  if (prop.includes('.')) {
    const [main, sub] = prop.split('.')
    const cssData = cssMap.find(item => item.prop === main)
    if (cssData) {
      cssData.value[sub] = value
    } else {
      cssMap.push({
        prop: main,
        value: {
          [sub]: value
        }
      })
    }
  } else {
    cssMap.push({ prop, value })
  }
}
```

现有 `formatAbbreviation` 也可以改为复用该 helper，属于小范围整理。

### 4. border 简写统一走 `formatBorder`

`border`、`border-top`、`border-right`、`border-bottom`、`border-left` 都由 `formatBorder` 统一处理；`formatBorder` 仅做整体 `none` 短路，其余 token 委派给 `formatUnorderedAbbreviation`。同时这些键也加入 `UnorderedAbbreviationMap`，保证从通用规则分发时的口径一致。

`formatBorder` 保持 `none` 特殊处理：

```js
border: none -> borderWidth: 0
border-top: none -> borderTopWidth: 0
```

实现方式：

```js
const formatBorder = ({ prop, value, selector }, { mode }) => {
  value = value.trim()
  if (value === 'none') {
    return {
      prop: AbbreviationMap[prop][0],
      value: 0
    }
  }
  return formatUnorderedAbbreviation({ prop, value, selector }, { mode })
}
```

规则表中需在通用 `AbbreviationMap` 匹配前添加 border 规则：

```js
{
  test: /^(border|border-left|border-right|border-top|border-bottom)$/,
  ios: formatBorder,
  android: formatBorder,
  harmony: formatBorder
}
```

### 5. 重复值处理

CSS 对同一类型重复赋值通常不合法，例如：

```css
border: 1px 2px solid red;
```

处理策略建议保持轻量：通过 `used` 避免同一个展开属性被重复消费，不为重复同类型 token 增加专门报错分支。重复 token 因没有可匹配的未占用属性，会沿用现有 invalid warn。

## 运行时方案

文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

### 1. 保留 `runtimeAbbreviationMap`

继续用当前映射描述展开目标，不抽公共模块：

```ts
border: ['borderWidth', 'borderStyle', 'borderColor']
textDecoration: ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor']
flexFlow: ['flexDirection', 'flexWrap']
textShadow: ['textShadowOffset.width', 'textShadowOffset.height', 'textShadowRadius', 'textShadowColor']
```

### 2. 增加运行时值类型判断

运行时没有 `verifyValues`，需要在 `utils.tsx` 内增加轻量判断函数。判断口径贴近编译期已有规则：

```ts
const borderStyleMap: Record<string, boolean> = {
  solid: true,
  dotted: true,
  dashed: true,
  // none 也作为合法 borderStyle token 收集，使 border: 1px none red 展开出 borderStyle: 'none'
  // 之后由 border 特定短路统一处理（borderStyle 缺省或 === none 都短路为 border*Width: 0）
  none: true
}

const textDecorationLineMap: Record<string, boolean> = {
  none: true,
  underline: true,
  'line-through': true
}

const textDecorationStyleMap: Record<string, boolean> = {
  solid: true,
  double: true,
  dotted: true,
  dashed: true
}

const flexDirectionMap: Record<string, boolean> = {
  row: true,
  'row-reverse': true,
  column: true,
  'column-reverse': true
}

const flexWrapMap: Record<string, boolean> = {
  wrap: true,
  nowrap: true,
  'wrap-reverse': true
}
```

长度与颜色判断：

```ts
function isLengthValue (token: string): boolean {
  return /^((-?(\d+(\.\d+)?|\.\d+))(rpx|px|%|vw|vh)?|hairlineWidth)$/.test(token)
}
```

说明：输出 RN 时 `borderWidth` 不支持 CSS 枚举值 `thin` / `medium` / `thick`，这里保持与编译期现有 `ValueType.length` 一致，仅识别数值单位与 `hairlineWidth`。

### 3. 新增运行时无序展开函数

运行时不做 warn，尽量处理合法 token，无法识别的 token 静默跳过；只要存在可识别 token，就删除原简写属性并把合法 token 填入对应展开属性。

示例：

```js
{ border: 'red unknown 1px' }
```

运行时展开为：

```js
{
  borderColor: 'red',
  borderWidth: 1
}
```

伪代码：

```ts
function pushExpandedPair (result: Array<[string, any]>, dotMap: Record<string, Record<string, any>>, prop: string, value: any) {
  if (prop.includes('.')) {
    const [main, sub] = prop.split('.')
    if (!dotMap[main]) {
      dotMap[main] = {}
      result.push([main, dotMap[main]])
    }
    dotMap[main][sub] = value
  } else {
    result.push([prop, value])
  }
}

function getUnorderedShorthandProp (key: string, token: string, used: Record<string, boolean>): string | undefined {
  const props = runtimeAbbreviationMap[key]
  for (const prop of props) {
    if (used[prop]) continue
    if (matchRuntimeShorthandProp(prop, token)) return prop
  }
}

function matchRuntimeShorthandProp (prop: string, token: string): boolean {
  if (prop === 'textShadowOffset.width' || prop === 'textShadowOffset.height' || prop === 'textShadowRadius') return isLengthValue(token)
  if (prop === 'textShadowColor') return isColorValue(token)
  if (prop.endsWith('Width')) return isLengthValue(token)
  if (prop === 'textDecorationStyle') return hasOwn(textDecorationStyleMap, token)
  if (prop.endsWith('Style')) return hasOwn(borderStyleMap, token)
  if (prop.endsWith('Color')) return isColorValue(token)
  if (prop === 'flexDirection') return hasOwn(flexDirectionMap, token)
  if (prop === 'flexWrap') return hasOwn(flexWrapMap, token)
  return false
}

function expandUnorderedAbbreviation (key: string, values: string[]): Array<[string, any]> | null {
  const result: Array<[string, any]> = []
  const dotMap: Record<string, Record<string, any>> = {}
  const used: Record<string, boolean> = {}
  let hasTextDecorationNone = false
  let hasUnderline = false
  let hasLineThrough = false
  for (const value of values) {
    if (key === 'textDecoration' && hasOwn(textDecorationLineMap, value)) {
      if (value === 'underline') {
        hasUnderline = true
      } else if (value === 'line-through') {
        hasLineThrough = true
      } else {
        hasTextDecorationNone = true
      }
      continue
    }
    const prop = getUnorderedShorthandProp(key, value, used)
    if (!prop) continue
    used[prop] = true
    pushExpandedPair(result, dotMap, prop, global.__formatValue(value))
  }
  if (hasUnderline || hasLineThrough) {
    result.push(['textDecorationLine', hasUnderline && hasLineThrough ? 'underline line-through' : hasUnderline ? 'underline' : 'line-through'])
  } else if (hasTextDecorationNone) {
    result.push(['textDecorationLine', 'none'])
  }
  return result.length ? result : null
}
```

`textDecorationLine` 的多值合并在 `expandUnorderedAbbreviation` 内部完成。例如：

```css
text-decoration: underline line-through red;
```

遍历时先收集 `underline` / `line-through` 等 line token，最后合并为 `textDecorationLine: 'underline line-through'`，调用侧不需要单独预处理。

注意：`textDecorationLine` 唯一支持的多值组合是 `underline line-through`，不是任意 line token 拼接；`none` 只在没有其他 decoration line 时作为单值生效。

### 4. 在 `transformShorthand` 中分流

新增：

```ts
const runtimeUnorderedAbbreviationMap: Record<string, boolean> = {
  border: true,
  borderTop: true,
  borderRight: true,
  borderBottom: true,
  borderLeft: true,
  textDecoration: true,
  flexFlow: true,
  textShadow: true
}
```

处理逻辑：

```ts
let pairs: Array<[string, any]> | null

if (hasOwn(runtimeUnorderedAbbreviationMap, key)) {
  pairs = expandUnorderedAbbreviation(key, values)
} else {
  pairs = expandAbbreviation(expandedValues, props)
}

if (!pairs) continue
```

成功展开后仍沿用当前优先级：

```ts
delete styleObj[key]
for (const [prop, val] of pairs) {
  if (!hasOwn(styleObj, prop)) styleObj[prop] = val
}
```

### 5. `none` 的处理

`border: none` 与混合 `border: 1px none red` 都需要短路为 `border*Width: 0`。具体短路流程（入口特判整体 `none` / `0` + 展开后判断 `borderStyle` 缺省或 === none）统一收敛到下文「简写缺省值补齐（通用机制）」的「border 特定短路」小节，编译期与运行时同口径，这里不再单列实现。

## 简写缺省值补齐（通用机制）

CSS 规范中大量简写允许槽位缺省，缺省值取自各长属性的 initial value。本节将"缺省补齐"抽成**由 `ShorthandDefaultMap` 数据驱动的通用机制**，由各简写在配置表里声明自己的缺省策略，主流程统一处理；后续新增简写或调整缺省值只改配置表，不动主流程。

当前实现只对 `border: none` 做了一条短路规则，其它缺省槽位均按"没写就不输出"处理，导致：

```css
.a { border: solid; }                      /* 当前: { borderStyle: 'solid' }，RN 上看不到边框（没 width） */
.b { border: 2px; }                        /* 当前: { borderWidth: 2 }，与 CSS 规范不一致（style 缺省 = none） */
.c { border-top: red; }                    /* 当前: { borderColor: 'red' }，同上 */
.d { text-shadow: 1px 2px; }               /* 当前: 缺 color，渲染依赖 RN 默认，跨端不稳定 */
.e { text-shadow: 1px 2px 3px; }           /* 当前: 同上，缺 color */
```

各简写在 CSS 规范与 RN 等价语义下的缺省策略：

策略分两类：**补齐**（进 `ShorthandDefaultMap` 通用表）、**特定短路**（border 独有，由 `formatBorder` / 运行时 border 分支处理，不进通用表）。

| 简写 | 槽位 | 策略 | RN 上的取值 |
| --- | --- | --- | --- |
| `border` / 四个单边 | `borderStyle` | **特定短路** | 缺省等价 `none` → 整体短路为 `border*Width: 0`（不进通用表，见「border 特定短路」） |
| 同上 | `borderWidth` / `border*Width` | **补齐** | `3`（对齐浏览器 `medium`） |
| 同上 | `borderColor` | 不补 | RN 实测对 `borderColor` 有内置缺省值（黑色），无需补齐 |
| `text-shadow` | `textShadowOffset.width` | 不补 | 必填，缺失沿用既有行为 |
| `text-shadow` | `textShadowOffset.height` | 既有 fallback | `0`，但有「width 存在才补」条件依赖，不并入通用表 |
| `text-shadow` | `textShadowRadius` | 不补 | RN 实测对 `textShadowRadius` 有内置缺省值（0），无需补齐 |
| `text-shadow` | `textShadowColor` | **补齐** | `'#000'`（CSS 是 `currentColor`，RN 无该概念，约定黑色） |
| `text-decoration` | 各槽位 | 当前不补 | line 缺省 `none` 即无装饰线，与 RN 默认一致 |
| `flex-flow` | 各槽位 | 当前不补 | 与 RN 默认一致 |

### 数据结构

引入「简写缺省值表」，**只描述补齐型缺省**：扫描完所有 token 后，目标槽位（以主循环 `used` map 记录的完整 prop 名为准）未被占用就追加 `{ prop: target, value: defaultValue }`。

`border` 的「styleProp 缺省 → 整体短路为 `border*Width: 0`」是 border 独有语义（CSS `border-style: none` 等价无边框），不进入这张通用表，由 `formatBorder` / 运行时 border 分支的**特定处理**承接（见下文「border 特定短路」）。这样通用机制保持单一职责（只补齐），无需引入 `shortCircuit` 这类分支语义，`applyShorthandDefaults` 也始终返回数组。

编译期（`packages/webpack-plugin/lib/platform/style/wx/index.js`）：

```js
// 简写槽位缺省值表（数据驱动，新增简写或调整缺省值只改这里）
// 值即槽位缺省时追加的补齐值；不含短路语义
// 注意：borderColor / textShadowRadius 因 RN 有内置缺省值，无需补齐，不进此表
const ShorthandDefaultMap = {
  border: {
    borderWidth: 3
  },
  'border-top': {
    borderTopWidth: 3
  },
  'border-right': {
    borderRightWidth: 3
  },
  'border-bottom': {
    borderBottomWidth: 3
  },
  'border-left': {
    borderLeftWidth: 3
  },
  'text-shadow': {
    textShadowColor: '"#000"'
    // textShadowOffset.height 的「width 存在才补 0」由既有 fallback 处理，不并入此表
    // textShadowRadius 由 RN 内置缺省值（0）承接，不补
  }
  // text-decoration / flex-flow 暂不配置，与 RN 默认一致
}
```

运行时（`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`）的镜像表，结构相同，值不带 CSS quote：

```ts
const runtimeShorthandDefaultMap: Record<string, Record<string, any>> = {
  border: {
    borderWidth: 3
  },
  borderTop: {
    borderTopWidth: 3
  },
  // ... 其它单边
  textShadow: {
    textShadowColor: '#000'
  }
}
```

> **为什么不直接用「CSS initial value 表」**：CSS initial value 是规范概念（`border-width: medium` / `text-shadow-color: currentColor` 等），需要做 RN 等价映射（`medium` → `3` / `currentColor` → `#000`）。映射逐条不一致，所以表里存 RN 上的最终值而非原始 initial value。
>
> 此外只补 RN **没有**内置缺省值的槽位：`borderColor`（RN 默认黑色）、`textShadowRadius`（RN 默认 0）实测有内置缺省值，补齐冗余，不进表；`borderWidth` 缺省 RN 是 0、与 CSS `medium`（约 3px）不一致，需要补 `3` 才符合预期。`border-style: none` 这条不是「补齐」而是「整体短路」，语义不同，单独由 border 特定处理表达。

### 通用补齐算法

只做一件事：扫描已展开结果，把配置表中缺省的槽位补上。始终返回数组（不引入短路语义）。

复用主循环已维护的 `used` map（key 是展开后的目标 prop 名，如 `borderWidth` / `textShadowColor` / `textShadowOffset.width`）判断槽位是否被占用，无需重新扫描结果数组：

```js
// 编译期：formatUnorderedAbbreviation 末尾追加调用，used 即主循环内的占用记录
const applyShorthandDefaults = (cssMap, prop, used) => {
  const defaults = ShorthandDefaultMap[prop]
  if (!defaults) return cssMap

  // 槽位未被 used 标记则追加补齐值
  for (const target in defaults) {
    if (!used[target]) {
      pushAbbreviationValue(cssMap, target, defaults[target])
    }
  }

  return cssMap
}

// formatUnorderedAbbreviation 末尾改为：
//   return applyShorthandDefaults(cssMap, prop, used)
```

要点：

- **`applyShorthandDefaults` 只补齐、始终返回数组**：border 的「styleProp 缺省 → 整体短路」不在这里处理，避免双返回类型与短路分支语义。
- **直接用 `used[target]` 判断**：`used` 的 key 就是完整目标 prop 名（含 `textShadowOffset.width` 这类 dot 路径），比重新扫描 `cssMap` + dot 主键聚合更简单也更精确 —— 后者会把 `textShadowOffset.width` 与 `.height` 聚到同一主键，误判其中一个已写就跳过另一个。
- **`textShadowOffset.height` 的 fallback** 保留在 `formatUnorderedAbbreviation` 原位置（不并入通用表），因为它有「width 存在才补 height」的条件依赖，超出无条件补齐范围。
- **缺省值不走 `global.__formatValue`**：直接以原始 JS 值（number / string）写入，与现有 `border` 短路写 `0` 的方式一致。

### border 特定短路

border「整体短路为 `border*Width: 0`」语义**不进通用补齐表**，由 `formatBorder` / 运行时 border 分支处理。编译期与运行时走**同一条流程**，分两步：

**第一步 · 入口短路**：只特判最高频的两种整体写法，在展开之前拦截：

| 入口短路 | 判定 |
| --- | --- |
| `border: none` | `value === 'none'` |
| `border: 0` | `value === '0'`（运行时再加 number `0`，覆盖 `style={{ border: 0 }}`） |

**第二步 · 展开后短路**：其余写法照常展开，然后统一判断 `borderStyle` 槽位 ——「不存在」或「值为 `none`」就整体短路，丢弃补齐结果：

```js
// formatBorder 内：cssMap = formatUnorderedAbbreviation + applyShorthandDefaults 后的数组
const styleEntry = cssMap.find(item => item.prop === 'borderStyle')
if (!styleEntry || styleEntry.value === 'none') {
  // borderStyle 缺省（border: 2px / 0px / red）或显式 none（border: 1px none red）
  // → 等价 border-style: none → 整体短路，丢弃 width 补齐结果
  return { prop: widthProp, value: 0 }
}
return cssMap
```

这条统一判断覆盖了原先要靠入口正则特判的所有场景：

| 写法 | 走哪步 | 结果 |
| --- | --- | --- |
| `border: none` | 入口短路 | `border*Width: 0` |
| `border: 0` / number `0` | 入口短路 | `border*Width: 0` |
| `border: 0px` / `0rpx` / `2px` / `red` | 展开后 borderStyle 缺省 | `border*Width: 0` |
| `border: 1px none red` | 展开后 borderStyle === `none` | `border*Width: 0` |

**关键前提**：为了让 `border: 1px none red` 的 `none` 不在展开主循环里被判为 invalid token 触发 warn，需要把 `none` 纳入 borderStyle 槽位的合法值，使其作为 `borderStyle: 'none'` 被收集：

- 运行时：`borderStyleMap` 增加 `none: true`（见前文）。
- 编译期：`getVerifiedProp` 对 `Style` 槽位的 token 判定，除 `SUPPORTED_PROP_VAL_ARR['border-style']`（`solid/dotted/dashed`）外，额外接受 `none`（仅在 border shorthand 展开上下文，不影响 `border-style` 长属性校验）。

> 注意顺序：`applyShorthandDefaults` 会先补上 `borderWidth: 3`，第二步短路判断在补齐之后；borderStyle 缺省或为 none 时整段丢弃、返回 `{ widthProp: 0 }`，补齐的 width 不会泄漏到短路结果中。

### 编译期改造

文件：`packages/webpack-plugin/lib/platform/style/wx/index.js`

1. 新增 `ShorthandDefaultMap`（纯补齐表）与 `applyShorthandDefaults`（只补齐、始终返回数组）。
2. `formatUnorderedAbbreviation` 末尾改为 `return applyShorthandDefaults(cssMap, prop, used)`（`used` 是主循环内已维护的占用记录）。`text-shadow` / `text-decoration` / `flex-flow` 已经走 `formatUnorderedAbbreviation`，自动获得通用补齐能力；border 也走同一条路径。
3. `getVerifiedProp` 对 `Style` 槽位额外接受 `none`（仅 border shorthand 展开上下文），使 `border: 1px none red` 的 `none` 作为 `borderStyle: 'none'` 被收集而非触发 invalid warn。
4. `formatBorder` 承接 border 特定短路（入口 `none` / `0` + 展开后 borderStyle 缺省或 === none）：

```js
const formatBorder = ({ prop, value, selector }, { mode }) => {
  value = value.trim()
  // border:        ['borderWidth',     'borderStyle', 'borderColor']
  // border-top:    ['borderTopWidth',  'borderStyle', 'borderColor'] ...
  const widthProp = AbbreviationMap[prop][0]

  // 入口短路：只特判最高频的整体 none / 0
  if (value === 'none' || value === '0') {
    return { prop: widthProp, value: 0 }
  }

  const cssMap = formatUnorderedAbbreviation({ prop, value, selector }, { mode })
  // 单 token var() 兜底：formatUnorderedAbbreviation 直接返回 { prop, value }，原样透传不补不短路
  if (!Array.isArray(cssMap)) return cssMap

  // 展开后短路：borderStyle 缺省 或 显式 none → 等价 border-style: none → 整体短路
  // 覆盖 border: 2px / 0px / red（缺省）与 border: 1px none red（显式 none）
  // 注意 cssMap 此时已被 applyShorthandDefaults 补过 borderWidth，短路时整段丢弃、补齐结果不泄漏
  const styleEntry = cssMap.find(item => item.prop === 'borderStyle')
  if (!styleEntry || styleEntry.value === 'none') {
    return { prop: widthProp, value: 0 }
  }

  return cssMap
}
```

注意：

- `widthProp` 直接取 `AbbreviationMap[prop][0]`（原数据，不再依赖已删除的 `shortCircuit` 字段）。
- 展开后短路放在 `formatBorder` 而非 `applyShorthandDefaults`：它是 border 专有语义，且需要对补齐后的结果再判断一次，不应污染只负责补齐的通用机制。
- `formatUnorderedAbbreviation` 在「单 token 且为 `var()`」时仍直接返回 `{ prop, value }` 兜底，`Array.isArray` 分流后原样透传 —— `var()` 会在运行时被 `transformVar` 替换为字面值后再次进入运行时分支，到时再补 / 短路。
- `formatCompositeVal` 链路（`border-width` / `border-color` / `border-radius` 四值简写）不经过 `formatUnorderedAbbreviation`，不受通用补齐影响。

### 运行时改造

文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

1. 新增 `runtimeShorthandDefaultMap`（纯补齐表）与 `applyRuntimeShorthandDefaults`（只补齐、始终返回数组）。
2. `expandUnorderedAbbreviation` 末尾改为 `return applyRuntimeShorthandDefaults(key, result, used)`（`used` 是主循环内已维护的占用记录），返回类型仍是 `Array`。调用侧 `transformShorthand` 直接使用展开结果，不再二次调用。
3. `transformShorthand` 中：
   - **border 分支前置到顶部 `typeof value !== 'string'` 检查之前**，因为 inline `style={{ border: 0 }}` 的 `value` 是 number `0`，会被通用 typeof 检查 `continue` 掉，等同失效。这是 inline style 与 class style 的关键差异：class 走 `formatBorder` 时永远是字符串（CSS 解析产物），runtime inline style 可能是 number。
   - border 短路与编译期 `formatBorder` 同流程：入口特判 `none` / `0`，展开后判断 `borderStyle` 缺省或 === none 再短路。
   - 其它简写走 `expandUnorderedAbbreviation` → `applyRuntimeShorthandDefaults`，得到的数组直接写入。

```ts
// used 即 expandUnorderedAbbreviation 主循环内的占用记录，key 是完整目标 prop 名
function applyRuntimeShorthandDefaults (
  key: string,
  pairs: Array<[string, any]>,
  used: Record<string, boolean>
): Array<[string, any]> {
  const defaults = runtimeShorthandDefaultMap[key]
  if (!defaults) return pairs

  for (const target in defaults) {
    if (!used[target]) {
      pushExpandedPair(pairs, target, defaults[target])
    }
  }

  return pairs
}

// transformShorthand —— border 只在公共链路两端各加一个最小 hook，其余完全复用
for (const key of shorthandKeys) {
  const value = styleObj[key]

  // border 入口短路：必须前置（要在 typeof string 检查前处理 number 0）
  // +value === 0 同时覆盖 number 0、string '0'；'0px' 等带单位写法 +value 是 NaN 不会误命中
  // 命中即写完跳过，未命中 fall through 走公共链路
  if (hasOwn(borderShorthandMap, key) && (+value === 0 || value === 'none')) {
    const widthProp = runtimeAbbreviationMap[key][0]
    delete styleObj[key]
    // 强制写入 0：「清除边框」是用户的最终意图，覆盖任何已存在的 borderWidth 长属性
    styleObj[widthProp] = 0
    continue
  }

  // —— 以下为公共链路（与 textDecoration / flexFlow / textShadow / 四值简写共用）——

  if (typeof value !== 'string') continue
  const values = parseValues(value)
  const props = runtimeAbbreviationMap[key]
  if (!props) continue
  if (hasOwn(runtimeCompositeStyleMap, key) && values.length === 1) continue

  let expandedValues = values
  if (hasOwn(runtimeCompositeStyleMap, key)) expandedValues = expandCompositeValues(values)

  let pairs: Array<[string, any]>
  if (hasOwn(runtimeUnorderedAbbreviationMap, key)) {
    // expandUnorderedAbbreviation 末尾已内部调用 applyRuntimeShorthandDefaults 补齐
    pairs = expandUnorderedAbbreviation(key, values)
  } else {
    pairs = expandAbbreviation(expandedValues, props)
  }

  // border 展开后短路：borderStyle 缺省 或 === none → 整体短路，丢弃补齐结果
  // 覆盖 border: 2px / 0px / red（缺省）与 border: 1px none red（显式 none，被 borderStyleMap 收集）
  if (hasOwn(borderShorthandMap, key)) {
    const styleEntry = pairs.find(([p]) => p === 'borderStyle')
    if (!styleEntry || styleEntry[1] === 'none') {
      const widthProp = runtimeAbbreviationMap[key][0]
      delete styleObj[key]
      // 强制写入 0：「清除边框」是用户的最终意图，覆盖任何已存在的 borderWidth 长属性
      styleObj[widthProp] = 0
      continue
    }
  }

  delete styleObj[key]
  for (const [prop, val] of pairs) {
    if (!hasOwn(styleObj, prop)) styleObj[prop] = val
  }
}
```

要点：

- **border 分支必须前置到 `typeof value !== 'string'` 之前**。`style={{ border: 0 }}` 在 JS 端 `value` 是 number `0`，若走通用 `typeof` 检查会被直接 `continue` 掉，`0` 短路分支永远走不到，等同失效。class 走 `formatBorder` 时永远是字符串（CSS 解析产物），runtime inline style 可能是 number。
- **短路流程与编译期 `formatBorder` 对齐**：入口特判 `none` / `0`，展开后判 `borderStyle` 缺省或 === none，行为口径一致。
- **仅 border 分支放开 number 兜底，且仅识别 number `0`**。其它简写（`margin` / `padding` / `borderRadius` 等）继续用 `typeof value !== 'string' continue` —— 用户写 `{ margin: 8 }` 时 RN 直接支持，本来就不需要展开。
- **缺省值不走 `global.__formatValue`**：直接以原始 JS 值写入（`3` 是 number，`'#000'` 是 string）。
- **`var()`**：运行时进入 `transformShorthand` 前已被 `transformVar` 替换为字面值，补齐 / 短路发生在字面值上，行为与编译期对齐。

### 目标行为对照表

| 输入 | 目标输出 | 来源 |
| --- | --- | --- |
| `border: 1px solid red` | `{ borderWidth: 1, borderStyle: 'solid', borderColor: 'red' }` | 维持现有展开 |
| `border: solid red` | `{ borderStyle: 'solid', borderColor: 'red', borderWidth: 3 }` | width 槽位通用补齐 |
| `border: solid` | `{ borderStyle: 'solid', borderWidth: 3 }` | width 槽位通用补齐；color 由 RN 内置缺省承接 |
| `border: 2px` | `{ borderWidth: 0 }` | 展开后 borderStyle 缺省 → 短路（整段丢弃补齐结果） |
| `border: red` | `{ borderWidth: 0 }` | 同上 |
| `border-top: red` | `{ borderTopWidth: 0 }` | 同上，短路目标 `AbbreviationMap['border-top'][0]` 走单边 |
| `border-top: solid` | `{ borderStyle: 'solid', borderTopWidth: 3 }` | width 通用补齐到单边；color 由 RN 内置缺省承接 |
| `border: none` | `{ borderWidth: 0 }` | 入口特判 `none` 短路 |
| `border: 1px none red` | `{ borderWidth: 0 }` | 展开后 borderStyle === none → 短路（`none` 被收集为 borderStyle token） |
| `border: 0` | `{ borderWidth: 0 }` | 入口特判纯 `0` 短路 |
| `border: 0px` / `0rpx` | `{ borderWidth: 0 }` | 展开后 borderStyle 缺省 → 短路，结果同上 |
| `style={{ border: 0 }}`（number） | `{ borderWidth: 0 }` | 运行时 number 0 入口短路 |
| `border-top: 0` | `{ borderTopWidth: 0 }` | 入口特判纯 `0` 短路（单边） |
| `text-shadow: 1px 2px` | `{ textShadowOffset: {width:1,height:2}, textShadowColor: '#000' }` | color 通用补齐；radius 由 RN 内置缺省承接 |
| `text-shadow: 1px 2px 3px` | `{ textShadowOffset: {width:1,height:2}, textShadowRadius: 3, textShadowColor: '#000' }` | color 通用补齐 |
| `text-shadow: red 1px 2px` | `{ textShadowOffset: {width:1,height:2}, textShadowColor: 'red' }` | color 已给出不补；radius 由 RN 内置缺省承接 |
| `text-shadow: 1px` | `{ textShadowOffset: {width:1,height:0}, textShadowColor: '#000' }` + warn | offset.height 沿用既有 fallback；color 通用补齐 |
| `border: var(--x)` | `{ border: 'var(--x)' }`（编译期单 var 兜底）；运行时由 `transformVar` 替换为字面值后再走通用流程 | — |

### 扩展性

新增简写或调整缺省值时，只改 `ShorthandDefaultMap` / `runtimeShorthandDefaultMap`，主流程不动。例如未来若要给 `text-decoration` 补齐 `textDecorationStyle: 'solid'`：

```js
// 编译期
ShorthandDefaultMap['text-decoration'] = {
  textDecorationStyle: '"solid"'
}
// 运行时
runtimeShorthandDefaultMap.textDecoration = {
  textDecorationStyle: 'solid'
}
```

无须改动 `formatUnorderedAbbreviation` / `expandUnorderedAbbreviation` / `applyShorthandDefaults` / `applyRuntimeShorthandDefaults`。

### 行为变更与兼容性

通用机制下，新增缺省补齐属于 **breaking 行为**，原先依赖宽松解析的写法会变化：

| 旧行为 | 新行为 | 受影响场景 |
| --- | --- | --- |
| `border: 2px` → `{ borderWidth: 2 }` | `{ borderWidth: 0 }` | 漏写 style 时旧行为能渲染边框，新行为按规范不渲染 |
| `border: red` → `{ borderColor: 'red' }` | `{ borderWidth: 0 }` | 漏写 style 且只指定颜色时新行为按规范不渲染 |
| `border-top: red` → `{ borderColor: 'red' }` | `{ borderTopWidth: 0 }` | 同上 |
| `border: solid` → `{ borderStyle: 'solid' }` | `{ borderStyle: 'solid', borderWidth: 3 }` | 旧行为 RN 上无 width 不渲染，新行为补 `3` 后按规范渲染 |
| `text-shadow: 1px 2px` 缺 color | 加 `textShadowColor: '#000'` | 旧行为依赖 RN 默认 color（跨端不稳定），新行为约定黑色 |
| `text-shadow: 1px 2px 3px` 缺 color | 加 `textShadowColor: '#000'` | 同上 |

> `borderColor` / `textShadowRadius` RN 有内置缺省值，不补齐，行为不变，不在 breaking 范围。

需要在 changelog 中显式列出，提醒「依赖宽松写法的页面应改为完整 `border: 1px solid red` 三段写法；text-shadow 缺省 color 现在固定为 `#000`」。`.agents/skills/mpx2rn/references/rn-style-reference.md` 与 `docs-vitepress/guide/rn/style.md` 中 `border` / `text-shadow` 章节同步加「缺省值补齐」说明，并附 `ShorthandDefaultMap` 表。

### 测试补充

`packages/webpack-plugin/test/platform/wx/style/style-rn.spec.js` 内 `describe('Unordered shorthand')` 增加：

```js
test('should fill border-width default when only style is given', () => {
  const css = '.a { border: solid; } .b { border: solid red; } .c { border-top: solid; }'
  const config = createConfig()
  const result = getClassMap({ content: css, filename: 'test.css', ...config })

  // style 存在 → 补 width(3)；color 由 RN 内置缺省承接，不补
  expect(result.a).toEqual({ borderStyle: '"solid"', borderWidth: 3 })
  expect(result.b).toEqual({ borderStyle: '"solid"', borderColor: '"red"', borderWidth: 3 })
  expect(result.c).toEqual({ borderStyle: '"solid"', borderTopWidth: 3 })
  expect(config.warn).not.toHaveBeenCalled()
  expect(config.error).not.toHaveBeenCalled()
})

test('should short-circuit to border-width: 0 when style slot is empty', () => {
  const css = '.a { border: 2px; } .b { border: red; } .c { border-top: red; } .d { border: 2px red; }'
  const config = createConfig()
  const result = getClassMap({ content: css, filename: 'test.css', ...config })

  expect(result.a).toEqual({ borderWidth: 0 })
  expect(result.b).toEqual({ borderWidth: 0 })
  expect(result.c).toEqual({ borderTopWidth: 0 })
  expect(result.d).toEqual({ borderWidth: 0 })
  expect(config.warn).not.toHaveBeenCalled()
  expect(config.error).not.toHaveBeenCalled()
})

test('should short-circuit zero / none border shorthand', () => {
  const css = `
    .a { border: 0; }
    .b { border: 0px; }
    .c { border: 0rpx; }
    .d { border-top: 0; }
    .e { border: none; }
    .f { border: 1px none red; }
  `
  const config = createConfig()
  const result = getClassMap({ content: css, filename: 'test.css', ...config })

  // 纯 0 / none（.a/.d/.e）走入口短路；带单位 0px/0rpx（.b/.c）走 borderStyle 缺省短路；
  // 混合 none（.f）none 被收集为 borderStyle:'none'，走 borderStyle === none 短路 —— 不报 warn
  expect(result.a).toEqual({ borderWidth: 0 })
  expect(result.b).toEqual({ borderWidth: 0 })
  expect(result.c).toEqual({ borderWidth: 0 })
  expect(result.d).toEqual({ borderTopWidth: 0 })
  expect(result.e).toEqual({ borderWidth: 0 })
  expect(result.f).toEqual({ borderWidth: 0 })
  expect(config.warn).not.toHaveBeenCalled()
  expect(config.error).not.toHaveBeenCalled()
})

test('should fill text-shadow color default', () => {
  const css = `
    .a { text-shadow: 1px 2px; }
    .b { text-shadow: 1px 2px 3px; }
    .c { text-shadow: red 1px 2px; }
  `
  const config = createConfig()
  const result = getClassMap({ content: css, filename: 'test.css', ...config })

  // color=currentColor，RN 无该概念，约定为 #000 补齐；radius 由 RN 内置缺省承接，不补
  expect(result.a).toEqual({
    textShadowOffset: { width: '1', height: '2' },
    textShadowColor: '"#000"'
  })
  expect(result.b).toEqual({
    textShadowOffset: { width: '1', height: '2' },
    textShadowRadius: '3',
    textShadowColor: '"#000"'
  })
  expect(result.c).toEqual({
    textShadowOffset: { width: '1', height: '2' },
    textShadowColor: '"red"'
  })
  expect(config.error).not.toHaveBeenCalled()
})
```

同时需要**调整现有用例**：

```js
// 原 'should accept partial border shorthand without all three slots'
// .a: border: solid       → 期望 { borderStyle, borderWidth: 3 }（color 不补，RN 内置缺省）
// .b: border: 2px         → 期望 { borderWidth: 0 }（style 缺省 = none → 短路）
// .c: border-top: red     → 期望 { borderTopWidth: 0 }（同上）
```

运行时部分核心用例（仍按现有运行时测试方式覆盖）：

1. `style={{ border: 'solid red' }}` → `{ borderStyle: 'solid', borderColor: 'red', borderWidth: 3 }`
2. `style={{ borderTop: 'solid' }}` → `{ borderStyle: 'solid', borderTopWidth: 3 }`（width 补齐，color 不补）
3. `style={{ border: '2px' }}` → `{ borderWidth: 0 }`
4. `style={{ border: 'red' }}` → `{ borderWidth: 0 }`
5. `style={{ border: 'solid red', borderWidth: 5 }}` → `borderWidth` 仍为 `5`（普通展开走「长属性不覆盖」原则）
6. `style={{ border: 0 }}`（number 0）→ `{ borderWidth: 0 }` —— **必测**，覆盖 inline style 写 number 的高频写法，验证 border 分支前置到 `typeof string` 检查之前
7. `style={{ border: '0' }}` / `style={{ border: '0px' }}` → `{ borderWidth: 0 }`
8. `style={{ borderTop: 0 }}` → `{ borderTopWidth: 0 }`
9. `style={{ border: 0, borderWidth: 5 }}` → `{ borderWidth: 0 }` —— **必测**，验证短路结果**强制写入**、覆盖显式 `borderWidth`（与普通展开的「长属性不覆盖」原则相反，这是 border 短路独有语义）
10. `style={{ textShadow: '1px 2px 3px' }}` → `{ textShadowOffset, textShadowRadius: 3, textShadowColor: '#000' }`
11. `style={{ textShadow: '1px 2px 3px', textShadowColor: 'red' }}` → `textShadowColor` 仍为 `red`（长属性不覆盖原则，验证 `applyRuntimeShorthandDefaults` 不破坏覆盖优先级）

### 与现有能力的关系（补充）

- **CSS 变量**：编译期 `border: var(--x)` 单 token 仍原样返回；多 token 含 `var()` 写法，`var()` 会在槽位匹配中占位，若 `var()` 命中 borderStyle 槽位则不触发短路。运行时由 `transformVar` 前置替换，缺省补齐发生在字面值上，行为可预期。
- **`calc()` / `env()`**：仅出现在 width 槽位，会被 `verifyValues` 视为 length，正常占位，不触发短路。
- **四值类简写（`border-width` / `border-color` / `border-radius`）**：不进入 `formatBorder`，不受缺省补齐影响。
- **`hairlineWidth`**：作为 length 合法值占用 width 槽位，与数字一致。

## 与现有能力的关系

### CSS 变量

编译期目前对单个 `var()` 简写会原样返回：

```js
if (values.length === 1 && cssVariableExp.test(value)) {
  return { prop, value }
}
```

该逻辑保持不变。`border: var(--border)` 这种无法在编译期判断内部 token 的写法继续交给运行时处理。

运行时如果变量解析后得到 `red solid 1px`，`transformShorthand` 会按新逻辑正确展开。

### `calc()` / `env()`

编译期 `verifyValues` 已支持 `calc()` / `env()` 的合法性判断，方案不改变。

运行时的处理顺序当前是：

1. `transformEnv`
2. `transformPercent`
3. `transformCalc`
4. `transformShorthand`

因此 `border: calc(1px + 1px) solid red` 在运行时进入 shorthand 时，`calc()` 已有机会被处理为数字。若 calc 位于未被收集的简写内部，当前运行时本身也无法深入处理，本方案不额外扩大范围。

### 长属性覆盖优先级

保持当前行为：

```js
if (!hasOwn(styleObj, prop)) styleObj[prop] = val
```

即：

```js
{
  border: 'red solid 1px',
  borderColor: 'blue'
}
```

最终 `borderColor` 仍为 `blue`。

## 测试方案

### 编译期单测

文件：`packages/webpack-plugin/test/platform/wx/style/style-rn.spec.js`

新增 `describe('Unordered shorthand')`，覆盖核心行为：

```js
test('should expand unordered border shorthand', () => {
  const css = '.box { border: red solid 1px; }'
  const result = getClassMap({ content: css, filename: 'test.css', ...createConfig() })
  expect(result.box).toEqual({
    borderColor: '"red"',
    borderStyle: '"solid"',
    borderWidth: '1'
  })
})
```

建议补充：

1. `border: solid #f00 2px`
2. `border-top: red solid 1px`
3. `border-left: dashed 2px blue`
4. `border: none`
5. `border-top: none`
6. `text-decoration: red underline solid`
7. `text-decoration: underline line-through red`
8. `flex-flow: wrap row`
9. `text-shadow: red 1px 2px 3px`
10. `text-shadow: 1px 2px red`
11. 重复同类型 token：`border: 1px 2px solid red` 中第二个长度没有可匹配的未占用属性，编译期沿用 invalid warn，运行时静默跳过。

### 运行时单测

如果当前仓库已有 RN runtime 单测入口，建议直接对 `useTransformStyle` 增加 hook 测试；如果没有轻量 hook 测试环境，可以先将新增的纯函数导出为测试专用能力不太合适，建议优先通过组件侧或已有 runtime 测试方式覆盖。

核心用例：

1. `style={{ border: 'red solid 1px' }}`
2. `style={{ borderTop: 'red solid 1px' }}`
3. `style={{ textDecoration: 'red underline solid' }}`
4. `style={{ flexFlow: 'wrap row' }}`
5. `style={{ textShadow: 'red 1px 2px 3px' }}`
6. 显式长属性不被覆盖：`{ border: 'red solid 1px', borderColor: 'blue' }`
7. 无法识别 token 静默跳过，合法 token 仍写入展开属性。

### 文档与 Skill

该变更会改变 RN 用户可用样式写法，按仓库约束需要同步：

1. `docs-vitepress/guide/rn/style.md`
   - 将 `border` / `border-top` 等章节中“值按固定顺序分别赋值”的描述改为“按值类型识别，顺序不敏感”。
   - 示例补充 `border: red solid 1px`。
2. `.agents/skills/mpx2rn/references/rn-style-reference.md`
   - 简写属性支持章节同步说明 `border`、单边 `border-*`、`text-decoration`、`flex-flow` 支持 CSS 合法无序写法。

## 实施步骤

1. 修改编译期 `formatAbbreviation`
   - 新增 `UnorderedAbbreviationMap`。
   - 新增 `formatUnorderedAbbreviation`。
   - 将 `text-decoration` 从单独预处理的 `formatTextDecoration` 迁移到 `formatUnorderedAbbreviation`，line token 在主循环中归一化。
   - 抽出 `pushAbbreviationValue`，减少重复代码。
   - 保持四值类简写原逻辑不变。

2. 修改运行时 `transformShorthand`
   - 新增运行时 token 类型判断 map。
   - 新增 `runtimeUnorderedAbbreviationMap`。
   - 新增 `expandUnorderedAbbreviation`。
   - 保留现有 `none`、四值类展开、长属性不覆盖逻辑。

3. 落地通用「简写缺省值补齐」机制
   - 新增 `ShorthandDefaultMap`（编译期）/ `runtimeShorthandDefaultMap`（运行时）**纯补齐表**：`{ [target]: defaultValue }`，不含短路语义。
   - 新增 `applyShorthandDefaults` / `applyRuntimeShorthandDefaults`：只做补齐、始终返回数组，复用主循环的 `used` map（key 为完整目标 prop 名）判断槽位是否被占用，无需重新扫描结果。
   - `formatUnorderedAbbreviation` / `expandUnorderedAbbreviation` 末尾调用上述函数（传入 `used`），所有走通用展开的简写（border / text-shadow / text-decoration / flex-flow）自动获得缺省补齐能力。
   - border 特定短路由 `formatBorder` / 运行时 border 分支承接，不进通用表，编译期与运行时同流程：
     - 入口特判 `none` / `0`（最高频整体写法捷径；运行时 `0` 含 number `0`）
     - 展开后判断 `borderStyle` 缺省或 === none → 整体短路返回 `{ widthProp: 0 }`（丢弃补齐结果）；覆盖 `border: 2px` / `0px` / `red`（缺省）与 `border: 1px none red`（显式 none）
   - 让 `none` 作为 borderStyle 槽位合法 token 被收集，避免混合 `none` 在主循环触发 invalid warn、并使「borderStyle === none」分支可达：
     - 运行时 `borderStyleMap` 加 `none: true`
     - 编译期 `getVerifiedProp` 对 `Style` 槽位额外接受 `none`（仅 shorthand 展开上下文）
   - 运行时 `transformShorthand` 把 border 分支前置到顶部 `typeof value !== 'string'` 检查之前，处理 inline `style={{ border: 0 }}` 的 number `0`。
   - 新增简写或调整缺省值时只改 `ShorthandDefaultMap` / `runtimeShorthandDefaultMap`，主流程不动。

4. 补充单测
   - 编译期测试优先覆盖，因为 class 样式是主要路径。
   - 运行时按现有测试基础补充最小核心用例。

5. 同步文档和 skill
   - 更新 `docs-vitepress/guide/rn/style.md`，border 章节加缺省补齐说明。
   - 更新 `.agents/skills/mpx2rn/references/rn-style-reference.md`，同步缺省补齐行为。
   - changelog 显式列出 `border: 2px` / `border: red` 的语义变更（旧版本可以渲染边框，新版本短路为 0）。

6. 同步运行时 dist
   - 修改 `utils.tsx` 后执行 `npm run build -w @mpxjs/webpack-plugin`。
   - 让 `packages/webpack-plugin/lib/runtime/components/react/dist/**` 由构建产物同步生成。

7. 校验
   - 运行相关 eslint。
   - 运行 `packages/webpack-plugin/test/platform/wx/style/style-rn.spec.js` 相关 jest。
   - 调整原 `should accept partial border shorthand without all three slots` 用例的期望（见上文）。

## 风险与边界

1. 运行时轻量颜色识别需与现有 `isColorValue` 保持一致，否则可能出现编译期和运行时差异。
2. `text-decoration-style` / `text-decoration-color` 在 Android / Harmony 当前受限，编译期仍应通过 `verifyProps` 过滤；运行时无法可靠知道组件平台差异时，可以继续尽力展开，由 RN 或现有运行时行为承接。
3. `calc()` 位于简写内部时，运行时当前不会深入收集简写 token 内的 calc keyPath，本方案不单独解决。
4. 重复同类型 token 通过 `used` 避免覆盖已匹配属性；编译期沿用 invalid warn，运行时按静默跳过处理。
5. **简写缺省补齐是 breaking 行为**：
   - `border: 2px` / `border: red` / `border-top: red`：旧 → 输出对应 width / color；新 → 经 border 特定短路（styleProp 缺省）整体短路为 `border*Width: 0`。
   - `border: solid`：旧 → 只输出 `borderStyle`（RN 无 width 不渲染）；新 → 补 `borderWidth: 3`，渲染结果与浏览器一致。
   - `text-shadow: 1px 2px` / `1px 2px 3px`：旧 → 缺 `textShadowColor`（运行时表现依赖 RN 默认）；新 → 补 `'#000'`，跨端稳定。
   - 需要在 changelog 与文档（`docs-vitepress/guide/rn/style.md` / `.agents/skills/mpx2rn/references/rn-style-reference.md`）显式提示。
6. **只补 RN 没有内置缺省值的槽位**：`borderColor`（RN 默认黑色）、`textShadowRadius`（RN 默认 0）实测有内置缺省值，补齐冗余，不进表；`borderWidth` 在 RN 缺省为 0，与 CSS `medium`（约 3px）不一致，必须补 `3`；`textShadowColor` 的 CSS `currentColor` 在 RN 无对应，补 `'#000'`。这些值都存放在 `ShorthandDefaultMap` / `runtimeShorthandDefaultMap`，后续若 RN 行为变化或出现更合适等价值，按表配置改即可，不动主流程。
7. **补齐策略两端必须镜像**：编译期与运行时的 `ShorthandDefaultMap` / `runtimeShorthandDefaultMap` 必须槽位一致（仅 CSS quote 形式不同），避免 class 与 inline 输出分叉。当前不补的槽位（`borderColor` / `textShadowRadius` 走 RN 内置缺省、`text-shadow-offset.width` 必填、`flex-direction` 等与 RN 默认一致）两端都保持不补。
8. **补齐先行、border 特定短路整段丢弃**：`applyShorthandDefaults` 会先补上 `borderWidth: 3`，随后 `formatBorder` / 运行时 border 分支检查 `borderStyle` 是否缺省。`border: 2px`（无 style token）补齐后 borderStyle 仍缺省 → 整段丢弃、返回 `{ borderWidth: 0 }`，补齐的 width **不会泄漏**。这与 CSS「border-style: none 则整体不渲染，无需 width」语义一致。
9. **普通展开走「长属性不覆盖」原则；border 短路走「强制写入」**：
   - 普通展开写回 `if (!hasOwn(styleObj, prop)) styleObj[prop] = val`，`{ border: 'solid red', borderColor: 'blue' }` 中 `borderColor` 仍为 `'blue'`、`{ border: 'solid red', borderWidth: 5 }` 中 `borderWidth` 仍为 `5`。
   - border 入口短路（`border: 0` / `border: none`）和展开后短路（`borderStyle` 缺省或 === none）写回是 `styleObj[widthProp] = 0` 直接强制覆盖，因为「清除边框」是用户的最终意图，应当覆盖任何显式 `borderWidth`：`{ border: 0, borderWidth: 5 }` 最终为 `{ borderWidth: 0 }`。
   - 这条非对称是 border 短路独有，与 CSS「shorthand 写在长属性之后会覆盖长属性」的源码顺序敏感语义一致 —— RN 里 `style` 对象无法表达顺序，约定 border 短路（语义最强）始终胜出。
