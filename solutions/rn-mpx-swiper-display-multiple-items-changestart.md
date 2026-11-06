# Mpx2RN mpx-swiper 多项展示与 changestart 支持方案

## 目标

Mpx2RN 的 `swiper` 新增两项能力：

1. 支持 `display-multiple-items`，一屏展示多个 `swiper-item`。
2. 支持 `bindchangestart`，在 swiper 开始切换时通知目标索引。

实现尽量复用现有 `step`、offset、手势和循环补位模型，不修改 `mpx-swiper-item`，不重写手势状态机。

## 使用方式

```html
<swiper
  display-multiple-items="2"
  bindchangestart="handleChangeStart"
>
  <swiper-item wx:for="{{list}}" wx:key="id">
    <!-- item content -->
  </swiper-item>
</swiper>
```

```js
function handleChangeStart(event) {
  const { current } = event.detail
}
```

- `display-multiple-items` 默认值为 `1`。
- `changestart` 返回 `event.detail = { current }`。
- 原有 `change` 语义不变，仍返回 `event.detail = { current, source }`。

## 核心实现

### display-multiple-items

运行时接收并将属性归一化为有限正整数：

```ts
const displayMultipleItems = normalizeDisplayMultipleItems(props['display-multiple-items'])
```

模板组件配置同时放开 iOS、Android 和 Harmony 对该属性的校验，避免继续提示 unsupported warning。

#### 1. 重算单个 item 尺寸

`mpx-swiper-item` 已使用 `SwiperContext.step` 设置宽度或高度，因此只需修改 `step`：

```text
availableSize = mainAxisSize - previousMargin - nextMargin
step = availableSize / displayMultipleItems
```

- 横向 swiper 使用可用宽度。
- 纵向 swiper 使用可用高度。
- offset、动画和手势继续以一个 `step` 为移动单位。

#### 2. 调整非循环边界

多项展示时，最后一个合法起点为：

```ts
const maxIndex = Math.max(
  0,
  childrenLength - displayMultipleItems
)
```

例如 5 个 item 同时展示 3 个时，`maxIndex = 2`，最后一屏为 `[2, 3, 4]`。

`maxIndex` 统一用于手势目标、autoplay 终点和边界阻力，避免最后一屏继续滑出空白。
外部 `current` 和动态配置变更也使用同一上限归一化，避免产生越界 offset。

#### 3. 统一重算动态布局

缓存 swiper 主轴尺寸，`display-multiple-items`、`previous-margin` 或 `next-margin` 变化时均通过完整公式重算 `step`，并在同一次状态对齐中更新索引、offset 与 autoplay。

#### 4. 调整循环补位

循环模式需要在真实 children 前后克隆足够的 item。基础数量为：

```ts
const hasEdgeMargin = !!previousMargin || !!nextMargin
const patchElmNum = circular && childrenLength > 1
  ? displayMultipleItems + (hasEdgeMargin ? 1 : 0)
  : 0
```

| 场景 | 前后各补数量 |
| --- | ---: |
| 无 margin | `displayMultipleItems` |
| 有 previous-margin 或 next-margin | `displayMultipleItems + 1` |

实际补位数还会与 `ceil(viewportSize / step)` 取较大值，保证自动播放和手势动画的任意一帧都有足够 clone 覆盖视口。

补位区通过取模映射回真实索引：

```ts
let index = (moveToIndex - patchElmNum) % childrenLength
if (index < 0) index += childrenLength
```

这样可以统一处理前置 clone、真实 children 和后置 clone，避免补位数量增加后跳错索引。
滑动越过补位边界时，offset 始终按 `childrenLength * step` 的完整周期平移。回绕阈值同时考虑视口尺寸，在剩余 clone 不足以覆盖视口前提前回绕，避免大边距场景露白。

#### 5. 对齐多项展示指示点

指示点总数仍与真实 `swiper-item` 数量一致，不包含循环补位 clone。`display-multiple-items` 大于 `1` 时，从 `current` 开始的多个主展示项对应指示点同时高亮；循环末尾使用真实索引取模，例如 5 项、`current=4`、同时展示 2 项时高亮第 5、1 个指示点。

### changestart

目标索引确定后创建事件：

```ts
function handleSwiperChangeStart(current) {
  const event = getCustomEvent('changestart', {}, {
    detail: { current },
    layoutRef
  })
  bindchangestart && bindchangestart(event)
}
```

覆盖四条切换路径：

1. autoplay 确定下一个索引。
2. 外部更新 `current`。
3. 手势结束并确定目标索引。
4. 拖动超过半个 item，目标索引发生变化。

事件时序：

```text
确定目标索引
  -> changestart
  -> 执行动画或更新索引
  -> change
```

`changestart` 表示切换开始，`change` 表示 current 已经更新。

## 兼容性与非目标

1. 未传 `display-multiple-items` 时默认为 `1`，保留原单项展示行为。
2. 单项展示且无 margin 时，循环模式仍然前后各补一个 item。
3. 横向、纵向、autoplay、circular、previous-margin 和 next-margin 继续可用。
4. `snap-to-edge` 仍不支持。
5. 不修改 `change` 事件现有的 `source: 'touch'` 行为。

## 已知风险

1. **循环渲染开销**：展示数量较大时 clone 数量同步增加；当展示数量大于 children 数量时会重复克隆。
2. **事件触发次数**：快速往返拖动时目标索引可能多次变化，因此一次手势可能触发多次 `changestart`。
3. **真机覆盖**：核心数值与边界逻辑已有 RN runtime 单测，手势动画的平台实现仍需真机回归。

## 验证重点

1. 横向、纵向分别验证展示数量 `1/2/3`。
2. 非循环模式验证最后一屏和边界阻力。
3. 循环模式验证无 margin、previous-margin、next-margin。
4. 验证 children 数量小于、等于和大于展示数量。
5. 验证 autoplay、外部 `current`、快速反向滑动。
6. 验证 `changestart` 先于对应的 `change`。
7. 验证指示点总数与真实 children 一致，且多项展示和循环跨尾部时高亮范围正确。

## Review 重点

本次方案的核心关系是：

```text
displayMultipleItems
  -> step 变小
  -> 非循环 maxIndex 调整
  -> 循环 clone 数量增加
```

Review 时主要确认：

1. 循环补位公式是否覆盖业务使用的 margin 组合。
2. 动态配置、children 变化与外部 `current` 是否始终同步到同一组 step、索引和 offset。
3. 快速往返拖动可能多次触发 `changestart` 是否符合业务预期。
