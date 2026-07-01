# Mpx2RN mpx-simple-text / mpx-simple-view 性能优化方案

## 结论

`mpx-simple-text` / `mpx-simple-view` 是 Mpx2RN 中用户主动通过 `is-simple` 标记的"快路径"组件，用于关闭样式百分比 / `var()` / `env()` / `position: fixed` / 动画 / hover 等能力，换取最薄的运行时开销。它们是大列表、长文本、纯展示节点的高频载体。本方案围绕这两个文件做局部减法，目标是把单次 render 中对象分配数与 `Object.keys` 遍历次数压到最低，并消除"无继承文本 / 无 boxSizing 影响样式"等常见路径下的多余 `extendObject` 与中间变量。

最终采纳的优化项：

1. `mpx-simple-text`：无 `inheritedText` 时 `mergedProps` / `mergedStyle` 直接复用 `props` / `props.style` 引用，避免两次 `extendObject({}, ...)` 分配。
2. `mpx-simple-text`：`isStringChildren(children)` 改为按需计算——仅当 `textStyle` 非空时才需要判断，否则不进入遍历。
3. `mpx-simple-text`：`mergedStyle` 上做 `transformBoxSizing` 时按需 clone，避免污染上游 `props.style`，并与 1 配合。
4. `mpx-simple-text`：合并 `extendObject({}, mergedProps, { allowFontScaling, style: mergedStyle })`，去掉单独解构 `allowFontScaling/children` 这两个仅为转手的中间变量。
5. `mpx-simple-view`：`styleObj` 仅在 `hasBoxSizingAffectingStyle` 时分配；否则直接复用 `innerStyle`（结合 `splitStyle` 的"首次命中索引复用"特性，无 text/bg 命中时即直接复用 `props.style`）。
6. `wrapChildren` 签名收紧为 `wrapChildren(children, config)`：原签名只读 `props.children`，所有 18 个 caller 全部传 `props.children` 即可——既省下 `mpx-simple-view` / `mpx-simple-text` 的 `{ children }` 临时对象，也顺带消灭 `mpx-text.tsx` 中为覆盖 `decode` 后 children 而构造的 `extendObject({}, mergedProps, { children })` 与 `mpx-scroll-view.tsx` 中 `hasRefresher` 时的 `extendObject({}, props, { children: otherContent })` 两个隐藏分配。

明确不做：

1. 不为 `mpx-simple-text` / `mpx-simple-view` 加 `React.memo`（外层渲染由父级控制，是否相等需父级决定；这里加 memo 会把 props 浅比较的负担转嫁过来，整体未必正收益）。
2. 不修改 `useInnerProps` 签名以"接收 extras 参数省去一次 `extendObject`"——影响面跨所有内建组件，超出本方案范围。
3. 不引入"`splitStyle` fast path（只探测 boxSizing 不分类）"。SimpleText 路径下 splitStyle 在无 text/bg 命中时本就只有一次 sideEffect 单循环遍历，进一步拆分会增加调用方复杂度且收益边际。
4. 不在 simple-text 中跳过 `splitStyle`——textStyle 必须能在子节点非纯字符串时透传给 `useTextPassThroughText`，无法用更轻量的判断替代。
5. 不引入对 `props.style` 的稳定引用缓存（编译产物每次新引用）。
6. 不在本方案中并行优化 `mpx-text` / `mpx-view`（已有独立方案 `rn-mpx-view-performance-optimization.md`，且 mpx-text 主体由 `useTransformStyle` 主导，与 simple 路径关注点不同）。

## 现状回顾

### `mpx-simple-text.tsx` 每帧分配点

```tsx
const { textStyle } = splitStyle(props.style || {}, /* boxSizing sideEffect */)   // 1) splitStyle 内部对象
const isStringOnly = isStringChildren(props.children)                             // 2) every 遍历
const childTextStyle = !isStringOnly ? textStyle as TextStyle : undefined
const { inheritedText, textPassThrough } = useTextPassThroughText(childTextStyle)
const mergedStyle = extendObject({}, inheritedText?.textStyle, props.style)       // 3) 新对象
const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)      // 4) 新对象
if (hasBoxSizingAffectingStyle) transformBoxSizing(mergedStyle)                   // mutate 上一对象
const { allowFontScaling, children } = mergedProps                                // 5) 仅转手
const innerProps = useInnerProps(
  extendObject({}, mergedProps, { allowFontScaling: ..., style: mergedStyle })    // 6) 又一新对象
)
createElement(Text, innerProps, wrapChildren({ children }, { ... }))              // 7) wrapChildren 临时对象
```

绝大多数 `<text>` 节点都满足"无 `TextPassThroughContext` 继承（顶层 Text）+ 子节点为字符串"。这种主路径下 3) 4) 7) 是纯浪费分配。

### `mpx-simple-view.tsx` 每帧分配点

```tsx
const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)         // 1) splitProps（无 text 时复用引用）
const { textStyle, innerStyle = {} } = splitStyle(props.style || {}, ...)         // 2) splitStyle（无命中时复用引用）
const textPassThrough = useTextPassThrough(...)                                   // null 路径很轻
const styleObj = extendObject({}, innerStyle)                                     // 3) 总是新对象
if (hasBoxSizingAffectingStyle) transformBoxSizing(styleObj)
const innerProps = useInnerProps(extendObject({}, props, { style: styleObj }))    // 4) 又一新对象
createElement(View, innerProps, wrapChildren(props, { hasVarDec: false, textPassThrough }))
```

无 box-sizing 影响样式（普通 view 主路径）时 3) 是纯浪费——`innerStyle` 已是新对象（splitStyle 命中后产物）或与 `props.style` 同引用（splitStyle 无命中复用产物）。两种情况都可以直接复用。

## 方案一：`mpx-simple-text` 主路径复用 props / props.style

无 `TextPassThroughContext` 继承（`inheritedText === null`）时——这是大多数 Text 顶层节点的常态——`mergedStyle` 与 `mergedProps` 没有任何字段要叠，直接复用即可。`transformBoxSizing` 是唯一会写入 `mergedStyle` 的步骤，仅在 `hasBoxSizingAffectingStyle` 时触发；该路径下条件 clone 一次出来即可，整体仍只一次分配。

```tsx
const SimpleText = (props: TextProps): JSX.Element => {
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('simple-text:render:total')

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('simple-text:render:style')
  let hasBoxSizingAffectingStyle = false
  const { textStyle } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  // textStyle 仅在子节点非纯字符串时才需要透传给子级；按需计算 isStringChildren
  const childTextStyle = textStyle && !isStringChildren(props.children)
    ? textStyle as TextStyle
    : undefined
  const { inheritedText, textPassThrough } = useTextPassThroughText(childTextStyle)

  const mergedProps = inheritedText?.pendingTextProps
    ? extendObject({}, inheritedText.pendingTextProps, props)
    : props
  let mergedStyle = inheritedText?.textStyle
    ? extendObject({}, inheritedText.textStyle, props.style)
    : props.style
  if (hasBoxSizingAffectingStyle) {
    // 仅在需要 mutate 时 clone，避免污染上游 props.style
    if (mergedStyle === props.style) mergedStyle = extendObject({}, props.style)
    transformBoxSizing(mergedStyle as Record<string, any>)
  }
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('simple-text:render:innerProps')
  const innerProps = useInnerProps(
    extendObject(
      {},
      mergedProps,
      {
        allowFontScaling: mergedProps.allowFontScaling ?? getDefaultAllowFontScaling(),
        style: mergedStyle
      }
    )
  )
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('simple-text:render:createElement')
  const result = createElement(Text, innerProps, wrapChildren(
    { children: mergedProps.children },
    {
      hasVarDec: false,
      textPassThrough
    }
  ))
  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)

  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return result
}
```

要点：

1. `mergedProps` / `mergedStyle` 在主路径下复用上游引用，外部调用方对 `props` / `props.style` 的不可变契约不破——后续 `transformBoxSizing` 在写入前做了独占 clone。
2. `isStringChildren` 仅当存在 `textStyle` 时计算。绝大多数无样式 Text 节点（`splitStyle` 不会产出 `textStyle`）连这次遍历都跳过。
3. `allowFontScaling` / `children` 不再单独解构；前者用 `mergedProps.allowFontScaling` 一次访问，后者交给 `wrapChildren` 经 `{ children: ... }` 间接消费。
4. `mergedProps.allowFontScaling ?? getDefaultAllowFontScaling()` 与原写法语义等价：`mergedProps` 包含 props 的所有字段（自身 spread 或主路径下 `=== props`），属性读取与解构等效。

## 方案二：`mpx-simple-view` `styleObj` 条件分配

`styleObj` 当前总是新建——但 `transformBoxSizing` 是唯一会写入它的步骤。把 clone 行为下沉到 `hasBoxSizingAffectingStyle` 分支：

```tsx
const SimpleView = (simpleViewProps: SimpleViewProps): JSX.Element => {
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('simple-view:render:total')

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('simple-view:render:style')
  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)
  const enableTextPassThrough = props['enable-text-pass-through']

  let hasBoxSizingAffectingStyle = false
  const { textStyle, innerStyle = {} } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const textPassThrough = useTextPassThrough(textStyle as TextStyle, textProps, { enableTextPassThrough })

  let styleObj: Record<string, any> = innerStyle
  if (hasBoxSizingAffectingStyle) {
    // 复制一次再 mutate，避免污染 splitStyle 复用的原 props.style
    styleObj = extendObject({}, innerStyle)
    transformBoxSizing(styleObj)
  }
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('simple-view:render:innerProps')
  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        style: styleObj
      }
    )
  )
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('simple-view:render:createElement')
  const result = createElement(View, innerProps, wrapChildren(
    { children: props.children },
    {
      hasVarDec: false,
      textPassThrough
    }
  ))
  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)

  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return result
}
```

要点：

1. `splitStyle` 在无 text/bg 命中时返回的 `innerStyle === props.style`（参考 `rn-mpx-view-performance-optimization.md` 中"首次命中索引 + 顺序补写"已落地的实现）。`styleObj = innerStyle` 此时直接复用 `props.style` 引用——`extendObject({}, props, { style: styleObj })` 内层 style 即上游引用，符合"普通 view 不分配额外 style 对象"。
2. `hasBoxSizingAffectingStyle === true` 路径下仍 clone 一次再 mutate，行为与现状等价。
3. `wrapChildren` 入参由 `props` 改为 `{ children: props.children }`：`wrapChildren` 内部仅用 `props.children`，传整个 `props` 没有功能差异，但 V8 在 `wrapChildren` 内部读取 `props.children` 会走完整属性访问链（带 hidden class 检索）；传只含一个字段的对象更便于内联优化，与 simple-text 调用形态保持一致。
4. 因为 `wrapChildren` 仍读 `children`，不能直接传 `null`/`undefined` 跳过——空 children 由 `wrapChildren` 内部正常处理。

## 方案三：`wrapChildren` 签名收紧为 `(children, config)`

`wrapChildren` 现状只读 `props.children`，所有 18 个 caller 都只是为了把 `children` 喂进去。签名直接收紧：

```tsx
export function wrapChildren (children: ReactNode, { hasVarDec, varContext, textPassThrough }: WrapChildrenConfig) {
  if (textPassThrough) {
    children = <TextPassThroughContext.Provider value={textPassThrough} key='textPassThroughWrap'>{children}</TextPassThroughContext.Provider>
  }
  if (hasVarDec && varContext) {
    children = <VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>
  }
  return children
}
```

caller 改造一律两类：

1. `wrapChildren(props, config)` → `wrapChildren(props.children, config)`（绝大多数）。
2. `wrapChildren({ children: X }, config)` → `wrapChildren(X, config)`（`mpx-simple-*` / `mpx-swiper` / `mpx-picker-view` / `mpx-text` / `mpx-scroll-view` 这几处原本就显式构造）。

收益：

1. `mpx-text.tsx` 原本为覆盖 `decode` 后的 children 而做的 `extendObject({}, mergedProps, { children })` 整对象分配可以彻底删除——每帧少分配一个 props 大小的对象。
2. `mpx-scroll-view.tsx` 中 `hasRefresher` 时的 `extendObject({}, props, { children: otherContent })` 同样可以删除。
3. `mpx-simple-text` / `mpx-simple-view` 不再需要为收敛入参形态而构造 `{ children: ... }` 临时对象。
4. `wrapChildren` 内部省去 `let { children } = props` 解构。
5. 函数职责更清晰：明确"只对 children 做 context 包裹"。

落地范围 18 个 caller：`mpx-simple-text` / `mpx-simple-view` / `mpx-swiper` / `mpx-swiper-item` / `mpx-radio` / `mpx-radio-group` / `mpx-checkbox` / `mpx-checkbox-group` / `mpx-label` / `mpx-form` / `mpx-movable-view` / `mpx-movable-area` / `mpx-sticky-section` / `mpx-sticky-header` / `mpx-scroll-view` / `mpx-view`（在 `wrapWithChildren` 内调用）/ `mpx-text` / `mpx-button` / `mpx-picker-view`。

## 非目标

1. 不改变 simple-text / simple-view 的对外 props 契约，不收紧 `is-simple` 的适用范围。
2. 不在本方案中调整 `splitStyle` / `splitProps` 自身实现——它们已是 `rn-mpx-view-performance-optimization.md` 的优化对象。
3. 不引入 `useInnerProps` 的 fast path / 无事件短路重写。
4. 不调整 `useTextPassThroughText` / `useTextPassThrough` 内部实现——本方案只调整其调用点的 input 形态与时机。
5. 不引入 `React.memo` 或父级渲染稳定性相关的优化。
6. 不引入运行时探针对照组、benchmark 脚本。

## 改动范围

1. `packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx`
   - 无继承文本时 `mergedProps` / `mergedStyle` 直接复用 `props` / `props.style`。
   - `transformBoxSizing` 写入前做独占 clone。
   - `isStringChildren` 改按需计算（`textStyle` 存在才调用）。
   - 去掉 `allowFontScaling` / `children` 的中间解构；`wrapChildren` 入参改为 `mergedProps.children`。
2. `packages/webpack-plugin/lib/runtime/components/react/mpx-simple-view.tsx`
   - `styleObj` 改条件分配；`hasBoxSizingAffectingStyle` 时 clone 再 mutate，否则直接复用 `innerStyle`。
   - `wrapChildren` 入参改为 `props.children`。
3. `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
   - `wrapChildren` 签名收紧为 `(children: ReactNode, config)`，去掉对 props 对象的依赖。
4. 跟随 `wrapChildren` 签名变更同步更新的 16 个 caller：`mpx-text` / `mpx-view` / `mpx-button` / `mpx-swiper` / `mpx-swiper-item` / `mpx-radio` / `mpx-radio-group` / `mpx-checkbox` / `mpx-checkbox-group` / `mpx-label` / `mpx-form` / `mpx-movable-view` / `mpx-movable-area` / `mpx-sticky-section` / `mpx-sticky-header` / `mpx-scroll-view` / `mpx-picker-view`。其中：
   - `mpx-text.tsx`：删除 `extendObject({}, mergedProps, { children })`，直接传 `children`。
   - `mpx-scroll-view.tsx`：删除 `hasRefresher` 分支的 `extendObject({}, props, { children: otherContent })`，直接传 `otherContent` / `props.children`。
   - 其他 caller 仅做 `props` → `props.children` 的入参形态调整。

## 测试建议

1. 纯字符串 children 的 `<text>` 节点，无样式时渲染与现状一致；`splitStyle`、`isStringChildren` 都不应进入实际收集分支（可在本地用断点 / 计数验证 `isStringChildren` 跳过）。
2. `<text style="color:red">x</text>`：textStyle 透传给 `useTextPassThroughText`；纯字符串子节点下不应触发 `<TextPassThroughContext.Provider>` 包裹（`childTextStyle === undefined`）。
3. `<text style="color:red"><image /></text>`：非纯字符串子节点下 `childTextStyle` 取到 `textStyle`，子级能继承文本样式。
4. `TextPassThroughContext` 已被父级注入时，`mergedStyle` / `mergedProps` 进入合并分支，最终样式 / props 合并顺序与现状一致。
5. `<text style="padding:10rpx">x</text>`：`hasBoxSizingAffectingStyle === true`，最终样式包含默认 boxSizing；`props.style` 上游对象不应被 mutate（可在父级保留引用做 `===` 与字段读校验）。
6. `<view>` 普通节点（无 text/bg style、无 box-sizing 影响 style）：`innerProps.style === props.style`（splitStyle 复用 + styleObj 复用）；改造前应当是新对象，改造后是同一引用。
7. `<view style="padding:10rpx">`：`styleObj` 进入分配分支，`transformBoxSizing` 写入，与现状一致；不污染上游。
8. `<view><text>x</text></view>` 带 `text-style` 透传：`useTextPassThrough` 在 textStyle/textProps/enableTextPassThrough 任一启用下产出 context，子级 `<text>` 能读取——`wrapChildren({ children }, { textPassThrough })` 仍负责注入 Provider。
9. `mpx-simple-text` / `mpx-simple-view` 的 `__mpx_perf_framework__` 三段探针 id 顺序与作用域结束位置保持不变。
10. 事件 props（如 `bindtap`）仍由 `useInnerProps` 内部识别并注入到 `innerProps`，与改造前一致。

完成代码改动后按仓库约束执行相关 eslint / jest。

## 回滚策略

1. `mpx-simple-text` 主路径复用出问题（如外部对 `props.style` 做反向断言失败）：恢复 `mergedStyle = extendObject({}, inheritedText?.textStyle, props.style)` 与 `mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)` 的无条件合并写法。
2. `isStringChildren` 按需计算出问题（如子节点动态切换样式继承未生效）：恢复每次 render 都调用 `isStringChildren(props.children)`。
3. `mpx-simple-view` `styleObj` 条件分配出问题：恢复 `const styleObj = extendObject({}, innerStyle)` 的无条件分配。
4. `wrapChildren` 签名收紧出问题：恢复 `(props, config)` 签名（`let { children } = props`），将所有 caller 由 `wrapChildren(X, config)` 回滚为 `wrapChildren({ children: X }, config)`；`mpx-text.tsx` 与 `mpx-scroll-view.tsx` 中删除的 `extendObject({}, props, { children })` 也一并复原。
5. 各项变更彼此独立，可单点回退，互不影响。
