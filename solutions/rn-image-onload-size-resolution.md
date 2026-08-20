# Mpx2RN 图像尺寸链路统一方案（位图 `onLoad` / SVG `onLayout`）

## 结论

对于 Mpx2RN 中需要原图尺寸参与布局计算的非 SVG 图片，统一以实际渲染节点的 `onLoad` 事件作为尺寸来源，移除 `Image.getSize` 及其尺寸缓存链路。SVG 继续以 `react-native-svg` 节点的 `onLayout` 作为尺寸来源，同时修复当前尺寸暂存不完整导致的事件顺序问题。

本方案同时覆盖：

- `<image>` 的 `widthFix`、`heightFix` 和裁剪类 mode；
- `view` 的 `background-image` 在 `background-size: auto/contain/cover` 等需要原图比例的场景；
- React Native `Image` 与 `enable-fast-image` 两条渲染链路；
- 远程 URI 与本地静态资源；
- `SvgCssUri`/`LocalSvg` 的 `onLayout` 尺寸暂存与布局计算。

图片在尺寸尚未就绪时仍立即挂载，但使用非零尺寸并设置透明，避免 `display: none`、条件渲染或 `0 × 0` 导致图片不发起加载。`onLoad` 返回当前图片的原始宽高后，再完成布局计算和显示。

SVG 不改为 `onLoad`，也不额外解析源文件的固有宽高；本次只修复现有 `onLayout` 链路中的状态完整性和无效更新。

## 实施基线

本方案直接基于当前本地代码 `93f9f7a5bfc69037ef2f5a676bf97e3df52bf013` 落地：

- 以当前 `mpx-image.tsx`、`mpx-view.tsx` 的实现和测试为唯一代码基线；
- 不依赖任何尚未合入的分支、补丁或中间实现；
- 实施时从当前 `Image.getSize`、`loaded/show`、尺寸缓存和 SVG `onLayout` 状态链路直接改造；
- 若实施前本地主干发生变化，先重新核对相同调用链，再按本文目标做最小适配。

## 背景

当前本地实现包含三条彼此不同的尺寸链路。

### `<image>` 非 SVG

- `widthFix`、`heightFix` 和裁剪类 mode 在 effect 中调用 `getImageSize`；
- 远程字符串最终调用 `RNImage.getSize`，本地 asset 尝试从 `resolveAssetSource` 同步取宽高；
- layout mode 的内部图片被 `loaded` 条件阻挡，getSize 未回调时实际图片不会挂载，因此也无法依靠真实图片事件恢复；
- `bindload` 的 `onImageLoad` 只服务公开事件：优先读取 `nativeEvent.source`，缺失时再次调用 `getImageSize`，没有参与 layout mode 的主尺寸计算。

### `view + background-image`

- `needImageSize` 为 true 时调用 `Image.getSize`；
- 尺寸按 URI 缓存在 `sizeCacheRef`，并通过 `sizeInfo + version + show` 驱动计算和显示；
- getSize 未回调时背景图片不会挂载；
- `src` 变化后的旧尺寸在 effect 执行前仍保留，首次 render 存在读取上一个来源状态的窗口。

### `<image>` SVG

- 字符串资源渲染为 `SvgCssUri`，本地 asset 渲染为 `LocalSvg`；
- 两者通过 `onLayout` 的 `nativeEvent.layout.width/height` 获取实际布局尺寸，不调用 `Image.getSize`；
- 当前 `onSvgLoad` 只把 `imageHeight` 和 ratio 写入 `state.current`，却没有暂存 `imageWidth`；
- 外层 `onLayout` 又要求 `imageWidth && imageHeight && ratio` 同时存在，导致 SVG `onLayout` 先发生、容器 `onLayout` 后发生时无法继续计算；
- `onSvgLoad` 在计算条件尚未满足时提前执行 `setImageHeight(height)`，由于 ratio 仍为 0，此次 render 没有有效消费者。

实际位图组件必须完成加载才能展示，因此它的 `onLoad` 是更接近最终渲染结果的尺寸来源。非 SVG 链路收敛到 `onLoad`，SVG 链路补齐 `onLayout` 的完整状态暂存，可以同时解决回调可靠性、事件顺序和状态复杂度问题。

## 目标

- 非 SVG 图片原始尺寸只从实际渲染节点的 `onLoad` 获取；
- `src` 变更后，旧图片尺寸不能参与新图片布局；
- `onLoad` 和容器 `onLayout` 无论谁先到达，最终计算结果一致；
- 尺寸未就绪时图片节点已挂载，且能够正常触发加载；
- React Native `Image` 与 `FastImage` 使用相同的状态模型；
- `<image>` 的 `bindload`/`binderror` 对外语义保持不变；
- SVG `onLayout` 与容器 `onLayout` 无论谁先到达，最终计算结果一致；
- SVG 只在布局计算条件满足时一次性更新 React 尺寸状态；
- 不新增业务 API，不改变渐变背景和无需原图尺寸的普通图片展示行为。

## 非目标

- 不在本次方案中新增跨实例或全局图片尺寸缓存；
- 不修改 `renderImage` 对 React Native `Image`/`FastImage` 的选择策略；
- 不调整图片下载、磁盘缓存、预加载和解码策略；
- 不改变 Web 端图片或滚动组件行为；
- 不扩展 background-image 的语法能力；
- 不使用 `onLoad` 替代 SVG 当前的 `onLayout` 链路；
- 不解析 SVG XML 的 `width`、`height` 或 `viewBox` 来推导源文件固有尺寸；
- 不在本次方案中重写 `react-native-svg` 的渲染和错误处理能力。

## 非 SVG 统一链路

```text
src 变化
  │
  ├─ 生成 sourceKey，当前尺寸只接受相同 sourceKey 的结果
  │
  ├─ 立即挂载实际 Image/FastImage
  │    └─ 待计算时使用 1 × 1、opacity: 0 的临时样式
  │
  ├─ 容器 onLayout（仅需要时）
  │    └─ 保存容器尺寸
  │
  └─ 图片 onLoad（非 SVG 实际图片统一监听）
       ├─ RN Image：读取 nativeEvent.source.width/height
       ├─ FastImage：读取 nativeEvent.width/height
       ├─ 校验事件仍属于当前 sourceKey
       ├─ 保存原图尺寸
       ├─ 原图尺寸和容器尺寸满足计算条件后更新布局
       ├─ 显示图片
       └─ <image> 独立触发 bindload
```

核心约束是：图片是否可以按最终样式显示由“当前 `sourceKey` 的尺寸是否就绪”决定，而不是由某个异步回调是否曾经执行过决定。

## 状态模型

### 1. 图片尺寸携带来源标识

尺寸状态不能只保存宽高，必须同时记录对应的图片来源：

```ts
interface ResolvedImageSize {
  sourceKey: string
  width: number
  height: number
}
```

消费尺寸时始终做来源匹配：

```ts
const currentImageSize = imageSizeInfo?.sourceKey === sourceKey
  ? imageSizeInfo
  : null
```

这样 `src` 从 A 切到 B 的首次 render 会立即把 A 的尺寸视为无效，不需要等待 `useEffect` 再清空状态，也不会用 A 的比例短暂计算 B。

### 2. 使用 `sourceKey` 隔离动态图片

`sourceKey` 同时用于：

- 判断尺寸是否属于当前图片；
- 作为实际图片节点的 `key`，切换来源时重建底层图片节点；
- 在 `onLoad`/`onLayout`/`onError` 中拒绝已经过期的原生事件。

字符串 URL 直接使用 URI；本地静态资源使用 `Image.resolveAssetSource` 得到的 URI。`resolveAssetSource` 只用于标识资源和 SVG 判断，不再用于提供尺寸。source 类型、RN Image/FastImage 渲染器等会改变底层节点身份的字段也应纳入 key，或由 React 的组件类型变化保证重建。

如果图片 source 除 URI 外还包含会改变资源内容的 header 等字段，`sourceKey` 需要包含这些有效字段。调用方若以相同 URI 表达不同内容，也应通过 query 或 source 字段使资源身份发生变化。

图片节点的 `key` 是主要隔离手段。组件内可额外用 `useLayoutEffect` 同步 `currentSourceKeyRef`，在原生层仍投递已卸载节点事件时进行防御性校验；不要在 render 阶段递增请求序号或修改 ref。

### 3. 就绪条件由输入推导

不要继续维护一个可能和输入脱节的 `show` 布尔状态。显示条件应由当前输入和已解析状态推导：

```ts
const imageSizeReady = !needImageSize || !!currentImageSize
const layoutReady = !needLayout || !!layoutInfo
const backgroundReady = imageSizeReady && layoutReady
```

对于 `<image>`，同样用当前来源尺寸、当前容器尺寸以及 mode 推导是否可以生成最终样式。

### 4. `onLoad` 事件尺寸归一化

React Native `Image` 和 `FastImage` 的事件结构不同，增加一个内部小工具统一读取：

```ts
function getLoadedImageSize (evt: NativeSyntheticEvent<ImageLoadEventData>) {
  const nativeEvent = evt.nativeEvent
  const source = nativeEvent.source
  const width = source?.width || nativeEvent.width || 0
  const height = source?.height || nativeEvent.height || 0

  return width > 0 && height > 0
    ? { width, height }
    : null
}
```

该工具只负责兼容事件结构，不发请求、不缓存、不提供默认宽高。若两个消费点的类型声明存在差异，可把入参约束为包含 `nativeEvent` 的最小结构，避免使用 `any` 扩散到业务计算。

### 5. 非法尺寸不进入布局状态

只有 `width > 0 && height > 0` 时才把尺寸标记为就绪。事件缺失尺寸时：

- 不回退到 `Image.getSize`；
- 不使用上一个 `src` 的尺寸；
- 不写入 `0` 或默认尺寸冒充原图尺寸；
- 开发环境输出一次可定位的 warning；
- `<image>` 的 `bindload` 仍由真实加载事件触发，不和内部“尺寸已就绪”状态绑定；异常情况下事件未携带有效尺寸时，detail 明确返回 `{ width: 0, height: 0 }`，同时不把内部布局标记为 ready。

### 6. 提前采集，按需消费

非 SVG 的实际图片节点统一绑定内部 `onLoad` 并记录当前来源尺寸，即使当前 mode 或 background-size 暂时不需要原图比例。原因是消费条件本身可以动态变化：

- `<image>` 可能从 `scaleToFill` 切换到 `widthFix`；
- background-size 可能从固定数值切换到 `auto`、`contain` 或 `cover`；
- 图片在切换前可能已经加载完成，之后新增 handler 不会让 `onLoad` 重新触发。

记录尺寸不等于立即执行布局计算。无需原图尺寸时只保存当前来源的轻量尺寸信息，不运行 mode/background 计算；消费条件变化触发的正常 render 可以直接读取已记录尺寸，不重新挂载或请求图片。若使用 state 会造成无消费者场景的额外 render，可使用带 `sourceKey` 的当前尺寸 ref，并仅在当前确有消费者时更新 version。

## `<image>` 改造

涉及文件：

- `packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx`
- 可能复用的事件尺寸工具位于 `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

### 删除旧链路

- 删除内部 `getImageSize` 尺寸获取函数；
- 删除 layout mode 中调用 `Image.getSize`/`resolveAssetSource` 获取宽高的 effect；
- 删除依赖 getSize 成功或失败才挂载图片的逻辑；
- `resolveAssetSource` 仅保留 source 标准化、URI 提取和 SVG 判断用途；
- `onImageLoad` 不再在事件缺少尺寸时回退到 `getImageSize`。

### 图片始终挂载

`widthFix`、`heightFix` 和裁剪类 mode 当前会在 `loaded` 后才渲染内部图片。改造后外层容器和实际图片同时挂载：

- 最终尺寸可计算时使用现有 `modeStyle`；
- 尚未取得原图尺寸时，内部图片使用非零临时样式，例如 `{ width: 1, height: 1, opacity: 0 }`；
- 不使用 `display: none`、条件渲染或 `width/height: 0`；
- 外层容器可继续保留当前/default 尺寸，避免页面布局在图片加载前完全塌陷；
- 当前图片尺寸就绪后再显示，不允许新图片以旧图片比例短暂出现。

临时样式只应用于内部实际图片，不覆盖外层 `<image>` 节点对外暴露的默认尺寸和布局信息。

### 合并 `onLoad` 内部处理与公开事件

所有非 SVG 实际图片节点都绑定统一内部 `onLoad`，保证动态 mode 切换后仍可消费已经完成的加载结果。用户是否绑定 `bindload` 只决定是否分发公开事件，不决定内部 handler 是否存在。

处理顺序为：

1. 从事件归一化宽高；
2. 校验 `sourceKey`；
3. 有有效宽高时记录当前来源尺寸；
4. 当前 mode 消费原图尺寸时再更新布局状态；
5. 用户绑定 `bindload` 时，基于同一次真实事件生成 Mpx `load` 事件并调用；
6. 不因为内部尺寸已经存在而跳过 `bindload`。

删除异步 `getSize` 后，`evt.persist()` 不再是内部回调所必需；若 `getCustomEvent` 同步完成事件转换，可以一并删除。

### 兼容两种事件结构

- React Native `Image`：尺寸通常位于 `evt.nativeEvent.source`；
- `FastImage`：尺寸通常位于 `evt.nativeEvent.width/height`。

两者必须进入同一个 `resolveImageSize` 流程，不能分别维护 ready 状态或回退策略。

### `onLoad` 与 `onLayout` 时序

保留当前容器 `onLayout` 的职责，但不假设事件先后顺序：

- `onLayout` 先发生：保存容器尺寸，等待当前图片 `onLoad`；
- `onLoad` 先发生：保存当前图片尺寸，等待需要的容器 `onLayout`；
- 两者均满足后：调用现有 `setViewSize` 和 mode 计算逻辑；
- 容器后续尺寸变化：复用已加载的当前图片尺寸重新计算，不重新加载图片。

`widthFix` 只需容器宽度和图片比例，`heightFix` 只需容器高度和图片比例；裁剪类 mode 仍需完整容器宽高。现有计算函数和 mode 映射保持不变。

### `src` 变化

`src` 变化后的 render 立即发生以下变化：

- 新 `sourceKey` 使旧尺寸失效；
- 图片节点因 `key` 变化重新挂载；
- 新图片进入透明待加载状态；
- 外层容器可暂时保留上一次或默认布局尺寸，但内部新图片不使用旧比例；
- 新 `onLoad` 到达后使用新尺寸完成布局并显示。

旧图片的迟到 `onLoad`/`onError` 必须被当前 source 校验拒绝，不能覆盖新图片的状态，也不能触发新图片对应的公开事件。

### 错误处理

- 当前来源加载失败时触发现有 `binderror`；
- 不恢复旧图片尺寸，不把失败标记为 ready；
- 不新增 getSize 兜底；
- 错误后若切换到新 `src`，新节点按完整加载流程重新开始。

### SVG `onLayout` 状态修复

SVG 继续使用实际 `SvgCssUri`/`LocalSvg` 节点的 `onLayout` 尺寸，不接入非 SVG 的 `onLoad` 事件归一化工具。需要修复的是当前 `onSvgLoad` 对事件顺序的处理。

当前逻辑只暂存高度：

```ts
state.current.imageHeight = height
setImageHeight(height)
state.current.ratio = !width ? 0 : height / width
```

但容器 `onLayout` 的恢复条件要求 ref 中同时存在 `imageWidth`、`imageHeight` 和 ratio。改造后先完整、同步地保存本次 SVG 布局结果：

```ts
const ratio = width ? height / width : 0

state.current.imageSourceKey = sourceKey
state.current.imageWidth = width
state.current.imageHeight = height
state.current.ratio = ratio
```

若继续沿用当前扁平的 `ImageState`，需增加 `imageSourceKey?: string`；容器 `onLayout` 恢复计算前同时校验它等于当前 `sourceKey`。如果非 SVG 改造已经把尺寸收敛为 `ResolvedImageSize`，SVG 直接复用该带来源标识的状态结构，不再增加平行字段。

只有当前 mode 所需的容器尺寸已经存在时，才一次性更新 React state：

```ts
if (state.current.imageSourceKey === sourceKey && (isWidthFixMode
  ? state.current.viewWidth
  : isHeightFixMode
    ? state.current.viewHeight
    : state.current.viewWidth && state.current.viewHeight)) {
  setRatio(ratio)
  setImageWidth(width)
  setImageHeight(height)
  setViewSize(state.current.viewWidth, state.current.viewHeight, ratio)
}
```

同时删除条件判断前的 `setImageHeight(height)`：

- 条件满足时，分支内部已经更新相同 state；
- 条件不满足时，ratio 仍为 0，`modeStyle` 不消费单独变化的 imageHeight；
- `bindload` 直接使用事件局部变量，不依赖 React state；
- 删除后避免一次没有可见结果的中间 render。

修复后的两个事件顺序必须等价：

```text
容器 onLayout → SVG onLayout
  └─ SVG 事件读取已有容器尺寸，直接完成计算

SVG onLayout → 容器 onLayout
  ├─ SVG 事件完整暂存 width/height/ratio
  └─ 容器事件读取完整暂存结果，完成计算
```

SVG 的 width/height 仍表示 `react-native-svg` 节点的实际布局尺寸，不宣称是 SVG 文件的固有尺寸。动态 `src` 场景下，该尺寸也必须携带 `sourceKey`，旧 SVG 节点的迟到 `onLayout` 不能覆盖当前来源。

公开事件保持现状：`bindload` 仍由 SVG `onLayout` 生成，detail 使用同一次事件的 width/height；本次不把它改造成资源网络加载完成事件。

## `view + background-image` 改造

涉及文件：

- `packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx`
- 与 `<image>` 共用时，事件尺寸归一化工具位于 `utils.tsx`

### 删除旧链路

- 删除 `Image.getSize` 调用；
- 删除 `sizeCacheRef`；
- 删除 getSize 回调的取消标识和回调驱动的 `show`；
- 删除仅为触发 getSize/隐藏节点而存在的平台分支；
- 保留 `backgroundSize`、`backgroundPosition`、`imageStyleToProps` 等现有计算函数。

本地或跨组件尺寸缓存不在此次替代方案中保留。实际图片组件自身已有资源缓存能力，布局尺寸状态只服务于当前组件和当前 source。

### 实际背景图片始终存在

当 `type === 'image' && src` 时始终渲染实际 `Image`/`FastImage`：

- 不需要原图尺寸和容器尺寸时，直接使用最终样式显示；
- 仅等待容器布局时，使用临时透明样式挂载，布局就绪后切换最终样式；
- 需要原图尺寸时，通过同一节点的 `onLoad` 获取；
- 同时需要原图尺寸和容器尺寸时，二者都就绪后计算最终样式；
- pending 与 ready 阶段保持相同 `sourceKey`，只更新样式，不二次挂载和二次请求。

临时节点必须是将来真正显示的背景图片节点，而不是额外创建一张仅用于测量的隐藏图片。

### 状态更新

删除 URI → Size 的 `sizeCacheRef` Map，但保留组件当前来源的轻量尺寸状态。建议把 `sizeInfo` 改为带 `sourceKey` 的 ref，把 `layoutInfo` 保留为容器 ref，并继续用 version 驱动确有消费者的重算：

- 当前 `needImageSize` 为 true 时，尺寸 ref 更新后有明确的 version 更新驱动重算；
- 当前 `needImageSize` 为 false 时只记录尺寸，不触发无效 render；后续 background-size 变化产生的 render 会直接消费该 ref；
- `currentImageSize` 按 `sourceKey` 派生；
- `backgroundReady` 按当前输入派生；
- src 变化不依赖 effect 清空旧 ref；
- 相同宽高不重复触发 render。

`show` 状态不再保留，避免它和 ref/version 形成第二套就绪状态。若实际实现改用直接的 `useState`，也必须满足相同 source 隔离，并确认固定 background-size 场景新增的一次 render 可以接受。

### 背景图片 `onLoad`

所有非 SVG 背景图片都保留内部 `onLoad` 来采集尺寸；仅当 `needImageSize` 为 true 时，事件才更新 version 并驱动布局计算。固定数值 background-size 等不消费原图尺寸的场景只写当前来源尺寸 ref，不额外 render。

处理流程为：

1. handler 闭包携带本次渲染的 `sourceKey`；
2. 归一化 RN Image/FastImage 的事件尺寸；
3. 拒绝非当前 source 的事件；
4. 保存 `{ sourceKey, width, height }`；
5. 当前 `needImageSize` 为 true 时，与 `layoutInfo` 一起驱动 `imageStyleToProps`；
6. 用最终背景样式显示同一个图片节点；
7. 后续 background-size 从固定值切换为需要原图比例时，直接消费已保存的当前尺寸。

`view` 的 background-image 当前没有对外 `bindload`/`binderror`，本次不新增公开事件。尺寸无效或加载失败时保持背景不可见，并在开发环境提供诊断信息。

### 渐变背景保持原样

`linear-gradient` 不依赖图片加载事件：

- `type === 'linear'` 继续只依赖现有 layout 计算；
- 不为渐变创建 Image 节点；
- 不将图片 source 状态混入渐变状态；
- 斜向渐变、百分比尺寸等现有逻辑不在本次重构范围内。

## 关键时序

### 初次加载

```text
render(source=A)
  ├─ mount Image(A, 1×1, opacity=0)
  ├─ onLayout(container)
  └─ onLoad(A, intrinsicSize)
       └─ calculate → render Image(A, finalStyle, opacity=1)
```

`onLoad` 和 `onLayout` 顺序反转时结果相同。

### 快速切换来源

```text
render A → mount key=A
render B → unmount key=A, mount key=B, A size immediately invalid
onLoad A → sourceKey mismatch, ignore
onLoad B → accept B size, calculate and show B
```

即使 A 的事件晚于 B，也不能把 B 从 ready 状态覆盖回 pending。

### 容器尺寸变化

```text
Image(A) already loaded
onLayout(new container size)
  └─ reuse current A intrinsic size → recalculate style
```

容器变化不触发新的图片请求，也不需要再次等待 `onLoad`。

## 兼容性与取舍

### 收益

- 避免 `Image.getSize` 不回调导致永久不显示；
- 每张图片只保留实际渲染组件这一条加载链路；
- RN Image/FastImage 行为由同一事件归一化层收敛；
- 移除尺寸缓存、取消标志、双回调竞态和多组 show 状态；
- 动态 `src` 的正确性可以通过 sourceKey 明确定义和测试。

### 代价

- `widthFix`、`heightFix`、裁剪 mode 和依赖原图比例的背景，需要在真实图片加载后才能得到最终布局；
- 本地静态资源即使能从 `resolveAssetSource` 同步取得宽高，也统一等待 `onLoad`，会多一次 pending → ready render；
- pending 阶段可能暂时保留默认或旧的外层占位尺寸，但不会显示使用错误比例的新图片。

这些代价是单一事实来源的直接结果。现有 `getSize` 同样需要等待资源信息，并不能消除首次尺寸计算；统一 `onLoad` 后反而减少了一条可能重复的请求和状态链路。

### 平台范围

方案应在 iOS、Android 和 Harmony RN 输出上采用相同逻辑，不设置 iOS 专用的隐藏图片分支。平台差异只允许存在于底层事件结构归一化中。

## 实施步骤

建议基于当前本地代码按以下提交顺序完成，便于逐步审查和回滚：

1. 增加 RN Image/FastImage 的 `onLoad` 尺寸归一化工具及单元测试；
2. 改造 `mpx-image.tsx`，移除 getSize，确保 layout mode 始终挂载实际图片；
3. 在 `mpx-image.tsx` 中补全 SVG width/height/ratio 暂存并删除提前的 `setImageHeight`；
4. 补齐 `<image>` 非 SVG/SVG 的 mode、事件顺序和动态 src 测试；
5. 改造 `mpx-view.tsx`，移除 getSize、尺寸缓存和 show 状态；
6. 补齐 background-image 尺寸、布局时序和动态 src 测试；
7. 在 RN Image/FastImage 两种配置下执行相关 eslint、jest 和必要的真机回归。

事件尺寸工具只有在两处事件结构完全一致时才抽到 `utils.tsx`。若类型或错误语义不同，保留两个很小的局部函数，避免为了复用引入复杂抽象。

## 测试方案

### 尺寸事件归一化

- RN Image：读取 `nativeEvent.source.width/height`；
- FastImage：读取 `nativeEvent.width/height`；
- source 尺寸优先级明确；
- 缺失、0 或负数尺寸返回 null；
- 不调用 `Image.getSize`。

### `<image>`

- `widthFix`：onLayout → onLoad 与 onLoad → onLayout 结果一致；
- `heightFix`：按原图比例计算最终宽度；
- 裁剪类 mode：取得原图尺寸后计算缩放与定位；
- pending 阶段实际图片已挂载，样式非 0 且透明；
- `scaleToFill`、`aspectFit`、`aspectFill` 等无需内部尺寸的模式不增加无效状态更新；
- 从 `scaleToFill` 动态切换到 `widthFix` 时，复用已采集尺寸且不重新请求图片；
- RN Image 与 FastImage 均能驱动相同布局；
- A → B 快速切换时，A 的迟到事件不改变 B 状态；
- B 已 ready 后 A 再迟到，B 不退回 pending；
- `bindload` 每次真实加载只触发一次，并携带对应来源尺寸；
- 内部已经取得尺寸时仍正常触发 `bindload`；
- 当前来源错误触发 `binderror`，不复用旧尺寸；
- 远程 URI 与本地静态资源均覆盖；
- SVG 继续通过 `onLayout` 获取节点布局尺寸，不调用 `Image.getSize` 或位图 `onLoad` 工具；
- 容器 `onLayout` → SVG `onLayout` 时正确计算最终尺寸；
- SVG `onLayout` → 容器 `onLayout` 时，ref 已完整保存 width/height/ratio，后续正确恢复计算；
- SVG 未满足容器计算条件时不提前发布只有 imageHeight 的 React state；
- SVG `bindload` 仍携带同一次 `onLayout` 的 width/height；
- `SvgCssUri` 与 `LocalSvg` 均覆盖；
- SVG 动态 A → B 时，A 的迟到 `onLayout` 不覆盖 B 的尺寸。

### `view + background-image`

- 固定 background-size 不依赖原图尺寸；
- 固定 background-size 动态切换到 `auto/contain/cover` 时，复用已采集尺寸且不重新请求图片；
- `auto auto` 使用原图宽高；
- `auto + 数值/百分比` 和 `数值/百分比 + auto` 按比例计算；
- `contain`、`cover` 在不同容器比例下计算正确；
- 百分比 background-position 同时消费图片尺寸和容器尺寸；
- onLayout → onLoad 与 onLoad → onLayout 结果一致；
- pending 阶段同一个背景图片节点已挂载且透明；
- ready 后只更新样式，不因测量额外挂载第二张图片；
- A → B 以及 A → B → A 时尺寸不串用；
- 图片加载失败时不显示错误比例背景；
- RN Image/FastImage、iOS/Android/Harmony 的状态判断一致；
- linear-gradient 相关现有测试保持通过。

建议新增或扩展：

- `packages/webpack-plugin/test/runtime/react-native/mpx-image-size.spec.ts`；
- `packages/webpack-plugin/test/runtime/react-native/mpx-view-background-image.spec.ts`。

测试中应把 `Image.getSize` mock 为抛错或记录调用，并断言相关场景调用次数为 0，避免未来重新引入双链路。

## 验收标准

- 非 SVG 原图尺寸链路中不存在 `Image.getSize` 调用；
- `<image>` layout mode 与需要原图尺寸的 background-image 在 pending 阶段都已挂载实际图片；
- pending 图片使用非零尺寸且不可见；
- 当前布局只消费当前 `sourceKey` 的尺寸；
- 动态 `src` 和迟到事件不会发生跨来源污染；
- RN Image 与 FastImage 的加载事件都能得到正确尺寸；
- `bindload`/`binderror` 语义不依赖内部尺寸 ready 状态；
- SVG `onLayout` 会完整暂存当前来源的 width/height/ratio；
- SVG 不再在布局条件不足时单独调用 `setImageHeight`；
- SVG 与容器 `onLayout` 的先后顺序不影响最终 mode 计算；
- SVG 仍使用节点布局尺寸并维持现有 `bindload` 语义；
- linear-gradient 行为无回归；
- 相关 eslint 与 jest 全部通过；
- 至少完成 iOS 低版本设备或等价环境、Android 和 FastImage 开关的人工回归。

## 回滚策略

改造按组件拆分提交：

- 若 `<image>` 出现回归，可单独回滚 `mpx-image.tsx` 与对应测试；
- 若 background-image 出现回归，可单独回滚 `mpx-view.tsx` 与对应测试；
- 事件尺寸归一化工具只有在无调用方后再回滚。

SVG 修复与非 SVG onLoad 改造应拆成可独立回滚的提交：SVG 回滚只恢复 `onSvgLoad` 及其测试，不影响位图尺寸来源。非 SVG 回滚只恢复具体组件实现，不保留一半 getSize、一半 onLoad 的临时双链路；若必须短期恢复旧实现，应完整恢复该组件原链路并记录平台问题，避免重新引入两个并发尺寸来源。

## 与既有方案的关系

本方案是图像原始尺寸获取链路的专项决策，实施时优先级高于以下既有文档中的相关段落：

- [`rn-local-image-support.md`](rn-local-image-support.md) 中通过 `getImageSize`/`resolveAssetSource` 获取尺寸的建议，由本方案的真实节点 `onLoad` 取代；本地资源 source 转换和 SVG 判断仍保留；
- [`rn-mpx-view-performance-optimization.md`](rn-mpx-view-performance-optimization.md) 中针对 `Image.getSize` 增加尺寸缓存的建议不再实施；其他与背景计算和渲染性能有关的结论仍有效；
- [`rn-mpx-image-performance-optimization.md`](rn-mpx-image-performance-optimization.md) 中不引入全局尺寸缓存的方向与本方案一致，其余优化建议不受影响。

如果后续实现与这些文档发生冲突，以本方案对“非 SVG 原图尺寸来源、source 隔离、pending 挂载方式，以及 SVG onLayout 完整状态暂存”的定义为准。
