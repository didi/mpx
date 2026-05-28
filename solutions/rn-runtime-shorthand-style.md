# Mpx2RN useTransformStyle 运行时简写属性展开方案

## 背景

Mpx2RN 当前对 CSS 简写属性的支持主要分为两类：

1. `<style>` / class 样式：在编译阶段由 `packages/webpack-plugin/lib/platform/style/wx/index.js` 展开，如多值 `margin`、`padding`、`border`、`flex-flow`、`text-shadow` 等。
2. 运行时样式：在 `packages/webpack-plugin/lib/runtime/components/react/utils.tsx` 的 `useTransformStyle` 中处理 CSS var、UnoCSS var、`env()`、`calc()`、百分比、`position: fixed`、`transform` 字符串、`boxShadow` 字符串等。

因此以下场景存在限制：

```xml
<view wx:style="{{ { margin: spacing } }}" />
<view style="--space: 12rpx 24rpx; margin: var(--space);" />
<view wx:style="{{ { border: borderToken } }}" />
```

如果简写值在编译期无法静态展开，例如来自 `wx:style`、CSS var fallback、运行时 data/computed 或 UnoCSS var，最终会以 RN 不支持或仅部分支持的简写形式进入原生 style，导致运行时报错、无效或表现不一致。

目标是在 `useTransformStyle` 中补齐与编译期等效的运行时简写展开能力，同时严格控制性能开销。

## 目标

1. 支持 `style` / `wx:style` / CSS var / UnoCSS var 等纯运行时入口中的主要简写属性展开。
2. 与现有编译期展开规则保持同口径，避免 class 样式与内联 style 表现分裂。
3. 不影响无简写属性的热路径性能。
4. 保持 React Hooks 调用顺序稳定，不因为是否存在简写属性改变 Hook 调用。
5. 只做运行时样式对象转换，不改模板、loader、编译期样式规则。

## 非目标

1. 不支持 RN 原生和现有编译期都不支持的 CSS 能力。
2. 不尝试实现完整 CSS parser，只复用当前 `parseValues` 这类轻量解析策略。
3. 不改变 CSS 声明优先级规则；在运行时对象能表达的顺序范围内尽量模拟“后声明覆盖前声明”。
4. 本方案阶段不进行实际代码开发。

## 支持范围

第一阶段建议覆盖现有编译期增强且适合在 `useTransformStyle` 通用处理的属性：

| 类别 | 属性 | 运行时展开结果 |
| --- | --- | --- |
| 间距多值 | `margin` / `padding` | `marginTop` / `marginRight` / `marginBottom` / `marginLeft`，`padding*` 同理 |
| 边框多值 | `borderWidth` / `borderColor` / `borderRadius` | 四方向或四角长属性 |
| 边框简写 | `border` | `borderWidth` / `borderStyle` / `borderColor` |
| 方向边框 | `borderTop` / `borderRight` / `borderBottom` / `borderLeft` | 对应方向的 `Width` / `Style` / `Color` |
| 布局简写 | `flex` 多值 / `flexFlow` | `flexGrow` / `flexShrink` / `flexBasis`，`flexDirection` / `flexWrap` |
| 文本简写 | `textShadow` / `textDecoration` | `textShadowOffset` / `textShadowRadius` / `textShadowColor`，`textDecorationLine` / `Style` / `Color` |
| 背景简写 | `background` | `backgroundImage` / `backgroundColor` / `backgroundRepeat` / `backgroundPosition` / `backgroundSize` |

说明：

1. `margin` / `padding` / `borderWidth` / `borderColor` / `borderRadius` 单值也可以展开，但可按需保留 RN 原生单值，以减少产物属性数量。为了 CSS var 场景语义一致，建议单值来自 `var()` 且解析后为复合值时执行展开。
2. `borderStyle` 多值不纳入，因为 RN 不支持分别设置各方向 `borderStyle`，现有文档也明确不支持。
3. `background` 本期只考虑简写展开本身，将可识别 token 拆为 `backgroundImage` / `backgroundColor` / `backgroundRepeat` / `backgroundPosition` / `backgroundSize`；不在本方案讨论这些长属性后续如何在具体组件中应用。
4. `boxShadow` 已有 `transformBoxShadow`，本方案不调整其语义。

## 推荐实现位置

文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

当前本地 `utils.tsx` 已经将若干热路径正则判断改为显式 map 或字符串方法：

1. `TEXT_STYLE_REGEX` → `TEXT_STYLE_MAP` + `key.startsWith('font')` / `key.startsWith('text')`
2. `BACKGROUND_REGEX` → `BACKGROUND_STYLE_MAP`
3. `TEXT_PROPS_REGEX` → `TEXT_PROPS_MAP`
4. `filterRegExp` → `typeof value === 'string' && (value.includes('%') || value.includes('calc(') || value.includes('env('))`
5. `boxSizingAffectingRegExp` → `boxSizingAffectingStyleMap`

运行时 shorthand 方案应沿用这个方向：优先用显式 map 与 `hasOwn` 做常量判断，避免重新引入正则热路径。

新增一个运行时简写转换阶段：

```ts
// apply runtime shorthand
transformShorthand(normalStyle, shorthandKeyPaths)
```

建议插入位置：

1. `traverseStyle(styleObj, [varVisitor, boxSizingVisitor, shorthandVisitor])`
2. CSS var / UnoCSS var 解析
3. `env()` 解析
4. 百分比解析
5. `calc()` 解析
6. `position` / stringify / boxShadow / transform
7. **运行时简写展开**
8. boxSizing 默认值处理

选择这个位置的原因：

1. 简写值里的 `var()` 会先按现有逻辑替换，例如 `margin: var(--space)` 会先解析成 `12rpx 24rpx`。
2. 简写值里直接包含 `env()`、`calc()` 时，仍由现有 `visitOther` / `transformEnv` / `transformCalc` 链路先处理原属性值，简写阶段只负责拆分最终字符串。
3. `shorthandVisitor` 只收集候选属性路径，不在遍历阶段判断是否展开，也不解析值；具体是否展开由 `transformShorthand` 基于最终值决定。
4. 建议将 `transformShorthand` 放在 `transformBoxSizing` 之前，这样动态 `padding`、`borderWidth`、`border` 展开出的盒模型相关长属性仍能被 boxSizing 默认值逻辑观察到。

## 关键流程设计

### 1. 候选路径收集

在前置遍历阶段新增一个轻量 `shorthandVisitor`，只收集顶层简写属性路径：

```ts
const runtimeShorthandStyleMap: Record<string, boolean> = {
  margin: true,
  padding: true,
  borderRadius: true,
  borderWidth: true,
  borderColor: true,
  border: true,
  borderTop: true,
  borderRight: true,
  borderBottom: true,
  borderLeft: true,
  flex: true,
  flexFlow: true,
  textShadow: true,
  textDecoration: true,
  background: true
}
```

示意：

```ts
const shorthandKeyPaths: Array<Array<string>> = []

function shorthandVisitor ({ key, keyPath }: VisitorArg) {
  if (keyPath.length === 1 && hasOwn(runtimeShorthandStyleMap, key)) {
    shorthandKeyPaths.push(keyPath.slice())
  }
}
```

无命中时 `shorthandKeyPaths.length === 0`，后续 `transformShorthand` 直接返回，不解析字符串、不构造展开对象。相比末尾再扫描 `normalStyle`，这种方式复用已有 `traverseStyle`，只增加一次常量表判断和少量候选路径记录。

### 2. 不提前决定是否展开

`shorthandVisitor` 不应该根据当前值决定是否展开，因为此时值可能还包含 `var()`、UnoCSS var、`env()` 或 `calc()`。它只记录“这个顶层属性可能需要展开”。

最终由 `transformShorthand` 在现有处理链路之后读取最终值，再判断：

1. 单值且 RN 原生支持的简写，可以选择保留原属性。
2. 多值简写或 RN 不支持的简写，展开成长属性。
3. 非字符串、数组或无法轻量识别的值，优先保持原样透传或跳过展开；运行时不做完整合法性校验。

这样 `margin: var(--space)` 会先被 `transformVar` 替换成最终值，再由 `transformShorthand` 基于最终值判断是否需要展开。

### 3. 尽量不改动既有处理链路

保持当前 `visitOther` 逻辑不变：

```ts
function visitOther ({ target, key, value, keyPath }: VisitorArg) {
  if (typeof value === 'string' && (value.includes('%') || value.includes('calc(') || value.includes('env('))) {
    [envVisitor, percentVisitor, calcVisitor].forEach(visitor => visitor({ target, key, value, keyPath }))
  }
}
```

也保持 `transformVar` 对解析后值继续调用 `visitOther` 的行为不变：

```ts
target[key] = resolved
visitOther({ target, key, value: target[key], keyPath: varKeyPath })
```

这样做的收益是实现侵入性最低：运行时简写展开只消费“现有链路处理后的 `normalStyle`”，不会改变已有 CSS var、UnoCSS var、`env()`、`calc()`、百分比路径的收集与执行时机。

需要明确的边界是：简写展开后的长属性不会再回到既有 visitor 流程。因此第一阶段不承诺“展开后再触发百分比自尺寸计算”这类能力。对于 `borderRadius: 50% 20%` 这种多值百分比半径，如果要做到完全等效，需要在 `transformShorthand` 内部额外复用 `resolvePercent`，或者后续再引入更靠前的展开阶段。

### 4. boxSizing 影响判断

当前本地 `boxSizingVisitor` 通过 `isBoxSizingAffectingStyle(key)` 判断 `padding*` 与 `border*Width`，底层已从正则改为 `boxSizingAffectingStyleMap`。运行时简写展开后，`border`、`borderTop`、`borderRight`、`borderBottom`、`borderLeft` 会生成对应 `border*Width`，也应触发默认 boxSizing。

不需要新增 `isBoxSizingAffectingShorthandStyle`，直接扩展现有 `boxSizingAffectingStyleMap` 即可：

```ts
const boxSizingAffectingStyleMap: Record<string, boolean> = {
  padding: true,
  paddingTop: true,
  paddingRight: true,
  paddingBottom: true,
  paddingLeft: true,
  borderWidth: true,
  borderTopWidth: true,
  borderRightWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  border: true,
  borderTop: true,
  borderRight: true,
  borderBottom: true,
  borderLeft: true
}
```

`boxSizingVisitor` 保持现有调用方式：

```ts
function boxSizingVisitor ({ key, keyPath }: VisitorArg) {
  if (keyPath.length === 1 && !hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
    hasBoxSizingAffectingStyle = true
  }
}
```

说明：

1. `padding`、`paddingTop` 等现有显式 key 保持不变，新增的 `border` / 方向 `border*` 只补齐会展开出 border width 的边框简写。
2. `borderRadius`、`borderColor`、`borderStyle` 不影响盒模型尺寸，不应触发默认 boxSizing。
3. `transformShorthand` 仍建议放在 `transformBoxSizing` 之前，保证 `normalStyle` 最终包含展开后的长属性。

### 5. 保留可表达的声明顺序

运行时 style 是 JS 对象，无法表达 CSS 中重复声明的完整顺序，但可以利用对象 key 的插入顺序处理常见冲突：

```ts
{
  margin: '10px',
  marginTop: '20px'
}
```

应得到 `marginTop: 20px`。

```ts
{
  marginTop: '20px',
  margin: '10px'
}
```

应得到 `marginTop: 10px`。

建议 `transformShorthand` 在 `shorthandKeyPaths.length > 0` 时，不直接原地逐项 delete/set，而是按 `Object.entries(normalStyle)` 顺序构造一个新对象：

1. 遇到普通长属性，写入结果对象。
2. 遇到简写属性，展开后按顺序写入结果对象。
3. 后写入的同名长属性自然覆盖前值。
4. 最后用 `Object.keys(normalStyle).forEach(delete)` 清空，再 `Object.assign(normalStyle, expandedStyle)` 回填。

这既能尽量模拟声明顺序，也避免遍历过程中改写当前对象带来的边界问题。

### 6. 处理后值的拆分

`transformShorthand` 只处理已经经过现有链路处理后的值。例如：

1. `margin: var(--space)` 会先由 `transformVar` 解析成最终字符串，再由简写阶段拆分。
2. `margin: calc(10px + 2px) 20px` 会先由现有 `transformCalc` 替换 `calc()` 片段，再由简写阶段拆分。
3. `paddingTop: env(safe-area-inset-top)` 这类长属性仍走原链路，不受简写阶段影响。

简写阶段不再调用 `visitOther`，避免把一个末尾收口逻辑反向耦合回前置 visitor 体系。

### 7. 解析策略

复用现有 `parseValues`，保持括号内空格不拆分：

```ts
parseValues('calc(100% - 20px) 10px')
// ['calc(100% - 20px)', '10px']
```

四值类属性使用 CSS 标准规则：

1. 1 值：四边一致
2. 2 值：上下、左右
3. 3 值：上、左右、下
4. 4 值：上、右、下、左

超过 4 值时按当前属性能消费的数量截断即可；运行时不输出高频 warning。

`background` 单独按 token 识别并展开，建议与当前本地编译期 `background` 新增能力保持同口径：

1. `none` → `backgroundImage: 'none'` + `backgroundColor: 'transparent'`。
2. `url(...)` 或 `linear-gradient(...)` → `backgroundImage`。
3. 颜色值 → `backgroundColor`。
4. `repeat` / `no-repeat` 等少量明确枚举 → `backgroundRepeat`。
5. position token → `backgroundPosition`；仅做轻量 token 归类，`center` 归一为 `50%`。
6. `/` 之后的 size token → `backgroundSize`；仅做轻量 token 归类。
7. 不支持逗号分隔的多重背景；其他无法识别 token 暂不展开，不做完整值校验。

position / size 的识别策略与当前本地编译期实现保持一致：

1. 遇到独立 `/` 后，后续 token 进入 `backgroundSize`。
2. 遇到包含 `/` 的 token，如 `center/cover`，按 `/` 拆分，前半进入 position，后半开始进入 size。
3. `/` 前的 position token 累积到 `positionValues`，仅做 `center` → `50%` 这类低成本归一。
4. `/` 后的 size token 累积到 `sizeValues`，不进行完整枚举 / 单位校验。
5. 编译期已有 `verifyValues` 负责静态样式的严格校验；运行时侧只负责轻量展开，避免在 render 路径复制校验成本。

示例：

```ts
background: 'url("./a.png") no-repeat center/cover #fff'
// =>
backgroundImage: 'url("./a.png")'
backgroundRepeat: 'no-repeat'
backgroundPosition: ['50%']
backgroundSize: ['cover']
backgroundColor: '#fff'
```

```ts
background: 'url(bg.png) no-repeat left top / 100% 50%'
// =>
backgroundImage: 'url(bg.png)'
backgroundRepeat: 'no-repeat'
backgroundPosition: ['left', 'top']
backgroundSize: ['100%', '50%']
```

这一步只负责把 `background` 简写拆成已有长属性，不关心 `mpx-view` 或其他组件后续如何消费这些长属性。

### 8. 值格式化

简写展开阶段不要主动调用大量 `global.__formatValue`。推荐策略：

1. 对拆出的 token 尽量保持现有链路处理后的值，不再回流到 `calc/env/percent` 处理。
2. 仅在当前已有运行时逻辑必须格式化的场景复用既有函数，例如 `transformBoxShadow`、`transformTransform`。
3. 对 `border: none` 这类编译期已有特殊语义保持同口径，转换为 `borderWidth: 0`。

这样可以避免每次 render 对所有 token 做重复单位解析。

## 性能控制

### 热路径原则

大多数节点样式不会包含运行时简写。无简写时的额外成本应接近：

1. `traverseStyle` 过程中每个顶层 key 一次 `hasOwn(runtimeShorthandStyleMap, key)` 判断。
2. `shorthandKeyPaths.length === 0` 时直接跳过 `transformShorthand`。

不应产生：

1. 额外完整 clone。
2. 命中简写前的 `Object.entries` 二次遍历。
3. 字符串解析。
4. 正则链式匹配。当前本地代码已将多个热路径正则替换为 map / `includes`，shorthand 逻辑应保持一致。

### 解析触发条件

只有满足以下条件才进入解析：

1. `shorthandVisitor` 已收集到对应顶层 keyPath。
2. value 是 string 或数组。
3. 对 RN 原生可接受的单值简写，可选择跳过展开，除非该值来自 `var()` 解析后可能是复合值。

### 校验策略

运行时 shorthand 的职责是“展开”，不是“校验”。原则如下：

1. 不引入编译期 `verifyValues` 等完整校验逻辑。
2. 不为了识别某个 token 串联多组正则或枚举判断。
3. 可以保留必要的低成本判断，例如 `url(`、`linear-gradient(`、`#` / `rgb(` / `rgba(` / 命名色的简单颜色识别、`/` 分割、少量明确枚举。
4. 无法低成本识别的 token 保守跳过，不在 render 高频路径输出 warn/error。
5. 静态 `<style>` 仍由编译期规则负责严格校验；运行时动态值默认认为业务已经给出可用值，框架只做尽力展开。

### 缓存策略

可以增加一个小型模块级缓存，但建议谨慎：

```ts
const shorthandCache: Record<string, Array<[string, any]>> = Object.create(null)
```

缓存 key 可使用 `${prop}:${value}`，仅缓存纯字符串输入，不缓存包含 `var(`、`env(`、`calc(` 的输入，避免上下文相关值误复用。

缓存上限建议 200-500 条，超出后整体清空即可，不引入复杂 LRU。原因是运行时样式值通常重复度高，但无限缓存可能在列表动态样式中积累。

若第一版追求最小变更，可以先不加缓存，只保留 fast path；后续通过性能数据再决定。

### 对 CSS var 的额外约束

`var()` 本身已经会触发 `enableVar`、Context 合并和 `transformVar`。简写展开不应让无 var 的节点误进入 var 流程。

对于 `margin: var(--space)`：

1. 初始遍历同时记录 var path 与 shorthand candidate path。
2. `transformVar` 解析为最终值。
3. `transformShorthand` 通过已收集的 candidate path 读取 `margin` 最终值。
4. 解析最终值并展开。

对于 `margin: var(--top) var(--right)`：

1. 先按现有 `resolveVar` 替换每个 token。
2. 再按四值规则展开。

## 与编译期规则的关系

运行时规则应尽量复用编译期 `AbbreviationMap` 的映射口径，但不建议直接 import `packages/webpack-plugin/lib/platform/style/wx/index.js`：

1. 该文件属于构建期平台规则，不适合进入 RN runtime bundle。
2. 其中包含属性校验、错误提示、平台分发等构建期逻辑，运行时引入会增加包体和执行成本。
3. `useTransformStyle` 已有 `parseValues`，只需要一份小型映射和少量 formatter。

建议将运行时映射写在 `utils.tsx` 内部，命名上显式标注 runtime：

```ts
const runtimeCompositeShorthandMap = { ... }
const runtimeAbbreviationMap = { ... }
```

后续如担心规则漂移，可以在测试中用相同输入分别覆盖编译期和运行时的关键结果，而不是共享整套实现。

## 风险与边界

1. **声明顺序风险**：JS 对象无法表达重复声明，只能处理对象最终保留的 key 顺序。该限制当前运行时 style 已存在，本方案不扩大。
2. **背景简写边界**：本期只做 `background` 到长属性的展开，不处理背景属性在具体组件中的应用；position/size 支持 `/` 简写，但仍不支持逗号分隔的多重背景 layer。
3. **RN 原生单值简写风险**：如果全部展开，可能改变 RN 对某些单值简写的内部处理路径。建议对单值 `margin/padding/borderWidth/borderColor/borderRadius` 做灰度式决策：先只展开多值和 var 解析后的复合值。
4. **对象分配风险**：只有命中简写时才构造新对象；无简写时维持当前对象处理路径。
5. **错误提示风险**：运行时不应像编译期一样高频输出 warn/error。对非法或无法识别的简写值建议保持静默透传或跳过展开，避免线上 render 日志噪音。
6. **后置展开边界**：简写展开发生在现有 `env/percent/calc` 之后，展开出的长属性不会再自动进入这些后处理。第一阶段应优先覆盖不依赖展开后再处理的场景；多值 `borderRadius` 百分比这类需要二次处理的能力，可作为后续增强单独设计。
7. **boxSizing 边界**：如果简写阶段放在 `transformBoxSizing` 之后，动态 `border` 展开出的 `borderWidth` 不会触发默认 boxSizing。推荐将简写阶段放在 `transformBoxSizing` 之前，作为最后一个值转换步骤。

## 测试建议

新增或补充运行时样式转换相关单测，核心覆盖：

1. `margin: '10px 20px'` → 四方向展开。
2. `padding: '1px 2px 3px'` → 第四值取第二值。
3. `borderRadius: '10px 20px'` → 四角展开；多值百分比半径先标记为后续增强。
4. `border: '1px solid red'` → width/style/color。
5. `borderTop: '1px solid red'` → top 三属性。
6. `flex: '1 0 20px'` → grow/shrink/basis。
7. `flexFlow: 'row wrap'` → direction/wrap。
8. `textShadow: '1px 2px 3px red'` → offset/radius/color。
9. `textDecoration: 'line-through solid red'` → line/style/color。
10. `background: 'url("./a.png") no-repeat #fff'` → image/repeat/color。
11. `background: 'url(https://example.com/bg.png) no-repeat center/cover #fff'` → image/repeat/color/position/size，其中 `center` → `50%`。
12. `background: 'url(bg.png) no-repeat left top / 100% 50%'` → image/repeat/position/size。
13. `background: 'none'` → `backgroundImage: 'none'` + `backgroundColor: 'transparent'`。
14. `margin: 'var(--space)'`，其中 `--space: '10px 20px'`。
15. `margin: 'calc(10px + 2px) 20px'`，先由现有 calc 链路处理，再展开处理后的值。
16. `{ margin: '10px', marginTop: '20px' }` 与 `{ marginTop: '20px', margin: '10px' }` 的覆盖顺序。

如实际落地改变对外使用方式，需要同步更新：

1. `docs-vitepress/` 下 RN 样式能力相关文档。
2. `.agents/skills/mpx2rn/references/rn-style-reference.md` 中“简写属性支持”的使用限制，将对应属性从“仅编译时增强”调整为“编译期 + 运行时增强”。
3. `.agents/skills/mpx2rn/references/rn-style-practice.md` 中涉及动态样式和 CSS var 的建议。

## 推荐落地顺序

1. 只在 `utils.tsx` 内实现 `shorthandVisitor`、`transformShorthand` 和少量 formatter。
2. 接入 `useTransformStyle`，保证 Hook 顺序不变。
3. 补核心单测，先覆盖 `margin/padding/borderRadius/border/flex`。
4. 根据测试结果再扩展 `textShadow/textDecoration/flexFlow`。
5. 同步生成 `dist/utils.jsx` / `dist/utils.d.ts`，保持 runtime 发布产物一致。
6. 更新 docs 与 mpx2rn Skill。

## 结论

推荐在 `useTransformStyle` 前置遍历中增加一个只收集候选路径的 `shorthandVisitor`，并在现有样式处理链路末尾增加 `transformShorthand`，优先放在 `transformBoxSizing` 之前作为最后一个值转换步骤。该方案能覆盖 `style`、`wx:style`、CSS var、UnoCSS var 等编译期无法静态处理的场景，同时不提前解析、不提前决定是否展开；无简写时只增加顶层 key 常量表判断，性能风险可控。

第一阶段应优先支持 `margin/padding/borderRadius/borderWidth/borderColor/border/flex/background` 这些收益较高、规则相对稳定的属性；`background` 仅做简写展开，不处理具体组件应用。
