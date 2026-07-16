# Mpx2RN mpx-view 性能优化方案

## 结论

`mpx-view` 是 Mpx2RN 中使用频率最高的基础组件，普通布局、列表项、容器、带 hover/动画/背景图/渐变/CSS var 的节点都会走它的 render 链路。本方案围绕 `mpx-view.tsx` 与 `utils.tsx` 中的 `splitStyle/splitProps/groupBy/useHover` 做局部减法，目标是降低普通节点的对象分配与枚举开销，让背景能力只在启用时付出成本，并修复 hover/effect 的几个陈旧引用问题。

最终采纳的优化项：

1. `wrapWithChildren` 无背景时直接返回 children，不创建 `[null, children]` 数组。
2. `splitProps` / `splitStyle` 改为"首次命中索引 + 命中前顺序补写"，无命中时复用原对象引用；`groupBy` 不再有调用方，同步删除。
3. `mpx-view` 在 `layoutStyle` 为空时复用 `innerStyle`，省一次 `viewStyle` 合并。
4. `defaultStyle` 抽为模块级 frozen 常量，非 flex 分支跳过空对象合并。
5. `transitionend` 计算下沉到 `useAnimationHooks`,仅在 `enableAnimation` 时执行。
6. `imageStyleToProps` 去掉 `applyHandlers`,按 `type` 分支构造初始 `imageProps`。
7. `preParseImage` 拆为三个独立 memo,`backgroundSize/backgroundPosition` 用 `join('|')` 字符串 key 作依赖。
8. `useWrapImage` effect 依赖补齐到 `[src, type, needLayout, needImageSize]`,并按 `src` 缓存 `Image.getSize` 结果。
9. 背景尺寸 state 由四个 setter 收敛为单 `version` state,ref 做相同值短路再 bump version。
10. 按 `[preImageInfo, version]` memo `imageProps`。
11. `useHover` 引入 `hoverConfigRef`,timer 函数搬进 `useMemo([])` 体内只分配一次,修复动态 hover 参数闭包陈旧。

明确不做：

1. 不做 `_View` 整体 `React.memo`。
2. 不做 `extendObject({}, props, layoutProps, { ref, style })` 在无 `layoutProps` 时的省层优化。
3. 不在 `useWrapImage` 内手写 string key 缓存解析结果——三个独立 memo 已足够命中。
4. 不引入深比较 / JSON 序列化缓存普通 style。
5. 不做 `useNodesRef` 暴露的 `style` 同值短路（每次都是新引用）。
6. 不做 `enableStyleAnimation` 数组引用稳定。
7. 不引入"探针对照组"等性能验证项。

## 方案一：`wrapWithChildren` 无背景路径

`wrapWithChildren` 当前无论是否启用背景都返回 `[useWrapImage(...), children]`。无背景时直接返回 `children`，少一次数组分配，CreateElement children 形态更贴近实际。

```tsx
function wrapWithChildren (props: _ViewProps, config: WrapChildrenConfig) {
  const children = wrapChildren(props, {
    hasVarDec: config.hasVarDec,
    varContext: config.varContext,
    textPassThrough: config.textPassThrough
  })

  if (!config.enableBackground) return children

  return [
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useWrapImage(config.backgroundStyle, config.innerStyle, config.enableFastImage),
    children
  ]
}
```

注意点：

1. 调用方传入的 `enableBackground` 必须是 `enableBackgroundRef.current`（首次 render 锁定的稳定值），不能传瞬时变量；否则会破坏 `useWrapImage` 的 Hook 顺序。
2. 同步删除 `WrapChildrenConfig` 中未使用的 `textStyle/textProps` 字段。

## 方案二：`splitProps` / `splitStyle` 首次命中索引 + 顺序补写

普通节点绝大多数 key 都属于 inner，当前每次都要全量创建 `innerProps/innerStyle` 对象。改为：

1. 第一次扫描时同时分类与收集，记录首个 special key 的位置 `firstSpecialIdx`；
2. 无命中时直接 `return { innerStyle: styleObj }`（或 `{ innerProps: props }`），复用原引用；
3. 有命中时只对 `[0, firstSpecialIdx)` 做一次顺序补写，不引入第二次分类扫描。

### `splitProps`

```ts
export function splitProps<T extends Record<string, any>> (props: T): {
  textProps?: Partial<T>
  innerProps?: Partial<T>
} {
  const keys = Object.keys(props)
  let textProps: Partial<T> | undefined
  let innerProps: Partial<T> | undefined
  let firstTextIdx = -1

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (hasOwn(textPropsMap, key)) {
      if (firstTextIdx < 0) firstTextIdx = i
      textProps = textProps || {}
      textProps[key as keyof T] = props[key]
    } else if (firstTextIdx >= 0) {
      innerProps = innerProps || {}
      innerProps[key as keyof T] = props[key]
    }
  }

  if (firstTextIdx < 0) return { innerProps: props }

  if (firstTextIdx > 0) {
    innerProps = innerProps || {}
    for (let i = 0; i < firstTextIdx; i++) {
      const key = keys[i]
      innerProps[key as keyof T] = props[key]
    }
  }
  return { textProps, innerProps }
}
```

### `splitStyle`

```ts
export function splitStyle<T extends Record<string, any>> (
  styleObj: T,
  sideEffect?: (key: string, val: T[keyof T]) => void
): {
  textStyle?: Partial<T>
  backgroundStyle?: Partial<T>
  innerStyle?: Partial<T>
} {
  const keys = Object.keys(styleObj)
  let textStyle: Partial<T> | undefined
  let backgroundStyle: Partial<T> | undefined
  let innerStyle: Partial<T> | undefined
  let firstSpecialIdx = -1

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const val = styleObj[key]
    sideEffect && sideEffect(key, val)

    if (isTextStyle(key)) {
      if (firstSpecialIdx < 0) firstSpecialIdx = i
      textStyle = textStyle || {}
      textStyle[key as keyof T] = val
    } else if (hasOwn(backgroundStyleMap, key)) {
      if (firstSpecialIdx < 0) firstSpecialIdx = i
      backgroundStyle = backgroundStyle || {}
      backgroundStyle[key as keyof T] = val
    } else if (firstSpecialIdx >= 0) {
      innerStyle = innerStyle || {}
      innerStyle[key as keyof T] = val
    }
  }

  if (firstSpecialIdx < 0) return { innerStyle: styleObj }

  if (firstSpecialIdx > 0) {
    innerStyle = innerStyle || {}
    for (let i = 0; i < firstSpecialIdx; i++) {
      const key = keys[i]
      innerStyle[key as keyof T] = styleObj[key]
    }
  }
  return { textStyle, backgroundStyle, innerStyle }
}
```

注意点：

1. `sideEffect` 仍在主循环里对每个 key 调一次，行为与现状一致。
2. 复用原 `styleObj/props` 后调用方不能突变 `innerStyle/innerProps`。落地前过一遍全部 `splitStyle/splitProps` 调用方（mpx-view、mpx-button、mpx-checkbox、mpx-label、mpx-radio、mpx-form、mpx-scroll-view、mpx-swiper、mpx-swiper-item、mpx-movable-view、mpx-sticky-section、mpx-sticky-header、mpx-text、mpx-simple-text、mpx-simple-view、mpx-picker-view、mpx-picker-view-column），确认都是 `extendObject({}, innerStyle, ...)` 这类不突变输入的写法。
3. `useNodesRef(... { style: normalStyle })` 暴露给业务的 `normalStyle` 现状即被外部读取，方案不改其语义；PR 描述里点名提示业务侧不要突变。
4. 改造完成后 `groupBy` 无调用方，同步删除。

## 方案三：`mpx-view` 内的小额引用与对象稳定

### 3.1 `defaultStyle` 模块级常量化

`_View` 内 `defaultStyle` 当前每次 render 现场构造，并对非 flex 节点也走一次 `extendObject` 空对象合并。抽为模块级常量并按分支跳过：

```ts
const FLEX_DEFAULT_STYLE: ExtendedViewStyle = {
  flexDirection: 'row',
  flexBasis: 'auto',
  flexShrink: 1,
  flexWrap: 'nowrap'
} as ExtendedViewStyle

// _View 内
const styleObj: ExtendedViewStyle = style.display === 'flex'
  ? extendObject({}, FLEX_DEFAULT_STYLE, style, isHover ? hoverStyle as ExtendedViewStyle : {})
  : extendObject({}, style, isHover ? hoverStyle as ExtendedViewStyle : {})
```

### 3.2 `transitionend` 计算下沉

`transitionend` 当前在 `_View` 主体里每帧通过两次 `isFunction` 计算，但只有 `useAnimationHooks` 使用。下沉到 `useAnimationHooks` 内部，仅在 `enableAnimation` 为 true 时算；外层 `_View` 删掉这个局部变量。

### 3.3 `viewStyle` 在无 layoutStyle 时复用 innerStyle

`viewStyle = extendObject({}, innerStyle, layoutStyle)` 当 `layoutStyle` 为空对象（非 fixed 节点的常态）时仍会创建新对象。改为：

```ts
const viewStyle = layoutStyle && Object.keys(layoutStyle).length
  ? extendObject({}, innerStyle, layoutStyle)
  : innerStyle
```

## 方案四：`imageStyleToProps` 去 handlers 数组

`imageStyleToProps` 当前每次 render 通过 `applyHandlers([backgroundSize, backgroundImage, backgroundPosition, linearGradient], args)` 调度，临时数组与可变长 args 都是无效成本，且 image / linear 路径会互相塞用不到的字段。改为按 `type` 分支：

```ts
const imageStyleToProps = (preImageInfo: PreImageInfo, imageSize: Size, layoutInfo: Size) => {
  const { type } = preImageInfo

  if (type === 'image') {
    const imageProps: ImageProps = {
      resizeMode: 'cover',
      style: { position: 'absolute' }
    }
    backgroundSize(imageProps, preImageInfo, imageSize, layoutInfo)
    backgroundImage(imageProps, preImageInfo)
    if (preImageInfo.backgroundPosition.length) {
      backgroundPosition(imageProps, preImageInfo, imageSize, layoutInfo)
    }
    return imageProps
  }

  // type === 'linear'
  const imageProps: ImageProps = {
    style: { position: 'absolute' },
    colors: []
  }
  backgroundSize(imageProps, preImageInfo, imageSize, layoutInfo)
  if (preImageInfo.backgroundPosition.length) {
    backgroundPosition(imageProps, preImageInfo, imageSize, layoutInfo)
  }
  linearGradient(imageProps, preImageInfo, imageSize, layoutInfo)
  return imageProps
}
```

注意点：必须保持 `backgroundSize → backgroundPosition` 顺序，position 依赖 size 写入后的 width/height。

## 方案五：背景预解析按字段独立 memo

`preParseImage` 内部由三块组成且输入字段相互独立，按字段独立 memo 命中率最高。`backgroundSize/backgroundPosition` 在编译产物中常是新数组，使用 `Array.isArray ? join('|') : val` 的轻量 string key 作依赖。

```tsx
const backgroundImage = imageStyle?.backgroundImage || ''
const backgroundSize = imageStyle?.backgroundSize
const backgroundPosition = imageStyle?.backgroundPosition

const parsed = useMemo(() => parseBgImage(backgroundImage), [backgroundImage])
const { type } = parsed

const backgroundSizeKey = Array.isArray(backgroundSize) ? backgroundSize.join('|') : backgroundSize
const sizeList = useMemo(
  () => normalizeBackgroundSize(backgroundSize ?? ['auto'], type),
  [backgroundSizeKey, type]
)

const backgroundPositionKey = Array.isArray(backgroundPosition) ? backgroundPosition.join('|') : backgroundPosition
const bgPosition = useMemo(
  () => normalizeBackgroundPosition(backgroundPosition ?? [0, 0]),
  [backgroundPositionKey]
)

const preImageInfo: PreImageInfo = useMemo(
  () => ({ ...parsed, sizeList, backgroundPosition: bgPosition }),
  [parsed, sizeList, bgPosition]
)
```

数组长度很短（1–4），`join` 成本远低于一次完整正则解析与归一化。`normalizeBackgroundSize` 内部对纯数字字符串和数字本来就经过 `__formatValue` 归一化、语义等效，不需为类型混淆做额外处理。

## 方案六：`useWrapImage` effect 依赖与 size 缓存

### 6.1 effect 依赖补齐

`useWrapImage` 的 effect 内使用了 `needLayout / needImageSize`，但依赖只写了 `[src, type]`。`src/type` 不变但 `backgroundSize` 从固定值切到 `auto/cover` 时不会重跑。补齐：

```tsx
useEffect(() => {
  // ...
}, [src, type, needLayout, needImageSize])
```

### 6.2 按 `src` 缓存 `Image.getSize`

依赖补齐后，`backgroundSize` 在 `'cover' → '100px 100px' → 'cover'` 来回切换会重复触发 `Image.getSize`。按 `src` 维度缓存：

```tsx
const sizeCacheRef = useRef<Map<string, Size>>(new Map())

useEffect(() => {
  // ...
  if (needImageSize) {
    const cached = src ? sizeCacheRef.current.get(src) : undefined
    if (cached) {
      sizeInfo.current = cached
      // ...
      return
    }
    Image.getSize(src!, (width, height) => {
      const size = { width, height }
      sizeCacheRef.current.set(src!, size)
      sizeInfo.current = size
      // ...
    })
  }
}, [src, type, needLayout, needImageSize])
```

`sizeCacheRef` 同实例内 src 数量有限，不显式清理（实例销毁随 ref GC）。

## 方案七：背景尺寸 state 收敛为单 version

`useWrapImage` 当前用四个 `useState(null)` 仅作触发重渲染的信号——值从不被读，render 阶段只读 `sizeInfo.current / layoutInfo.current` 这两个 ref。改为 ref 自身做相同值短路 + 单 `version` state 触发 render：

```tsx
const sizeInfo = useRef<Size | null>(null)
const layoutInfo = useRef<Size | null>(null)
const [, setVersion] = useState(0)
const bumpVersion = () => setVersion(v => v + 1)

const updateImageSize = (width: number, height: number) => {
  if (sizeInfo.current?.width === width && sizeInfo.current?.height === height) return
  sizeInfo.current = { width, height }
  bumpVersion()
}

const updateLayoutInfo = (width: number, height: number) => {
  if (layoutInfo.current?.width === width && layoutInfo.current?.height === height) return
  layoutInfo.current = { width, height }
  bumpVersion()
}
```

`Image.getSize` 与 `onLayout` 中按需调用对应函数；`show` 仍单独保留。

注意点：需保持原调用时机，`needLayout` 与 `needImageSize` 同时存在时必须 `updateImageSize → updateLayoutInfo → setShow(true)`，不能颠倒。

## 方案八：`imageProps` 按 `[preImageInfo, version]` memo

方案七的 `version` 与触发 render 的信号同源，作为 memo 依赖不会漏：

```tsx
const imageProps = useMemo(
  () => imageStyleToProps(preImageInfo, sizeInfo.current as Size, layoutInfo.current as Size),
  [preImageInfo, version]
)
```

## 方案九：`useHover` 手势读取最新配置

现状 `gesture = useMemo(..., [])` 捕获首次 render 的 `setStartTimer/setStayTimer`，每帧重建这两个闭包都是无用功；同时 `disabled/hoverStartTime/hoverStayTime` 动态变化时存在闭包陈旧风险。不走 `useStableCallback`（仍要每帧分配 wrapper 闭包并写 ref），直接手写 `hoverConfigRef`，timer 函数搬进 `useMemo([])` 体内：

```tsx
const hoverConfigRef = useRef({ hoverStartTime, hoverStayTime, disabled })
hoverConfigRef.current.hoverStartTime = hoverStartTime
hoverConfigRef.current.hoverStayTime = hoverStayTime
hoverConfigRef.current.disabled = disabled

const gesture = useMemo(() => {
  const setStartTimer = () => {
    const cfg = hoverConfigRef.current
    if (cfg.disabled) return
    dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
    dataRef.current.startTimer = setTimeout(() => setIsHover(true), +cfg.hoverStartTime)
  }
  const setStayTimer = () => {
    const cfg = hoverConfigRef.current
    if (cfg.disabled) return
    dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
    dataRef.current.stayTimer = setTimeout(() => setIsHover(false), +cfg.hoverStayTime)
  }
  return Gesture.Pan()
    .onTouchesDown(() => setStartTimer())
    .onTouchesUp(() => setStayTimer())
    .runOnJS(true)
}, [])
```

要点：

1. `setStartTimer/setStayTimer` 在 `useMemo` 体内定义，整个生命周期只分配一次。
2. `hoverConfigRef.current` 始终是同一个对象，每帧重写 3 个字段。
3. `gesture` 仍空依赖，闭包陈旧风险通过 ref 读取消解；hover 触发由用户手势驱动，与 render 体内字段更新无竞态。

## 非目标

1. 不移除 `enable-background` 的生命周期稳定约束。
2. 不改变背景图/渐变对 `onLayout` 与 `Image.getSize` 的依赖条件。
3. 不把可选能力改成编译期分组件输出，需要模板编译器协同，超出本方案范围。
4. 不在本方案中重复实现已有 `useInnerProps`、`useTransformStyle`、`useTextPassThrough` 优化。
5. 不引入深比较或 JSON 序列化缓存普通 style。
6. 不做 `_View` 整体 `React.memo`、`extendObject` 省层、`useNodesRef` style 同值短路、`enableStyleAnimation` 数组引用稳定、性能探针对照组等额外项。

## 改动范围

1. `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
   - `splitProps` / `splitStyle` 改"首次命中索引 + 命中前顺序补写"；同步删除无调用方的 `groupBy`。
   - `useHover` 引入 `hoverConfigRef`，timer 函数搬进 `useMemo([])` 体内。
2. `packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx`
   - `wrapWithChildren` 无背景直接返回 children；删除 `WrapChildrenConfig` 的 `textStyle/textProps`。
   - `defaultStyle` 抽 `FLEX_DEFAULT_STYLE` 模块常量；非 flex 跳过空合并。
   - `transitionend` 计算下沉到 `useAnimationHooks`。
   - `viewStyle` 在 `layoutStyle` 为空时复用 `innerStyle`。
   - `useWrapImage` 内：`preParseImage` 拆三个 memo + string key；effect 依赖补齐；`sizeCacheRef` 缓存 `Image.getSize`；四个 setter 收敛为单 `version`，加 `updateImageSize/updateLayoutInfo`；`imageProps` 按 `[preImageInfo, version]` memo。
   - `imageStyleToProps` 去 `applyHandlers`，按 `type` 分支。

## 测试建议

1. 大量普通 view 列表（无事件、无背景、无文本样式）渲染输出与现状一致。
2. `splitStyle` 在"text/background style 出现在末尾"、"只在中间出现一次"、"完全不出现"三种分布下结果一致（覆盖 firstSpecialIdx 补写路径）。
3. `splitProps` 无文本 prop 时直接复用原 `props` 引用（可用 `Object.is` 断言）。
4. 背景图 `url(...)` 仍能渲染并正确透传 `source.uri`；`linear-gradient(...)` 的 colors / locations / angle 不变。
5. `background-size: cover / contain / auto / %` 尺寸计算不变。
6. `background-size` 在 `'cover' → '100px 100px' → 'cover'` 来回切换时 `src` 不变不重复 `Image.getSize`，最终展示尺寸正确。
7. `background-position` 百分比在 layout 后正确计算。
8. `enable-background` 生命周期不稳定仍报错。
9. hover 参数（`hover-start-time / hover-stay-time / disabled`）动态变化时使用最新值。
10. 无背景 view 的 children 直接渲染，不再被 `[null, children]` 包裹。
11. `position: fixed` 节点行为不变。

完成代码改动后按仓库约束执行相关 eslint / jest。

## 回滚策略

1. `splitProps/splitStyle` 改造出问题：恢复 `groupBy` 实现并复用原 `Object.entries` 调用写法。
2. `wrapWithChildren` 无背景路径出问题：恢复 `[null, children]` 数组返回。
3. `useWrapImage` effect 依赖 / `sizeCacheRef` / 单 version state 出问题：分别局部回退到原四 setter + `[src, type]` 依赖写法。
4. `imageStyleToProps` 分支化出问题：恢复 `applyHandlers` 调度。
5. `useHover` `hoverConfigRef` 出问题：恢复每帧重建 `setStartTimer/setStayTimer`。
6. `defaultStyle` / `transitionend` / `viewStyle` 复用 / 字段 memo 等小项可独立回退，互不影响。
