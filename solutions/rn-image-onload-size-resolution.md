# Mpx2RN 图像尺寸链路统一方案（位图 `onLoad + getImageSize` / SVG `onLayout`）

## 结论

对于 Mpx2RN 中的非 SVG `<image>` 和位图 background-image，都同时从实际渲染节点的 `onLoad` 和缓存未命中时主动执行的 `getImageSize` 获取原图尺寸。只有 `<image>` 支持 SVG，并继续以 `react-native-svg` 节点的 `onLayout` 作为尺寸来源。三类结果不设计独立的存储或通知链路，全部进入各自组件内统一的尺寸提交入口：先校验有效宽高，再和组件实例内 `imageSizeCacheRef.current[sourceKey]` 逐项比较；结果变化时先更新对应缓存项，且只有结果属于当前 `sourceKey`、当前 mode、`background-size` 或 `background-position` 确实需要刷新视图时才递增 version。切回已有缓存的 source 时，props render 直接读取缓存并生成最终样式，不重新等待 getSize、onLoad 或 `<image>` 的 SVG onLayout。`getImageSize` 只由支持的位图 source 在缓存未命中时通过 effect 启动，`<image>` 的 `onImageLoad` 不再执行 `getImageSize(src, triggerLoad)`；公开 `bindload`/`binderror` 不参与内部 source 隔离和 ready 判断，收到实际节点事件后直接透传，其中 `bindload` 的宽高兼容读取 RN Image 与 FastImage 各自的 `onLoad` 事件结构。`<image>` SVG 保留当前已经合入的完整尺寸暂存与事件顺序修复，但复用相同的缓存、提交和 version 发布逻辑。

`view + background-image` 当前只通过 React Native `Image`/`FastImage` 渲染 `url(...)`，没有 `SvgCssUri`/`LocalSvg` 节点，也没有 SVG `onLayout` 尺寸链路。本方案不补充 background-image 的 SVG 渲染能力；解析出 SVG URI 时复用现有 `svgRegExp` 识别，调用 `error` 输出不支持提示并丢弃该背景，不启动 `getImageSize`，不创建图片节点，也不写入尺寸缓存。

对于 `view + background-image`，`backgroundSize()` 是 CSS `background-size` 的唯一尺寸决策层：它负责生成背景图片的最终绘制矩形，React Native `Image`/`FastImage` 统一使用 `resizeMode: 'stretch'` 将位图填满该矩形。`cover` 的超出裁剪由计算后的图片矩形和外层 `overflow: hidden` 完成，不再交给底层 Image 的 `cover` 做第二次缩放决策。

本方案同时覆盖：

- `<image>` 的 `widthFix`、`heightFix` 和裁剪类 mode；
- `view` 的位图 `background-image` 在 `background-size: auto/contain/cover` 等需要原图比例的场景；
- React Native `Image` 与 `enable-fast-image` 两条渲染链路；
- 远程 URI 与本地静态资源；
- `<image>` 中 `SvgCssUri`/`LocalSvg` 的 `onLayout` 尺寸暂存与布局计算；
- `view` 遇到 SVG background-image 时的明确报错与丢弃行为。

图片在尺寸尚未就绪时仍立即挂载，但使用非零尺寸并设置透明，避免 `display: none`、条件渲染或 `0 × 0` 导致图片不发起加载。`onLoad` 或并行的 `getImageSize` 任一路先取得当前图片原始宽高后，即可完成布局计算和显示。`background-size: auto auto` 直接使用该原始宽高作为最终背景矩形，不按容器缩放。

`<image>` 和位图 background-image 统一采用“事实始终采集、渲染按需发布”的两层状态模型：支持的位图 source 缓存未命中时执行 `getImageSize`，实际图片的内部 `onLoad` 与承载容器的内部 `onLayout` 始终挂载；三路先把最新原图尺寸写入按 sourceKey 索引的缓存 ref、把容器尺寸写入布局 ref，只有当前 mode、`background-size` 或 `background-position` 确实消费对应事实，且当前 source 的事实足以改变最终输出时，才递增用于渲染通知的 version。这样动态切换 source 或消费条件时可以复用已经采集的事实，同时避免缓存写入和无需尺寸的场景产生额外 render。`<image>` SVG 仅将原图尺寸来源替换为节点 `onLayout`；SVG background-image 不进入该模型。

`<image>` 的容器布局只保留单份 `layoutInfoRef`，不按 mode 建立 Map。`layoutInfoRef` 只保存最近一次容器 `onLayout` 上报的 `{ width, height }` 测量事实；最终 view 尺寸和 `modeStyle` 仍由当前用户 style、当前 mode、当前 source 的原图尺寸以及这份布局事实在 render 中派生。`widthFix` 只消费容器 width，`heightFix` 只消费容器 height，裁剪类 mode 消费完整 width/height；派生出的另一轴尺寸和最终 style 都不能回写 `layoutInfoRef`。

两个组件的尺寸链路各自只保留单一 version 作为 ref 变化通知。`mpx-image` 不再双存 `viewWidth`、`viewHeight`、`imageWidth`、`imageHeight`、`ratio`、`loaded` 等可由当前输入与事实 ref 推导的 state；`mpx-view` 同样删除 `show`。version 不承载尺寸含义，只负责让异步 ref 变化在确有当前消费者时进入一次新的 render。mode、`background-size` 或 `background-position` 自身变化已经会触发 props render，不需要额外递增 version。

`<image>` SVG 不改为 `onLoad`，也不额外解析源文件的固有宽高；它仍从实际 SVG 节点的 `onLayout` 取得尺寸，但写入、缓存比较、迟到结果处理和 version 通知与位图完全一致，统一使用 `imageSizeCacheRef.current[sourceKey]` 和同一个 `commitImageSize`。切回已测量过的 SVG source 时同样直接复用缓存，后续真实 `onLayout` 若上报不同尺寸，再按统一规则更新缓存并按需递增 version。当前 `updateImageSize` 的完整暂存和事件顺序语义保留，不再继续维护独立的宽高、ratio、`loaded` 派生 state。该链路不适用于 background-image。

## 实施基线

本方案直接基于当前本地代码 `ec691d2f12aca37149dedd857237848cb79499cd` 落地：

- 以当前 `mpx-image.tsx`、`mpx-view.tsx` 的实现和测试为唯一代码基线；
- `mpx-image.tsx` 已通过 `updateImageSize` 统一 SVG `onLayout` 与非 SVG `getImageSize` 的尺寸写入；SVG 完整暂存和事件顺序语义视为既有基线，但存储与通知方式统一改为 ref + version；
- 不依赖任何尚未合入的分支、补丁或中间实现；
- 实施时从当前 `Image.getSize`、`loaded/show`、尺寸缓存和背景图 `resizeMode` 状态链路直接改造；
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
- `url(...)` 不区分位图与 SVG，统一交给 `Image`/`FastImage`；当前没有 background-image 专用的 SVG 组件和尺寸链路，SVG URI 也没有明确的不支持提示。

### `<image>` SVG

- 字符串资源渲染为 `SvgCssUri`，本地 asset 渲染为 `LocalSvg`；
- 两者通过 `onLayout` 的 `nativeEvent.layout.width/height` 获取实际布局尺寸，不调用 `Image.getSize`；
- 当前 `onSvgLoad` 已复用 `updateImageSize(width, height)`，同步把 `imageWidth`、`imageHeight` 和 ratio 完整写入 `state.current`；
- 只有当前 mode 所需的容器尺寸已经存在时，才一次性发布 React 尺寸 state 并调用 `setViewSize`；
- SVG `onLayout` 先于或晚于容器 `onLayout` 都能继续计算，原先缺失 `imageWidth` 和提前 `setImageHeight` 的问题已经修复；
- 当前尺寸状态尚未携带 source 标识，动态 `src` 的迟到事件隔离仍需纳入统一 `sourceKey` 方案。

实际位图组件必须完成加载才能展示，但 `onLoad` 与 `getImageSize` 的可用性、到达顺序在不同渲染器和平台上并不完全一致。非 SVG `<image>` 与位图 background-image 因此保留两条并行尺寸来源，由各自统一提交入口去重、隔离过期 source 并按需发布；`<image>` SVG 链路保留当前已经正确的 `onLayout + updateImageSize` 行为，三类结果都通过 source 标识解决动态来源隔离问题。SVG background-image 则在解析阶段明确报错并丢弃。

## 目标

- 非 SVG 图片同时从实际渲染节点的 `onLoad` 与缓存未命中时执行的 `getImageSize` 获取原始尺寸；
- 两路有效结果统一与 `imageSizeCacheRef.current[sourceKey]` 比较，相同结果不重复写入，不同结果更新对应缓存项，并且只在结果属于当前 source、当前派生输出需要变化时递增 version；
- `src` 切回已缓存的 sourceKey 时，在本次 props render 中直接使用缓存尺寸生成最终样式，不等待新的 `onLoad` 或 `getImageSize`；
- `src` 变更后，旧图片尺寸不能参与新图片布局；
- `onLoad`、`getImageSize` 和容器 `onLayout` 无论谁先到达，相同尺寸输入下最终计算结果一致；
- 非 SVG 图片的内部 `onLoad` 与相关容器的内部 `onLayout` 始终挂载并采集事实；
- 当前 mode/background 样式不消费某项事实时，只更新 ref，不产生对应的 React state render；
- mode、`background-size` 或 `background-position` 动态变为需要尺寸时，直接消费已采集事实，不等待事件重新触发；
- 尺寸未就绪时图片节点已挂载，且能够正常触发加载；
- React Native `Image` 与 `FastImage` 使用相同的状态模型；
- `<image>` 的 `bindload` 始终由真实 `onLoad` 同步触发，宽高兼容读取 RN Image 的 `nativeEvent.source.width/height` 与 FastImage 的 `nativeEvent.width/height`，不再调用 `getImageSize` 补查；`bindload`/`binderror` 不校验当前 source、不去重，也不受内部尺寸 ready 状态限制，收到实际节点事件后直接透传；
- `backgroundSize()` 独立完成背景图最终宽高计算，位图统一使用 `resizeMode: 'stretch'` 填充结果矩形；
- `background-size: auto auto` 使用当前图片原始宽高，不按容器执行 cover/contain 缩放；
- background-image 解析到 SVG URI 时明确报错并丢弃，不进入位图尺寸获取、缓存或渲染链路；
- 保持 SVG `onLayout` 与容器 `onLayout` 无论谁先到达都能得到相同结果；
- 保持 SVG 只在布局计算条件满足时递增 version，并补充动态 source 隔离；
- `<image>` SVG 与位图复用同一个 sourceKey 缓存、`commitImageSize` 和 version 发布规则，切回已测量 SVG 时直接使用缓存，不设计 SVG 专用链路；
- 不新增业务 API，不改变渐变背景和无需原图尺寸的普通图片展示行为。

## 非目标

- 不在本次方案中新增跨实例或全局图片尺寸缓存；
- 不为组件实例内缓存增加 LRU、TTL 或持久化能力，缓存随组件卸载释放；
- 不修改 `renderImage` 对 React Native `Image`/`FastImage` 的选择策略；
- 不调整图片下载、磁盘缓存、预加载和解码策略；
- 不改变 Web 端图片或滚动组件行为；
- 不扩展 background-image 的语法能力；
- 不使用 `onLoad` 替代 SVG 当前的 `onLayout` 链路；
- 不解析 SVG XML 的 `width`、`height` 或 `viewBox` 来推导源文件固有尺寸；
- 不在本次方案中重写 `react-native-svg` 的渲染和错误处理能力；
- 不新增 background-image 的 SVG 渲染与尺寸计算能力；
- 不为保证跨 mode 的原生节点身份而统一 `<image>` 现有 direct/layout render 树；mode 切换若因既有树结构导致节点重建，正确性仍不能依赖新节点再次触发 `onLoad`；
- 不为 `layoutInfoRef` 增加按 mode 分桶，也不处理 mode 切换前旧布局节点的 `onLayout` 迟到隔离；本方案以当前节点后续上报的容器布局为准。

## 统一尺寸缓存与提交链路

下图中的 SVG 分支只属于 `<image>`；background-image 在 `parseBgImage()` 识别到 SVG URI 后已经报错并返回空结果，不进入此流程。

```text
src 变化
  │
  ├─ 生成 sourceKey，读取 imageSizeCacheRef.current[sourceKey]
  │
  ├─ 缓存命中：本次 render 直接派生最终样式
  │
  ├─ 缓存未命中
  │    ├─ 非 SVG：为当前 source 启动 getImageSize
  │    │    └─ 有效结果进入 commitImageSize(sourceKey, width, height, 'getSize')
  │    └─ SVG：不启动 getImageSize，等待实际节点 onLayout
  │
  ├─ 立即挂载实际 Image/FastImage 或 SvgCssUri/LocalSvg
  │    └─ 非 SVG 待计算时使用 1 × 1、opacity: 0 的临时样式；SVG 保持现有挂载方式
  │
  ├─ 容器 onLayout（内部 handler 始终挂载）
  │    ├─ 保存最新容器尺寸到 ref
  │    └─ 当前消费的容器原始值变化并改变派生输出时才递增 version
  │
  └─ 实际图片节点的尺寸事件
       ├─ RN Image onLoad：读取 nativeEvent.source.width/height
       ├─ FastImage onLoad：读取 nativeEvent.width/height
       ├─ SVG onLayout：读取 nativeEvent.layout.width/height
       ├─ 有效结果全部进入同一个 commitImageSize
       └─ <image> 使用本次真实事件宽高同步透传 bindload，不调用 getImageSize，不校验当前 source

commitImageSize
  ├─ 校验 width/height
  ├─ 与 imageSizeCacheRef.current[targetSourceKey] 逐项比较
  ├─ 相同：不替换缓存项，不递增 version
  └─ 变化：更新 targetSourceKey 对应缓存项
       ├─ targetSourceKey 不是当前 sourceKey：只缓存，不通知
       ├─ 当前派生输出无需变化：结束
       └─ 当前派生输出发生变化：version + 1 → render
```

核心约束是：图片是否可以按最终样式显示由“尺寸缓存是否存在当前 `sourceKey` 的有效项”决定，而不是由某个异步回调是否曾经执行过决定。

## 状态模型

### 1. 按 `sourceKey` 缓存图片尺寸

图片尺寸 ref 保存为组件实例内、以 `sourceKey` 为 key 的对象；来源已经体现在对象 key 中，value 不再重复保存 `sourceKey`。`<image>` 的位图与 SVG 不区分数据结构，background-image 只保存通过 SVG 检查的位图尺寸：

```ts
interface ResolvedImageSize {
  width: number
  height: number
}

type ImageSizeCache = Record<string, ResolvedImageSize>

const imageSizeCacheRef = useRef<ImageSizeCache>(Object.create(null))
```

使用无原型对象避免 URI 等外部字符串命中特殊原型属性。写入时直接给目标 key 赋显式的 width/height 对象，不使用对象 spread。消费尺寸时只读取当前 key：

```ts
const currentImageSize = imageSizeCacheRef.current[sourceKey] || null
```

这样 `src` 从 A 切到 B 时，B 只会读取自己的缓存项，不会使用 A 的比例；B 切回 A 时，本次 props render 可以直接读取仍保留的 A 尺寸并生成最终样式，不需要等待 effect 清空/回填状态，也不等待新的 `onLoad` 或 `getImageSize`。

该缓存只存在于当前 `<image>` 或 background-image 组件实例内，组件卸载后自然释放，不跨实例、页面或应用共享。`<image>` 内位图与 SVG 共用同一对象：位图由 `onLoad/getImageSize` 写入，SVG 由 `onLayout` 写入；background-image 的缓存只接收位图 `onLoad/getImageSize` 结果，SVG URI 在创建 sourceKey 和启动查询前已经被丢弃。

### 2. 使用 `sourceKey` 隔离动态图片

`sourceKey` 同时用于：

- 索引组件实例内的图片尺寸缓存；
- 判断某次尺寸写入是否需要通知当前视图；
- 作为实际图片节点的 `key`，切换 URI 时重建底层图片节点。

`sourceKey` 先保持为简单的资源 URI：字符串 URL 直接使用原值，本地静态资源使用 `Image.resolveAssetSource` 得到的 URI。`resolveAssetSource` 同时用于 SVG 判断，并作为本地 asset 的 `getImageSize` 尺寸来源。`is-svg`、source 类型、RN Image/FastImage 渲染器和 headers 等其他字段本次不纳入 key，也不设计序列化或组合 key 规则。

该简化建立在“同一 URI 表达同一资源内容和尺寸语义”的约定上。调用方若需要让同一路径表达不同资源内容，应通过 query 等方式改变 URI。对于 `<image>`，若同一 URI 的内容原地变化，或同一 URI 在 SVG 与位图解释方式之间切换，允许首次 render 先复用已有尺寸，后续再由实际 `onLoad`、`getImageSize` 或 SVG `onLayout` 上报的新尺寸校正缓存。background-image 的 SVG URI 会在缓存之前被拒绝，不存在跨位图/SVG 复用。

组件内用 `useLayoutEffect` 同步 `currentSourceKeyRef`，只用于内部尺寸发布判断：迟到尺寸结果仍可写入它自己 targetSourceKey 的缓存项，但只有 targetSourceKey 等于当前 source 时才允许递增 version。公开 `bindload`/`binderror` 不读取 `currentSourceKeyRef`，不因 source 已变化而拦截迟到的实际节点事件。不要在 render 阶段递增请求序号或修改 ref。

### 3. 事实 ref 与 version 通知分离

原图尺寸和容器尺寸是事件事实，统一以 ref 保存；React state 只保留单一 version，承担“通知渲染重新读取事实”的职责，不能成为另一套独立事实源：

- `imageSizeCacheRef` 在 `<image>` 中统一保存位图与 SVG 尺寸，在 background-image 中只保存通过 SVG 检查的位图尺寸，结构均为 `{ [sourceKey]: { width, height } }`；
- `layoutInfoRef` 保存最近一次容器 `onLayout` 上报的 `{ width, height }`，不按 mode 或 sourceKey 分桶；
- 位图 `onLoad`/`getImageSize` 与 SVG `onLayout` 的有效结果都进入同一个 `commitImageSize(sourceKey, width, height, origin)`，不分别维护写入和通知逻辑；
- `commitImageSize` 每次写入前与 targetSourceKey 对应缓存项逐项比较 width/height，相同值不替换对象，也不触发后续发布；
- 当前消费条件通过 latest ref 保存，事件回调读取最新的 `needImageSize`、`needLayout`、mode 和 `sourceKey`，不能依赖可能过期的闭包；
- latest ref 在 `useLayoutEffect` 中同步，不在 render 阶段修改 ref；
- targetSourceKey 不是当前 source 时，只更新对应缓存项，不执行当前输出派生，也不更新 version；
- targetSourceKey 是当前 source 时，记录写入前后的事实快照，用当前消费需求判断 width/height 是否会改变派生输出；没有消费者、只改变了当前不消费的轴，或派生结果在写入前后都仍为 pending 时，只写缓存 ref，不更新 version；
- pending → ready、ready 下相关尺寸变化，以及 ready → pending 都必须递增 version。初次同时等待图片和容器时，先到事件只写 ref，最后补齐事实的事件负责递增一次 version。

`layoutInfoRef` 的 width/height 是同一容器最近一次真实布局的完整快照，但不同 mode 只读取自己的必要输入：

- `widthFix` 从当前 style 与 `layoutInfoRef.width` 确定有效容器宽度，再按当前图片比例派生最终高度；
- `heightFix` 从当前 style 与 `layoutInfoRef.height` 确定有效容器高度，再按当前图片比例派生最终宽度；
- 裁剪类 mode 使用当前 style 与 `layoutInfoRef` 的完整宽高计算图片定位；
- `scaleToFill`、非 SVG 的 `aspectFit`、`aspectFill` 等无需 JS 尺寸派生的 mode 不消费 `layoutInfoRef`。

用户 style、当前 source 图片尺寸和 mode 派生出的最终宽高只进入本次 render 的最终 style，不能写回 `layoutInfoRef`。mode 切换由 props render 触发，先使用这份最近布局事实按新 mode 重新派生；如果新 mode 使原生容器尺寸变化，随后到达的 `onLayout` 覆盖单份 `layoutInfoRef` 并按需递增 version 完成校正。本方案不为这个过渡过程维护 mode 级缓存。

结果合并规则保持简单且对称：同一 targetSourceKey 的后到有效结果与缓存项相同则直接去重；若宽高不同，则以后到结果覆盖该缓存项。方案不为位图两条来源设置隐式优先级，因此异常情况下同一位图 source 的 `onLoad` 与 `getImageSize` 上报不同尺寸时遵循“最后一个有效结果生效”；SVG `onLayout` 也走相同的覆盖规则。结果属于当前 source 且确实改变 ready 或最终尺寸/定位时才递增 version；结果属于非当前 source 时只更新缓存，切回该 source 的 props render 会自然读取最新项。

`commitImageSize` 的 `origin` 参数只用于诊断，不写入尺寸 ref，也不参与布局计算。伪代码如下：

```ts
function commitImageSize (targetSourceKey, nextSize, _origin) {
  if (!isValidSize(nextSize)) return

  const previousSize = imageSizeCacheRef.current[targetSourceKey]
  if (isSameImageSize(previousSize, nextSize)) return

  imageSizeCacheRef.current[targetSourceKey] = {
    width: nextSize.width,
    height: nextSize.height
  }

  if (targetSourceKey !== latestSourceKeyRef.current) return

  const previousOutput = deriveCurrentOutput(
    targetSourceKey,
    previousSize,
    layoutInfoRef.current
  )
  const nextOutput = deriveCurrentOutput(
    targetSourceKey,
    imageSizeCacheRef.current[targetSourceKey],
    layoutInfoRef.current
  )

  if (shouldRefreshView(previousOutput, nextOutput)) bumpVersion()
}
```

`deriveCurrentOutput`/`shouldRefreshView` 表示复用现有尺寸派生与逐轴比较逻辑。`origin` 可用于开发环境诊断，但“缓存旧值与新值不同”本身不等价于双路异常：同一 URI 内容变化或 SVG 重新布局都可能合法改变尺寸。只有实现额外确认同一次位图激活中的 `onLoad` 与 `getImageSize` 结果冲突时才输出双路不一致 warning，不为此影响缓存和发布主链路，也不要求为了方案形式额外抽象公共 Hook。

两个组件采用相同的发布方式：

- `<image>`：`modeStyle`、最终 view 尺寸和 ready 状态由当前 `mode`、`imageSizeCacheRef.current[sourceKey]`、容器尺寸 ref 与 version 在 render 中派生；位图与 SVG 不分叉存储，删除 `viewWidth`、`viewHeight`、`imageWidth`、`imageHeight`、ratio、`loaded` 等派生 state；
- `view + background-image`：`imageStyleToProps()` 继续直接读取 `imageSizeCacheRef.current[sourceKey]`，`backgroundReady` 由当前需求和 ref 派生，删除 `show`；
- 两处的 `onLoad`/`getImageSize`/`onLayout` 都通过同一判断规则决定是否递增 version：当前消费的原始值发生变化，并且该变化使 ready 或最终尺寸/定位结果发生变化；
- mode、`background-size`、`background-position` 和 `src` 变化本身已经触发 props render，该次 render 直接读取 ref；消费条件变化不额外递增 version，也不需要把 ref 再同步到一组尺寸 state。

version 只作为“当前 source 的异步事实变化”通知令牌，不参与 source 身份、缓存命中、就绪条件或最终尺寸计算。切换 source 本身已有 props render，缓存命中时不需要额外递增 version。两个组件可各自保留很小的 `bumpVersion` 和事实写入函数，无需为了形式统一抽取共享 Hook；现有 `setViewSize`、`backgroundSize` 等纯计算逻辑应改为返回派生结果后继续复用。

所有读取事实 ref 的派生 `useMemo` 必须把 version 以及对应的当前输入加入依赖。例如 `<image>` 至少依赖 `sourceKey`、mode、version 和影响外层尺寸的样式输入；背景图至少依赖 `preImageInfo` 与 version。这样异步事件通过 version 重算，动态消费条件通过 props 自身重算，两条入口最终执行同一套纯计算。

### 4. 就绪条件由输入推导

不要继续维护一个可能和输入脱节的 `show` 布尔状态。显示条件应由当前输入和已解析状态推导：

```ts
const imageSizeReady = !needImageSize || !!currentImageSize
const layoutReady = !needLayout || !!layoutInfo
const backgroundReady = imageSizeReady && layoutReady
```

对于 `<image>`，同样用当前来源尺寸、当前容器尺寸以及 mode 推导是否可以生成最终样式。

### 5. `onLoad` 事件尺寸归一化

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

该工具只负责兼容事件结构，不发请求、不缓存、不提供默认宽高。`<image>` 的 `onImageLoad` 只调用一次该工具：有效结果既进入内部 `commitImageSize`，也直接生成公开 `bindload.detail`；异常结果跳过内部提交，并同步使用 `{ width: 0, height: 0 }` 生成公开事件。因此应删除现有 `getImageSize(src, triggerLoad)` 分支，不能从 `onImageLoad` 再发起或等待尺寸查询；内层 `triggerLoad` 若保留，也只作为同步事件组装函数。若两个消费点的类型声明存在差异，可把入参约束为包含 `nativeEvent` 的最小结构，避免使用 `any` 扩散到业务计算。

### 6. 非法尺寸不进入布局状态

只有 `width > 0 && height > 0` 时才把尺寸标记为就绪。各尺寸来源统一遵循以下规则：

- `<image>` 只在当前非 SVG source 的缓存未命中时执行一次 `getImageSize`；background-image 则先拒绝 SVG URI，再在当前位图 source 缓存未命中时执行一次查询；远程字符串走 `RNImage.getSize`，本地 asset 走 `resolveAssetSource`；
- 支持的 RN Image 与 FastImage 都能从各自的 `onLoad` 事件结构取得 width/height；归一化结果异常时只视为该路没有内部布局候选，不额外再发起一次 `getImageSize`。缓存未命中时查询已经启动，缓存命中时继续使用已有值并等待真实 `onLoad` 校验；
- `<image>` SVG `onLayout` 的有效 width/height 进入相同的 `commitImageSize`，不单独维护 SVG 尺寸 ref 或通知函数；
- 各路结果都不使用其他 `sourceKey` 的尺寸，也不写入 `0` 或默认尺寸冒充图片尺寸；
- 各路有效结果都必须经过 `commitImageSize` 再次校验 `width > 0 && height > 0`；结果即使属于非当前 source，也可安全写入自己的缓存项，但不能通知当前视图；
- 任一路失败或返回非法尺寸时不写缓存、不标记 ready；位图另一条路径仍可独立完成尺寸提交；
- 对于非 SVG，只有两路都没有得到有效结果且当前 source 也没有缓存时，需要原图尺寸的布局才持续 pending。开发环境 warning 应区分 `onLoad` 事件结构异常、`getImageSize` 失败和已确认的同次双路尺寸不一致，避免把单路失败误报为整体加载失败；
- `<image>` 的位图 `bindload` 只使用同一次真实 `onLoad` 归一化出的宽高，不读取尺寸缓存，也不等待或调用 `getImageSize`。正常 RN Image/FastImage 事件都应携带对应路径的宽高；若事件异常缺失有效尺寸，内部布局不提交该路结果，但公开 `bindload` 仍同步触发并携带归一化后的 `{ width: 0, height: 0 }`，避免真实加载事件因为尺寸补查失败而丢失。SVG `bindload` 同理只使用本次 `onLayout` 的宽高，不从缓存回填公开事件。

### 7. 始终采集，按需通知和消费

支持的位图 source 只在缓存未命中时启动一次 `getImageSize`，实际图片节点统一绑定内部 `onLoad`；`<image>` 的 SVG 节点统一绑定内部 `onLayout`，承载图片布局的容器也统一绑定内部 `onLayout`。这些 handler 始终记录最新事实，即使当前 mode 或 background 样式暂时不需要对应尺寸。background-image 的 SVG URI 在此之前已经报错并丢弃，不参与事实采集。原因是消费条件本身可以动态变化：

- `<image>` 可能从 `scaleToFill` 切换到 `widthFix`；
- background-size 可能从固定数值切换到 `auto`、`contain` 或 `cover`；
- background-position 可能从固定偏移切换到 center/百分比定位；
- 图片在切换前可能已经加载完成，之后新增 handler 不会让 `onLoad` 重新触发。
- 容器在切换前可能已经完成首次布局，之后新增 handler 不能作为一定会补发 `onLayout` 的正确性前提。

记录尺寸不等于立即执行布局计算。无需原图或容器尺寸时只保存轻量事实，不更新 version。消费条件变化后，`<image>` 与 `mpx-view` 都在正常 props render 中直接读取缓存和布局 ref 并派生结果，不额外挂载测量节点，也不再次调用尺寸查询。背景容器未因样式切换改变布局时可以直接复用既有布局事实；`<image>` 切换 mode 时先按新 mode 消费单份 `layoutInfoRef`，若原生容器尺寸随之变化，再由后续 `onLayout` 更新事实并校正最终样式。`<image>` 若因现有 direct/layout render 分支切换而重建原生节点，原图尺寸正确性仍由 `imageSizeCacheRef` 保证，不依赖新节点再次触发 `onLoad`。

两个内部 handler 必须稳定存在，不能继续使用 `isLayoutMode ? onLayout : undefined` 或 `needLayout ? { onLayout } : {}` 这类条件挂载方式。是否消费只控制 version 通知和最终计算，不控制事实采集。

## `<image>` 改造

涉及文件：

- `packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx`
- 可能复用的事件尺寸工具位于 `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

### 调整旧链路

- 保留内部 `getImageSize` 小工具，由依赖 `sourceKey` 的 effect 仅在当前非 SVG source 的缓存未命中时调用，不再受 mode 或当前是否消费原图尺寸控制；
- `getImageSize` 成功结果与真实 `onLoad` 的有效结果都进入 `commitImageSize`；
- 删除 `onImageLoad` 中 `getImageSize(src, triggerLoad)` 的公开事件补查逻辑；主动 getSize effect 与 `bindload` 分发相互独立；
- 删除依赖 getSize 成功或失败才挂载图片的逻辑；
- `resolveAssetSource` 保留 source 标准化、URI 提取、SVG 判断，以及本地 asset 的 `getImageSize` 尺寸获取用途；
- mode effect、容器 `onLayout` 等其他入口不重复调用 `getImageSize`。

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

1. handler 闭包携带本次节点的 `targetSourceKey`，从事件归一化宽高；
2. 事件有有效宽高时调用 `commitImageSize(targetSourceKey, width, height, 'onLoad')`；事件缺尺寸时不重复发起查询；
3. `commitImageSize` 校验宽高，与 `imageSizeCacheRef.current[targetSourceKey]` 比较；尺寸变化时更新该缓存项，且仅在 targetSourceKey 仍为当前 source、当前 mode 的 ready 或最终尺寸/定位结果需要变化时递增 version；
4. 用户绑定 `bindload` 时，基于同一次真实事件归一化出的宽高生成 Mpx `load` 事件并同步调用；RN Image 读取 `nativeEvent.source.width/height`，FastImage 读取 `nativeEvent.width/height`；公开事件不校验 targetSourceKey 是否仍为当前 source；
5. 迟到节点的有效尺寸允许进入自己的缓存项，其 `bindload`/`binderror` 也按实际原生事件直接透传，不做 source 过滤或事件去重；
6. 事件缺少有效宽高时不调用 `getImageSize`，公开事件使用归一化后的 `0 × 0`；缓存未命中时内部布局继续等待已启动的 getSize，缓存命中时继续使用缓存；
7. 不因为内部尺寸已经存在而跳过当前节点的 `bindload`，也不因为主动 getSize 返回而触发或重复触发 `bindload`。

`bindload` 不再跨异步回调持有合成事件，因此同步删除当前 `evt.persist()`，也不引入待分发事件状态、source 判断或去重状态。内层 `triggerLoad` 可以保留为同步的事件组装函数，也可以直接内联；主动 getSize 结果只进入 `commitImageSize`，不能触发任何 source 的公开 `bindload`。

### 兼容两种事件结构

- React Native `Image`：尺寸通常位于 `evt.nativeEvent.source`；
- `FastImage`：尺寸通常位于 `evt.nativeEvent.width/height`。

两者必须进入同一个 `resolveImageSize` 流程，不能分别维护 ready 状态。归一化结果为 null 时，该次 `onLoad` 不提交候选尺寸；缓存未命中的 `<image>` 与 background-image 继续等待各自已经启动的 `getImageSize` 路径，缓存命中时继续使用缓存，不再由事件分支追加查询。

### `onLoad`、`getImageSize` 与 `onLayout` 时序

容器的内部 `onLayout` 始终传给 `useLayout`，不再使用 `isLayoutMode ? onLayout : undefined` 按 mode 动态挂载。handler 不假设事件先后顺序：

- `onLayout` 先发生：保存容器尺寸；若当前 mode 还在等待图片尺寸，只写 ref，不递增 version；
- `onLoad` 或 `getImageSize` 先得到有效尺寸：保存当前图片尺寸；若当前 mode 还在等待容器尺寸，只写 ref，不递增 version；
- 两者均满足后：由最后到达且改变事实的事件递增 version，render 复用现有 mode 计算逻辑派生最终结果；
- 当前 mode 不消费容器尺寸：`onLayout` 仍更新 ref，但不递增 version；
- 容器后续尺寸变化：只有当前 mode 实际消费的 width/height 轴发生变化并改变派生输出时才递增 version，并复用已加载的当前图片尺寸重新计算，不重新加载图片；
- mode 变化：props render 读取已缓存的当前图片尺寸和单份 `layoutInfoRef`，按新 mode 选择必要的容器轴重新派生，不额外递增 version；若 mode 使原生容器布局变化，后续 `onLayout` 再更新 `layoutInfoRef` 并按需递增 version 校正结果。

`widthFix` 只读取有效容器宽度并按图片比例派生高度，`heightFix` 只读取有效容器高度并按图片比例派生宽度；裁剪类 mode 仍需完整容器宽高。现有计算公式和 mode 映射保持不变，`setViewSize` 从写 state 的过程函数调整为返回最终尺寸的纯计算函数，供 render 派生结果时复用。所有派生尺寸只进入最终 style，不回写 `layoutInfoRef`。

### version 驱动的尺寸派生

删除宽高、ratio 和 `loaded` state 后，`<image>` 在 render 中基于当前输入和事实 ref 生成一份纯派生结果，至少包含 ready、最终 view 宽高、当前图片宽高、ratio 和 `modeStyle`。

派生函数的输入包括 `mode`、`isSvg`、当前 `sourceKey` 对应的图片尺寸和容器尺寸；对应 memo 的依赖至少包含 `mode`、`isSvg`、`sourceKey` 和 version。内部继续复用现有 `getFixedWidth`、`getFixedHeight`、fit/fill scale、裁剪定位等公式，不在事件回调中拼装最终样式。

version 只在 `onLoad`、`getImageSize` 或 `onLayout` 写入当前模式需要的新事实，且该事实改变派生输出时变化。mode 自身变化会使 memo 重新执行，所以 `widthFix → heightFix`、`scaleToFill → widthFix` 等切换会先基于单份 `layoutInfoRef` 按需取轴计算，不需要额外 effect 把 ref 发布到尺寸 state；切换导致的后续真实布局变化仍由 `onLayout` 正常校正。

### `src` 变化

`src` 变化后的 render 立即发生以下变化：

- 新 `sourceKey` 只读取自己的缓存项，不使用切换前 source 的尺寸；
- 图片节点因 `key` 变化重新挂载；
- 缓存命中时，本次 props render 直接用该 source 已有尺寸完成布局和显示，不启动新的 `getImageSize`；
- 缓存未命中时，新图片进入透明待加载状态，effect 启动一次 `getImageSize`，`onLoad` 或 getSize 任一路先提交有效尺寸后完成布局并显示；
- 外层容器可暂时保留上一次或默认布局尺寸，但内部新图片不使用其他 source 的比例。

旧图片的迟到尺寸结果按它自己的 targetSourceKey 写入缓存，但不能递增当前 source 的 version。迟到的 `onLoad`/`onError` 公开事件不做当前 source 校验，仍按实际原生事件直接透传；内部尺寸提交与公开事件分发互不限制。这样 A → B 期间迟到的 A 尺寸可以被缓存，之后 B → A 时能够直接复用，而不会污染 B 的内部布局。

### 错误处理

- 实际图片节点加载失败时直接触发现有 `binderror`，不校验该节点是否仍对应当前 source；
- 不使用其他 source 的尺寸，不把失败标记为 ready；当前 source 已有有效缓存时继续以缓存结果渲染；
- 不因为加载失败新增第二次 getSize 查询；当前 source 已启动的 getSize 路径仍可独立提交有效尺寸；
- 错误后若切换到新 `src`，新节点按完整加载流程重新开始。

### SVG 复用统一尺寸提交链路

SVG 继续使用实际 `SvgCssUri`/`LocalSvg` 节点的 `onLayout` 尺寸，不接入非 SVG 的 `onLoad` 事件归一化工具，也不调用 `getImageSize`。这只是尺寸来源不同；取得有效宽高后的缓存、比较、迟到结果处理和 version 发布全部复用统一链路。当前基线中 `updateImageSize(width, height)` 已验证以下行为，本次保留其计算与时序语义：

- 同步暂存 `imageWidth`、`imageHeight` 和 ratio；
- 只在当前 mode 所需的容器尺寸已经存在时发布渲染更新；
- 只在能够形成最终布局时生成最终 view 尺寸和 ready 结果；
- `onSvgLoad` 与位图 `onLoad/getImageSize` 复用同一个 `commitImageSize`。

SVG `onLayout` 调用 `commitImageSize(sourceKey, width, height, 'svgOnLayout')`，与 `imageSizeCacheRef.current[sourceKey]` 比较并更新同一个缓存对象；容器内部 `onLayout` 始终写入 `layoutInfoRef`。只有结果属于当前 source 且当前 mode 的派生输出需要变化时才递增同一个 version。ratio 在 render 中由当前缓存项计算，不单独存 state；最终 view 尺寸和 ready 同样由当前 mode、缓存与布局 ref 派生，不保留 `svgImageSizeRef`、SVG 专用缓存或 SVG 专用发布函数。

两个事件顺序继续保持等价：

```text
容器 onLayout → SVG onLayout
  └─ SVG 事件读取已有容器尺寸，直接完成计算

SVG onLayout → 容器 onLayout
  ├─ SVG 事件写入 imageSizeCacheRef[sourceKey]
  └─ 容器事件读取当前 sourceKey 的缓存项，完成计算
```

SVG 的 width/height 仍表示 `react-native-svg` 节点的实际布局尺寸，不宣称是 SVG 文件的固有尺寸。动态 `src` 场景下，旧 SVG 节点迟到的 `onLayout` 只更新自己的 sourceKey 缓存项，不能递增当前来源的 version，也不能把当前图片从 ready 状态改回 pending。切回已经测量过的 SVG 时直接使用缓存；新节点后续 `onLayout` 若得到不同尺寸，再通过同一个 `commitImageSize` 更新缓存并按需通知。

公开事件保持现状：`bindload` 仍由 SVG `onLayout` 生成，detail 使用同一次事件的 width/height；本次不把它改造成资源网络加载完成事件。handler 同样携带 targetSourceKey 供内部尺寸提交使用，但公开 `bindload` 不校验 targetSourceKey；迟到 `onLayout` 可以提交自己的缓存项，并直接透传对应的公开事件。

## `view + background-image` 改造

涉及文件：

- `packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx`
- 与 `<image>` 共用时，事件尺寸归一化工具位于 `utils.tsx`

### 调整旧链路

- 在 `parseBgImage()` 解析出 `url(...)` 的 URI 后先复用 `svgRegExp` 检查 SVG；命中时调用现有 `error` 提示并返回空解析结果，不生成 `type: 'image'`；
- 保留依赖 `sourceKey` 的主动 `getImageSize` effect，但移除 `needImageSize` 条件，仅在当前已通过 SVG 检查的位图 source 缓存未命中时执行查询；
- 将现有按 URI 缓存的 `sizeCacheRef` 改造成与 `<image>` 一致的 `imageSizeCacheRef.current[sourceKey]`，统一由 `commitImageSize` 读写；
- 删除回调驱动的 `show`；getSize 的迟到结果写入自己的 targetSourceKey 缓存项，但不通知当前视图，不依赖取消标识维护第二套有效性状态；
- 删除仅为触发 getSize/隐藏节点而存在的平台分支；
- 保留 `backgroundSize`、`backgroundPosition`、`imageStyleToProps` 等现有计算函数。

缓存只保留在当前 `mpx-view` 组件实例内，不增加跨组件或全局缓存。它可以保存当前实例访问过的多个 sourceKey；组件卸载后整体释放。

### SVG background-image 明确报错并丢弃

当前 background-image 的 `url(...)` 最终只会创建 React Native `Image`/`FastImage`，没有 `SvgCssUri`/`LocalSvg` 渲染分支。方案不把 `<image>` 的 SVG `onLayout` 链路错误复用到 background-image，而是在解析阶段直接拒绝 SVG URI：

```ts
const src = parseUrl(text)
if (src) {
  if (svgRegExp.test(src)) {
    error(`[mpx-view] background-image 暂不支持 SVG 资源，已丢弃，原值: ${text}`)
    return {}
  }
  return { src, type: 'image' }
}
```

检测规则复用 `<image>` 已使用的 `svgRegExp`，覆盖以 `.svg` 结尾以及带 query/hash 的 SVG URI，不另建一套扩展名判断。命中后的行为与其他不支持的 background-image 语法一致：保留 View 及其子节点，只丢弃该背景；不创建 `sourceKey`、不查询 `getImageSize`、不挂载 Image/FastImage、不写尺寸缓存，也不新增公开事件。错误由 `@mpxjs/utils` 的现有 `error` 输出，不额外抛出异常或维护去重状态；`parseBgImage()` 已由 `backgroundImage` 的 memo 输入约束调用频率。

### 实际背景图片始终存在

当 `type === 'image' && src` 且已经通过 SVG 检查时，始终渲染实际 `Image`/`FastImage`：

- 不需要原图尺寸和容器尺寸时，直接使用最终样式显示；
- 仅等待容器布局时，使用临时透明样式挂载，布局就绪后切换最终样式；
- 缓存未命中的位图 source 并行通过同一节点的 `onLoad` 与单次 `getImageSize` 获取原图尺寸；缓存命中时直接派生样式，并继续用真实 `onLoad` 校验缓存；
- 同时需要原图尺寸和容器尺寸时，二者都就绪后计算最终样式；
- pending 与 ready 阶段保持相同 `sourceKey`，只更新样式，不二次挂载和二次请求。

临时节点必须是将来真正显示的背景图片节点，而不是额外创建一张仅用于测量的隐藏图片。

### 状态更新

将 URI → Size 的 `sizeCacheRef` Map 收敛为与 `<image>` 相同的 `imageSizeCacheRef` 对象，key 使用完整 `sourceKey`，value 只保存 `{ width, height }`。删除只保存当前来源的 `sizeInfo`，把 `layoutInfo` 保留为容器 ref，并继续用 version 驱动确有消费者且派生输出发生变化时的重算：

- 当前 `needImageSize` 为 true 时，仅在被消费的原图尺寸变化使 ready 或最终矩形发生变化时递增 version；
- 当前 `needImageSize` 为 false 时只记录尺寸，不触发无效 render；后续 background-size 变化产生的 render 会直接消费该 ref；
- 当前 `needLayout` 为 false 时，容器 `onLayout` 同样只记录尺寸，不递增 version；为 true 时也只比较当前计算实际消费的 width/height 轴；
- `currentImageSize` 按 `sourceKey` 派生；
- `backgroundReady` 按当前输入派生；
- src 变化不依赖 effect 清空旧 ref；
- `onLoad` 与 `getImageSize` 都调用同一个 `commitImageSize`；相同 sourceKey/宽高不替换缓存项、不重复触发 render；非当前 source 的有效迟到结果只更新自己的缓存项。

`show` 状态不再保留，避免它和 ref/version 形成第二套就绪状态；本方案不再为尺寸增加对象或分字段 state。

### 背景图片双路尺寸提交

所有通过 SVG 检查的位图背景都保留内部 `onLoad`，并仅在当前 source 缓存未命中时启动一次 `getImageSize`；两路都只在结果属于当前 source、`needImageSize` 为 true，且写入前后的 ready 或最终背景矩形发生变化时更新 version 并驱动布局计算。固定数值 background-size 等不消费原图尺寸的场景只写对应 sourceKey 的缓存项，不额外 render。

处理流程为：

1. `parseBgImage()` 先拒绝 SVG URI；只有得到位图 `src` 时才生成 `sourceKey`，effect 读取 `imageSizeCacheRef.current[sourceKey]` 并在未命中时启动一次 `getImageSize`；
2. 背景图片 handler 携带本次节点的 `sourceKey`，归一化 RN Image/FastImage 的事件尺寸；
3. 两路有效结果分别调用 `commitImageSize(sourceKey, width, height, origin)`；事件缺尺寸时不追加 getSize 请求；
4. `commitImageSize` 拒绝非法尺寸，与 targetSourceKey 对应缓存项逐项比较，相同则结束，不同则更新该缓存项；
5. targetSourceKey 不是当前 source 时只缓存结果，不递增 version；
6. targetSourceKey 是当前 source，且当前消费的原图尺寸使 ready 或最终矩形发生变化时递增 version，pending → pending 不通知；
7. 用最终背景样式显示同一个图片节点；
8. 后续 background-size 从固定值切换为需要原图比例时，直接消费已保存的当前尺寸。

`view` 的 background-image 当前没有对外 `bindload`/`binderror`，本次不新增公开事件。SVG URI 的不支持错误在解析阶段输出；位图缓存未命中且 `onLoad` 与 `getImageSize` 都无有效尺寸时保持背景不可见，并在开发环境提供诊断信息。`getImageSize` 每次位图缓存未命中只查询一次；失败或非法结果不创建缓存项，之后切回该 source 时仍视为未命中并允许重试。

### 背景容器 `onLayout`

当背景包装 View 已存在时，内部 `onLayout` 始终挂载，不再使用 `needLayout ? { onLayout } : {}` 动态决定是否监听。handler 按以下规则处理：

1. 逐项比较并保存最新容器 width/height 到 `layoutInfoRef`；
2. 尺寸未变化时直接结束；
3. latest `needLayout` 为 false 时只保留 ref，不递增 version；
4. latest `needLayout` 为 true 时，只比较当前背景计算实际消费的 width/height 轴；变化前后都仍为 pending 时不递增 version；
5. 该变化使 ready、最终矩形或定位结果发生变化时递增 version，由 render 调用 `imageStyleToProps()`；
6. 后续 `background-size`/`background-position` 从无需布局切换为需要布局时，props render 直接复用已经采集的 `layoutInfoRef`，不等待 RN 补发 `onLayout`。

该规则同样覆盖渐变背景：固定尺寸或非斜向渐变只记录布局 ref，不产生无效 render；后续切换为百分比尺寸或需要容器宽高的斜向角度时直接复用已有布局事实。

### `background-size` 与 `resizeMode` 职责

当前 `backgroundSize()` 已经为每种支持的 `background-size` 生成 Image 的最终宽高，底层 `resizeMode` 不应再次实现 cover/contain。各模式的尺寸来源如下：

| `background-size` | 最终图片矩形 | 是否需要原图尺寸 | 是否需要容器尺寸 |
| --- | --- | --- | --- |
| `cover` | 比较容器和原图宽高比，计算能够覆盖容器的最小等比矩形 | 是 | 是 |
| `contain` | 比较容器和原图宽高比，计算能够完整放入容器的最大等比矩形 | 是 | 是 |
| `auto auto` | 直接使用原图自然宽高 | 是 | 否；background-position 另行需要时除外 |
| `数值/百分比 + auto` | 先确定宽度，再按原图比例计算高度 | 是 | 百分比时需要 |
| `auto + 数值/百分比` | 先确定高度，再按原图比例计算宽度 | 是 | 百分比时需要 |
| `数值/百分比 + 数值/百分比` | 两个轴分别使用声明值 | 否 | 百分比交给 RN 布局解析 |

`auto auto` 的具体流程为：未声明 `background-size` 时先归一化为 `['auto', 'auto']`；当前图片的 `onLoad` 或 `getImageSize` 任一路提交原图 width/height 后，直接把二者写入背景 Image style。图片不按容器缩放：比容器大时由外层 `overflow: hidden` 裁切，比容器小时剩余区域留空。`center` 或百分比 background-position 可能额外消费容器尺寸，但只计算偏移，不改变 `auto auto` 的图片宽高。

最终位图节点统一使用：

```ts
imageProps.resizeMode = 'stretch'
```

理由如下：

- `cover`、`contain` 和含单边 `auto` 的矩形已经按原图比例计算，`stretch` 填充相同比例的目标矩形不会造成变形；
- 双轴显式尺寸本来就允许分别缩放，必须使用 `stretch`；
- `auto auto` 的目标矩形就是原图自然尺寸，使用 `stretch` 不产生额外缩放；
- CSS `cover` 的裁切由超出容器的最终图片矩形和外层 `overflow: hidden` 实现；
- 继续使用 RN `cover` 等于在框架尺寸计算之后增加第二层缩放策略，正常比例下虽通常无视觉差异，但在取整、错误尺寸或动态来源状态串用时可能产生额外裁切。

实现时删除 `imageStyleToProps` 中普通图片默认的 `resizeMode: 'cover'`，改为统一的 `stretch`，同时删除仅在双轴数值分支中重复设置 `stretch` 的代码。动态来源的旧尺寸问题由 `sourceKey` 和 ready 推导解决，不使用 `cover` 作为兜底。

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
  ├─ cache miss → start getImageSize(A)
  ├─ mount Image(A, 1×1, opacity=0)
  ├─ onLayout(container)
  ├─ onLoad(A, intrinsicSize) ─┐
  └─ getImageSize(A) result ──┴─ first valid result may calculate and show
```

`onLoad`、`getImageSize` 和 `onLayout` 的到达顺序可任意交换。两条尺寸路径返回相同宽高时，第一条有效结果最多触发一次需要的 render，第二条在 ref 比较阶段直接去重。

### 双路尺寸不一致

```text
onLoad(A, 100×50)
  └─ ref: 100×50 → output changes → version + 1

getImageSize(A, 200×100)
  └─ differs from ref → ref: 200×100
       ├─ derived output unchanged → no version change
       └─ derived output changed → version + 1
```

两路理论上应返回相同原图尺寸，但平台或渲染器异常时可能不同。方案采用最后一个有效结果生效，不引入来源优先级；因此依赖绝对像素尺寸的模式可能出现第二次样式更新，开发环境需要记录不一致诊断。若两组尺寸比例相同且当前派生输出不变，只更新 ref，不额外 render。

### 快速切换来源

```text
render A → mount key=A
render B → unmount key=A, mount key=B, A size immediately invalid
onLoad/getImageSize A → cache under A only, do not notify B
onLoad/getImageSize B → update B cache, calculate and show B
```

即使 A 的事件晚于 B，也不能把 B 从 ready 状态覆盖回 pending。

### 切回已缓存来源

```text
render A → cache A = 100×50
render B → read/cache B only
render A again → read cache A and calculate immediately
  ├─ do not start getImageSize(A)
  └─ later onLoad/onLayout(A) → same result deduplicated; changed result updates cache as usual
```

`<image>` 的位图与 SVG，以及 background-image 的位图 A → B → A 都遵循这一时序。若 A 的尺寸是在 B 显示期间由迟到结果写入，切回 A 时同样直接命中；若位图 A 之前查询失败且没有任何有效结果，则没有缓存项，切回时重新启动 `getImageSize(A)`。SVG background-image 已在解析阶段丢弃，不参与该时序。

### 容器尺寸变化

```text
Image(A) already loaded
onLayout(new container size)
  └─ reuse current A intrinsic size → recalculate style
```

容器变化不触发新的图片请求，也不需要再次等待 `onLoad`。

### 动态切换消费条件

```text
render(fixed/scaleToFill)
  ├─ onLoad/getImageSize → imageSizeCacheRef[sourceKey]（不递增 version）
  └─ onLayout → layoutInfoRef（不递增 version）

render(cover/widthFix) caused by props change
  ├─ 读取图片尺寸缓存和单份 layoutInfoRef → 按当前 mode/样式派生
  └─ 若容器实际尺寸随 mode 变化 → 后续 onLayout 更新 layoutInfoRef 并校正
```

切换后不依赖新的图片加载，也不把“新增 handler 后 RN 是否补发历史事件”作为正确性前提，因为内部 `onLayout` 始终挂载。`<image>` 使用单份 `layoutInfoRef` 完成首次派生；若新 mode 改变容器实际尺寸，则以随后正常产生的 `onLayout` 为准完成校正。若切换时必要事实尚未发生，则保持 pending，由最后补齐事实的事件递增一次 version。

## 兼容性与取舍

### 收益

- `onLoad` 与 `getImageSize` 任一路成功都能提供原图尺寸，单一路径缺尺寸、失败或不回调时不再必然永久 pending；
- 缓存未命中的 source 查询不受当前消费条件限制，动态切换到需要原图尺寸的 mode/background-size 时更容易直接命中已采集事实；
- RN Image/FastImage 行为由同一事件归一化层收敛；
- `<image>` 位图、`<image>` SVG 与位图背景共享 `imageSizeCacheRef + commitImageSize + version` 心智模型，保留实例级多 source 缓存并移除多组尺寸/ready state；
- background-image 的 SVG URI 在解析阶段明确失败，不再隐式交给不支持 SVG 的 Image/FastImage 后静默失效；
- 无消费者的 `onLoad`/`getImageSize`/`onLayout` 只写 ref，不增加 state render；
- 动态 mode/background 样式切换不再依赖事件补发；
- 动态 `src` 的正确性可以通过 sourceKey 明确定义和测试。

### 代价

- 每个未缓存的非 SVG `<image>` 或位图 background source 都会主动执行一次 `getImageSize`，即使当前 mode/background-size 不消费原图尺寸，也会增加一次元数据查询及其回调开销；缓存命中时不重复查询；
- 实际图片仍同时加载并触发 `onLoad`，相比单一路径存在重复获取尺寸的工作；
- pending 阶段可能暂时保留默认或旧的外层占位尺寸，但不会显示使用错误比例的新图片；
- 无消费者时仍会收到内部 `onLoad`/`getImageSize`/`onLayout` 并执行尺寸比较和 ref 写入，但不会触发 React render；
- `mpx-image` 从多项原始 state 改为 ref + version 后，所有读取尺寸的派生计算都必须完整声明输入依赖，漏依赖会造成样式不更新；
- `<image>` 仅保存单份最近容器布局；mode 切换若改变容器实际尺寸，首次 props render 可能暂时基于上一次测量值派生，随后由新的 `onLayout` 校正。本方案不为消除该过渡帧引入按 mode 布局缓存；
- 两路相同结果会去重；两路结果不同时，后到结果可能再次更新 ref 和 version，依赖绝对尺寸的布局存在第二次样式更新风险，且最终值由到达顺序决定；
- 组件实例访问的唯一 sourceKey 越多，尺寸缓存占用越大；本方案不设置 LRU/TTL，内存会在组件卸载时统一释放；
- `sourceKey` 只使用资源 URI；若同一 URI 指向的资源内容在服务端原地变化，或同一 URI 切换 SVG/位图解释方式，切回时会先使用缓存中的旧尺寸，直到真实 `onLoad`、`getImageSize` 或 SVG `onLayout` 上报新尺寸并完成校正。需要主动区分内容身份时由调用方通过 query 等方式改变 URI；
- SVG 缓存保存的是该 source 最近一次节点布局尺寸，不是文件固有尺寸；切回时可立即复用，但新节点 `onLayout` 仍会重新校验并可能触发一次样式修正；
- 若 `onLoad` 没有有效尺寸且 `getImageSize` 既不成功也不失败回调，需要原图比例的 `<image>` mode 或背景样式仍会保持 pending；但 `<image>` 的 `bindload` 已由真实 `onLoad` 同步完成，不再被尺寸查询阻塞；离开后再切回该 source 因仍无缓存会重新查询；
- A → B → A 在 A 首次查询尚未返回时仍属于缓存未命中，可能再次发起 A 的 `getImageSize`；两次有效结果会由缓存比较去重。这一取舍避免维护可能因底层永不回调而永久锁住 source 的 in-flight 状态。

这些代价来自双路同时采集、按 ref 差异合并的尺寸模型。它优先保证任一路可用时都能恢复，并通过按需 version 抑制无效 render，但不能消除查询本身的开销，也不隐藏双路数据不一致时的顺序风险。

### 平台范围

方案应在 iOS、Android 和 Harmony RN 输出上采用相同逻辑，不设置 iOS 专用的隐藏图片分支。平台差异只允许存在于底层事件结构归一化中。

## 实施步骤

建议基于当前本地代码按以下提交顺序完成，便于逐步审查和回滚：

1. 增加 RN Image/FastImage 的 `onLoad` 尺寸归一化工具及单元测试；
2. 改造 `mpx-image.tsx` 的状态模型：图片尺寸写入按 sourceKey 缓存的 ref，容器尺寸只写入单份 `layoutInfoRef`，不按 mode 分桶；只保留 version state，ready、ratio、最终 view 尺寸和 `modeStyle` 在 render 中基于当前 style、mode 和事实 ref 派生，派生尺寸不回写布局 ref；
3. 为 `<image>` 增加实例级 `imageSizeCacheRef`，字符串资源直接以 URI、本地静态资源以 `resolveAssetSource` 得到的 URI 作为 sourceKey；保留并调整主动 getSize effect，使其只在当前非 SVG sourceKey 缓存未命中时执行；增加 `commitImageSize`，让 getSize、位图 `onLoad` 与 SVG `onLayout` 统一比较目标缓存项，缓存迟到结果并按需递增 version；
4. 删除 `<image>` 的 `loaded` 条件挂载，确保实际图片及内部 `onLoad`、容器内部 `onLayout` 始终存在；删除 `onImageLoad` 中的 `getImageSize(src, triggerLoad)` 与 `evt.persist()`，`bindload` 直接使用兼容 RN Image/FastImage 事件结构的归一化宽高同步触发，`bindload`/`binderror` 都不增加 source 判断或去重逻辑；
5. 将 SVG `onLayout` 直接接入同一个 `imageSizeCacheRef` 与 `commitImageSize`，不保留 SVG 专用尺寸 ref、缓存或通知链路，并复用现有完整尺寸暂存与事件顺序语义；
6. 补齐 `<image>` 非 SVG/SVG 的 mode、双路先后顺序、动态消费条件、动态 src 和既有 SVG 回归测试；
7. 改造 `mpx-view.tsx`：在 `parseBgImage()` 中复用 `svgRegExp` 拒绝 SVG background-image，调用现有 `error` 后丢弃；将现有尺寸 Map 收敛为相同的实例级 `imageSizeCacheRef`，getSize effect 只在当前位图 sourceKey 缓存未命中时执行，并移除 show 状态；背景图片 `onLoad` 与 getSize 共用 `commitImageSize`，包装 View `onLayout` 始终采集到 ref，三者都只用 version 通知有效重算；
8. 让背景位图统一使用 `resizeMode: 'stretch'`，删除默认 `cover` 和双轴数值分支中的重复赋值；
9. 补齐 background-image SVG URI 报错丢弃、最终矩形、`auto auto`、统一 stretch、双路先后顺序、动态消费条件、布局时序和动态 src 测试；
10. 同步更新 `docs-vitepress/guide/rn/style.md` 的 `background-image` 支持说明，以及 `.agents/skills/mpx2rn/references/rn-style-reference.md` 的背景图支持表，明确 RN 的 background-image 不支持 SVG URI，且会报错丢弃；
11. 在 RN Image/FastImage 两种配置下执行相关 eslint、jest 和必要的真机回归。

事件尺寸工具只有在两处事件结构完全一致时才抽到 `utils.tsx`。`getImageSize` 若能用包含字符串 URI 与本地 asset 的最小统一签名覆盖两处，也可一并复用；否则保留两个很小的局部函数。两个组件都只增加实例内、按 sourceKey 索引的缓存，不增加跨实例或全局缓存，也不为了复用引入复杂抽象。

## 测试方案

### 尺寸事件归一化

- RN Image：读取 `nativeEvent.source.width/height`；
- FastImage：读取 `nativeEvent.width/height`；
- source 尺寸优先级明确；
- 缺失、0 或负数尺寸返回 null；
- 不调用 `Image.getSize`。
- sourceKey 只取资源 URI：字符串资源使用原值，本地静态资源使用 `resolveAssetSource` 的 URI，其他 source 字段不参与 key 生成。

### `<image>`

- `widthFix`：onLayout、onLoad、getImageSize 的有效结果以不同顺序到达时计算正确；
- `heightFix`：按原图比例计算最终宽度；
- 裁剪类 mode：取得原图尺寸后计算缩放与定位；
- pending 阶段实际图片已挂载，样式非 0 且透明；
- `scaleToFill`、`aspectFit`、`aspectFill` 等无需内部尺寸的模式中，`onLoad`/`getImageSize`/`onLayout` 会保存 ref，但不递增 version、不增加无效 render；
- 等待图片和容器两个事实时，第一个事件只写 ref，最后补齐事实的事件只递增一次 version；
- 重复收到相同 width/height 时不替换 ref、不递增 version；
- `widthFix` 只改变未消费的容器 height、`heightFix` 只改变未消费的容器 width 时不递增 version；
- 从 `scaleToFill` 动态切换到 `widthFix`、从 `widthFix` 切换到 `heightFix` 时，不发起新的 `Image.getSize`，也不等待新的 `onLoad`；首次 render 使用单份 `layoutInfoRef` 按新 mode 取必要轴派生，若容器实际尺寸变化则由后续 `onLayout` 校正；
- mode 切换前后始终只有一份 `layoutInfoRef`，不创建 mode Map；`widthFix` 不消费 height，`heightFix` 不消费 width，派生轴变化不回写布局事实；
- mode 变化但最终所需事实尚未就绪时保持 pending，事实补齐后通过 version 正确恢复；
- RN Image 与 FastImage 均能驱动相同布局；
- 非 SVG source 缓存未命中时调用 `getImageSize` 一次，无论当前 mode 是否需要原图尺寸、`onLoad` 是否携带有效尺寸；再次切回已缓存 source 时不重复调用；
- `getImageSize → onLoad` 与 `onLoad → getImageSize` 返回相同尺寸时，第一条有效结果按需发布，第二条不替换 ref、不递增 version；
- 两路返回不同尺寸时，后到有效结果覆盖缓存项；派生输出变化时再次递增 version，未变化时只更新缓存；若能确认是同一次激活的双路冲突，则产生开发环境不一致诊断；
- 无需原图尺寸的 mode 中，两路成功都只写 ref、不递增 version，后续切换到 `widthFix` 等 mode 时直接消费；
- RN Image 的 `bindload` detail 读取 `nativeEvent.source.width/height`，FastImage 的 detail 读取 `nativeEvent.width/height`；
- `onLoad` 缺少有效尺寸时不额外调用 `getImageSize`，`bindload` 仍同步触发并携带 `{ width: 0, height: 0 }`，主动查询只继续服务内部布局；
- `getImageSize` 结果到达前切换 A → B 时，A 的有效结果写入 A 的缓存项，但不能触发 B 的 version；主动查询结果在任何时序下都不触发 `bindload`；
- `getImageSize` 失败或返回非法尺寸时不写缓存；若 `onLoad` 有效仍可正常 ready，只有两路均无有效尺寸时才保持 pending；
- A → B 快速切换时，A 的迟到事件不改变 B 状态；
- B 已 ready 后 A 再迟到，B 不退回 pending；
- A → B → A 时直接读取 A 的已有缓存生成布局，不等待新事件、不再次调用 `getImageSize`；若 A 的结果在 B 显示期间迟到，切回 A 时也直接使用该缓存；
- A 的 getSize 与 onLoad 均失败、未形成缓存项时，A → B → A 会再次对 A 执行一次缓存未命中查询；
- `bindload` 对每次收到的真实 `onLoad` 事件同步透传一次，并携带该事件归一化后的尺寸，不按当前 source、ready 状态或历史事件去重；
- 内部已经取得尺寸时仍正常触发 `bindload`；
- `onImageLoad` 不调用 `getImageSize`、不等待主动查询结果，也不再调用 `evt.persist()`；
- 每次收到真实图片节点的 `onError` 都直接触发 `binderror`，不按当前 source 或历史事件过滤；错误节点对应的内部尺寸不复用其他 sourceKey 的尺寸，当前 source 已有缓存时尺寸布局仍可复用；
- 远程 URI 与本地静态资源均覆盖；
- `<image>` SVG 继续通过 `onLayout` 获取节点布局尺寸，不调用 `Image.getSize` 或位图 `onLoad` 工具；
- 容器 `onLayout` → `<image>` SVG `onLayout` 时正确计算最终尺寸；
- `<image>` SVG `onLayout` → 容器 `onLayout` 时，`imageSizeCacheRef[sourceKey]` 已完整保存 width/height，ratio 在 render 中正确派生；
- `<image>` SVG 未满足容器计算条件时不递增 version，条件满足后只产生一次有效 render；
- `<image>` SVG `bindload` 仍携带同一次 `onLayout` 的 width/height；
- `SvgCssUri` 与 `LocalSvg` 均覆盖；
- `<image>` SVG 与位图复用同一个 `commitImageSize`，没有 `svgImageSizeRef`、SVG 专用缓存或 SVG 专用 version 发布分支；
- `<image>` SVG 动态 A → B 时，A 的迟到 `onLayout` 只更新 A 的缓存项，不覆盖 B 的尺寸、不触发 B 的 version；同一次事件生成的公开 `bindload` 仍直接透传，不做 source 过滤；
- `<image>` SVG 动态 A → B → A 时直接使用 A 最近一次 `onLayout` 缓存，之后新节点 `onLayout` 上报相同值时去重、上报不同值时按统一规则更新并按需通知。

### `view + background-image`

- `.svg`、`.svg?query`、`.svg#hash` background-image 均通过 `svgRegExp` 命中，调用现有 `error` 并返回空解析结果；
- SVG background-image 不调用 `getImageSize`，不挂载 Image/FastImage，不创建 sourceKey 或尺寸缓存项，View 子节点仍正常渲染；
- 固定 background-size 不依赖原图尺寸；
- 固定 background-size 下图片 `onLoad`、`getImageSize` 与容器 `onLayout` 都只采集 ref，不递增 version；
- 固定 background-size 动态切换到 `auto/contain/cover` 时，复用已采集的原图和容器尺寸，不重新请求图片、不等待新的 `onLayout`；
- 已稳定布局的包装 View 从 `needLayout=false` 切换到 `needLayout=true` 时，即使 RN 不补发 `onLayout` 也能立即得到正确结果；
- `auto auto` 使用原图宽高作为最终 Image 矩形，不按容器缩放；
- `auto auto` 配合默认位置时虽然内部 `onLayout` 始终采集容器尺寸，但不递增 version、不消费布局；配合 center/百分比位置时只计算偏移；
- `auto + 数值/百分比` 和 `数值/百分比 + auto` 按比例计算；
- `contain`、`cover` 在不同容器比例下计算正确；
- `cover`、`contain`、`auto auto`、单边 `auto` 和双轴显式尺寸最终都向 RN Image/FastImage 传递 `resizeMode: 'stretch'`；
- `cover` 通过计算后的超大图片矩形和外层 `overflow: hidden` 裁切，不依赖底层 Image 的 `cover`；
- 图片矩形与原图比例一致时，统一 `stretch` 不引入变形或二次裁切；
- 百分比 background-position 同时消费图片尺寸和容器尺寸；
- onLayout、onLoad、getImageSize 的有效结果以不同顺序到达时计算正确；
- 同时等待图片和容器事实时，第一个事件不触发无结果 render，最后补齐事实的事件只递增一次 version；
- 相同背景图片尺寸或容器尺寸重复上报时不递增 version；
- 只改变当前 background-size/background-position 未消费的容器轴时不递增 version；
- pending 阶段同一个背景图片节点已挂载且透明；
- ready 后只更新样式，不因测量额外挂载第二张图片；
- A → B 以及 A → B → A 时尺寸不串用；
- 图片加载失败时不显示错误比例背景；
- 位图 background source 缓存未命中时调用 `getImageSize` 一次，无论当前 background-size 是否需要原图尺寸、`onLoad` 是否携带有效尺寸；再次切回已缓存 source 时不重复调用；
- `getImageSize → onLoad` 与 `onLoad → getImageSize` 返回相同尺寸时只产生一次必要的 version 更新；
- 两路返回不同尺寸时，后到有效结果覆盖 ref，并仅在最终背景矩形或 ready 变化时再次递增 version；
- 背景图片 `onLoad` 缺少有效尺寸时不额外调用 `getImageSize`；缓存未命中时继续等待当前 source 已启动的查询，缓存命中时继续使用缓存；
- 固定 background-size 下两路成功都只写 ref、不递增 version，后续切换到 `auto/contain/cover` 时直接消费；
- 背景图任一路失败或返回非法尺寸时不写缓存；source 已变化时，有效结果只写入自己的 sourceKey 缓存项、不递增当前 version；另一条路径仍可独立完成；
- background-image 动态 A → B → A 时直接使用 A 缓存生成最终矩形，不再次调用 `getImageSize`；A 在 B 显示期间迟到的有效结果也可供切回时复用；
- RN Image/FastImage、iOS/Android/Harmony 的状态判断一致；
- 渐变从固定尺寸动态切换到百分比尺寸或斜向角度时复用已采集 layout，不等待新的 `onLayout`；
- linear-gradient 相关现有测试保持通过。

建议新增或扩展：

- `packages/webpack-plugin/test/runtime/react-native/mpx-image-size.spec.ts`；
- `packages/webpack-plugin/test/runtime/react-native/mpx-view-background-image.spec.ts`。

测试中应记录 `Image.getSize` 调用：`<image>` 与位图 background-image 都断言每次缓存未命中恰好调用一次，A → B → A 命中 A 缓存时不增加调用次数；失败且未形成缓存项的 source 切回后允许再次查询。SVG background-image 断言调用现有 `error` 后被丢弃，且 `Image.getSize`、Image/FastImage 渲染与缓存提交调用次数均为 0。mode/background-size 变化和缺尺寸 `onLoad` 不增加调用次数。`<image>` 还需分别构造 RN Image 与 FastImage 的事件结构，断言 `bindload` 同步取得正确宽高，且主动查询成功、失败或迟到都不会触发公开事件；每次真实 `onLoad`/`onError` 则无论 source 是否仍为当前值都直接透传一次，不做去重。两处分别覆盖双路相同结果的两种先后顺序、双路不同结果、任一路失败或不回调、两路都无有效结果，以及 source 变化后的迟到回调；`<image>` SVG 额外覆盖同缓存、同 commit 与 A → B → A 复用。

## 验收标准

- `<image>` 非 SVG 与位图 background-image 只在当前 sourceKey 缓存未命中时调用一次 `getImageSize`，并始终监听真实节点 `onLoad`；同一 source 缓存命中后不因切回、mode/background-size 或缺尺寸事件重复查询；
- SVG background-image 由 `parseBgImage()` 复用 `svgRegExp` 识别，调用现有 `error` 明确提示并丢弃，不进入 getSize、缓存、Image/FastImage 或 SVG 渲染链路；
- 位图 `onLoad/getImageSize` 与 `<image>` SVG `onLayout` 的有效尺寸都进入同一个提交入口，与 `imageSizeCacheRef.current[targetSourceKey]` 逐项比较；相同值不替换缓存项、不递增 version，不同值更新对应缓存项，并且只有 targetSourceKey 是当前 source 且派生视图需要变化时才递增 version；
- `<image>`、背景图片的内部 `onLoad` 以及相关容器的内部 `onLayout` 不再按当前消费条件动态挂载；
- `<image>` 与 `mpx-view` 的图片尺寸事实只保存在实例级 sourceKey 缓存 ref，容器尺寸事实各自保存在单份 `layoutInfoRef`，React state 只保留各自的单一 version；
- 无消费者、当前不消费的尺寸轴变化、尺寸未变化，或写入前后派生输出都仍为 pending 时不递增 version；pending/ready 变化和 ready 下的最终结果变化必须递增 version；
- mode、`background-size`、`background-position` 动态变为需要尺寸时，能够先使用已采集事实完成派生，不等待历史事件补发；`<image>` mode 导致的后续真实容器变化允许由正常 `onLayout` 校正；
- `<image>` layout mode 与需要原图尺寸的位图 background-image 在 pending 阶段都已挂载实际图片；
- pending 图片使用非零尺寸且不可见；
- sourceKey 只使用资源 URI，不序列化 `is-svg`、renderer、headers 等其他字段；
- 当前布局只消费当前 `sourceKey` 的缓存项；
- 动态 `src` 的迟到尺寸结果可写入自己的 sourceKey 缓存项，但不会发生跨来源污染或触发当前 source 的 version；公开 `bindload`/`binderror` 与内部尺寸隔离无关，仍直接透传；
- A → B → A 能直接使用 A 的缓存完成首次 render；未形成有效缓存项时才重新走 getSize 兜底；
- RN Image 与 FastImage 的加载事件都能得到正确尺寸；
- `backgroundSize()` 是背景图最终矩形的唯一尺寸决策层；
- 所有位图 background-size 模式统一使用 `resizeMode: 'stretch'`，不存在框架计算后再次由 RN `cover` 裁切的双重策略；
- `auto auto` 使用当前来源原始宽高，且只在 background-position 需要时消费容器 layout；
- `bindload` 只由真实 `onLoad` 同步触发，兼容 RN Image/FastImage 两种宽高路径，不调用或等待 `getImageSize`，也不依赖内部尺寸 ready 状态；`bindload`/`binderror` 不校验当前 source、不去重，每次收到实际节点事件都直接透传；
- `<image>` SVG 保持当前 `updateImageSize` 对完整尺寸事实的暂存语义，具体存储复用 `imageSizeCacheRef.current[sourceKey]`，ratio 在 render 中派生；
- `<image>` SVG 保持在布局条件不足时不递增 version；
- `<image>` SVG 与容器 `onLayout` 的先后顺序不影响最终 mode 计算；
- `<image>` SVG 与位图复用同一个 `commitImageSize`、缓存比较和 version 发布规则，不存在单独链路；
- `<image>` SVG 尺寸同样按 sourceKey 缓存，迟到 `onLayout` 只更新自己的缓存项，不覆盖或通知当前来源；
- `<image>` SVG 仍使用节点布局尺寸并维持现有 `bindload` 语义；
- RN background-image 不支持 SVG URI，且会报错丢弃的行为已同步到用户文档与 Mpx2RN Skill；
- linear-gradient 行为无回归；
- 相关 eslint 与 jest 全部通过；
- 至少完成 iOS 低版本设备或等价环境、Android 和 FastImage 开关的人工回归。

## 回滚策略

改造按组件拆分提交：

- 若 `<image>` 出现回归，可单独回滚 `mpx-image.tsx` 与对应测试；
- 若 background-image 出现回归，可单独回滚 `mpx-view.tsx` 的 SVG 拒绝、onLoad/source 隔离、统一 stretch 改动与对应测试；
- 事件尺寸归一化工具只有在无调用方后再回滚。

当前 `<image>` SVG 完整尺寸暂存和事件顺序修复早于本方案且已进入行为基线；若回滚 ref + version 重构，必须恢复到此前完整的 SVG state 实现，不能只恢复部分宽高字段。`<image>` 统一缓存改造中，位图与 SVG 必须共同使用同一 `imageSizeCacheRef` 和 `commitImageSize`，不应只回滚一类来源而重新形成两套链路。background-image 的 SVG 拒绝逻辑属于 `mpx-view` 改动，应随该组件独立回滚。非 SVG 回滚只恢复具体组件实现；`onLoad` 与 getSize 共存时必须完整保留本文定义的“缓存未命中查询、统一 commit、相同结果去重、按 targetSourceKey 缓存、当前 source 按需 version”约束。若必须短期恢复旧实现，应完整恢复该组件原链路并记录平台问题。

## 与既有方案的关系

本方案是图像原始尺寸获取链路的专项决策，实施时优先级高于以下既有文档中的相关段落：

- [`rn-local-image-support.md`](rn-local-image-support.md) 中主动通过 `getImageSize`/`resolveAssetSource` 获取尺寸的建议继续保留，但调整为只在缓存未命中时与真实节点 `onLoad` 并行，并统一进入缓存 ref/version 提交流程；本地资源 source 转换和 SVG 判断仍保留；
- [`rn-mpx-view-performance-optimization.md`](rn-mpx-view-performance-optimization.md) 中针对 `Image.getSize` 增加尺寸缓存的方向保留，但具体实现统一为本文的实例级 `imageSizeCacheRef[sourceKey]`，不再保留另一套 URI Map/当前来源 ref；其他与背景计算和渲染性能有关的结论仍有效；
- [`rn-mpx-image-performance-optimization.md`](rn-mpx-image-performance-optimization.md) 中不引入全局尺寸缓存的方向与本方案一致，其余优化建议不受影响。

如果后续实现与这些文档发生冲突，以本方案对“非 SVG 原图尺寸由 onLoad/getImageSize 双路获取、缓存未命中查询、资源 URI 作为 sourceKey、`<image>` 位图与 SVG 共用实例级 sourceKey 缓存和统一 commit、background-image SVG 明确报错并丢弃、迟到尺寸结果只缓存不通知当前视图、公开 bindload/binderror 无条件透传、onLoad/onLayout 始终采集、ref + version 按需通知、pending 挂载方式、background-size 最终矩形与统一 stretch 职责，以及 `<image>` SVG onLayout 尺寸来源”的定义为准。
