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

运行时接收并转换属性：

```ts
const displayMultipleItems = Number(props['display-multiple-items']) || 1
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

#### 3. 调整循环补位

循环模式需要在真实 children 前后克隆足够的 item：

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

补位区通过取模映射回真实索引：

```ts
let index = (moveToIndex - patchElmNum) % childrenLength
if (index < 0) index += childrenLength
```

这样可以统一处理前置 clone、真实 children 和后置 clone，避免补位数量增加后跳错索引。

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

1. **动态修改配置**：只修改 `display-multiple-items` 时，容器可能不会重新触发 `onLayout`，`step` 不一定立即重算；动态修改 margin 也仍沿用原有增量算法。
2. **外部 current 越界**：手势和 autoplay 已使用新边界，但外部传入的 `current` 没有新增统一裁剪。
3. **非法属性值**：当前只做 `Number(value) || 1`，负数、小数和 `Infinity` 不会额外归一化，调用方应传正整数。
4. **循环渲染开销**：展示数量较大时 clone 数量同步增加；当展示数量大于 children 数量时会重复克隆。
5. **事件触发次数**：快速往返拖动时目标索引可能多次变化，因此一次手势可能触发多次 `changestart`。
6. **运行时测试不足**：当前模板测试只覆盖属性告警，循环补位和事件时序仍需 RN runtime 测试或真机验证。

## 验证重点

1. 横向、纵向分别验证展示数量 `1/2/3`。
2. 非循环模式验证最后一屏和边界阻力。
3. 循环模式验证无 margin、previous-margin、next-margin。
4. 验证 children 数量小于、等于和大于展示数量。
5. 验证 autoplay、外部 `current`、快速反向滑动。
6. 验证 `changestart` 先于对应的 `change`。

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
2. 是否接受动态配置和外部越界 `current` 暂不完整处理。
3. 快速往返拖动可能多次触发 `changestart` 是否符合业务预期。
