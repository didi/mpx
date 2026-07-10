# RN 文本样式透传按需订阅优化方案

## 背景与问题

当前 RN runtime 通过 `TextPassThroughContext` 实现文本样式与文本属性透传：

1. 容器组件通过 `splitStyle` 拆出 `textStyle`，通过 `splitProps` 拆出 `textProps`。
2. 容器组件调用 `useTextPassThrough(textStyle, textProps)` 合并祖先透传值。
3. `wrapChildren` 在存在 `textPassThrough` 时包 `TextPassThroughContext.Provider`。
4. `mpx-text`、`mpx-simple-text`、`mpx-inline-text` 等文本类组件读取 context，并把继承样式合并到 RN Text。

问题在于 `useTextPassThrough` 当前一开始就会调用 `useContext(TextPassThroughContext)`。因此任何调用该 hook 的容器，即使自身没有字体样式或文本属性，也会订阅 `TextPassThroughContext`。在 view-heavy 页面中，大量普通布局节点成为无效 consumer，会增加 context dependency、render 阶段 JS 执行与 context propagation 成本。

此前考虑过将 hook 改成按需 `TextPassThroughWrap` 组件，但这会让子树在“直接 children”和“wrapper 包 children”之间切换。动态字体样式或文本属性出现/消失时，React 可能把子树识别为不同结构，带来 remount、本地状态丢失、effect 重跑、动画/手势状态重置等风险。

## 目标

1. 保留当前 `useTextPassThrough` + `wrapChildren` 的整体设计。
2. 无本地文本透传源的容器默认不订阅 `TextPassThroughContext`。
3. 有本地 `textStyle` / `textProps` 或显式开启 `enable-text-pass-through` 的节点，稳定订阅 context 并稳定包 Provider。
4. “是否启用文本透传 Provider”在组件生命周期内保持稳定，避免子树结构动态切换。
5. 动态字体样式 / 动态文本属性场景通过 `enable-text-pass-through` 提前启用，类似 `enable-background` / `enable-animation`。
6. 保持 React Hooks 调用顺序稳定；需要条件式调用内部 hook 时，必须配合生命周期稳定性检查。
7. 运行时代码继续使用 `extendObject` / `Object.assign`，不使用 object spread。

## 总体设计

保留 `useTextPassThrough`，但把“是否需要订阅 context”的判断前置到 hook 内部：

1. 组件仍然在顶层调用 `useTextPassThrough`。
2. hook 先根据 `textStyle`、`textProps`、`enableTextPassThrough` 计算 `enableTextPassThrough` 状态。
3. 通过 `useRef` 记录首次计算结果，后续如果变化则报错，要求生命周期稳定。
4. 如果首次结果为 false，hook 直接返回 `null`，不调用 `useContext(TextPassThroughContext)`，从而不订阅 context。
5. 如果首次结果为 true，hook 每次都调用 `useContext`，并稳定返回一个 context value；即使当前没有本地 `textStyle` / `textProps`，也会透传父级值，保持 Provider 持续存在。

这样可以同时达成：

1. 普通无文本透传源 view 不订阅 context。
2. 需要文本透传的节点 Provider 存在性稳定，避免子树结构来回变化。
3. 动态场景通过显式开关从首次渲染就启用 Provider。

## API 与类型

### 新增组件属性

为会参与文本透传的容器类组件新增可选属性：

```ts
'enable-text-pass-through'?: boolean
```

语义：

1. 默认不传时，仅首次渲染存在 `textStyle` 或 `textProps` 的节点启用文本透传 Provider。
2. 如果节点后续可能动态出现字体样式或文本属性，应显式传 `enable-text-pass-through`，让 Provider 从首次渲染就稳定存在。
3. 如果未显式开启，但生命周期中启用状态发生变化，runtime 报错提示使用 `enable-text-pass-through`。

如果该属性作为用户可见能力落地，需要同步更新 RN 相关文档与 skill；如果仅作为内部编译产物/运行时 prop 使用，则按内部实现处理。

### 调整 TextPassThroughValueOptions

文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

```ts
export interface TextPassThroughValueOptions {
  enableTextPassThrough?: boolean
}
```

其中：

1. `enableTextPassThrough` 对应组件属性 `enable-text-pass-through`，用于提前稳定启用 Provider。

## useTextPassThrough 改造

### 启用判断

hook 内部先计算当前 render 是否需要启用文本透传：

```tsx
const shouldEnableTextPassThrough = (
  enableTextPassThrough ||
  !!textStyle ||
  !!textProps
)
```

说明：

1. 容器组件通常只会因为 `enableTextPassThrough`、`textStyle`、`textProps` 启用。
2. 文本组件不复用该 hook，改用文本组件专用 hook 消费父级透传值，并按需为子树创建 Provider。

### 生命周期稳定性检查

```tsx
const enableTextPassThroughRef = useRef(shouldEnableTextPassThrough)

if (enableTextPassThroughRef.current !== shouldEnableTextPassThrough) {
  error('[Mpx runtime error]: text pass-through use should be stable in the component lifecycle, or you can set [enable-text-pass-through] with true.')
}

if (!enableTextPassThroughRef.current) return null
```

这与现有 `enable-background`、`hover-class`、`enable-animation` 的稳定性约束一致。区别是这里用于避免 Provider 动态新增/删除导致子树结构变化。

### 条件订阅 context

只有 `enableTextPassThroughRef.current` 为 true 时才订阅 context：

```tsx
// eslint-disable-next-line react-hooks/rules-of-hooks
const parent = useContext(TextPassThroughContext)
// eslint-disable-next-line react-hooks/rules-of-hooks
const valueRef = useRef<TextPassThroughContextValue | null>(null)
```

这里属于“稳定条件下的条件 hook”。运行时 hook 顺序稳定由 `enableTextPassThroughRef` 保证；代码层面需要添加 ESLint 注释，和现有 `useHover` / `useAnimationHooks` 中的模式保持一致。

### 合并逻辑

启用后始终返回一个 context value，不因为当前 `textStyle` / `textProps` 为空而返回 `null`。这样 Provider 存在性保持稳定：

```tsx
const nextTextStyle = textStyle
  ? extendObject({}, parent?.textStyle, textStyle)
  : parent?.textStyle
const nextTextProps = textProps
  ? extendObject({}, parent?.pendingTextProps, textProps)
  : parent?.pendingTextProps
const nextValue = {
  textStyle: nextTextStyle,
  pendingTextProps: nextTextProps
}

if (diffAndCloneA(valueRef.current, nextValue).diff) {
  valueRef.current = nextValue
}

return valueRef.current
```

即使 `enable-text-pass-through=true` 且当前没有本地文本源，也会返回透传父级后的 value。若父级也为空，value 中字段为 undefined，对行为无影响，但可保证 Provider 一直存在。

### 完整示意

```tsx
export function useTextPassThrough (
  textStyle?: TextStyle,
  textProps?: Record<string, any>,
  {
    enableTextPassThrough = false
  }: TextPassThroughValueOptions = {}
) {
  const shouldEnableTextPassThrough = (
    enableTextPassThrough ||
    !!textStyle ||
    !!textProps
  )
  const enableTextPassThroughRef = useRef(shouldEnableTextPassThrough)

  if (enableTextPassThroughRef.current !== shouldEnableTextPassThrough) {
    error('[Mpx runtime error]: text pass-through use should be stable in the component lifecycle, or you can set [enable-text-pass-through] with true.')
  }

  if (!enableTextPassThroughRef.current) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const parent = useContext(TextPassThroughContext)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const valueRef = useRef<TextPassThroughContextValue | null>(null)

  const nextTextStyle = textStyle
    ? extendObject({}, parent?.textStyle, textStyle)
    : parent?.textStyle
  const nextTextProps = textProps
    ? extendObject({}, parent?.pendingTextProps, textProps)
    : parent?.pendingTextProps
  const nextValue = {
    textStyle: nextTextStyle,
    pendingTextProps: nextTextProps
  }

  if (diffAndCloneA(valueRef.current, nextValue).diff) {
    valueRef.current = nextValue
  }

  return valueRef.current
}
```

## wrapChildren 保持不变

`wrapChildren` 继续接收已计算好的 `textPassThrough` value：

```tsx
export function wrapChildren (props = {}, { hasVarDec, varContext, textPassThrough }) {
  let { children } = props

  if (textPassThrough) {
    children = (
      <TextPassThroughContext.Provider value={textPassThrough} key='textPassThroughWrap'>
        {children}
      </TextPassThroughContext.Provider>
    )
  }

  if (hasVarDec && varContext) {
    children = <VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>
  }

  return children
}
```

只要容器侧 `useTextPassThrough` 的启用状态生命周期稳定，容器子树里的 Provider 就不会动态新增/删除。

## 容器组件改造

以 `mpx-view` 为例：

```tsx
const {
  ...
  'enable-text-pass-through': enableTextPassThrough,
  ...
} = props

const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)
const textPassThrough = useTextPassThrough(textStyle, textProps, {
  enableTextPassThrough
})
```

其他容器组件同理：

1. 类型中补充 `'enable-text-pass-through'?: boolean`。
2. 从 props 中取出 `enableTextPassThrough`。
3. 调用 `useTextPassThrough(textStyle, textProps, { enableTextPassThrough })`。
4. 保持传给 `wrapChildren` 的 `textPassThrough` 不变。

无需改 `wrapChildren` 调用结构。

## 文本组件处理

文本组件与容器组件职责不同：

1. `mpx-text` / `mpx-simple-text` / `mpx-inline-text` 自身必须消费父级 `TextPassThroughContext`，否则无法继承外层字体样式与文本属性。
2. 它们只有在“当前 text 存在可继续向子 text 继承的本地 `textStyle`，且子节点不是纯字符串”时，才需要继续向子树提供 Provider。
3. `pendingTextProps` 属于当前 Text 的消费项，消费后不继续向更深层 text 透传。

因此为文本组件提供专用 hook，例如 `useTextPassThroughText`：

```tsx
export function useTextPassThroughText (textStyle?: TextStyle) {
  const inheritedText = useContext(TextPassThroughContext)
  const valueRef = useRef<TextPassThroughContextValue | null>(null)

  if (!textStyle) {
    return {
      inheritedText,
      textPassThrough: null
    }
  }

  const nextValue = {
    textStyle: extendObject({}, inheritedText?.textStyle, textStyle)
  }

  if (diffAndCloneA(valueRef.current, nextValue).diff) {
    valueRef.current = nextValue
  }

  return {
    inheritedText,
    textPassThrough: valueRef.current
  }
}
```

其中：

1. `inheritedText` 用于当前 Text 消费父级样式和 `pendingTextProps`。
2. `textPassThrough` 仅用于包裹子树；没有本地 `textStyle` 时返回 `null`，不创建子级 Provider。
3. `textPassThrough` 不携带 `pendingTextProps`，避免 `numberOfLines`、`ellipsizeMode` 被更深层 text 重复消费。
4. 该 hook 不复用容器侧 `useTextPassThrough`，避免为了 text 场景强制创建 Provider 或在组件内做二次派生处理。

### mpx-text

`mpx-text` 使用专用 hook 拆分当前层消费与子级透传：

```tsx
const { textStyle } = splitStyle(normalStyle)
const { inheritedText, textPassThrough } = useTextPassThroughText(
  !isStringOnly ? textStyle : undefined
)

const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)
const finalStyle = extendObject({}, inheritedText?.textStyle, normalStyle)
```

`textPassThrough` 传给 `wrapChildren`。当 `textStyle` 不存在或子节点是纯字符串时，它为 `null`，不会为 text 子树创建 Provider。

### mpx-simple-text

`mpx-simple-text` 与 `mpx-text` 保持同一语义：

```tsx
const { textStyle } = splitStyle(props.style || {}, sideEffect)
const childTextStyle = !isStringOnly ? textStyle : undefined
const { inheritedText, textPassThrough } = useTextPassThroughText(childTextStyle)
const mergedStyle = extendObject({}, inheritedText?.textStyle, props.style)
const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)
```

它只在存在本地 `textStyle` 且子节点不是纯字符串时向子树提供 Provider。

### mpx-inline-text

`mpx-inline-text` 是编译器为 RN 裸文字自动补的 Text 包裹，按叶子文本节点处理。它只需消费祖先透传值，不继续向子级提供 Provider，因此直接 `useContext(TextPassThroughContext)` 即可，无需走专用 hook：

```tsx
const inheritedText = useContext(TextPassThroughContext)
const style = extendObject({}, inheritedText?.textStyle, props.style)
const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props, { style })
```

`mpx-inline-text` 不引入 `wrapChildren`。

### mpx-portal

`mpx-portal` 是跨树挂载边界，应保留当前 context 桥接逻辑：读取当前 `TextPassThroughContext`，并在 portal 子树重新提供。否则 fixed / portal 场景会丢失外层文本透传。

## 语义与边界

### 普通透明容器

```tsx
view(color:red) -> view(no text style) -> text
```

中间 `view` 首次渲染没有 `textStyle`、没有 `textProps`、没有 `enable-text-pass-through`，因此 `useTextPassThrough` 返回 `null` 且不订阅 context。`text` 仍能直接读取外层 `view(color:red)` 的 Provider。

### 本地覆盖

```tsx
view(color:red) -> view(color:blue) -> text
```

内层 `view(color:blue)` 首次渲染存在 `textStyle`，因此稳定订阅并提供 Provider，text 最终继承 blue。

### 动态字体样式

```tsx
view(enable-text-pass-through) -> text
```

如果该 view 后续可能动态出现 `color` / `fontSize` / `numberOfLines` 等文本透传源，需要提前设置 `enable-text-pass-through`。这样 Provider 从首次渲染就存在，后续只更新 value，不改变子树结构。

如果未设置 `enable-text-pass-through`，但运行时从无文本透传源变成有文本透传源，runtime 报错提示开启该属性。

### textProps 消费边界

`mpx-text` / `mpx-simple-text` 消费 `pendingTextProps` 后，专用 hook 只为子级 Provider 生成 `textStyle`，不携带 `pendingTextProps`，避免 `numberOfLines` 等继续传给更深层 text。

## 与树形稳定性的关系

该方案不新增 `TextPassThroughWrap` 组件，不改变现有 `wrapChildren` 的 Provider 包裹形态。容器侧通过 `enable-text-pass-through` 保证 Provider 存在性稳定。

首次未启用的节点始终不包 Provider；首次启用的节点始终包 Provider。动态文本源需要通过 `enable-text-pass-through` 提前启用，避免在运行时新增/删除 Provider。

文本组件侧是消费节点，不复用容器侧稳定开关。`mpx-text` / `mpx-simple-text` 没有本地 `textStyle` 时只消费父级 context，不创建子级 Provider；只有存在本地 `textStyle` 且存在非纯字符串子树时才向下提供 Provider。

这与现有 `enable-background`、`hover-class`、`enable-animation` 的约束口径一致。

## 性能分析

设页面中容器节点数为 `N`，其中首次需要文本透传或显式开启 `enable-text-pass-through` 的容器数为 `K`，文本类节点数为 `T`，通常 `K << N`。

当前 consumer 规模约为：

```txt
N + T + portal consumer
```

改造后 consumer 规模约为：

```txt
K + T + portal consumer
```

收益：

1. 无文本透传源的容器不再执行 `useContext(TextPassThroughContext)`。
2. 无文本透传源的容器不再创建用于透传 value 的 `useRef`。
3. React 不再为这些容器记录 `TextPassThroughContext` dependency。
4. 上层文本透传 context value 变化时，无关容器不再被 context propagation 命中。

成本：

1. `useTextPassThrough` 内多一次稳定性判断。
2. 动态场景需要显式开启 `enable-text-pass-through`，会让该节点从首次渲染就订阅 context。
3. 条件式内部 hook 需要 ESLint 注释与稳定性检查共同维护。

整体上，普通 view-heavy 页面会减少大量无效 context consumer；动态场景通过显式开启承担必要成本。

## 影响范围

核心文件：

1. `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
   - 扩展 `TextPassThroughValueOptions`。
   - 改造 `useTextPassThrough` 的启用判断、稳定性检查与条件订阅。
   - 新增 `useTextPassThroughText`，供文本组件消费父级透传并按需生成子级 Provider value。
2. 所有当前调用 `useTextPassThrough(textStyle, textProps)` 的容器组件。
   - 增加 `'enable-text-pass-through'?: boolean` 类型。
   - 读取该属性并传给 hook。
3. `packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx`
   - 使用 `useTextPassThroughText` 拆分当前 Text 消费值与子级 Provider value。
   - 当前 text 没有可向子级继承的 `textStyle` 时，不创建子级 Provider。
4. `packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx`
   - 同步 `mpx-text` 的处理方式。
5. `packages/webpack-plugin/lib/runtime/components/react/mpx-inline-text.tsx`
   - 复用 `useTextPassThroughText`，保持纯叶子消费逻辑，不引入子级 Provider。

## 实施步骤

### Step 1：改造 hook

1. `TextPassThroughValueOptions` 新增 `enableTextPassThrough?: boolean`。
2. 在 `useTextPassThrough` 内新增 `shouldEnableTextPassThrough`。
3. 用 `useRef` 记录首次启用状态。
4. 启用状态变化时报错。
5. 未启用时 return `null`，且不调用 `useContext`。
6. 启用时调用 `useContext` 并始终返回稳定 value。

### Step 2：容器组件接入 enable-text-pass-through

1. 组件 props 类型新增 `'enable-text-pass-through'?: boolean`。
2. 从 props 中取出该值。
3. 调用 hook 时传入 `{ enableTextPassThrough }`。
4. `useInnerProps` 的排除列表中按需加入 `'enable-text-pass-through'`，避免透传到 RN 原生组件。

### Step 3：文本组件调整

1. 新增 `useTextPassThroughText(textStyle?)`。
2. `mpx-text` 调用该 hook，使用 `inheritedText` 合并当前 Text 的 props / style，使用 `textPassThrough` 传给 `wrapChildren`。
3. `mpx-simple-text` 同步上述处理。
4. 当前 text 没有本地 `textStyle` 或子节点为纯字符串时，`textPassThrough` 为 `null`，不创建子级 Provider。
5. `mpx-inline-text` 复用 `useTextPassThroughText()`，保持纯消费逻辑，不改为容器侧 `useTextPassThrough`。

### Step 4：残留检查

1. 确认 `wrapChildren` 不变。
2. 确认没有新增 wrapper 组件。
3. 确认无文本透传源的普通容器不会调用 `useContext(TextPassThroughContext)`。
4. 确认动态文本透传源未显式开启时会报错。

## 验证用例

建议覆盖以下核心场景：

1. `view(color:red) -> text`，text 继承 red。
2. `view(color:red) -> view(no text style) -> text`，中间 view 不订阅 context，text 仍继承 red。
3. `view(color:red) -> view(color:blue) -> text`，text 最终为 blue。
4. `view(numberOfLines=1) -> view -> text`，text 获取 `numberOfLines=1`。
5. `view(numberOfLines=1) -> text -> text`，第二层 text 不继续继承已消费的 `numberOfLines`。
6. `view(enable-text-pass-through) -> text` 后续动态添加 `color`，Provider 不新增/删除，只更新 value。
7. 未设置 `enable-text-pass-through` 的 view 后续动态添加 `color`，触发稳定性错误。
8. `mpx-inline-text` 能消费外层文本样式与 `pendingTextProps`，但不创建子级 Provider。
9. `position: fixed` / portal 场景下，text 仍继承外层样式。

## 风险与回滚

主要风险：

1. 条件式内部 hook 需要稳定性检查兜底，否则可能违反 Hooks 调用顺序。
2. 某些动态样式场景未显式开启 `enable-text-pass-through`，会从原先“动态生效”变成 runtime error。
3. 容器组件漏加 `enable-text-pass-through` 类型或漏从 props 中剔除，可能透传到 RN 原生组件。
4. 文本组件专用 hook 生成子级 Provider value 错误，可能导致无意义 Provider 或 `pendingTextProps` 被继续向下透传。

回滚方式：

1. 恢复 `useTextPassThrough` 为无条件 `useContext`。
2. 移除 `enableTextPassThrough` option 和组件属性。
3. 保留原有 `wrapChildren` 与组件调用方式。

## 文档与 Skill 同步

如果 `enable-text-pass-through` 作为用户可见属性开放，需要同步更新 `docs-vitepress/` 与 `.agents/skills/mpx2rn/references/` 中 RN 基础组件属性相关文档。

如果仅作为内部编译产物或 runtime 私有 prop 使用，且不改变用户开发方式，则无需同步公开文档与 skill。
