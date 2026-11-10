# Mpx2RN useTransformStyle 运行时样式处理能力拉齐方案

## 背景

Mpx2RN 当前对 CSS 样式处理的支持分为两类：

1. **编译期**：`<style>` / class 样式由 `packages/webpack-plugin/lib/platform/style/wx/index.js` 处理，包含简写属性展开、`line-height` 换算、`font-family` 格式化等。
2. **运行时**：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx` 的 `useTransformStyle` 处理 CSS var、UnoCSS var、`env()`、`calc()`、百分比、`position: fixed`、`transform`、`boxShadow` 等。

来自 `wx:style`、CSS var fallback、运行时 data/computed 或 UnoCSS var 的样式值在编译期无法静态处理，导致运行时报错或表现不一致。

目标：在 `useTransformStyle` 中补齐与编译期等效的运行时样式处理能力，严格控制性能开销。

## 目标与约束

1. 支持 `style` / `wx:style` / CSS var / UnoCSS var 等运行时入口的样式处理能力拉齐。
2. 与编译期处理规则保持同口径。
3. 无需处理时不影响热路径性能。
4. 保持 React Hooks 调用顺序稳定。
5. 只做运行时样式对象转换，不改模板、loader、编译期样式规则。
6. 不尝试实现完整 CSS parser，复用 `parseValues` 轻量解析。
7. 运行时不做完整值校验，只做尽力处理。

## 处理能力概览

对比编译期 `packages/webpack-plugin/lib/platform/style/wx/index.js`，运行时缺失以下处理能力：

| 处理类型 | 对应 Transformer | 覆盖属性 |
| --- | --- | --- |
| 行高换算 | `transformLineHeight` | `lineHeight` 纯数字 → 百分比 |
| 字体族格式化 | `transformFontFamily` | `fontFamily` 去引号取首值 |
| flex 展开 | `transformFlex` | `flex` 多值/枚举 → `flexGrow`/`flexShrink`/`flexBasis` |
| 四值复合展开 | `transformShorthand` | `margin` / `padding` / `borderRadius` / `borderWidth` / `borderColor` |
| 顺序缩写展开 | `transformShorthand` | `border` / `borderTop/Right/Bottom/Left` / `flexFlow` / `textShadow` / `textDecoration` |
| 背景简写展开 | `transformBackground` | `background` → image/color/repeat/position/size |

说明：

1. `borderStyle` 多值不纳入，RN 不支持分别设置各方向 `borderStyle`。
2. `background` 只做简写展开，不处理长属性在具体组件中的应用。
3. `boxShadow` 已有 `transformBoxShadow`，`transform` 已有 `transformTransform`，不调整。

## 实现位置与处理顺序

文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

处理链路中的位置：

1. `traverseStyle(styleObj, [varVisitor, boxSizingVisitor, shorthandVisitor])`
2. CSS var / UnoCSS var 解析
3. `env()` 解析
4. 百分比解析
5. `calc()` 解析
6. `position` / stringify / boxShadow / transform
7. boxSizing 默认值处理
8. **`transformLineHeight(normalStyle)`**
9. **`transformFontFamily(normalStyle)`**
10. **`transformFlex(normalStyle)`**
11. **`transformShorthand(normalStyle, shorthandKeys)`**
12. **`transformBackground(normalStyle)`**

`boxSizingVisitor` 在 `traverseStyle` 阶段已通过 `boxSizingAffectingStyleMap` 检测到 `border`/`borderTop` 等简写 key，无需依赖展开后的长属性。

## transformLineHeight

与编译期 `formatLineHeight` 保持同口径：纯数字（如 `1.5`）转换为百分比（`150%`）。

```ts
function transformLineHeight (styleObj: Record<string, any>) {
  const value = styleObj.lineHeight
  if (typeof value === 'number' && value !== 0) {
    styleObj.lineHeight = `${Math.round(value * 100)}%`
  }
}
```

运行时 `lineHeight` 已支持百分比计算（`percentVisitor`），此处只补前置的纯数字→百分比转换。

## transformFontFamily

与编译期 `formatFontFamily` 保持同口径：去除引号，取逗号分隔后第一个值。RN 不支持多字体 fallback。

```ts
function transformFontFamily (styleObj: Record<string, any>) {
  const value = styleObj.fontFamily
  if (typeof value !== 'string') return
  const stripped = value.replace(/["']/g, '').trim()
  if (!stripped) return
  const values = parseValues(stripped, ',')
  styleObj.fontFamily = values[0].trim()
}
```

## transformFlex

独立的 flex 简写展开，与编译期 `formatFlex` 保持同口径：

1. `flex: none` → `flexGrow: 0, flexShrink: 0`
2. `flex: initial` → `flexGrow: 0, flexShrink: 1`
3. 单值及多值按序映射到 `flexGrow/flexShrink/flexBasis`（如 `flex: 1` → `flexGrow: 1, flexShrink: 1, flexBasis: 0`）

`flexGrow`/`flexShrink` 为纯数字直接转换，仅 `flexBasis` 通过 `global.__formatValue` 处理单位换算。展开属性低优先级，不覆盖已有同名属性。

```ts
function expandFlex (value: string): Array<[string, any]> | null {
  const values = parseValues(value)
  if (values.length === 0) return null
  if (values.length === 1) {
    if (values[0] === 'none') return [['flexGrow', 0], ['flexShrink', 0]]
    if (values[0] === 'initial') return [['flexGrow', 0], ['flexShrink', 1]]
    const num = +values[0]
    if (!isNaN(num) && num > 0) return null
  }
  const result: Array<[string, any]> = []
  let i = 0
  const isNum = (v: string) => !isNaN(+v)
  if (isNum(values[i])) { result.push(['flexGrow', +values[i++]]) } else { result.push(['flexGrow', 1]) }
  if (i < values.length && isNum(values[i])) { result.push(['flexShrink', +values[i++]]) } else { result.push(['flexShrink', 1]) }
  if (i < values.length) { if (values[i] !== 'auto') result.push(['flexBasis', global.__formatValue(values[i])]) } else { result.push(['flexBasis', 0]) }
  return result
}

function transformFlex (styleObj: Record<string, any>) {
  const value = styleObj.flex
  if (typeof value !== 'string') return
  const flexResult = expandFlex(value)
  if (!flexResult) return
  delete styleObj.flex
  for (const [prop, val] of flexResult) {
    if (!hasOwn(styleObj, prop)) styleObj[prop] = val
  }
}
```

## transformShorthand

### 抽象设计

通过数据驱动复用核心函数，按展开模式归类，处理四值复合展开和顺序缩写展开：

### 数据映射

```ts
const runtimeAbbreviationMap: Record<string, string[]> = {
  // 四值复合类（先按 CSS 四值规则展开，再按序映射）
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  borderRadius: ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'],
  borderWidth: ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'],
  borderColor: ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
  // 顺序缩写类（值按位置 1:1 映射）
  border: ['borderWidth', 'borderStyle', 'borderColor'],
  borderTop: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'],
  borderRight: ['borderRightWidth', 'borderRightStyle', 'borderRightColor'],
  borderBottom: ['borderBottomWidth', 'borderBottomStyle', 'borderBottomColor'],
  borderLeft: ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor'],
  flexFlow: ['flexDirection', 'flexWrap'],
  textShadow: ['textShadowOffset.width', 'textShadowOffset.height', 'textShadowRadius', 'textShadowColor'],
  textDecoration: ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor']
}

const runtimeCompositeStyleMap: Record<string, boolean> = {
  margin: true,
  padding: true,
  borderRadius: true,
  borderWidth: true,
  borderColor: true
}
```

### 核心函数

1. **`expandCompositeValues(values)`**：CSS 四值规则，输入 1-4 值，输出 4 值数组。
2. **`expandAbbreviation(values, props)`**：按位置映射到目标属性列表，支持 `prop.sub` 点路径（`textShadowOffset`），返回 `[propName, value][]`。展开后的 token 值通过 `global.__formatValue` 格式化。
3. **特殊前处理**（尽量薄）：`border: none` → `borderWidth: 0`。处理完后回到通用流程。

新增属性只需在 `runtimeAbbreviationMap` 加一条映射。

### 候选路径收集

在前置遍历中新增 `shorthandVisitor`，只收集顶层简写属性 key：

```ts
const shorthandKeys: string[] = []

function shorthandVisitor ({ key, keyPath }: VisitorArg) {
  if (keyPath.length === 1 && hasOwn(runtimeAbbreviationMap, key)) {
    shorthandKeys.push(key)
  }
}
```

`shorthandVisitor` 不根据当前值决定是否展开（值可能含未解析的 `var()` 等），只记录候选。`transformShorthand` 在所有前置处理完成后基于最终值决定展开。

### 优先级处理

展开属性低优先级：通过 `hasOwn(styleObj, prop)` 检查，展开后的属性不覆盖已有同名属性。

### 值格式化

展开后的每个 token 值调用 `global.__formatValue` 进行格式化（`rpx` → `px` 换算、数值类型转换等）。不再回流到 `calc/env/percent` 处理链路。对于 `textShadowOffset` 这类对象值，内部子属性也需格式化。

### 单值优化

对于 `margin`/`padding` 等 `runtimeCompositeStyleMap` 中的属性，单值时 RN 原生支持，跳过展开。

## transformBackground

独立的背景简写展开，与编译期 `checkBackgroundImage` 保持同口径：

1. `none` → `backgroundImage: 'none'` + `backgroundColor: 'transparent'`
2. `url(...)` / `linear-gradient(...)` → `backgroundImage`
3. 颜色值（`#`/`rgb(`/`rgba(`/命名色）→ `backgroundColor`
4. `repeat` / `no-repeat` 等枚举 → `backgroundRepeat`
5. position token → `backgroundPosition`，`center` 归一为 `50%`
6. `/` 后的 size token → `backgroundSize`
7. 不支持逗号分隔多重背景

position/size 识别：遇到独立 `/` 后续 token 进入 size；包含 `/` 的 token 按 `/` 拆分。

## boxSizing 影响

扩展 `boxSizingAffectingStyleMap`，新增 `border`、`borderTop/Right/Bottom/Left`：

```ts
const boxSizingAffectingStyleMap: Record<string, boolean> = {
  padding: true, paddingTop: true, paddingRight: true, paddingBottom: true, paddingLeft: true,
  borderWidth: true, borderTopWidth: true, borderRightWidth: true, borderBottomWidth: true, borderLeftWidth: true,
  border: true, borderTop: true, borderRight: true, borderBottom: true, borderLeft: true
}
```

## 性能控制

无需处理时额外成本：

1. 每个顶层 key 一次 `hasOwn` 判断（直接复用 `runtimeAbbreviationMap`，无额外 map）。
2. `shorthandKeys.length === 0` 时跳过 `transformShorthand`。
3. `transformLineHeight` / `transformFontFamily` / `transformFlex` 各一次类型判断。
4. 单值 composite 属性跳过展开（RN 原生支持）。
5. `expandFlex` 使用索引遍历，避免数组拷贝和 `shift()`。
6. 正则常量提升至模块顶层，避免循环内重复创建。

不引入额外 clone、二次遍历。

## 风险与边界

1. JS 对象无法表达重复声明，只处理最终保留的 key 顺序。
2. 展开后的长属性不回到 `env/percent/calc` visitor。多值百分比 `borderRadius` 需后续增强。
3. 运行时不输出高频 warn/error，无法识别的值静默透传。
4. 只有命中简写时才进行展开处理。

## 测试用例

1. `margin: '10px 20px'` → 四方向展开
2. `padding: '1px 2px 3px'` → 第四值取第二值
3. `borderRadius: '10px 20px'` → 四角展开
4. `border: '1px solid red'` → width/style/color
5. `borderTop: '1px solid red'` → top 三属性
6. `flex: '1 0 20px'` → grow/shrink/basis
7. `flexFlow: 'row wrap'` → direction/wrap
8. `textShadow: '1px 2px 3px red'` → offset/radius/color
9. `textDecoration: 'line-through solid red'` → line/style/color
10. `background: 'url("./a.png") no-repeat #fff'` → image/repeat/color
11. `background: 'url(https://example.com/bg.png) no-repeat center/cover #fff'` → image/repeat/color/position/size
12. `background: 'url(bg.png) no-repeat left top / 100% 50%'` → image/repeat/position/size
13. `background: 'none'` → image + transparent color
14. `margin: 'var(--space)'` 其中 `--space: '10px 20px'`
15. `margin: 'calc(10px + 2px) 20px'`
16. `{ margin: '10px', marginTop: '20px' }` 与 `{ marginTop: '20px', margin: '10px' }` 覆盖顺序
17. `lineHeight: 1.5` → `lineHeight: '150%'`
18. `fontFamily: '"Helvetica Neue", Arial, sans-serif'` → `fontFamily: 'Helvetica Neue'`
