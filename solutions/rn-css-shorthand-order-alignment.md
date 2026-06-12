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
  dashed: true
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

当前运行时已支持：

```ts
border: 'none' -> borderWidth: 0
```

建议保留现有判断，并继续覆盖 `borderTop` / `borderRight` / `borderBottom` / `borderLeft`：

```ts
if ((key === 'border' || key === 'borderTop' || key === 'borderRight' || key === 'borderBottom' || key === 'borderLeft') && value.trim() === 'none') {
  const prop = runtimeAbbreviationMap[key][0]
  delete styleObj[key]
  if (!hasOwn(styleObj, prop)) styleObj[prop] = 0
  continue
}
```

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

3. 补充单测
   - 编译期测试优先覆盖，因为 class 样式是主要路径。
   - 运行时按现有测试基础补充最小核心用例。

4. 同步文档和 skill
   - 更新 `docs-vitepress/guide/rn/style.md`。
   - 更新 `.agents/skills/mpx2rn/references/rn-style-reference.md`。

5. 同步运行时 dist
   - 修改 `utils.tsx` 后执行 `npm run build -w @mpxjs/webpack-plugin`。
   - 让 `packages/webpack-plugin/lib/runtime/components/react/dist/**` 由构建产物同步生成。

6. 校验
   - 运行相关 eslint。
   - 运行 `packages/webpack-plugin/test/platform/wx/style/style-rn.spec.js` 相关 jest。

## 风险与边界

1. 运行时轻量颜色识别需与现有 `isColorValue` 保持一致，否则可能出现编译期和运行时差异。
2. `text-decoration-style` / `text-decoration-color` 在 Android / Harmony 当前受限，编译期仍应通过 `verifyProps` 过滤；运行时无法可靠知道组件平台差异时，可以继续尽力展开，由 RN 或现有运行时行为承接。
3. `calc()` 位于简写内部时，运行时当前不会深入收集简写 token 内的 calc keyPath，本方案不单独解决。
4. 重复同类型 token 通过 `used` 避免覆盖已匹配属性；编译期沿用 invalid warn，运行时按静默跳过处理。
