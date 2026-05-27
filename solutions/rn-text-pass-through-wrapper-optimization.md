# RN 文本样式透传按需订阅优化方案

## 背景与问题

当前 RN runtime 已将文本样式与文本属性透传从 `cloneElement` 改为 `TextPassThroughContext`：

1. 容器组件通过 `splitStyle` 拆出 `textStyle`，通过 `splitProps` 拆出 `textProps`。
2. 容器组件调用 `useTextPassThroughValue(textStyle, textProps)` 合并祖先透传值。
3. `wrapChildren` 在存在 `textPassThrough` 时包一层 `TextPassThroughContext.Provider`。
4. `mpx-text`、`mpx-simple-text`、`mpx-inline-text` 等文本类组件读取 context，并将继承样式合并到自身 RN Text style。

该方案解决了文本样式跨非 text 中间层透传的问题，但当前 hook 实现存在额外订阅成本：

```tsx
export function useTextPassThroughValue (textStyle, textProps, options) {
  const parent = useContext(TextPassThroughContext)
  const valueRef = useRef(null)

  if (disabled) return null
  if (!textStyle && !textProps && (inheritTextProps || !parent?.pendingTextProps)) return null
  // ...
}
```

`useContext(TextPassThroughContext)` 在早退判断之前执行，因此任何调用 `useTextPassThroughValue` 的容器组件，即使自身没有字体样式或文本属性，也会成为 `TextPassThroughContext` consumer。当前 `view`、`scroll-view`、`swiper`、`movable-view`、`button`、`form`、`label`、`radio`、`checkbox`、`sticky-*` 等容器都存在这种调用方式。

在 view-heavy 页面中，大量普通布局节点并不提供文本透传能力，却会订阅文本透传 context。上层文本透传值变化时，这些透明容器也进入 context 传播链路，带来无效的 JS 执行、Fiber context dependency 记录与调度开销。

## 优化目标

1. 没有本节点文本样式或文本属性的容器，不订阅 `TextPassThroughContext`。
2. 有本节点文本样式或文本属性的容器，继续合并祖先透传值并向下提供 Provider。
3. 文本类组件仍然消费 context，保持当前继承语义。
4. 不改变业务侧使用方式，不改变 `textStyle` / `textProps` 优先级。
5. 保持 React Hooks 调用顺序稳定。
6. 保持 `wrapChildren` 作为普通工具函数，不在普通函数内直接调用 hook。
7. 运行时代码继续使用 `extendObject` / `Object.assign` 合并对象，不使用 object spread。

## 核心思路

将“计算并提供文本透传 context”的逻辑从调用方 hook 改为组件包装：

1. 容器组件不再直接调用 `useTextPassThroughValue`。
2. 容器组件只负责拆出 `textStyle` / `textProps`，并把这两个源数据传给 `wrapChildren`。
3. 删除 `useTextPassThroughValue` hook，将其中的 `useContext`、`useRef`、早退、合并与引用稳定逻辑迁移到 `TextPassThroughWrap`。
4. `shouldWrapTextPassThrough` 放在 `TextPassThroughWrap` 外部调用，统一负责“是否需要渲染 wrapper 以订阅 context 并创建 Provider”的判断。
5. `TextPassThroughWrap` 只在已确认需要订阅和包裹的场景渲染；一旦进入该组件，就直接读取父级 context、合并 value 并包 Provider，不再做二次早退判断。

示意：

```tsx
function TextPassThroughWrap ({
  children,
  textStyle,
  textProps,
  options
}: TextPassThroughWrapProps) {
  const parent = useContext(TextPassThroughContext)
  const valueRef = useRef<TextPassThroughContextValue | null>(null)

  // 这里执行原 useTextPassThroughValue 中的合并与 value 引用稳定逻辑
  const textPassThrough = getMergedTextPassThroughValue({
    parent,
    textStyle,
    textProps,
    options,
    valueRef
  })

  return (
    <TextPassThroughContext.Provider value={textPassThrough} key='textPassThroughWrap'>
      {children}
    </TextPassThroughContext.Provider>
  )
}
```

这样，普通透明容器不会实例化 `TextPassThroughWrap`，也就不会执行 `useContext(TextPassThroughContext)`。

## 推荐 API 形态

### 1. 调整 WrapChildrenConfig

文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

将 `wrapChildren` 的文本透传入参从已计算好的 `textPassThrough`，调整为本地透传源：

```ts
export interface TextPassThroughWrapOptions {
  inheritTextProps?: boolean
  disabled?: boolean
}

export interface TextPassThroughWrapConfig {
  textStyle?: TextStyle
  textProps?: Record<string, any>
  options?: TextPassThroughWrapOptions
}

export interface WrapChildrenConfig {
  hasVarDec: boolean
  varContext?: Record<string, any>
  textPassThrough?: TextPassThroughWrapConfig | null
}
```

`textPassThrough` 字段保留当前命名，降低调用点改动面；但含义从“已合并后的 context value”变为“当前节点待透传的源数据”。

### 2. 新增 shouldWrapTextPassThrough

新增判断函数，集中定义何时需要渲染 wrapper。该函数只在 `TextPassThroughWrap` 外部调用；如果返回 false，就完全不渲染 `TextPassThroughWrap`，自然不会订阅 context；如果返回 true，进入 `TextPassThroughWrap` 后就必然订阅 context 并创建 Provider。

```ts
function shouldWrapTextPassThrough (
  config?: TextPassThroughWrapConfig | null
) {
  if (!config || config.options?.disabled) return false

  const { textStyle, textProps, options } = config

  if (textStyle || textProps) return true

  return options?.inheritTextProps === false
}
```

对容器组件而言，只要没有本地 `textStyle` / `textProps`，就不需要读取父 context。透明容器不提供新的 Provider，子孙文本组件会直接读取最近的祖先 Provider。

`inheritTextProps: false` 是文本组件向子树清空已消费 `pendingTextProps` 的特殊语义。由于 `shouldWrapTextPassThrough` 不读取 context，文本组件应在调用前根据自身已经读取到的 `inheritedText` 决定是否设置 `disabled`，避免无意义 wrapper。

### 3. 新增 TextPassThroughWrap 组件

同文件新增组件，并把原 `useTextPassThroughValue` 中的合并逻辑迁移进来：

```tsx
function TextPassThroughWrap ({
  children,
  textStyle,
  textProps,
  options
}: TextPassThroughWrapConfig & { children?: ReactNode }) {
  const parent = useContext(TextPassThroughContext)
  const valueRef = useRef<TextPassThroughContextValue | null>(null)
  const { inheritTextProps = true } = options || {}

  const nextTextStyle = textStyle
    ? extendObject({}, parent?.textStyle, textStyle)
    : parent?.textStyle
  const nextTextProps = inheritTextProps
    ? textProps
      ? extendObject({}, parent?.pendingTextProps, textProps)
      : parent?.pendingTextProps
    : textProps
  const nextValue = {
    textStyle: nextTextStyle,
    pendingTextProps: nextTextProps
  }

  if (diffAndCloneA(valueRef.current, nextValue).diff) {
    valueRef.current = nextValue
  }

  return (
    <TextPassThroughContext.Provider value={valueRef.current} key='textPassThroughWrap'>
      {children}
    </TextPassThroughContext.Provider>
  )
}
```

注意点：

1. `TextPassThroughWrap` 是组件，可以合法调用 `useContext` / `useRef`。
2. `wrapChildren` 仍是普通函数，只返回 JSX，不直接调用 hook。
3. `diffAndCloneA` 引用稳定逻辑保留在 `TextPassThroughWrap` 内。
4. `TextPassThroughWrap` 内部不调用 `shouldWrapTextPassThrough`，不做二次判断；能进入该组件就说明必须订阅并创建 Provider。
5. 删除 `useTextPassThroughValue`，避免同一套早退与合并逻辑分散在 hook 和 wrapper 两处。

### 4. 调整 wrapChildren

```tsx
export function wrapChildren (
  props: Record<string, any> = {},
  { hasVarDec, varContext, textPassThrough }: WrapChildrenConfig
) {
  let { children } = props

  if (shouldWrapTextPassThrough(textPassThrough)) {
    children = (
      <TextPassThroughWrap key='textPassThroughWrap' {...textPassThrough}>
        {children}
      </TextPassThroughWrap>
    )
  }

  if (hasVarDec && varContext) {
    children = <VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>
  }

  return children
}
```

包裹顺序保持与现状一致：先处理 `TextPassThroughContext`，再处理 `VarContext`。这样可以降低行为差异。

## 容器组件改造方式

### 当前写法

```tsx
const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)
const textPassThrough = useTextPassThroughValue(textStyle, textProps)

const childNode = wrapChildren(props, {
  hasVarDec,
  varContext: varContextRef.current,
  textPassThrough
})
```

### 调整后写法

```tsx
const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)

const childNode = wrapChildren(props, {
  hasVarDec,
  varContext: varContextRef.current,
  textPassThrough: {
    textStyle,
    textProps
  }
})
```

如果担心每次都创建配置对象，可以在调用点先判断：

```tsx
const textPassThrough = textStyle || textProps
  ? { textStyle, textProps }
  : null
```

优先推荐在 `wrapChildren` 内部统一判断，调用点保持简洁；如果后续性能 profile 发现配置对象创建也在热路径中有可见成本，再收敛为调用点判断。

## 文本组件处理

文本类组件与普通容器不同，它们本身就是 context consumer，不能去掉 `useContext(TextPassThroughContext)`：

1. `mpx-text` 需要读取祖先 `textStyle` 与 `pendingTextProps`，合并到当前 Text。
2. `mpx-simple-text`、`mpx-inline-text` 如果当前仍参与文本透传消费，也需要保留读取。
3. `mpx-portal` 需要读取当前 context 并在 portal 子树重新提供，否则 fixed/portal 子树会断开文本透传。

`mpx-text` 对自身 children 的透传不再调用 `useTextPassThroughValue`，改为继续走 `wrapChildren + TextPassThroughWrap`：

```tsx
const textPassThrough = {
  textStyle: childTextStyle,
  options: {
    inheritTextProps: false,
    disabled: isStringOnly || (!childTextStyle && !inheritedText?.pendingTextProps)
  }
}
```

这里的关键是 `inheritTextProps: false`：父级 `pendingTextProps` 已经被当前 text 消费，不能继续向更深层 text 迁移。因此当 `childTextStyle` 存在，或当前 text 已读取到 `inheritedText?.pendingTextProps` 时，需要让 `shouldWrapTextPassThrough` 返回 true，渲染 `TextPassThroughWrap` 并创建一个新的 Provider。

如果父级没有 `pendingTextProps`，且当前 text 也没有需要继续继承的 `childTextStyle`，则在外部把 `disabled` 置为 true，让 `shouldWrapTextPassThrough` 返回 false，直接不渲染 `TextPassThroughWrap`。

## 影响范围

建议一次性移除 `useTextPassThroughValue`，统一迁移到 wrapper 模式：

1. `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
   - 调整 `WrapChildrenConfig` 类型。
   - 新增 `TextPassThroughWrapConfig`。
   - 新增 `shouldWrapTextPassThrough`。
   - 新增 `TextPassThroughWrap`。
   - 将原 `useTextPassThroughValue` 中的 `useContext`、`useRef`、早退、合并与 `diffAndCloneA` 逻辑迁移到 `TextPassThroughWrap`。
   - 调整 `wrapChildren`，从直接包 Provider 改为按需包 `TextPassThroughWrap`。
   - 删除 `useTextPassThroughValue` export。
2. `packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx`
3. `packages/webpack-plugin/lib/runtime/components/react/mpx-simple-view.tsx`
4. `packages/webpack-plugin/lib/runtime/components/react/mpx-scroll-view.tsx`
5. `packages/webpack-plugin/lib/runtime/components/react/mpx-swiper.tsx`
6. `packages/webpack-plugin/lib/runtime/components/react/mpx-swiper-item.tsx`
7. `packages/webpack-plugin/lib/runtime/components/react/mpx-movable-view.tsx`
8. `packages/webpack-plugin/lib/runtime/components/react/mpx-button.tsx`
9. `packages/webpack-plugin/lib/runtime/components/react/mpx-form.tsx`
10. `packages/webpack-plugin/lib/runtime/components/react/mpx-label.tsx`
11. `packages/webpack-plugin/lib/runtime/components/react/mpx-radio.tsx`
12. `packages/webpack-plugin/lib/runtime/components/react/mpx-checkbox.tsx`
13. `packages/webpack-plugin/lib/runtime/components/react/mpx-sticky-section.tsx`
14. `packages/webpack-plugin/lib/runtime/components/react/mpx-sticky-header.tsx`
15. `packages/webpack-plugin/lib/runtime/components/react/mpx-picker-view/index.tsx`
16. `packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx`
17. `packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx`

容器组件的共同改法是删除顶层的 `useTextPassThroughValue` 调用，把 `wrapChildren` 入参改为 `{ textStyle, textProps }`。

文本组件的共同改法是保留自身消费 `TextPassThroughContext` 的逻辑，但删除对子级透传时的 `useTextPassThroughValue` 调用，改为向 `wrapChildren` 传：

```tsx
textPassThrough: {
  textStyle: childTextStyle,
  options: {
    inheritTextProps: false,
    disabled: isStringOnly || (!childTextStyle && !inheritedText?.pendingTextProps)
  }
}
```

暂不建议改以下文件的 context 消费逻辑：

1. `mpx-inline-text.tsx`
2. `mpx-portal/index.tsx`

它们属于真正 consumer 或跨树传递边界，保留当前逻辑风险更低。

## 语义与边界

### 透明容器

无本地 `textStyle` / `textProps` 的容器不包 Provider，也不读 context：

```tsx
view(color:red) -> view(no text style) -> text
```

中间 `view` 不订阅 context，`text` 仍能直接读取外层 `view(color:red)` 提供的 Provider。

### 本地覆盖

有本地 `textStyle` 的容器才渲染 `TextPassThroughWrap`：

```tsx
view(color:red) -> view(color:blue) -> text
```

内层 wrapper 读取父 context 后合并为 `color:blue`，再向下提供新 Provider。

### textProps 迁移

`numberOfLines` / `ellipsizeMode` 等 `textProps` 仍通过最近的 Provider 迁移到下层 text。普通透明容器不需要中转，因为 React context 本身可以跨过没有 Provider 的中间层。

### 动态样式切换

当某个容器运行时从“无文本透传源”切换为“有文本透传源”时，会新增 `TextPassThroughWrap` 组件。当前实现中 `textPassThrough` 从 `null` 切到非空时也会新增 Provider，已有类似的树形变化风险。

需要关注的场景：

1. 动态 class / style 中字体样式条件切换。
2. 动态添加 / 删除 `numberOfLines` 或 `ellipsizeMode`。
3. 子树内存在有状态自定义组件时，新增 wrapper 是否触发不期望的 remount。

如果实测发现动态 wrapper 导致状态丢失，可以考虑第二方案：容器始终渲染一个不读取 context 的稳定占位组件，只有存在源数据时再在占位组件内部渲染 `TextPassThroughWrap`。该方案会保留一层额外 Fiber，性能收益弱于当前推荐方案，作为兜底即可。

### Portal

`mpx-portal` 当前会读取并重新提供 `TextPassThroughContext`。本次优化不应修改该逻辑。Portal 子树跨 React 位置挂载，必须显式桥接 context，否则 fixed 场景会丢失外层文本透传。

## 性能分析

设页面中容器节点数为 `N`，其中带文本样式或文本属性的容器数为 `K`，文本类节点数为 `T`。通常业务页面中 `K << N`。

当前 consumer 规模约为：

```txt
N + T + portal consumer
```

按需 wrapper 后 consumer 规模约为：

```txt
K + T + portal consumer
```

收益来自：

1. 无文本透传源的容器不再执行 `useContext(TextPassThroughContext)`。
2. 无文本透传源的容器不再创建 `useRef` 与执行 `diffAndCloneA`。
3. React 不再为这些容器记录 `TextPassThroughContext` dependency。
4. 上层文本透传 context value 变化时，无关容器不再被 context propagation 命中。
5. 大列表、深层布局、频繁 render 场景下 JS 线程压力降低。

新增成本：

1. 有文本透传源的节点多一层 `TextPassThroughWrap` 函数组件。
2. `wrapChildren` 内多一次轻量判断。
3. 如果调用点总是传 `{ textStyle, textProps }`，会多创建一个小对象。

性能得失判断：

1. 当大多数容器没有字体样式或文本属性时，收益明显大于成本。
2. 当几乎所有容器都有字体样式或文本属性时，收益收敛，额外 wrapper 会带来少量 Fiber 成本。
3. 真实页面通常以布局样式为主，文本透传源节点远少于普通 view，因此该优化方向整体正收益。

建议后续用 RN dev 环境补一组 profile：

1. 构造 1000 个无文本样式嵌套/列表 view，比较 render 阶段耗时。
2. 构造外层 `view(color)` + 大量透明 view + text，触发外层 color 更新，比较被调度组件数量。
3. 构造 1000 个带 `color` 的 view，确认最坏情况下额外 wrapper 成本可接受。

## 实施步骤

### Step 1：公共 helper 改造

1. 在 `utils.tsx` 新增 `TextPassThroughWrapConfig`。
2. 修改 `WrapChildrenConfig.textPassThrough` 类型。
3. 新增 `shouldWrapTextPassThrough`。
4. 新增 `TextPassThroughWrap` 组件。
5. 将 `useTextPassThroughValue` 中的 context 读取、引用稳定、早退与合并逻辑迁移到 `TextPassThroughWrap`。
6. 修改 `wrapChildren`，仅当 `shouldWrapTextPassThrough` 为 true 时包 wrapper。
7. 删除 `useTextPassThroughValue`。

### Step 2：组件调用迁移

逐个替换容器组件：

1. 删除 `useTextPassThroughValue` import。
2. 删除顶层 `const textPassThrough = useTextPassThroughValue(textStyle, textProps)`。
3. `wrapChildren` 入参改为：

```tsx
textPassThrough: {
  textStyle,
  textProps
}
```

如果某组件只有 `textStyle` 或只有 `textProps`，只传对应字段。

文本组件对子级继续透传时也改为传配置对象：

```tsx
textPassThrough: {
  textStyle: childTextStyle,
  options: {
    inheritTextProps: false,
    disabled: isStringOnly
  }
}
```

### Step 3：类型修正

重点检查：

1. `mpx-view.tsx` 内部自定义 `WrapChildrenConfig` 是否还引用 `ReturnType<typeof useTextPassThroughValue>`。
2. `utils.tsx` 导入的 React 类型是否需要增加或保留 `ReactNode`。
3. 删除不再使用的 `useTextPassThroughValue` import。
4. 删除 `utils.tsx` 中的 `useTextPassThroughValue` export，确认没有残留引用。
5. `shouldWrapTextPassThrough` 不接收 `parent` 入参，不读取 context，只基于外部传入配置判断是否渲染 wrapper。
6. `TextPassThroughWrap` 内部不调用 `shouldWrapTextPassThrough`，进入后必须创建 Provider。

### Step 4：验证行为

至少覆盖以下行为：

1. `view(color:red) -> text`，text 继承 red。
2. `view(color:red) -> view(no text style) -> text`，中间 view 不订阅 context，text 仍继承 red。
3. `view(color:red) -> view(color:blue) -> text`，text 最终为 blue。
4. `view(numberOfLines=1) -> view -> text`，text 获取 `numberOfLines=1`。
5. `view(color:red) -> text(color:green)`，text 自身 green 优先。
6. `position: fixed` / portal 场景下，text 仍继承外层样式。
7. 动态切换 class/style 中的字体样式，不出现明显渲染异常。

### Step 5：性能确认

建议添加临时调试计数或 profile：

1. 在 `TextPassThroughWrap` 内临时统计实例数，确认普通无文本样式 view 不会实例化 wrapper。
2. 在 `shouldWrapTextPassThrough` 内临时统计返回 true 的次数，确认无源容器不触发 wrapper 渲染。
3. 使用 RN profiler 或业务页面性能面板比较优化前后 render 耗时。

临时统计代码不要提交。

## 测试建议

本改动属于 RN runtime 内部实现优化，不改变对外 API。变更后仅需执行相关范围校验：

1. RN runtime 文本透传相关单测，如果仓库已有对应用例。
2. `packages/webpack-plugin/lib/runtime/components/react` 相关 TypeScript / ESLint 校验。
3. 最小 RN demo 编译，覆盖 `view -> view -> text`、`scroll-view -> view -> text`、`button -> text`、portal/fixed 场景。
4. 如需同步 dist，使用仓库既有构建脚本生成，避免手写 dist 漂移。

不需要全量测试。

## 风险与回滚

主要风险：

1. 某个容器调用点漏传 `textStyle` / `textProps`，导致该组件作为透传源时失效。
2. 动态新增 wrapper 可能影响子树状态保持，需要通过动态样式用例确认。
3. `wrapChildren` 入参语义变化后，局部类型未同步，导致仍把已计算 value 当源数据传入。
4. 文本组件特殊的 `inheritTextProps: false` 清空迁移属性语义不能丢失。
5. 文本组件对子级透传时需要正确设置 `disabled`，避免在没有 `childTextStyle` 且没有 `inheritedText?.pendingTextProps` 时创建无意义 Provider。

回滚方式简单：

1. 恢复容器组件顶层 `useTextPassThroughValue` 调用。
2. `wrapChildren` 恢复直接接收 `TextPassThroughContextValue | null` 并包 Provider。
3. 恢复 `useTextPassThroughValue` export。
4. 删除 `TextPassThroughWrap` 与新配置类型。

## 是否需要同步文档与 Skill

本方案不改变用户开发使用方式，不新增对外 API、配置项、模板能力或样式能力。实际代码落地时通常无需更新 `docs-vitepress/` 与 `.agents/skills/mpx2rn/references/`。

如果后续在实现中顺带调整 `textProps` 支持范围、`allowFontScaling` 配置语义，或改变 RN 文本继承对外行为，则需要按仓库约束同步更新文档与 Mpx2RN skill。
