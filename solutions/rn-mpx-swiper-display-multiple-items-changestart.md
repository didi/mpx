# Mpx2RN mpx-swiper 多项展示与 changestart 支持方案

## 背景与问题

`mpx-swiper.tsx` 是 Mpx2RN runtime 中对小程序 `swiper` 能力的 RN 实现。当前实现已经支持 `indicator-dots`、`current`、`autoplay`、`circular`、`vertical`、`previous-margin`、`next-margin`、`duration`、`easing-function` 等核心能力，但此前存在两个能力缺口：

1. `display-multiple-items` 未支持，RN 侧一个 swiper item 始终按容器完整宽度或高度渲染，无法实现一屏展示多个 swiper item。
2. `bindchangestart` / `changestart` 未支持，业务只能在 `change` 阶段拿到最终索引，无法在切换动画开始时获知目标页。

这两个能力都不是单纯新增 prop 即可完成。`display-multiple-items` 会改变 swiper 的基础度量模型、循环补位数量、非循环边界、手势目标索引、阻力区间与 autoplay 停止条件；`changestart` 则需要嵌入到 autoplay、外部 `current` 更新和手势切换三个路径中，且要避免与既有 `change` 事件重复或时序冲突。

## 目标

1. 在 RN runtime 中支持 `display-multiple-items`，默认值保持为 1。
2. 在横向和纵向 swiper 下都以 `display-multiple-items` 拆分单个 item 的宽度或高度。
3. 在非循环模式下，最大可滚动索引从 `childrenLength - 1` 调整为 `childrenLength - displayMultipleItems`。
4. 在循环模式下，根据多项展示需要动态补足前后 clone，保证边界过渡过程中可见区域不露空。
5. 新增 `bindchangestart`，在切换动画开始前触发 `changestart`。
6. 保持原有 `change` 事件语义不变：`currentIndex` 真正更新后再触发。
7. 新增 prop 不透传到 RN 原生 `View`。
8. display 相关逻辑尽量贴近 `fix-drn-2.10.18` 分支实现，本轮只保留必要的小范围修正，不额外扩大动态更新与越界兜底范围。

## 非目标

1. 不支持 `snap-to-edge`，该能力仍标记为未支持。
2. 不改 `mpx-swiper-item.tsx` 的渲染模型，只继续通过 `SwiperContext.step` 控制 item 尺寸。
3. 不改分页点数量与交互语义，分页仍按真实 children 数量渲染。
4. 不改 `change` 的事件 `source` 字段，目前仍沿用 `{ source: 'touch' }` 的既有行为。
5. 不引入新的手势库或重写 gesture 状态机。

## 当前相关实现概览

### 文件范围

主要改动文件：

```text
packages/webpack-plugin/lib/runtime/components/react/mpx-swiper.tsx
```

关联但未改动的文件：

```text
packages/webpack-plugin/lib/runtime/components/react/mpx-swiper-item.tsx
```

`mpx-swiper-item.tsx` 中 item 的宽高由 `SwiperContext.step` 决定：

1. 横向时 item 外层宽度为 `step.value`，高度为 `100%`。
2. 纵向时 item 外层高度为 `step.value`，宽度为 `100%`。

因此本方案在 swiper wrapper 中重算 `step`，就能影响每个 swiper item 的可见尺寸。

## 方案一：新增 prop 与事件类型

### 改动内容

在 `SwiperProps` 中新增：

```ts
'display-multiple-items'?: number
bindchangestart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
```

组件内部新增：

```ts
const displayMultipleItems = Number(props['display-multiple-items']) || 1
```

### 为什么这么改

1. `display-multiple-items` 是小程序 swiper 的标准属性，RN runtime 需要在 wrapper 层感知它，因为 item 尺寸、边界和循环补位都依赖该值。
2. RN 模板编译后静态属性可能以字符串形式传入，使用 `Number()` 做必要的数值转换，避免补位数量计算中的 `+` 发生字符串拼接；未传值、传入 `0` 或无法转换为数字时通过 `|| 1` 使用默认值，不额外增加 `Number.isFinite`、取整或正数裁剪。
3. `bindchangestart` 是业务事件回调，必须进入 props 类型，否则 TS 层无法表达该能力。

### prop 透传处理

`useInnerProps` 的 remove list 中新增：

```ts
'display-multiple-items',
'bindchangestart'
```

原因是这两个字段是 Mpx runtime 层消费的逻辑 prop，不应该透传到 RN 原生 `View` 上，否则可能产生无效 native prop 或警告。

### RN 编译能力声明

原模板组件配置会在 iOS、Android 和 Harmony 编译时提示 `display-multiple-items` 不受支持。runtime 完成支持后，需要将该属性从 RN unsupported 规则中移除，避免编译器继续输出与实际能力不一致的 warning：

```js
{
  test: /^(snap-to-edge|easing-function)$/,
  ios: iosPropLog,
  android: androidPropLog,
  harmony: harmonyPropLog
}
```

这里只移除 `display-multiple-items`，`snap-to-edge` 和 `easing-function` 等尚未支持的属性继续保持原 warning。模板编译测试同时覆盖“`display-multiple-items` 不告警”和“`snap-to-edge` 仍告警”，防止误放开整条规则。

## 方案二：基于 displayMultipleItems 重算 step

### 原模型

原实现中：

```ts
step = wrapperWidthOrHeight
```

这意味着一个 swiper item 占满整个 swiper 容器。

### 新模型

新实现中：

```ts
step = wrapperWidthOrHeight / displayMultipleItems
```

横向时：

```ts
step = (width - previousMargin - nextMargin) / displayMultipleItems
```

纵向时：

```ts
step = (height - previousMargin - nextMargin) / displayMultipleItems
```

### 为什么这么改

`mpx-swiper-item` 已经通过 context 读取 `step` 并用它设置自身外层宽高。将 `step` 降为容器可用尺寸的 `1 / displayMultipleItems`，可以复用现有 item 渲染机制，不需要改 swiper item 本身。

这样带来的好处：

1. 改动集中在 swiper wrapper，侵入性小。
2. 横向、纵向逻辑可以共用 `step`。
3. 现有 scale、offset、gesture 计算仍围绕 `step` 运行，模型连续。

### 动态 display 更新

本轮不新增 `wrapperSizeRef` 缓存尺寸，也不额外处理 `display-multiple-items` 动态变化时的 step 反推。保持与 `fix-drn-2.10.18` 接近：主要依赖 `onWrapperLayout` 与既有 effect 同步 shared value。

这样做的原因是控制本次迁移范围，避免为了动态配置场景引入更多状态同步逻辑。动态切换 `display-multiple-items` 的完整表现可以作为后续增强单独评估。

## 方案三：非循环 current 边界保持 fix-drn 口径

### 问题

支持多项展示后，非循环模式下最后一个合法起点不再是最后一个 item。例如 `childrenLength = 5`、`displayMultipleItems = 3` 时，最后一个合法起点是 2，对应可见 `[2, 3, 4]`。

### 当前处理

本轮不新增 `normalizeCurrent` / `getMaxCurrent` 全链路裁剪 helper，仅保留 `fix-drn-2.10.18` 已有的核心处理：

1. 手势 `getTargetPosition` 中将非循环目标索引限制在 `[0, childrenLength - displayMultipleItems]`。
2. autoplay 的停止位置使用 `childrenLength - displayMultipleItems`。
3. `canMove` / `handleResistanceMove` 的末端边界使用 `childrenLength - displayMultipleItems`。

外部传入越界 `current`、children 动态减少、`display-multiple-items` 动态变化导致的 current 重新裁剪，本轮暂不额外扩展。

## 方案四：循环模式动态补位

### 原补位逻辑

原 circular 模式补位规则是：

1. 无 `previous-margin` 时，前后各补 1 个。
2. 有 `previous-margin` 时，前后各补 2 个。

这个规则只适用于单 item 宽度接近容器宽度的场景。多 item 展示时，如果仍只补 1 或 2 个，在循环边界过渡时可能露出空白。

### 新补位数量

```ts
const hasEdgeMargin = !!preMargin || !!nextMargin
const patchElmNum = (circular && children.length > 1)
  ? displayMultipleItems + (hasEdgeMargin ? 1 : 0)
  : 0
```

### 为什么要考虑 previous-margin / next-margin

`patchElmNum` 需要同时兼顾多项展示和边缘露出：

1. 无边缘 margin 时，可见区域宽度正好由 `displayMultipleItems` 个 item 填满，循环边界至少需要补 `displayMultipleItems` 个 clone。
2. 有 `previous-margin` 或 `next-margin` 时，可见区域会额外露出边缘内容。此时滑动过渡中除了当前可见的 `displayMultipleItems` 个 item，还需要额外 1 个 item 承接边缘露出，所以补 `displayMultipleItems + 1` 个 clone。
3. 这里使用 `preMargin || nextMargin`，而不是只看 `previous-margin`。原因是 `previous-margin` 影响左侧露出和初始 offset，`next-margin` 影响右侧露出；二者任意存在，都可能让循环边界需要多一个 clone 来覆盖边缘可视区域。

关键组合如下：

```text
displayMultipleItems = 1, no margin      -> patchElmNum = 1
displayMultipleItems = 1, has margin     -> patchElmNum = 2
displayMultipleItems = N, no margin      -> patchElmNum = N
displayMultipleItems = N, has margin     -> patchElmNum = N + 1
```

这样可以保留原默认行为：`display-multiple-items` 缺省为 1 且无 `previous-margin` / `next-margin` 时，仍然是前后各补 1 个，而不是无条件补 2 个。

### 前置 clone 生成

前置 clone 从真实 children 尾部向前取：

```ts
const startIndex = intLen - (patchElmNum % intLen)
for (let i = 0; i < patchElmNum; i++) {
  const sourceIndex = (startIndex + i) % intLen
}
```

例如：

```text
childrenLength = 5
displayMultipleItems = 2
hasEdgeMargin = false
patchElmNum = 2
front clones = [3, 4]
back clones = [0, 1]
```

如果存在 `previous-margin` 或 `next-margin`：

```text
childrenLength = 5
displayMultipleItems = 2
hasEdgeMargin = true
patchElmNum = 3
front clones = [2, 3, 4]
back clones = [0, 1, 2]
```

### 循环索引映射

在手势目标计算中，补位区的 `moveToIndex` 统一映射为真实索引：

```ts
let circularIndex = (moveToIndex - patchElmNumShared.value) % childrenLength.value
if (circularIndex < 0) {
  circularIndex += childrenLength.value
}
```

### 为什么这么改

之前前置补位区只有两种映射：

1. `moveToIndex === 0` 映射到 `childrenLength - patchElmNum`
2. 其他都映射到 `childrenLength - 1`

当 `patchElmNum > 2` 时，这个映射会错误。例如：

```text
childrenLength = 5
displayMultipleItems = 2
hasEdgeMargin = true
patchElmNum = 3
front clones = [2, 3, 4]
旧映射 = [2, 4, 4]
新映射 = [2, 3, 4]
```

这里分为两步处理：

1. `moveToIndex - patchElmNumShared.value` 先移除前置 clone 带来的索引偏移，再通过 `% childrenLength.value` 将索引限制在一个 children 周期内。
2. JavaScript 对负数取余仍会得到负数，前置 clone 可能产生负余数，因此在结果小于 0 时加上 `childrenLength.value`，将其修正为有效的真实索引。

这样前置补位、真实区、后置补位都能使用同一套映射逻辑。分步写法与双重取模结果一致，但更容易理解每一步的目的。

## 方案五：非循环边界调整

### autoplay 边界

非循环 autoplay 原来在：

```ts
currentIndex.value === childrenLength.value - 1
```

时停止。现在改为：

```ts
const maxIndex = Math.max(0, childrenLength.value - displayMultipleItemsShared.value)
if (currentIndex.value >= maxIndex) {
  pauseLoop()
}
```

### 为什么使用非负 maxIndex 和 >=

非循环模式下，最后一个合法起始索引不能小于 0。当 `displayMultipleItems > childrenLength` 时，`childrenLength - displayMultipleItems` 会得到负数，但实际只能停在索引 0。使用 `Math.max(0, ...)` 可以让 autoplay、手势定位和阻力边界保持一致。使用 `>=` 则可以在 children 动态减少、当前索引已经超过新边界时及时停止 autoplay。

### 手势边界

非循环模式下：

1. `getTargetPosition` 将目标索引上限裁剪到 `maxIndex`。
2. `canMove` 的末端边界改为 `-step * maxIndex`。
3. `handleResistanceMove` 的末端阻力边界同样改为 `-step * maxIndex`。

### 为什么这么改

多项展示时，滚动坐标含义仍然是“以第几个 item 作为视口起点”。非循环最后可滚动坐标应该让最后一屏刚好展示到最后一个真实 item，而不是以最后一个 item 作为起点。

当 `displayMultipleItems > childrenLength` 时，非循环模式不会生成 clone，`maxIndex` 固定为 0；循环模式则继续通过重复 clone 填充可视区域，不受这组非循环边界调整影响。

## 方案六：changestart 事件

### 新增事件处理函数

```ts
function handleSwiperChangeStart (current: number) {
  const eventData = getCustomEvent('changestart', {}, {
    detail: { current },
    layoutRef
  })
  bindchangestart && bindchangestart(eventData)
}
```

并注册到 `runOnJSCallbackRef`，让 worklet 中可以触发。

### 触发点

1. autoplay 确定 `nextIndex` 后、动画开始前触发。
2. 外部 `current` 触发动画前触发。
3. 手势 `handleEnd` 确定目标索引后、`withTiming` 动画开始前触发。
4. 手势 onUpdate 过程中跨过半屏并更新 `currentIndex` 前触发。

### 与 change 的关系

`change` 仍由：

```ts
useAnimatedReaction(() => currentIndex.value, ...)
```

触发。也就是说：

```text
changestart: 目标 current 已确定，切换动画即将开始
change: currentIndex 已更新，切换结果生效
```

### 为什么这么改

这符合小程序侧常见的事件语义：`changestart` 代表切换开始，`change` 代表切换完成或索引变更生效。把 `changestart` 放在 `withTiming` 之前，可以让业务在动画开始时提前响应。

## 方案七：动态变化处理边界

### margin 动态变化

`previous-margin` / `next-margin` 变化后，当前保持接近 `fix-drn` 的处理方式：

1. 计算 margin delta。
2. 更新 `preMarginShared` / `nextMarginShared`。
3. 用 `step.value - patchStep` 更新 step。
4. 根据当前 index 重新计算 offset。

这里没有额外按 `displayMultipleItems` 拆分 margin delta，也没有缓存 wrapper 尺寸。该部分是后续可评估的增强点。

### display-multiple-items 动态变化

当 `displayMultipleItems` 变化：

1. 更新 `displayMultipleItemsShared.value`。
2. 根据当前 step 重新计算 offset。

本轮不通过缓存尺寸反推新 step，也不额外裁剪 current。这样可以减少逻辑迁移范围，保持与 `fix-drn` 更一致。

### circular 动态变化

当 `circular` 变化：

1. 更新 `circularShared`。
2. 更新 `patchElmNumShared`。
3. 按新的 circular 语义重算 offset。

### children 动态变化

当 children 数量变化：

1. 更新 `childrenLength.value`。
2. 如果 `children.length - 1 < currentIndex.value`，将 current 重置为 0。
3. 必要时暂停 autoplay 并重新启动。

## 关键数据流

### 横向非循环，多项展示

```text
wrapper layout width
  -> realWidth = width - previousMargin - nextMargin
  -> step = realWidth / displayMultipleItems
  -> swiper-item width = step
  -> maxCurrent = childrenLength - displayMultipleItems
  -> offset = -current * step
```

### 横向循环，多项展示

```text
displayMultipleItems
  -> hasEdgeMargin = !!previousMargin || !!nextMargin
  -> patchElmNum = displayMultipleItems + (hasEdgeMargin ? 1 : 0)
  -> render front clones + real children + back clones
  -> initial offset = -(current + patchElmNum) * step + previousMargin
  -> crossing boundary
      -> animate to clone position
      -> reset to matching real position
```

### changestart 时序

```text
target current calculated
  -> changestart(current)
  -> withTiming animation
  -> currentIndex.value = current
  -> change(current)
```

## 风险点与应对

### 风险一：循环补位数量与索引映射复杂

风险：

1. `displayMultipleItems + (hasEdgeMargin ? 1 : 0)` 会让前后 clone 数量随配置变大。
2. 当 `displayMultipleItems >= childrenLength` 时，clone 中会重复使用真实节点。
3. 循环边界 reset 的坐标和真实索引映射需要完全一致，否则会出现跳错页或闪动。

当前应对：

1. clone 生成使用 modulo，允许补位数量大于 children 数量。
2. 手势目标索引使用统一 modulo 映射。
3. 已用示例校验 `childrenLength=5, displayMultipleItems=2` 的前置 clone 映射从 `[2,4,4]` 修正为 `[2,3,4]`。

后续建议：

1. 增加真实 RN 示例验证 `childrenLength < displayMultipleItems`、`childrenLength === displayMultipleItems`、`childrenLength > displayMultipleItems` 三类场景。
2. 特别验证 circular + previous-margin + displayMultipleItems 的组合。

### 风险二：动态 display-multiple-items 依赖缓存尺寸

风险：

RN 的 `onLayout` 只在布局变化时触发。如果只改 `display-multiple-items`，容器尺寸可能不变，因此不会自然重算 step。

当前取舍：

1. 本轮不引入 wrapper 尺寸缓存。
2. `displayMultipleItemsShared` 会更新，offset 会按当前 step 重新计算。
3. 若业务运行时动态修改 `display-multiple-items`，可能需要等待布局回调或后续增强才能完全修正 item 尺寸。

剩余风险：

1. 运行时动态切换 display 数量可能出现短时间或持续的 item 尺寸不符合预期。
2. 如果业务明确依赖动态切换，需要单独补充缓存尺寸和 step 重算逻辑。

### 风险三：margin 动态变化与布局回调可能重复

风险：

当前 margin effect 沿用接近 `fix-drn` 的 `step.value - patchStep` 处理。多项展示时，margin delta 理论上应按 `displayMultipleItems` 分摊到单个 item 的 step 上。

当前取舍：

1. 本轮不引入 `wrapperSizeRef`，避免扩大状态同步逻辑。
2. 保持与 `fix-drn` 行为接近，降低迁移风险。

剩余风险：

1. 在 `displayMultipleItems > 1` 且动态修改 margin 时，step 变化量可能偏大。
2. 如果业务不动态修改 margin，则主要影响较小。

### 风险四：外部 current 越界仍未统一裁剪

风险：

外部传入越界 current 时，当前方案不会新增统一裁剪。例如非循环 `childrenLength=5, displayMultipleItems=3, current=4` 时，理论合法起点应为 2，但本轮不额外改这条路径。

当前取舍：

1. 贴近 `fix-drn`，避免扩展 current 语义。
2. 本轮聚焦基础 display 展示、补位数量、循环索引映射。

需要 review 的点：

1. 是否接受外部越界 current 仍可能进入非法 offset。
2. 是否需要在后续单独补充 `normalizeCurrent` 方案。

### 风险五：changestart 可能在某些路径提前于 change 多次触发

风险：

手势 onUpdate 跨过半屏时会触发一次 `changestart` 并更新 `currentIndex`；onFinalize 阶段如果目标索引再次变化，也可能触发另一次。

当前应对：

1. `triggerChangeStart` 会判断 `current !== currentIndex.value`。
2. 如果 onUpdate 已经把 `currentIndex` 更新为目标值，onFinalize 同目标不会再次触发。

剩余风险：

1. 快速往返拖拽时目标索引来回变化，会按变化次数触发多次 `changestart`。
2. 这与“目标切换开始”语义基本一致，但业务如果假设一次手势最多一个 changestart，需要额外说明。

### 风险六：change 事件 source 仍固定为 touch

风险：

当前既有 `change` 事件 detail 里 `source` 固定为 `'touch'`。本次新增 autoplay 与外部 current 的 `changestart` 后，事件 source 精度没有同步提升。

为什么本次不改：

1. 这是已有行为，贸然修改可能影响业务判断。
2. 本次目标聚焦 `display-multiple-items` 与 `changestart`。

后续建议：

如需完整对齐小程序，可单独评估 `source` 在 autoplay、touch、外部 current 更新中的语义。

### 风险七：display-multiple-items 非法输入

风险：

当前入口只做必要的数值转换和默认值处理，不额外校验或归一化 `display-multiple-items`：

```ts
const displayMultipleItems = Number(props['display-multiple-items']) || 1
```

潜在影响：

1. `undefined`、`0`、空字符串、非法字符串和 `NaN` 经转换后会回退为 `1`。
2. 负数、小数和 `Infinity` 等转换后的 truthy 数值会直接参与 step、clone 数量和边界计算，调用方需要遵循该属性应为正整数的约定。

建议：

保留 `Number()` 解决 RN 模板输入的运行时类型问题，但不在本次实现中增加 `Number.isFinite`、`Math.floor` 或 `Math.max` 等额外容错；如后续确认需要统一校验，应作为组件属性校验策略单独评估。

### 风险八：测试覆盖不足

风险：

当前完成了单文件 lint、diff check 和若干索引推导校验，但缺少真实 RN 运行时交互验证。

建议至少覆盖：

1. 横向非循环：`display-multiple-items=2/3`。
2. 纵向非循环：`display-multiple-items=2/3`。
3. 横向循环：`childrenLength=2/3/5` 与 `display-multiple-items=2/3`。
4. `previous-margin` / `next-margin` 与多项展示组合。
5. autoplay 非循环到尾部停止。
6. autoplay circular 从最后一项回到第一项。
7. 外部动态更新 current 到合法值与越界值。
8. 动态切换 `display-multiple-items`。
9. 动态增删 swiper item。
10. 快速拖拽、反向拖拽、边界阻力拖拽。
11. `bindchangestart` 与 `bindchange` 触发顺序。

## 验证结果

已执行：

```bash
node_modules/.bin/eslint packages/webpack-plugin/lib/runtime/components/react/mpx-swiper.tsx
git diff --check
```

结果：

1. 单文件 ESLint 通过。
2. `git diff --check` 通过。

已尝试：

```bash
node_modules/.bin/tsc -p packages/webpack-plugin/lib/runtime/components/react/tsconfig.json --noEmit
```

结果：

1. 当前失败原因是既有 `@mpxjs/perf` 模块类型缺失。
2. 报错文件为 `mpx-simple-text.tsx`、`mpx-simple-view.tsx`、`mpx-text.tsx`、`mpx-view.tsx`。
3. 未发现 `mpx-swiper.tsx` 新增 TS 错误。

额外推导校验：

```text
childrenLength = 5
displayMultipleItems = 2
hasEdgeMargin = false
patchElmNum = 2
front clone render indexes = [3, 4]
front clone mapped indexes = [3, 4]

childrenLength = 5
displayMultipleItems = 2
hasEdgeMargin = true
patchElmNum = 3
front clone render indexes = [2, 3, 4]
front clone mapped indexes = [2, 3, 4]
```

## Review 清单

代码 review 建议重点看：

1. `displayMultipleItems` 使用 `Number(props['display-multiple-items']) || 1` 完成类型转换和默认值处理是否符合业务兼容预期。
2. `patchElmNum = displayMultipleItems + (hasEdgeMargin ? 1 : 0)` 是否满足所有循环边界场景。
3. 外部越界 current 暂不统一裁剪是否符合本次“贴近 fix-drn”的取舍。
4. `changestart` 是否需要补充 `source` 字段。
5. 快速拖拽时多次 `changestart` 是否符合预期。
6. margin 动态变化暂不按 `displayMultipleItems` 分摊 delta 是否可接受。
7. `childrenLength <= displayMultipleItems` 时循环模式重复 clone 的展示行为是否符合预期。
8. 是否需要在文档或测试用例中明确 `display-multiple-items` 动态变化的支持范围。

## 后续建议

1. 增加一个 RN 示例页面，专门覆盖 `display-multiple-items`、`circular`、`previous-margin`、`next-margin`、`autoplay`、`changestart` 组合。
2. 在真机或模拟器上录制边界滑动行为，重点看循环 reset 是否闪动。
3. 若项目测试体系允许，补充纯函数层面的索引映射单测，把 clone 生成与 `moveToIndex -> selectedIndex` 的关系固定下来。
4. 若后续要完整对齐小程序事件语义，单独评估 `change/changestart` 的 `source` 字段。
