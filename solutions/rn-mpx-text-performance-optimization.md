# Mpx2RN mpx-text 性能优化方案

## 结论

`mpx-text` 是 Mpx2RN 中文本节点的入口组件，普通文本、按钮文案、列表文案、嵌套 Text 都会走它的 render 链路。现状 `_Text` render 体内除了必走的 `useTransformStyle / useInnerProps / useTextPassThroughText / useNodesRef` 之外，还有几处"为可选语义付出的恒定成本"和"输出装配阶段的冗余对象合并"，可以在不动外围 hook 的前提下做局部减法。

最终采纳的优化项：

1. `wrapChildren` 入参由 `extendObject({}, mergedProps, { children })` 精简为 `{ children }`，去掉一次完整的 mergedProps 浅合并。
2. `inheritedText?.pendingTextProps` / `inheritedText?.textStyle` 缺失时直接复用 `props` / `normalStyle`，免一次 `extendObject` 浅拷贝。
3. `isStringOnly === true` 时跳过 `splitStyle(normalStyle)` 调用：纯字符串子树不会向下创建 Provider，textStyle 不会被消费。
4. `decode === true` 且 `children` 是单字符串时直接调用 `decode(children)`，跳过 `Children.map` 的数组化与再遍历。
5. `getDecodedChildren` 在遍历时同步返回 `isStringOnly`，避免对 decode 后的 children 再走一遍 `isStringChildren`。

明确不做：

1. 不动 `useTextPassThroughText` 内部实现（属于 [rn-text-pass-through-optimization](rn-text-pass-through-optimization.md) 范畴）。
2. 不改 `useTransformStyle` 调用形态与返回字段（属于 [rn-use-transform-style-perf-optimization](rn-use-transform-style-perf-optimization.md) 范畴）。
3. 不改 `useInnerProps` 调用形态（属于 [rn-use-inner-props-performance-optimization](rn-use-inner-props-performance-optimization.md) 范畴）。
4. 不为 `_Text` 整体引入 `React.memo`：父级每次 render 大概率传新 style/props 引用，浅比较命中率低，且会引入比较成本与额外闭包链路。
5. 不改 `forwardRef` 形态。
6. 不动 `useNodesRef` 暴露给业务的 `style: finalStyle`：业务侧已读取该字段，方案不变其语义。
7. 不引入"探针对照组"等性能验证项。

## 当前问题

核心文件：[packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx)

### 1. `wrapChildren` 入参把 `mergedProps` 整体合进新对象

```tsx
let finalComponent: JSX.Element = createElement(Text, innerProps, wrapChildren(
  extendObject({}, mergedProps, {
    children
  }),
  {
    hasVarDec,
    varContext: varContextRef.current,
    textPassThrough
  }
))
```

[wrapChildren](packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L1436) 的 props 入参里只读 `children`，其余字段全部丢弃。当前实现每帧把整份 `mergedProps`（包含来自 `inheritedText?.pendingTextProps` 和原始 `props` 的所有字段，含事件、可访问性属性、style、ref 等）拷贝到一个新对象，仅为了挂上 `children` 字段。

`mpx-simple-text` 已经是 `wrapChildren({ children }, …)` 的写法（见 [mpx-simple-text.tsx:50](packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx#L50)），mpx-text 在这一点上单独多付了一次 `Object.keys(mergedProps)` 数量级的字段拷贝。

### 2. inheritedText 缺失时仍走 extendObject 浅拷贝

```tsx
const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)
const finalStyle = extendObject({}, inheritedText?.textStyle, normalStyle)
```

view-heavy 页面里，普通文本节点祖先链上可能完全没有声明文本透传源（`color/fontSize/numberOfLines` 等），`inheritedText` 是 `null` 或字段全 undefined。此时这两次合并退化为对 `props` / `normalStyle` 的纯浅拷贝，下游消费方（`useNodesRef` 暴露 instance、`useInnerProps` 入参、`finalStyle` 写入 RN Text）拿到与原引用语义等价的新对象，没有任何收益。

注意：

1. `mergedProps` 后续被 `useNodesRef(mergedProps, ref, …)` 写入 `_props.current`。若 `inheritedText?.pendingTextProps` 为空，`mergedProps === props` 与 `mergedProps` 是一份 props 浅拷贝在外部读取语义上等价（`getNodeInstance().props.current` 的字段集合一致）。
2. `finalStyle` 后续被 `useNodesRef` 暴露给业务的 `instance.style`、写入 `useInnerProps` 的 `style` 字段。复用 `normalStyle` 引用与新建一份浅拷贝在 RN Text 渲染语义上等价；调用方不能反向突变 `normalStyle`，但当前代码没有这种写法（`useTransformStyle` 内部对 `normalStyle` 的写入都在返回前完成），与 `splitStyle` 复用 `styleObj` 引用的口径一致。

### 3. 纯字符串子树仍走 splitStyle

```tsx
const children = decode ? getDecodedChildren(props.children) : props.children
const isStringOnly = isStringChildren(children)
const { textStyle } = splitStyle(normalStyle)
const { inheritedText, textPassThrough } = useTextPassThroughText(!isStringOnly ? textStyle : undefined)
```

`splitStyle` 的 textStyle 在 mpx-text 中**只**用于 `useTextPassThroughText` 的子级 Provider value。当 `isStringOnly === true` 时（也是文本节点的常态），`useTextPassThroughText` 收到 `undefined`，即不会向下创建 Provider，textStyle 不会被消费。此时 `splitStyle(normalStyle)` 整圈 `Object.keys` 扫描 + 文本/背景分类完全是纯浪费。

`splitStyle` 内部已对常见输入做了"无命中复用 styleObj 引用"短路（[utils.tsx:376](packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L376)），但仍要走一遍主循环；mpx-text 自己跳过整次调用是更直接的减法。

### 4. decode 路径强制走 Children.map

```tsx
function getDecodedChildren (children: ReactNode) {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return decode(child)
    }
    return child
  })
}
```

当 `decode=true` 且 `props.children` 是单字符串（典型 `<text decode="{{true}}">{{txt}}</text>`），`Children.map` 仍然会：

1. 创建新的回调闭包；
2. 把单字符串包装到长度为 1 的数组并打 key；
3. 返回一个新数组。

后续 `isStringChildren(children)` 还要再走一次 `every(typeof === 'string')`。两次遍历叠加对单值文本是无效成本。

### 5. decode 后 isStringOnly 二次遍历

`getDecodedChildren` 已经在 `Children.map` 中检查过每个 child 是否是 string；外层 `isStringChildren(children)` 又重新遍历一遍。两条信息可以合一。

## 方案一：wrapChildren 入参精简

把无意义的 `mergedProps` 合并去掉，与 `mpx-simple-text` 拉齐写法：

```tsx
let finalComponent: JSX.Element = createElement(
  Text,
  innerProps,
  wrapChildren(
    { children },
    {
      hasVarDec,
      varContext: varContextRef.current,
      textPassThrough
    }
  )
)
```

注意点：

1. `wrapChildren` 当前只读入参的 `children`，签名行为一致。
2. 不影响外层 `Text` 收到的 `innerProps`：`innerProps` 已经携带 `mergedProps` 的合并结果。

## 方案二：inheritedText 缺失时复用 props/normalStyle

```tsx
const pendingTextProps = inheritedText?.pendingTextProps
const inheritedTextStyle = inheritedText?.textStyle
const mergedProps = pendingTextProps
  ? extendObject({}, pendingTextProps, props)
  : props
const finalStyle = inheritedTextStyle
  ? extendObject({}, inheritedTextStyle, normalStyle)
  : normalStyle
```

注意点：

1. `useNodesRef(mergedProps, ref, nodeRef, { style: finalStyle })` 仍接收当前 render 的对象。无 inheritedText 时 `mergedProps === props`、`finalStyle === normalStyle`，业务通过 `getNodeInstance().props.current` 读到的是原 props 引用，字段语义一致。
2. 复用引用后调用方不能反向突变 `mergedProps` / `finalStyle`。当前代码没有这种写法；落地前过一遍 `_Text` 主体内对这两个变量的所有写入位置（仅作为 `extendObject` 入参与 `useNodesRef` 第四参数被读），确认无突变即可。
3. 与 [splitStyle 在无命中时复用 styleObj 引用](packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L376) 的口径一致。

## 方案三：isStringOnly 时跳过 splitStyle

```tsx
const childTextStyle: TextStyle | undefined = !isStringOnly
  ? (splitStyle(normalStyle).textStyle as TextStyle | undefined)
  : undefined
const { inheritedText, textPassThrough } = useTextPassThroughText(childTextStyle)
```

注意点：

1. 文本节点常态 `isStringOnly === true`，整次 `splitStyle` 主循环可省。
2. 非纯字符串子树（如 `<text>foo<text>bar</text></text>`）走原路径，行为不变。
3. `useTextPassThroughText` 的 hook 调用顺序不受影响（`splitStyle` 不是 hook）。

## 方案四：decode 单字符串短路

```tsx
function getDecodedChildren (children: ReactNode): { children: ReactNode, isStringOnly: boolean } {
  if (typeof children === 'string') {
    return { children: decode(children), isStringOnly: true }
  }
  let isStringOnly = true
  const decoded = Children.map(children, (child) => {
    if (typeof child === 'string') return decode(child)
    isStringOnly = false
    return child
  })
  return { children: decoded, isStringOnly }
}
```

注意点：

1. 顶层是字符串时直接 `decode(...)` 返回，跳过 `Children.map` 的数组包装、key 写入与再分配。
2. `decode(value)` 当前签名返回 `string | undefined`，对 `null`/`undefined` 透传仍返回 undefined，行为不变（[utils.tsx 中 decode](packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx#L25-L31)）。
3. 与 mpx-simple-text 不消费 decode 的现状无冲突。

## 方案五：decoded children 同步收集 isStringOnly

```tsx
const decodeOn = !!decode
let children: ReactNode
let isStringOnly: boolean
if (decodeOn) {
  ({ children, isStringOnly } = getDecodedChildren(props.children))
} else {
  children = props.children
  isStringOnly = isStringChildren(children)
}
```

注意点：

1. `decode=true` 路径下 `getDecodedChildren` 内部已经按 child 维度做过 `typeof === 'string'` 判断，外层不再走 `isStringChildren`。
2. `decode=false` 路径保持现状，`isStringChildren` 仍由外层一次性判断。
3. 与方案四共用同一个返回结构，避免再分别遍历。

## 改动范围

1. [packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx)
   - `wrapChildren` 入参由 `extendObject({}, mergedProps, { children })` 改为 `{ children }`。
   - `inheritedText?.pendingTextProps` / `inheritedText?.textStyle` 缺失时直接复用 `props` / `normalStyle`。
   - `isStringOnly === true` 时跳过 `splitStyle(normalStyle)` 调用。
   - `getDecodedChildren` 改为返回 `{ children, isStringOnly }`，并对单字符串 children 走 `decode` 直返路径。
   - 顶层根据 `decode` 开关选择 `getDecodedChildren` 或 `isStringChildren`，避免在 decode 路径下二次遍历。

不涉及外部 API、用户开发使用方式、文档与 skill 改动。

## 测试建议

1. 普通文本（无 decode、无嵌套）：渲染输出与现状一致；`useNodesRef.getNodeInstance().props.current` 的字段集合不变。
2. `decode=true` + 单字符串 children（如 `&amp;`）：仍能正确解码；`children` 类型由 string 直接落到 RN Text，不走数组包装。
3. `decode=true` + 多 child（混合 string 与 element）：`isStringOnly === false`，`useTextPassThroughText` 收到 `textStyle` 进入子级 Provider 路径。
4. `decode=false` + 纯字符串 children：`isStringOnly === true`，跳过 `splitStyle`，`useTextPassThroughText` 收到 `undefined`，不创建子级 Provider。
5. 嵌套 `<text>foo<text>bar</text></text>`：`isStringOnly === false`，textStyle 通过 `useTextPassThroughText` 向下透传，子层文本继承。
6. 父级 `<view color:red> -> <text>` 与 `<view> -> <text>` 两种链路：`mergedProps` / `finalStyle` 在 inheritedText 缺失时复用 props/normalStyle，业务读 `instance.props.current` 字段一致。
7. `position: fixed` 节点：仍被 Portal 包裹，行为不变。
8. `selectable` / `user-select` / `allowFontScaling` 等开关行为不变。

完成代码改动后按仓库约束执行 `packages/webpack-plugin/lib/runtime/components/react` 的 eslint 与相关 jest。

## 回滚策略

1. wrapChildren 入参精简出问题：恢复 `extendObject({}, mergedProps, { children })`。
2. mergedProps / finalStyle 复用引用出问题：恢复无条件 `extendObject({}, inheritedText?.pendingTextProps, props)` 与 `extendObject({}, inheritedText?.textStyle, normalStyle)`。
3. `isStringOnly` 跳过 `splitStyle` 出问题：恢复无条件调用，`useTextPassThroughText` 入参仍按 `!isStringOnly ? textStyle : undefined` 分流。
4. `getDecodedChildren` 返回结构调整出问题：回退为单返回值版本，外层重新调用 `isStringChildren(children)`。
5. decode 单字符串短路出问题：删除字符串短路分支，仅保留 `Children.map` 路径；其他改动可独立保留。

各项可独立回退，互不依赖。
