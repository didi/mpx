# textProps/textStyle 透传方案

## 背景与问题

当前 RN 运行时会在 `wrapChildren` 中将容器拆出的 `textProps` 和 `textStyle` 透传给直接子级的 text 类组件：

```tsx
children = Children.map(children, (child) => {
  if (isText(child)) {
    const style = extendObject({}, textStyle, child.props.style)
    return cloneElement(child, extendObject({}, textProps, { style }))
  }
  return child
})
```

这个实现有两个问题：

1. 透传链路只能命中直接子级 text 组件，遇到中间层非 text 组件时会中断，例如 `view(style=color:red) -> custom/view -> text` 中的 `text` 无法继承外层文本样式。
2. 每次透传都需要遍历直接子节点并 `cloneElement`，对大子树和频繁 render 场景不够友好，也容易和组件自身的 props 处理顺序耦合。

目标是改为基于 context 的子树级透传，让子树中的所有 `mpx-text` 主动读取祖先容器提供的文本样式与文本属性，从而更接近 Web/小程序中部分 text 属性和文本样式逐级继承的行为。

## RN TextAncestorContext 分析

RN 0.74.5 内部存在 `TextAncestorContext`，但不建议直接复用：

1. 它的值只是 boolean，语义是“当前节点是否处于 RN `<Text>` 子树内”，用于让 RN `<Text>` 在 `NativeText` 与 `NativeVirtualText` 间切换。
2. RN `<View>` 在 text 子树内会把该 context 重置为 `false`，这是 RN 原生 text nesting 约束的一部分，不适合承载 Mpx 的跨非 text 组件透传语义。
3. 该模块位于 RN 内部路径 `react-native/Libraries/Text/TextAncestor`，不是稳定公开 API，直接依赖会带来 RN 版本升级风险。
4. 它不携带 `style` / `props`，即使读取也无法解决 `textStyle` / `textProps` 的继承合并问题。

因此推荐自建 Mpx 专用 context，不读写 RN 的 `TextAncestorContext`。这样可以避免与 RN 自身选择 `NativeText` / `NativeVirtualText` 的机制冲突，也能明确表达 Mpx 的文本透传语义。

## 推荐方案

新增一个 Mpx runtime 内部 context，例如 `TextPassThroughContext`，只承载 Mpx 容器拆出的文本样式和文本属性：

```ts
export interface TextPassThroughContextValue {
  textStyle?: TextStyle
  textProps?: Record<string, any>
}

export const TextPassThroughContext = createContext<TextPassThroughContextValue | null>(null)
```

在 `utils.tsx` 中新增一个显式 hook，例如 `useTextPassThroughValue`，负责把当前容器的 `textStyle` / `textProps` 与祖先 context 合并，并通过 `diffAndCloneA` 保持 value 引用稳定。合并顺序保持现有行为：祖先值优先进入，当前容器覆盖祖先，最终具体 `mpx-text` 自身 props/style 再覆盖 context。

不建议把 `useContext` / `useRef` 直接写进现有 `wrapChildren`。`wrapChildren` 当前是普通工具函数，调用点里存在嵌套 render 函数、循环渲染等场景；如果它内部开始调用 hooks，会变成隐式 hook，容易破坏 hooks 调用顺序，也不利于 ESLint 识别。更稳妥的方式是让各组件在顶层调用 `useTextPassThroughValue`，再把结果传给仍然保持纯函数的 `wrapChildren`。

```tsx
export function useTextPassThroughValue (textStyle?: TextStyle, textProps?: Record<string, any>) {
  const parent = useContext(TextPassThroughContext)
  const valueRef = useRef<TextPassThroughContextValue | null>(null)

  if (!textStyle && !textProps) return null

  const nextValue = {
    textStyle: extendObject({}, parent?.textStyle, textStyle),
    textProps: extendObject({}, parent?.textProps, textProps)
  }

  if (diffAndCloneA(valueRef.current, nextValue).diff) {
    valueRef.current = nextValue
  }

  return valueRef.current
}
```

`wrapChildren` 不再遍历和 clone 子节点，也不新增独立 provider 组件，只在已有返回结构里直接包 `TextPassThroughContext.Provider`：

```tsx
export function wrapChildren (props = {}, { hasVarDec, varContext, textPassThrough }) {
  let { children } = props

  if (textPassThrough) {
    children = (
      <TextPassThroughContext.Provider value={textPassThrough}>
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

组件侧调用方式示例：

```tsx
const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)
const textPassThrough = useTextPassThroughValue(textStyle, textProps)

const childNode = wrapChildren(props, {
  hasVarDec,
  varContext: varContextRef.current,
  textPassThrough
})
```

`mpx-text` 改为读取 context，并在进入 `useTransformStyle` 前完成合并：

```tsx
const inheritedText = useContext(TextPassThroughContext)
const mergedStyle = extendObject({}, inheritedText?.textStyle, props.style)
const mergedProps = extendObject({}, inheritedText?.textProps, props, { style: mergedStyle })
```

后续解构、`useTransformStyle`、`useInnerProps`、`useNodesRef` 都基于 `mergedProps` 工作。这样可以保持：

1. 祖先容器文本样式可以跨中间非 text 组件继续传递。
2. 近层容器覆盖远层容器。
3. `mpx-text` 自身显式传入的 props/style 优先级最高。
4. 不需要 clone 子节点，只有真正的 `mpx-text` 消费 context 时才做合并。

对于 `mpx-text` 自身的子树，建议继续通过 `wrapChildren` 向下提供当前 text 的已解析文本样式。RN 原生 text 子树本身也有文本继承，但 Mpx context 负责 Mpx 组件级属性/样式透传，两者职责不同；即使嵌套 text 既受 RN 原生继承又读取 Mpx context，同名样式值也会按“祖先 -> 当前 -> 子级自身”的顺序稳定覆盖。

## 影响范围

需要修改的核心文件：

1. `packages/webpack-plugin/lib/runtime/components/react/context.ts`
   - 新增 `TextPassThroughContext` 类型与实例。
2. `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
   - 引入 `TextPassThroughContext`。
   - 新增 `useTextPassThroughValue`，通过 `diffAndCloneA` 保持 context value 引用稳定。
   - 调整 `wrapChildren`，删除 `Children.map` + `isText` + `cloneElement` 的透传逻辑，改为直接包 `TextPassThroughContext.Provider`。
   - 如果 `isText` 后续无其他使用，可评估是否保留；为降低风险可以先保留。
3. `packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx`
   - 读取 `TextPassThroughContext`。
   - 先合并 context 与自身 props/style，再执行现有 transform、listeners、decode、Portal 等逻辑。
   - 在包裹自身 children 时，将当前 text 的文本样式继续作为下层 context。
4. `packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx`、`mpx-inline-text.tsx`
   - 如果这两个组件也可能由编译产物作为 text 类组件使用，应同步消费 context，避免原先被 `isText` 命中的组件在新方案下丢失透传能力。
5. `packages/webpack-plugin/lib/runtime/components/react/mpx-portal/index.tsx`
   - 当前 custom portal 已手动补传 `VarContext` / `ProviderContext`，新 context 也需要在 portal mount 前读取并重新包裹，否则 fixed/portal 子树会丢失文本透传。
6. `packages/webpack-plugin/lib/runtime/components/react/dist/**`
   - 若仓库要求提交编译产物，需要在 `packages/webpack-plugin` 下执行 `npm run build`，同步生成 dist。

## 兼容性与边界

1. 不依赖 RN 内部 `TextAncestorContext`，避免 RN 版本升级导致路径或语义变化。
2. 不向 RN 的 `TextAncestorContext` 写入值，不影响 RN 判断 native text / virtual text 的逻辑。
3. Mpx 的 `TextPassThroughContext` 不应被 `View` 重置。跨非 text 组件继续传递正是本方案要模拟的 Web/小程序行为。
4. 合并对象时遵守仓库约束，运行时代码使用 `extendObject` / `Object.assign`，不使用 object spread。
5. `textProps` 仍沿用现有 `TEXT_PROPS_REGEX` 的范围，避免把普通 view props 误透传到 text。是否扩展 `selectable` 等属性应作为单独行为变更评估。
6. 如果某些组件手动 clone 子项并注入 `textStyle` / `textProps`，例如 picker-view column item，需要单独确认是否应迁移到统一 context，避免出现双重合并或优先级变化。

## 验证用例

建议覆盖以下核心用例即可：

1. 直接子级继承：`view(style=color:red) -> text`，text 最终 color 为 red。
2. 非 text 中间层不中断：`view(style=color:red) -> view -> text`，text 最终 color 为 red。
3. 近层覆盖远层：`view(color:red) -> view(color:blue) -> text`，text 最终 color 为 blue。
4. text 自身覆盖 context：`view(color:red) -> text(style=color:green)`，text 最终 color 为 green。
5. `textProps` 继承：外层容器设置 `numberOfLines`，深层 `mpx-text` 能读取；深层自身设置时自身优先。
6. Portal 场景：带 `position: fixed` 的 text 子树进入 custom portal 后仍能继承外层文本样式。
7. RN text nesting 场景：`mpx-text -> mpx-text` 可以正常渲染，不影响 RN 选择 `NativeVirtualText`。

执行变更后仅需跑与 RN runtime text 组件相关的测试、类型检查或最小 demo 编译，不需要全量测试。
