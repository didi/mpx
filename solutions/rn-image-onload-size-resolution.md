# Mpx2RN 图像尺寸解析最终实现

## 结论

Mpx2RN 的 `<image>` 与 `view + background-image` 都采用“尺寸事实缓存到 ref，只有当前渲染所需事实全部就绪时才递增 version”的模型。

图片尺寸按 source 缓存在组件实例内的普通对象中。每个 source 的首个有效尺寸写入后不再覆盖，因此 `onLoad`、`getSize` 和 `resolveAssetSource` 即使并发返回，也只会采用最先得到的有效结果。动态切换 source 时，迟到结果只会写入其对应 source 的缓存；切回曾出现过的 source，则能在当次 props render 中同步复用尺寸，不需要再次等待异步查询。

两处实现的分工如下：

| 场景 | 图片尺寸来源 | 布局尺寸来源 | 渲染方式 |
| --- | --- | --- | --- |
| `<image>` 普通位图 mode | 实际节点 `onLoad` 仅做事实采集 | 不需要 | 直接渲染 Image/FastImage |
| `<image>` 位图 layout mode | 本地资源 `resolveAssetSource`；远程字符串 `Image.getSize`；实际节点 `onLoad` | 外层 View `onLayout` | View 包裹 Image/FastImage |
| `<image>` 远程 SVG | SVG 节点 `onLayout` | 外层 View `onLayout` | View 包裹 `SvgCssUri` |
| `<image>` 本地 SVG | `resolveAssetSource` 同步尺寸优先；SVG 节点 `onLayout` 作为补充来源 | 外层 View `onLayout` | View 包裹 `LocalSvg` |
| 位图 `background-image` | `Image.getSize` 与实际节点 `onLoad` | 背景容器 `onLayout` | View 包裹 Image/FastImage |
| SVG `background-image` | 不支持，解析阶段报错并丢弃 | 不适用 | 不创建图片节点 |
| `linear-gradient` | 不使用图片尺寸 | 固定绘制尺寸或容器 `onLayout` | View 包裹 LinearGradient |

## 支持范围

### `<image>`

需要 JS 参与尺寸或定位计算的场景统一称为 layout mode：

```ts
const isLayoutMode = isSvg || isWidthFixMode || isHeightFixMode || isCropMode
```

其中包括：

- 所有 SVG；
- `widthFix`；
- `heightFix`；
- `top`、`bottom`、`center`、`left`、`right`、四角定位等裁剪类 mode。

普通位图的 `scaleToFill`、`aspectFit` 和 `aspectFill` 不进入 layout mode，继续直接依赖 React Native Image/FastImage 的 `resizeMode`，不增加外层 View，也不主动调用 `Image.getSize`。

### `view + background-image`

当前仅支持 `url(...)` 位图和 `linear-gradient(...)`。URI SVG（包括 query/hash）与 SVG base64 会在 `parseBgImage()` 中被识别、报错并丢弃。

`url(...)` 最终解析为字符串 URI，因此 background-image 当前不支持 React Native 本地静态资源对象。`enable-fast-image` 只影响实际图片节点的选择，不改变尺寸获取与缓存逻辑。

## 核心状态模型

### 按 source 缓存首个有效图片尺寸

两个组件各自在实例内维护普通对象：

```ts
const imageSizeRef = useRef<Record<string, Size>>({})
```

缓存值保持扁平的 `{ width, height }`，source 只作为对象 key，不在 value 中重复存储。

统一提交规则为：

1. source 已有缓存时直接返回；
2. width、height 必须是有限数字且大于 0；
3. 一次性写入完整的 `{ width, height }`；
4. 只有结果属于当前 source，且当前渲染需要该尺寸并已具备其他必要事实时，才递增 version。

“首个有效结果生效”避免 `getSize` 与 `onLoad` 先后返回不同值时反复改写样式和触发渲染。其代价是同一 URI 内容原地变化时不会主动校正尺寸；调用方应使用不同 URI（例如 query）表达不同资源。

缓存不跨组件实例共享，也没有 LRU、TTL 或持久化，组件卸载后自然释放。

### 动态 source 隔离

异步回调通过闭包捕获发起查询或创建节点时的 source，并将其传入 `commitImageSize(source, width, height)`。提交函数再与同步更新的 `srcRef.current` 比较：

- source 仍是当前值：按就绪条件决定是否通知 render；
- source 已过期：缓存该 source 的尺寸，但不影响当前视图；
- 后续切回旧 source：当前 render 直接命中缓存。

`srcRef` 及消费条件 ref 在 render 中同步赋值，不依赖 effect 才更新，因此异步回调始终能读取当前 props 对应的判断条件。

### 布局事实与渲染通知

容器布局只保存最近一次有效测量：

```ts
const layoutInfoRef = useRef<Size | null>(null)
```

布局 width、height 接受有限且大于等于 0 的值；相同尺寸不重复写入。允许 `0 × 0` 是因为它仍是有效的实际布局事实，后续非零 `onLayout` 会继续覆盖。

图片尺寸和布局尺寸都保存在 ref 中，React state 只保留一个匿名 version：

```ts
const [, setVersion] = useState(0)
```

version 不承载尺寸数据，只在当前输出已经具备全部必要事实时通知 React 重新读取 ref。这样同时等待图片与布局时，无论谁先到，都只由后到的事实触发一次可见结果渲染。

## `<image>` 实现

### source 标识与同步尺寸

字符串 src 直接作为 `sourceKey`；本地资源先调用 `RNImage.resolveAssetSource(src)`，再使用解析结果的 URI：

```ts
const resolvedSource = typeof src === 'string' ? undefined : RNImage.resolveAssetSource(src)
const sourceKey = typeof src === 'string' ? src : resolvedSource?.uri || ''
```

如果当前 source 尚未缓存，且 `resolvedSource` 同步提供了有效 width、height，则在 render 中直接写入缓存。该逻辑不区分位图和 SVG，因此打包元数据完整的本地 SVG 也可以同步获得尺寸。

同步命中使本地资源在已有容器布局时无需等待 `onLoad`/SVG `onLayout`；后续节点事件仍会正常触发公开事件，但不会覆盖已经缓存的尺寸。

### 图片尺寸提交

`commitImageSize` 的实际通知条件是：

```text
source 是当前 source
  && 当前属于 layout mode
  && 容器布局已经存在
```

因此：

- 普通位图 mode 的 `onLoad` 可以被动缓存尺寸，但不触发额外 render；
- 之后切换到 layout mode 时，props render 直接消费缓存；
- layout mode 下图片尺寸先到时只缓存，等待容器布局；
- 容器布局先到时只缓存，等待图片尺寸；
- 迟到的旧 source 结果不会刷新当前视图。

### 布局提交

`commitLayout` 更新单份 `layoutInfoRef`，只有当前属于 layout mode 且当前 source 已有图片尺寸时才递增 version。派生出的 `viewWidth`、`viewHeight` 不回写布局 ref：

- `widthFix` 根据实际容器 width 和图片比例派生 height；
- `heightFix` 根据实际容器 height 和图片比例派生 width；
- 裁剪类 mode 使用当前容器宽高计算 transform；
- SVG 使用同一套 layout mode 计算。

### 异步获取链路

`Image.getSize` 只在以下条件同时满足时启动：

```text
src 是非空字符串
  && 不是 SVG
  && 当前属于 layout mode
  && 当前 source 没有缓存
```

本地资源已经由 `resolveAssetSource` 尝试同步获取尺寸，不进入该 effect。普通位图 mode 也不主动查询尺寸。

实际 Image/FastImage 节点始终挂载 `onLoad`。`getImageLoadSize()` 统一兼容：

- React Native Image：`nativeEvent.source.width/height`；
- FastImage：`nativeEvent.width/height`。

内部尺寸提交与公开 `bindload` 相互独立：尺寸可能因为已有缓存而被忽略，但每次真实节点事件仍按原事件语义透传 `bindload`。`binderror` 同样只负责公开事件透传。

### SVG 链路

字符串 SVG 使用 `SvgCssUri`，本地 SVG 使用 `LocalSvg`。SVG 节点的 `onLayout` 同时承担两件事：

- 将事件中的 width、height 以闭包 source 提交到统一图片尺寸缓存；
- 透传 `<image>` 的 `bindload`。

本地 SVG 如果已通过 `resolveAssetSource` 同步写入尺寸，`onLayout` 不会覆盖首个结果；远程 SVG 无法调用 `Image.getSize`，因此依靠 SVG 节点 `onLayout` 提供尺寸。

### 统一 layout 包装

SVG 和位图 layout mode 共用同一个外层 View：

```ts
function renderLayout () {
  return createElement(View, innerProps, isSvg ? renderSvgImage() : renderBaseImage())
}

const finalComponent = isLayoutMode ? renderLayout() : renderBaseImage()
```

这样容器 `onLayout`、用户 style、事件 props 和 widthFix/heightFix 派生尺寸都只在一个包装入口处理。非 layout 位图仍把 `innerProps` 直接传给 Image/FastImage，不改变节点层级。

### pending 与 modeStyle

layout mode 只有图片尺寸和容器布局都存在时才 ready：

```ts
const pending = isLayoutMode && (!imageSize || !layoutInfo)
```

`modeStyle` 通过 `useMemo` 统一生成 SVG 与位图内部节点样式，并且不依赖容器 style 对象：

- 非 layout mode：返回空对象；
- pending 位图：使用 `1 × 1 + opacity: 0`，保证节点已挂载且能触发加载；
- pending SVG：保留 SVG transform origin 并设置 `opacity: 0`；
- ready 的普通 layout 位图：填满外层 View；
- ready 的裁剪位图：设置固有尺寸与左上 transform origin，再按 mode 计算 transform；
- ready 的 SVG：使用同一套 mode transform，并合入 SVG transform origin。

`modeStyle` 的依赖只保留其闭包中直接读取的基础值：

```ts
[pending, isSvg, mode, imageWidth, imageHeight, viewWidth, viewHeight]
```

`isLayoutMode` 与 `isCropMode` 不需要额外列入依赖，因为它们对结果的影响已分别体现在 `pending`、`isSvg`、`mode` 等基础依赖中。

## `view + background-image` 实现

### 解析与能力边界

`parseBgImage()` 只接受：

- `url(...)` 位图；
- `linear-gradient(...)`。

SVG URI 和 SVG base64 会输出明确错误并返回空结果，不启动图片尺寸查询、不创建背景图片节点，也不进入缓存。

### 位图尺寸需求

`needImageSize` 只属于位图，并在以下场景为 true：

- `background-size: cover`；
- `background-size: contain`；
- 任一轴为 `auto`。

`needLayout` 则由最终尺寸或位置是否依赖容器决定，例如 cover/contain、`auto + 百分比`、百分比 background-position 等。

两个消费条件及当前 src 都同步写入 ref，供异步提交函数读取最新值。

### 图片与布局提交

background-image 使用与 `<image>` 相同的 source 对象缓存和首个有效结果规则，但通知条件按背景需求判断。

图片尺寸写入后，仅在以下条件下通知：

```text
source 是当前 src
  && needImageSize
  &&（不需要布局 || 布局已存在）
```

布局写入后，仅在以下条件下通知：

```text
needLayout
  &&（不需要图片尺寸 || 当前 src 已存在且已有尺寸缓存）
```

其中对当前 src 的非空判断也用于 TypeScript 将 `string | undefined` 收窄为可索引的 string。

`Image.getSize(src)` 只在位图确实需要原图尺寸且缓存未命中时执行。实际 Image/FastImage 始终挂载，并通过 `onLoad` 将真实节点尺寸提交到同一入口；pending 时使用 `1 × 1 + opacity: 0`，避免未挂载或零尺寸阻断加载。

### 背景位图绘制

`backgroundSize()` 是位图最终绘制矩形的唯一尺寸决策层：

- `auto auto` 使用图片原始宽高；
- 单轴固定、另一轴 auto 时按原图比例计算；
- `cover`/`contain` 根据容器与图片比例计算完整矩形；
- 固定双轴直接使用指定尺寸。

Image/FastImage 统一使用 `resizeMode: 'stretch'` 填满已经算好的矩形，避免底层再次执行 cover/contain。外层背景 View 使用 `overflow: hidden` 完成 cover 超出区域裁剪，并负责内边框圆角。

### 渐变与图片尺寸彻底分离

渐变不读取 `imageSizeRef`。其绘制尺寸单独命名为 `gradientDrawingSize`：

- background-size 为两个有限数值时可同步得到；
- 默认值、百分比或其他动态尺寸从容器布局派生；
- 对角线方向角度使用 `gradientDrawingSize` 计算；
- `cover`、`contain`、`auto` 在渐变场景统一归一化为 `100%`。

渐变 pending 时不创建 LinearGradient；位图则始终创建实际图片节点。这是两类背景渲染时机的刻意区别。

## 关键时序

### 图片尺寸先到

```text
onLoad / getSize / resolveAssetSource
  → 缓存图片尺寸
  → 缺少 layout，不通知
  → 容器 onLayout
  → 写入 layout 并 version + 1
  → 一次渲染得到最终结果
```

### 布局先到

```text
容器 onLayout
  → 缓存 layout
  → 缺少图片尺寸，不通知
  → onLoad / getSize / SVG onLayout
  → 缓存图片尺寸并 version + 1
  → 一次渲染得到最终结果
```

### source 快速切换

```text
A 发起异步查询 → 切换到 B → A 回调
  → A 的尺寸写入 A 缓存
  → srcRef.current 为 B，不通知当前视图
  → 后续切回 A 时同步命中缓存
```

### 从无需尺寸切换到需要尺寸

普通位图 mode 或无需原图尺寸的背景仍会从实际节点 `onLoad` 被动采集事实。后续 mode/background-size 改为需要尺寸时，本次 props render 可以直接消费已有缓存；只有缓存未命中时才进入异步等待链路。

## 实现约束

- 图片尺寸必须是有限且大于 0 的完整 width/height；不做逐轴合并。
- 布局尺寸必须有限，允许 0；相同布局不重复通知。
- 每个 source 的首个有效图片尺寸生效，后到结果不覆盖。
- 缓存仅按 URI/sourceKey 区分，不包含 renderer、headers 或其他请求配置。
- 迟到结果可以缓存旧 source，但不能通知当前 source。
- `bindload`/`binderror` 是公开事件，不参与内部 ready 状态或 source 隔离。
- layout ref 只保存实际容器测量，不保存 widthFix/heightFix 等派生尺寸。
- SVG background-image 不支持；本次实现没有新增对外 API。

## 测试覆盖

### `<image>`

`mpx-image-size.spec.ts` 覆盖：

- 普通 mode 不查询尺寸、不增加包装 View；
- layout mode 在 pending 时仍挂载实际图片；
- 图片尺寸与布局两种到达顺序都只在 ready 时发布；
- 无消费者时被动缓存，切换 mode 后同步复用；
- 动态 source 的迟到结果隔离与切回缓存复用；
- 本地位图与本地 SVG 的 `resolveAssetSource` 同步尺寸；
- RN Image/FastImage 两种 `onLoad` 事件结构；
- 远程 SVG 的 `onLayout` 尺寸回退链路。

### `view + background-image`

`mpx-view-background-image.spec.ts` 覆盖：

- SVG 背景拒绝；
- 固定尺寸位图立即显示且使用 stretch；
- 被动尺寸事实在 background-size 变化后复用；
- `getSize` 与 `onLoad` 首个有效结果生效；
- 图片尺寸与布局的两种就绪顺序；
- `0 × 0` 布局及后续更新；
- `auto`、固定单轴、cover/contain 的矩形计算；
- 动态 source 的迟到结果隔离与缓存复用；
- 消费条件变化不会产生多余提交。

`mpx-view-gradient.spec.ts` 覆盖固定绘制尺寸、依赖布局的默认/百分比尺寸，以及对角线方向和多种角度单位。

## 验证命令

```sh
npm exec eslint -- packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx packages/webpack-plugin/test/runtime/react-native/mpx-image-size.spec.ts packages/webpack-plugin/test/runtime/react-native/mpx-view-background-image.spec.ts packages/webpack-plugin/test/runtime/react-native/mpx-view-gradient.spec.ts

npm exec tsc -- -p packages/webpack-plugin/lib/runtime/components/react/tsconfig.json --noEmit

npm test -w @mpxjs/webpack-plugin -- mpx-image-size.spec.ts mpx-view-background-image.spec.ts mpx-view-gradient.spec.ts --runInBand --no-watchman
```
