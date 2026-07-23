# Mpx2RN mpx-image 性能优化方案

## 结论

`mpx-image` 是 RN 跨端产物中除 `mpx-view`/`mpx-text` 之外被复用最广的基础组件，列表项缩略图、头像、icon、占位图、广告位等均会经过它的 render 链路。当前实现每帧都要：

1. 把 `defaultStyle / overflow / transformOrigin` 等常量字面量重新构造一份并参与 `extendObject` 合并；
2. 在普通展示路径上对 `cropMode` 数组做 `Array.includes` 线性查找，对 `src` 做正则匹配判断 SVG，对 string `src` 重新打包成 `{ uri }`；
3. 即使 `mode` 不是布局模式，仍然把 `noop` 作为 `onLayout` 透传到 [useLayout](packages/webpack-plugin/lib/runtime/components/react/utils.tsx)，由于 `noop` 是 truthy，[utils.tsx:1228](packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L1228) 的 `if (hasSelfPercent || onLayout || enableOffset)` 会无条件注册一次 layout 回调。

本方案围绕 [mpx-image.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx) 做局部减法，目标是降低普通图片节点的对象分配 / 正则 / `Array.includes` 等无效开销，并修复 `noop` 透传引发的多余 layout 监听。不引入新的引用稳定假设，不改变现有渲染语义。

最终采纳的优化项：

1. `cropMode` 由数组改为 `Record<Mode, boolean>` 哈希表，`isCropMode` 用 `hasOwn` O(1) 命中。
2. `defaultStyle` / `{ overflow: 'hidden' }` / `{ transformOrigin: 'left top' }` / 非 crop 模式下的基础 image style 抽为模块级常量，去掉每帧字面量构造与重复合并。
3. `isSvg` 与 `imageSource` 按 `src` 维度 `useMemo`，省去普通展示路径上每帧的 SVG 正则匹配与 `{ uri: src }` 对象分配。
4. `onLayout` 在非 layout 模式下传 `undefined` 而非 `noop`，避免在 [useLayout](packages/webpack-plugin/lib/runtime/components/react/utils.tsx) 中因为 truthy 守卫而无条件注册 layout 回调。
5. `ModeMap` 由 `Map` 改为 `Record`，省去 hot path 上的 `Map.get` 调用与 `||` 兜底，并把回退到 `'stretch'` 的兜底收敛到查找侧。

明确不做：

1. 不做 `_Image` 整体 `React.memo`：上层多以稳定 props 进入，但 `style`、`bindload`、`binderror` 这些每帧均为新引用，memo 几乎不可能命中；为命中而强行做引用稳定改造，破坏面大于收益。
2. 不做 `innerProps style` 的 `extendObject` 省层（与 [rn-mpx-view-performance-optimization.md](solutions/rn-mpx-view-performance-optimization.md) 保持一致结论）。
3. 不把 `imageWidth / imageHeight / ratio / viewWidth / viewHeight` 五个 `useState` 收敛为单对象 state：React 18 在事件 / `useEffect` 内已自动 batch，多 setter 不会触发多次 commit，且布局回调链路是低频路径。
4. 不在 `mpx-image` 内做 `Image.getSize` 缓存——同一组件实例内 `src` 数量受限，且 layout 模式下首屏只触发一次；按 src 缓存仅对反复切回切出的极端场景有意义，超出本方案范围（与 [rn-mpx-view-performance-optimization.md](solutions/rn-mpx-view-performance-optimization.md) 方案六保持差异化）。
5. 不重构 `modeStyle` 的 `useMemo` 分支结构。该 `useMemo` 现状仅对 svg / crop 模式有产出，普通图片走默认 `{}` 路径，分支已足够清晰，依赖列表也覆盖了所有读取项，保留现状。
6. 不把 `setViewSize / onSvgLoad / onImageLoad` 包成 `useCallback`：它们只作为子元素 prop 透传，下游 RN `<Image>` 不会因父函数引用变化跳过 commit，包 useCallback 只增加 ref 写入与 useCallback 自身的开销。
7. 不在 [renderImage](packages/webpack-plugin/lib/runtime/components/react/utils.tsx) 内对 `@d11/react-native-fast-image` 做模块级 lazy cache：webpack / Metro 自带模块缓存，重复 `require` 仅走一次缓存查找，再叠一层 `cachedFastImage` 收益甚微。
8. 不引入 RN runtime 性能探针对照组，与既有 RN 优化方案保持一致结论。

## 方案一：`cropMode` 改 hash 表

[mpx-image.tsx:74-84](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L74-L84) 当前以数组形式持有 9 个 crop mode token，每帧 render 都要执行 `cropMode.includes(mode)` 做 9 次相等比较。改为 `Record<string, boolean>` + `hasOwn`：

```ts
import { hasOwn } from '@mpxjs/utils'

const cropModeMap: Record<string, boolean> = {
  top: true,
  bottom: true,
  center: true,
  left: true,
  right: true,
  'top left': true,
  'top right': true,
  'bottom left': true,
  'bottom right': true
}

// _Image 内
const isCropMode = hasOwn(cropModeMap, mode)
```

`ModeMap` 同时由 `Map<Mode, ImageResizeMode>` 改为 `Record<string, ImageResizeMode>`。`Map.get(mode) || 'stretch'` 是兜底反模式（`||` 在合法 falsy 值时也会兜底），改为查找侧聚合：

```ts
const modeResizeMap: Record<string, ImageResizeMode> = {
  scaleToFill: 'stretch',
  aspectFit: 'contain',
  aspectFill: 'cover',
  widthFix: 'stretch',
  heightFix: 'stretch',
  top: 'stretch',
  bottom: 'stretch',
  center: 'stretch',
  left: 'stretch',
  right: 'stretch',
  'top left': 'stretch',
  'top right': 'stretch',
  'bottom left': 'stretch',
  'bottom right': 'stretch'
}

const resizeMode: ImageResizeMode = modeResizeMap[mode] || 'stretch'
```

注意点：

1. `mode` 在 `props` 中带默认值 `'scaleToFill'`，进 hot path 前已经收敛；`modeResizeMap[mode] || 'stretch'` 仍保留兜底，处理业务侧传入未声明枚举的情况。
2. 同步删除 `cropMode` 数组与 `ModeMap = new Map([...])` 的模块级初始化（其中 `...cropMode.map<[Mode, ImageResizeMode]>(mode => [mode, 'stretch'])` 在加载阶段会跑一次 9 次 map，可一并去掉）。

## 方案二：模块级常量化默认 style 与拼装常量

`_Image` 内若干字面量常量每帧都重新构造：

1. [mpx-image.tsx:169-172](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L169-L172) `defaultStyle = { width: 320, height: 240 }`。
2. [mpx-image.tsx:174-179](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L174-L179) `extendObject({}, defaultStyle, style, { overflow: 'hidden' })` 中第 4 个参数。
3. [mpx-image.tsx:504](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L504) SVG 路径 `{ transformOrigin: 'left top' }`。
4. [mpx-image.tsx:526-531](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L526-L531) base image style：非 crop 时 `{ transformOrigin: 'left top', width: '100%', height: '100%' }` 是固定字面量，每帧都新建一个对象传给 RN `<Image>` 的 `style`。

抽到模块级：

```ts
const DEFAULT_IMAGE_STYLE: ImageStyle = {
  width: DEFAULT_IMAGE_WIDTH,
  height: DEFAULT_IMAGE_HEIGHT
}
const OVERFLOW_HIDDEN_STYLE = { overflow: 'hidden' as const }
const SVG_TRANSFORM_ORIGIN_STYLE = { transformOrigin: 'left top' as const }
const BASE_IMAGE_FILL_STYLE: ImageStyle = {
  transformOrigin: 'left top',
  width: '100%',
  height: '100%'
}
```

`_Image` 内对应替换：

```ts
const styleObj = extendObject({}, DEFAULT_IMAGE_STYLE, style, OVERFLOW_HIDDEN_STYLE)

useNodesRef(props, ref, nodeRef, {
  defaultStyle: DEFAULT_IMAGE_STYLE
})
```

base image style：

```ts
const baseImageStyle = isCropMode
  ? extendObject(
      { transformOrigin: 'left top', width: imageWidth, height: imageHeight },
      modeStyle
    )
  : BASE_IMAGE_FILL_STYLE
```

非 crop 模式下复用同一个 frozen-shape 引用，向 RN `<Image>` / `<FastImage>` 桥层传同一份 style 引用，使 RN diff 链路在 prop reconciler 阶段直接 bail out，普通图片节点连续 render 不再产生 style diff 工作。

注意点：

1. `useNodesRef` 把 `defaultStyle` 透出到业务侧 `getNodeInstance().instance`。当前 [useNodesRef.ts](packages/webpack-plugin/lib/runtime/components/react/useNodesRef.ts) 只读不改，PR 描述中点名提示业务侧不可突变 instance。
2. `OVERFLOW_HIDDEN_STYLE` 会被 `extendObject` 浅复制写入 styleObj，外层不会突变到常量本身；安全。
3. `BASE_IMAGE_FILL_STYLE` 仅在非 crop 路径下被作为子组件 style 直接传入。RN `<Image>` 不会突变 `style`，安全。crop 路径下仍走临时对象 + `extendObject(modeStyle)`，因为该路径下 `imageWidth/imageHeight/modeStyle` 都是动态值。

## 方案三：`isSvg` / `imageSource` 按 src 维度 memo

[mpx-image.tsx:186](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L186) `const isSvg = isSvgProp || isSvgSource(src)`，`isSvgSource` 内部调用 `getImageUri` + `svgRegExp.test`，对 `require()` 返回的 `ImageSourcePropType` 还会跑一次 `RNImage.resolveAssetSource` 的反查。在普通展示场景里 `src` 通常稳定，每帧重新计算属于纯浪费。

[mpx-image.tsx:522](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L522) `source: normalizeImageSource(src)` 同理：每帧把 string `src` 重新打包成新的 `{ uri }` 对象，下游 RN `<Image>` 在 source diff 时认为是新对象触发 prop change。按 `src` 维度 memo 后引用稳定，RN 桥侧可跳过 source 重设。

```tsx
const isSvg = useMemo(
  () => isSvgProp || isSvgSource(src),
  [isSvgProp, src]
)

const imageSource = useMemo(() => normalizeImageSource(src), [src])

// renderBaseImage 内
source: imageSource
```

注意点：

1. `isSvgProp` 与 `src` 都是 props 字段，依赖项稳定；`useMemo` 不会破坏 hook 顺序。
2. `imageSource` 仅供 `renderBaseImage`（非 svg 路径）使用，svg 路径仍走 `typeof src === 'string'` 分支判断；不影响。
3. `RNImage.resolveAssetSource` 对同一 `require()` 返回的资源对象其结果稳定，无需担心 cache invalidation。

## 方案四：非 layout 模式下 `onLayout` 不传 `noop`

[mpx-image.tsx:226](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L226) 当前写法：

```ts
const { layoutRef, layoutStyle, layoutProps } = useLayout({
  props,
  hasSelfPercent,
  setWidth,
  setHeight,
  nodeRef,
  onLayout: isLayoutMode ? onLayout : noop
})
```

[utils.tsx:1228](packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L1228) `if (hasSelfPercent || onLayout || enableOffset)` 把 `onLayout` 当作 truthy 守卫，`noop` 是函数（truthy），导致即使在非 layout 模式 + 无 selfPercent + 无 enableOffset 的"普通图片"场景，也会注册一次 `layoutProps.onLayout`，被 RN 视为业务感兴趣 layout，每次实例 mount / remeasure 都会回调。

改为：

```ts
onLayout: isLayoutMode ? onLayout : undefined
```

`undefined` 是 falsy，`useLayout` 守卫直接短路；普通图片节点不再产生无谓的 layout 回调。

注意点：

1. `useLayout` 内部 `onLayout && onLayout(e)` 已经做了存在性判断，传 `undefined` 安全。
2. `enable-offset` 与 `hasSelfPercent` 路径仍按原逻辑独立注册 layout，不受影响。
3. `props.onLayout` 透传分支保持原行为（`useLayout` 内 `props.onLayout && props.onLayout(e)` 仍在 layout 注册路径里被调用）。

## 改动范围

1. [packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx)
   - `cropMode` 数组改 `cropModeMap` Record + `hasOwn` 命中；`ModeMap` 改 `modeResizeMap` Record。
   - 抽 `DEFAULT_IMAGE_STYLE` / `OVERFLOW_HIDDEN_STYLE` / `SVG_TRANSFORM_ORIGIN_STYLE` / `BASE_IMAGE_FILL_STYLE` 模块级常量。
   - `useNodesRef` 与 `styleObj` 引用模块级常量。
   - `isSvg` / `imageSource` 改 `useMemo([src])` / `useMemo([isSvgProp, src])`。
   - `useLayout` 入口 `onLayout` 在非 layout 模式传 `undefined`。
   - `renderBaseImage` 非 crop 分支复用 `BASE_IMAGE_FILL_STYLE`。

## 测试建议

1. 大量普通图片列表（`scaleToFill / aspectFit / aspectFill`，无 svg、无 crop、无 widthFix/heightFix）渲染输出与现状一致；连续 render 时 `<Image>` style / source 引用稳定（可用 `Object.is` 在测试桩中断言）。
2. `mode='widthFix' / 'heightFix' / 'top' / 'top left'` 等 layout / crop 模式的尺寸计算、`modeStyle` transform 与现状一致。
3. SVG `src`（`*.svg` / `*.svg?xx` / `*.svg#yy`）走 `renderSvgImage` 分支；本地 require 资源 `<LocalSvg>` 分支正常。
4. `bindload / binderror` 在普通图片、SVG、layout 模式三种路径下均能被触发，`detail` 字段不变。
5. 非 layout 模式且无 `enable-offset`、无 `hasSelfPercent` 的图片，`onLayout` 不会被订阅（可在 RN 端侧通过 mock `<Image onLayout>` 验证未被传入 callback）。
6. `position: fixed` 的图片走 `Portal` 包裹路径，行为不变。
7. `cropMode` 全部 9 种 token 经 `hasOwn(cropModeMap, mode)` 命中；非 crop 模式不进入 crop 分支。

完成代码改动后按仓库约束执行相关 eslint 与 jest。

## 回滚策略

1. `cropModeMap` / `modeResizeMap` 改造出问题：恢复 `cropMode` 数组 + `ModeMap` Map。
2. 模块级常量化出问题（如业务侧突变 `defaultStyle`）：恢复 `_Image` 内字面量构造。
3. `isSvg / imageSource` `useMemo` 出问题：分别局部回退到每帧调用 `isSvgSource(src)` / `normalizeImageSource(src)`。
4. `onLayout` 改 `undefined` 出问题：恢复 `noop` 透传。
