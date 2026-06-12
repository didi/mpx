# Mpx2RN useTransformStyle 性能优化方案

## 结论

`useTransformStyle` 位于 RN 内建组件高频 render 路径中，当前每次 render 都会遍历样式、拆分 CSS var、收集候选路径并执行 env / percent / calc / shorthand 等转换。

本方案只做局部减法，目标是降低普通节点的无效开销，同时保持现有样式行为和 Hook 调用顺序稳定。

最终采纳的优化项：

1. `RouteContext` 按需订阅，并支持用户传入 `enable-env` 作为稳定开关。
2. 样式遍历改为单 visitor，去掉 visitors 数组调度。
3. 字符串正则检测前置 `typeof value === 'string'` 判断。
4. 空候选路径时跳过对应 transform 阶段。

明确不做：

1. 不做 `width` / `height` layout state 按需化。
2. 不做输入分析 / 动态解析 / 格式化分层重构。
3. 不做 `normalStyle` 结果引用稳定。
4. 不做基于 `styleObj` 的 WeakMap 缓存。`styleObj` 来自运行时 `getStyle` 合并，每次 render 都是新对象，引用缓存基本无法命中。

## 当前问题

核心文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

当前链路中值得优化的热路径开销：

1. `useTransformStyle` 无条件调用 `useNavigation()`，所有节点都会订阅 `RouteContext`。
2. `traverseStyle(styleObj, [varVisitor, boxSizingVisitor, shorthandVisitor])` 每个节点都要执行 visitors 数组遍历。
3. `varVisitor` 会对非字符串值执行 `RegExp.test`，隐式转字符串后再返回 false。
4. 部分 transform 阶段即使没有候选路径也会进入函数调用。

## 方案一：RouteContext 按需订阅

`navigation` 只用于解析 `env(safe-area-inset-*)`。先通过样式遍历收集 `envKeyPaths`，再决定是否订阅 `RouteContext`。

同时新增用户可写属性 `enable-env`：

1. 如果组件首 render 时 `enable-env` 为 true，即使当前样式没有 `env()`，也从首次渲染开始订阅 `RouteContext`。
2. 如果业务后续可能动态切换出 `env()` 样式，应在首次渲染就传 `enable-env`。
3. `enable-env` 自身也应保持生命周期稳定，不建议运行中从 false 切到 true。

建议实现：

```tsx
const enableEnv = !!enableEnvFromProps || envKeyPaths.length > 0
const enableEnvRef = useRef(enableEnv)

if (enableEnvRef.current !== enableEnv) {
  error('env() style use should be stable in the component lifecycle, or you can set [enable-env] with true.')
}

let navigation
if (enableEnvRef.current) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  navigation = useNavigation()
}

if (envKeyPaths.length) {
  transformEnv(normalStyle, envKeyPaths, navigation)
}
```

接入要求：

1. `TransformStyleConfig` 新增 `enableEnv?: boolean`。
2. 所有调用 `useTransformStyle` 的 RN 内建组件 props 类型新增 `'enable-env'?: boolean`。
3. 调用 hook 时传入 `enableEnv`。
4. `useInnerProps` 透传过滤列表排除 `enable-env`，避免落到 RN 原生组件上。
5. `enable-env` 是用户可见能力，落地代码时必须同步 `docs-vitepress/` 和 `.agents/skills/mpx2rn/`。

## 方案二：traverseStyle 改为单 visitor

当前 `traverseStyle` 只有 `useTransformStyle` 一处调用，不需要保留数组 visitor 接口。

建议签名改为：

```tsx
export function traverseStyle (styleObj: Record<string, any>, visitor: (arg: VisitorArg) => void) {
  const keyPath: Array<string> = []

  function traverse<T extends Record<string, any>> (target: T) {
    if (Array.isArray(target)) {
      target.forEach((value, index) => {
        const key = String(index)
        keyPath.push(key)
        visitor({ target, key, value, keyPath })
        traverse(value)
        keyPath.pop()
      })
    } else if (isObject(target)) {
      Object.entries(target).forEach(([key, value]) => {
        keyPath.push(key)
        visitor({ target, key, value, keyPath })
        traverse(value)
        keyPath.pop()
      })
    }
  }

  traverse(styleObj)
}
```

在 `useTransformStyle` 内合并原 `varVisitor` / `boxSizingVisitor` / `shorthandVisitor`，直接传单个 `styleVisitor`：

```tsx
function styleVisitor ({ target, key, value, keyPath }: VisitorArg) {
  // var / normalStyle 拆分
  // boxSizing affecting 检测
  // shorthand key 收集
  // env / calc / percent 候选收集
}

traverseStyle(styleObj, styleVisitor)
```

注意点：

1. 改动前用 `rg "traverseStyle\\(" packages` 确认仍只有 `useTransformStyle` 调用。
2. 保持现有 `keyPath` 语义，`setStyle` 依赖这些路径。
3. 不新增 `analyzeTransformStyleInput` 之类的包装函数，避免无意义抽象。

## 方案三：轻量短路

### 字符串前置判断

对 `var()` / UnoCSS var / `env()` / `calc()` / percent 等正则检测，先判断值类型：

```tsx
if (typeof value === 'string') {
  if (unoVarUseRegExp.test(value)) {
    unoVarKeyPaths.push(keyPath.slice())
  } else if (varUseRegExp.test(value)) {
    hasVarUse = true
    varKeyPaths.push(keyPath.slice())
  } else {
    visitOther({ target, key, value, keyPath })
  }
} else {
  visitOther({ target, key, value, keyPath })
}
```

### 空阶段短路

候选路径为空时在调用侧直接跳过对应 transform，并移除 transform 内部同类空数组判断，避免重复判断。

```tsx
if (varKeyPaths.length) transformVar(normalStyle, varKeyPaths, varContextRef.current, visitOther)
if (unoVarKeyPaths.length) transformVar(normalStyle, unoVarKeyPaths, unoVarStyle, visitOther)
if (envKeyPaths.length) transformEnv(normalStyle, envKeyPaths, navigation)
if (percentKeyPaths.length) transformPercent(normalStyle, percentKeyPaths, percentConfig)
if (calcKeyPaths.length) transformCalc(normalStyle, calcKeyPaths, formatter)
if (shorthandKeys.length) transformShorthand(normalStyle, shorthandKeys)
```

例如 `transformShorthand` 当前内部已有：

```tsx
if (shorthandKeys.length === 0) return
```

外层统一短路后，这个内部判断应删除。

## 非目标

### 不做 layout state 按需化

继续保留无条件：

```tsx
const [width, setWidth] = useState(0)
const [height, setHeight] = useState(0)
```

原因：

1. 自身百分比可能来自 `borderRadius`、`calc()`、CSS var / UnoCSS var 解析后的值。
2. 条件式 state 会引入新的 Hook 稳定性约束。
3. 动态从无自身百分比变为有自身百分比时，当前行为不应退化为 runtime error。

### 不做转换分层重构

不拆输入分析 / 动态解析 / 格式化层。保持现有转换顺序，只做局部减法。

原因：

1. `styleObj` 每次都是 `getStyle` 合并出的新对象，分层不能带来跨 render 缓存收益。
2. 当前转换顺序有行为含义，例如 var 解析后继续进入 env / percent / calc 候选收集。
3. 结构重构收益不如局部短路直接。

### 不做 normalStyle 引用稳定

继续每次返回新的 `normalStyle`。

原因：

1. 内容相等判断需要深比较，热路径上可能得不偿失。
2. 当前调用侧存在 `extendObject(normalStyle, layoutStyle)` 这类可能突变 `normalStyle` 的写法。
3. 引入 ref / diff / 突变审计会明显增加方案复杂度。

### 不做 styleObj WeakMap 缓存

不在 `useTransformStyle` 内基于 `styleObj` 做 WeakMap 缓存。

原因：

1. `styleObj` 来自运行时 `getStyle` 合并，每次 render 都是新对象。
2. 引用缓存命中率低，深比较或序列化 key 又会引入新的热路径成本。
3. 如果未来要缓存，应优先在 `getStyle` 或编译产物中提供稳定 cache key。

## 改动范围

1. `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
   - `TransformStyleConfig` 新增 `enableEnv?: boolean`。
   - `traverseStyle` 改为单 visitor。
   - `useTransformStyle` 合并为单个 `styleVisitor`。
   - `useNavigation()` 改为按 `enableEnv || envKeyPaths.length > 0` 订阅。
   - 增加字符串前置判断和空阶段短路。
2. 所有调用 `useTransformStyle` 的 RN 内建组件。
   - props 类型新增 `'enable-env'?: boolean`。
   - 读取 `'enable-env': enableEnv` 并传给 `useTransformStyle`。
   - 确认 `enable-env` 不透传到 RN 原生组件。
3. 文档与 Skill。
   - `docs-vitepress/` 同步 `enable-env` 用法。
   - `.agents/skills/mpx2rn/` 同步 RN 模板 / 样式能力参考。

## 测试建议

重点覆盖行为稳定性：

1. 普通样式 `{ width: 100, height: 100 }` 不订阅 `RouteContext`，但仍保留 `width` / `height` state hook。
2. 首 render 无 `env()` 且未传 `enable-env`，后续出现 `env()` 时触发稳定性错误。
3. 首 render 无 `env()` 但传入 `enable-env`，后续出现 `env()` 时不触发稳定性错误，并能读取 navigation insets。
4. 传入 `enable-env` 但始终没有 `env()` 时，只订阅 `RouteContext`，不执行 `transformEnv`。
5. CSS var / UnoCSS var 仍能正常解析，并在解析后继续触发 env / percent / calc 候选收集。
6. `padding` / `border` 仍触发 boxSizing 默认补齐。
7. `position: fixed` 仍返回 `hasPositionFixed: true`，且 `position` 转为 `absolute`。
8. `transform`、`boxShadow`、`fontFamily`、`flex`、`shorthand`、`background` 等现有 runtime 样式能力保持不变。

建议执行与 RN runtime style 相关的 eslint / jest；如果落地 `enable-env` 公开属性，还需补文档与 Skill 校验。

## 回滚策略

1. `RouteContext` 按需订阅出问题：恢复无条件 `useNavigation()`，保留其他轻量优化。
2. `enable-env` 行为出问题：先保留类型与过滤，回退 hook 内启用逻辑，再重新评估文档。
3. 单 visitor 出问题：恢复 `traverseStyle(styleObj, [varVisitor, boxSizingVisitor, shorthandVisitor])`。
