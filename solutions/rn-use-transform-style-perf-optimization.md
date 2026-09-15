# Mpx2RN useTransformStyle 性能优化方案

## 结论

`useTransformStyle` 位于 RN 内建组件高频 render 路径中，当前每次 render 都会遍历样式、拆分 CSS var、收集候选路径并执行 env / percent / calc / shorthand 等转换。

本方案只做局部减法，目标是降低普通节点的无效开销，同时保持现有样式行为和 Hook 调用顺序稳定。

最终采纳的优化项：

1. 样式遍历改为单 visitor，去掉 visitors 数组调度，并把 `Object.entries` 替换为 `Object.keys` 索引访问。
2. `varVisitor` 中的 `unoVarUseRegExp.test` / `varUseRegExp.test` 前置 `typeof value === 'string'` 判断（env / percent / calc 不需要补，已经在 `visitOther` 入口做了字符串预过滤）。
3. 空候选路径时跳过对应 transform 阶段，明确目标函数：`transformVar(varKeyPaths)` / `transformEnv` / `transformPercent` / `transformCalc`，并删除 `transformShorthand` 内部的同类守卫。
4. `transformEnv` 入口预合并一次 `insets`，把 `getSafeAreaInset` 改为按表查询。
5. 无 `--var` 声明节点跳过 `varContext` merge 与 `diffAndCloneA`：`varContextRef` 只有作为 `<VarContext.Provider>` value 时才需要引用稳定，无声明时直接用父 `varContext` 解析。
   有声明节点的 `varContextRef` 比对也从 `diffAndCloneA` 换成浅比较：`newVarContext` 是 `extendObject({}, varContext, varStyle)` 的浅合并，diffAndCloneA 的 deep clone 产物从未被消费，浅比较 keys + 引用即可。
6. `styleVisitor` 顺手收集 `hasTransform` / `hasBoxShadow` / `hasFontFamily` / `hasFlex` / `hasBackgroundLike` / `needStringify` 等顶层标志位，调用侧按需调用 `transform*`，普通节点跳过整批 transform 函数调用。
7. `percentConfig` 改为按需构造（仅在 `percentKeyPaths.length || calcKeyPaths.length` 时分配），`hasPositionFixed` 用局部变量替代 `positionMeta` 对象。
8. `visitOther` 展开 `[envVisitor, percentVisitor, calcVisitor].forEach`，按 `value.includes` 结果分别短路调用，去掉每次 render 的临时数组与闭包。

明确不做：

1. 不做 `useNavigation()` / `RouteContext` 按需订阅。RN 内建组件 view 链路上 `useLayout` 和 `useInnerProps` 都无条件调用 `useNavigation()`，单独优化 `useTransformStyle` 一处省不下订阅成本；将多处 `useNavigation()` 抽到顶层统一调用也只有结构收益，`useContext` 订阅按组件粒度建立而非按调用次数，对 render 性能无帮助。
2. 不做 `width` / `height` layout state 按需化。
3. 不做输入分析 / 动态解析 / 格式化分层重构。
4. 不做 `normalStyle` 结果引用稳定。
5. 不做基于 `styleObj` 的 WeakMap 缓存。`styleObj` 来自运行时 `getStyle` 合并，每次 render 都是新对象，引用缓存基本无法命中。
6. 不做顶层 `diffAndCloneA` 按需化。`varVisitor` 在 `keyPath.length === 1` 时对所有顶层对象/数组样式无条件 clone，理论上当该 key 下不存在任何 var/env/percent/calc 候选时这次 clone 多余，但按需化需要两次遍历或写时克隆，复杂度高于收益。

## 当前问题

核心文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

当前链路中值得优化的热路径开销：

1. `traverseStyle(styleObj, [varVisitor, boxSizingVisitor, shorthandVisitor])` 每个节点都要走 visitors 数组遍历，并且 `traverseStyle` 内部用 `Object.entries(target).forEach(([key, value]) => …)`，每个对象都要额外分配一份 entries 数组并对每对做数组解构。
2. `varVisitor` 对所有节点都执行 `unoVarUseRegExp.test(value)` 与 `varUseRegExp.test(value)`，没有 `typeof value === 'string'` 守卫，非字符串值会被隐式转为字符串后再做正则匹配。env / percent / calc 三个 visitor 在 `visitOther` 入口已经做过 `typeof value === 'string'` 预过滤，不在此问题范围内。
3. `transformVar(varKeyPaths)` / `transformEnv` / `transformPercent` / `transformCalc` 当前没有外层空数组守卫，候选路径为空时仍会进入函数；`transformShorthand` 自带内部 `if (shorthandKeys.length === 0) return`，与外层短路重复。
4. `transformEnv` 内 `getSafeAreaInset` 每次调用都执行 `extendObject({}, initialWindowMetrics?.insets, navigation?.insets)`，同一节点出现多个 `env(...)` 时按 token 数重复合并。
5. `enableVarRef.current` 为 true 时无条件执行 `extendObject({}, varContext, varStyle)` + `diffAndCloneA(varContextRef.current, newVarContext)`。两个独立问题叠加：
   - 只有 `hasVarDec === true` 时 `varContextRef.current` 才会作为 `<VarContext.Provider>` value（[utils.tsx:1377](packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L1377)），需要引用稳定。"只用不声明" 的节点（典型业务场景：祖先 view 声明 token，子节点直接 `var(--token)`）每次 render 都付出一次完整对象 clone + diff 没有任何下游收益。
   - 即使在确实需要维持引用稳定的"有声明"路径上，`diffAndCloneA` 也只用 `.diff` 字段决定是否替换 ref，递归 clone 出来的产物没有任何下游消费者。`newVarContext` 是浅合并，浅比较已足够。
6. `transformStringify` / `transformBoxShadow` / `transformTransform` / `transformFontFamily` / `transformFlex` / `transformBackground` 当前每个节点 render 都被无条件调用，即使它们内部都有 early return，函数调用本身仍是常驻成本，对没有这些样式的"普通节点"来说是纯浪费。
7. `percentConfig` 每次 render 都构造完整对象，但只有 percent / calc 路径会消费它；`positionMeta` 对象只为携带一个布尔字段，多了一次堆分配。
8. `visitOther` 内 `[envVisitor, percentVisitor, calcVisitor].forEach(visitor => visitor(...))` 每次都会创建临时 visitor 数组与箭头函数闭包，hot path 上重复生成。

## 方案一：traverseStyle 改为单 visitor

当前 `traverseStyle` 只有 `useTransformStyle` 一处调用，不需要保留数组 visitor 接口。同时把对象分支的 `Object.entries` 换成 `Object.keys` 索引访问，少一份中间数组分配和数组解构开销。

建议签名改为：

```tsx
type StyleVisitorArg = Pick<VisitorArg, 'key' | 'value' | 'keyPath'>

export function traverseStyle (styleObj: Record<string, any>, visitor: (arg: StyleVisitorArg) => void) {
  const keyPath: Array<string> = []

  function traverse<T extends Record<string, any>> (target: T) {
    if (Array.isArray(target)) {
      for (let i = 0; i < target.length; i++) {
        const key = String(i)
        const value = target[i]
        keyPath.push(key)
        visitor({ key, value, keyPath })
        traverse(value)
        keyPath.pop()
      }
    } else if (isObject(target)) {
      const keys = Object.keys(target)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const value = (target as Record<string, any>)[key]
        keyPath.push(key)
        visitor({ key, value, keyPath })
        traverse(value)
        keyPath.pop()
      }
    }
  }

  traverse(styleObj)
}
```

在 `useTransformStyle` 内合并原 `varVisitor` / `boxSizingVisitor` / `shorthandVisitor`，直接传单个 `styleVisitor`：

```tsx
function styleVisitor ({ key, value, keyPath }: StyleVisitorArg) {
  // var / normalStyle 拆分
  // boxSizing affecting 检测
  // shorthand key 收集
  // env / calc / percent 候选收集（沿用 visitOther）
}

traverseStyle(styleObj, styleVisitor)
```

注意点：

1. 改动前用 `rg "traverseStyle\\(" packages` 确认仍只有 `useTransformStyle` 调用。
2. 保持现有 `keyPath` 语义，`setStyle` 依赖这些路径。
3. 不新增 `analyzeTransformStyleInput` 之类的包装函数，避免无意义抽象。

## 方案二：轻量短路

### 字符串前置判断

`varVisitor` 中 `unoVarUseRegExp.test(value)` / `varUseRegExp.test(value)` 是当前唯一对所有节点生效、且无类型守卫的两次正则；env / percent / calc 三个 visitor 已经在 `visitOther` 入口做了 `typeof value === 'string'` 预过滤，不在此次改动范围。

合并到单 visitor 后：

```tsx
function styleVisitor ({ key, value, keyPath }: StyleVisitorArg) {
  // ... var/normal 拆分、boxSizing、shorthand 等收集

  if (varDecRegExp.test(key) || typeof value !== 'string') return
  if (unoVarUseRegExp.test(value)) {
    unoVarKeyPaths.push(keyPath.slice())
  } else if (varUseRegExp.test(value)) {
    hasVarUse = true
    varKeyPaths.push(keyPath.slice())
  } else {
    visitOther({ key, value, keyPath })
  }
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

具体增/删点：

1. `transformVar(varKeyPaths)`：当前只受 `enableVarRef.current` 守卫，需要在外层补 `if (varKeyPaths.length)`。
2. `transformVar(unoVarKeyPaths)`：当前已有 `if (unoVarKeyPaths.length)`，保留即可。
3. `transformEnv` / `transformPercent` / `transformCalc`：当前均无外层守卫，全部补齐。
4. `transformShorthand`：当前内部 `if (shorthandKeys.length === 0) return` 与外层短路重复，外层补齐后删除。

## 方案三：transformEnv 内 insets 预合并

`getSafeAreaInset` 当前签名是按 name 查询，但内部每次都会执行：

```tsx
const insets = extendObject({}, initialWindowMetrics?.insets, navigation?.insets)
return insets[safeAreaInsetMap[name]]
```

`transformEnv` 通过 `parseFunc(value, 'env')` 把单个值里的多个 `env(...)` 都解析出来，每个 token 都会调用一次 `getSafeAreaInset`，导致同一节点多次重复 `extendObject` 合并。改造点是把合并提到 `transformEnv` 入口一次完成：

```tsx
function transformEnv (styleObj, envKeyPaths, navigation) {
  const insets = extendObject({}, initialWindowMetrics?.insets, navigation?.insets)
  envKeyPaths.forEach((envKeyPath) => {
    setStyle(styleObj, envKeyPath, ({ target, key, value }) => {
      const parsed = parseFunc(value, 'env')
      const replaced = new ReplaceSource(value)
      parsed.forEach(({ start, end, args }) => {
        const name = args[0]
        const fallback = args[1] || ''
        const inset = insets[safeAreaInsetMap[name]]
        const next = '' + (inset ?? global.__formatValue(fallback))
        replaced.replace(start, end - 1, next)
      })
      target[key] = global.__formatValue(replaced.source())
    })
  })
}
```

注意点：

1. 这是 `transformEnv` 内部实现细节，签名不变。
2. 只在 `envKeyPaths.length > 0` 时被调用，结合外层空阶段短路后 0 候选节点没有任何额外开销。
3. `getSafeAreaInset` 当前未在文件外被复用，可保留 / 可内联，按改动量取舍。

## 方案四：varContext 路径瘦身（按需 merge + 浅比较替代 diffAndCloneA）

观察：

1. `varContextRef.current` 的引用稳定性只在 `hasVarDec === true` 时被 `wrapChildren` 用做 `<VarContext.Provider value={varContextRef.current}>`，否则它没有任何下游消费者。
2. `varStyle` 只在 `varDecRegExp` 命中时写入，`!hasVarDec` 时一定是空对象，`extendObject({}, varContext, varStyle)` 退化为 `varContext` 的浅拷贝。
3. 无声明节点的 `transformVar` 只读 `varContext` 的键值表，跟引用是否稳定无关。
4. 即使在 `hasVarDec` 路径下，`diffAndCloneA(varContextRef.current, newVarContext).diff` 也只取一个 boolean，递归 clone 出的对象从未被消费；`newVarContext` 又是浅合并产物，键值都是已 resolve 的简单值或字符串，浅比较足够。

合并这两点改造，在 `enableVarRef.current` 路径里按 `hasVarDec` 分流，并把有声明分支的 `diffAndCloneA` 换成浅比较。`shallowEqual` 抽到 `@mpxjs/utils`（与 `diffAndCloneA` 并列在 `packages/utils/src/object.js`），并在 `packages/webpack-plugin/lib/runtime/components/react/types/global.d.ts` 的 `@mpxjs/utils` ambient 声明中追加签名，便于其它 RN runtime 调用复用：

```tsx
import { shallowEqual } from '@mpxjs/utils'

if (enableVarRef.current) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const varContext = useContext(VarContext)
  // 无声明：直接用父 varContext，跳过 merge / 比对 / ref 维护
  // 有声明：浅合并出 newVarContext；只在内容变化时替换 ref 维持引用稳定，
  //         供 wrapChildren 的 <VarContext.Provider> 使用
  let resolvedVarContext = varContext
  if (hasVarDec) {
    const newVarContext = extendObject({}, varContext, varStyle)
    if (!shallowEqual(varContextRef.current, newVarContext)) {
      varContextRef.current = newVarContext
    }
    resolvedVarContext = varContextRef.current
  }
  if (varKeyPaths.length) {
    transformVar(normalStyle, varKeyPaths, resolvedVarContext, visitOther)
  }
}
```

收益与边界：

1. 业务侧典型用法是祖先 view 声明 token，子节点只 `var(--token)`，这条路径覆盖大多数 var 使用节点，每次 render 省下一次完整 `extendObject` 浅拷贝 + 一次 `diffAndCloneA` 递归遍历。
2. 有声明路径的 `diffAndCloneA` 换成浅比较后，每次 render 省下一次 deep clone + path 收集，结果一致：浅合并产生的差异都能被浅比较捕获。
3. `hasVarDec` 由当前 render 的样式决定，不是 ref 锁定的。组件在 render 之间从无声明变为有声明时，会进入 `if (hasVarDec)` 分支重新维护 `varContextRef`，没有时序问题。
4. `wrapChildren` 内 `hasVarDec && varContext` 守卫保证 `!hasVarDec` 时 `varContextRef.current` 不被读取，本次跳过 ref 更新对外不可见。
5. `enableVar` 稳定性检查（`enableVarRef.current !== enableVar`）逻辑保持不变，不与本方案冲突。
6. `shallowEqual` 已抽到 `@mpxjs/utils`：a/b 长度相同且每个键引用相等时认为相等。`!isObject(a) || !isObject(b)` 时按 `===` 分支返回 false。`packages/webpack-plugin/lib/runtime/components/react/types/global.d.ts` 中 `@mpxjs/utils` ambient 声明同步追加签名。

## 方案五：顶层 transform* 标志位短路

`useTransformStyle` 末尾每次 render 都会无条件依次调用：

```tsx
transformPosition(normalStyle, positionMeta)
transformStringify(normalStyle)
transformBoxShadow(normalStyle)
transformTransform(normalStyle)
transformBoxSizing(normalStyle, hasBoxSizingAffectingStyle)
transformFontFamily(normalStyle)
transformFlex(normalStyle)
transformShorthand(normalStyle, shorthandKeys)
transformBackground(normalStyle)
```

这些函数自身都有 early return（如 `if (!style.transform) return`），但函数调用本身仍是 hot path 上的常驻成本。普通节点（典型只有 width/height/color/marginTop 这种）每次 render 都白走一圈。

改造点是把这些"是否需要进入"的判断挪到 `styleVisitor` 收集阶段，调用侧按位短路：

```tsx
let hasTransform = false        // style.transform 存在
let hasBoxShadow = false        // style.boxShadow 存在
let hasFontFamily = false       // style.fontFamily 存在
let hasFlex = false             // style.flex 存在
let needTransformBackground = false // background / backgroundSize / backgroundPosition 任一存在
let needStringify = false       // fontWeight / transformOrigin 存在

function styleVisitor ({ key, value, keyPath }: StyleVisitorArg) {
  if (keyPath.length === 1) {
    switch (key) {
      case 'transform': hasTransform = true; break
      case 'boxShadow': hasBoxShadow = true; break
      case 'fontFamily': hasFontFamily = true; break
      case 'flex': hasFlex = true; break
      case 'background':
      case 'backgroundSize':
      case 'backgroundPosition': hasBackgroundLike = true; break
      case 'fontWeight':
      case 'transformOrigin': needStringify = true; break
    }
  }
  // ... 其它收集逻辑
}
```

调用侧：

```tsx
// transformPosition：单字段判断成本极低，不引入标志位
let hasPositionFixed = false
if (normalStyle.position === 'fixed') {
  normalStyle.position = 'absolute'
  hasPositionFixed = true
}
if (needStringify) transformStringify(normalStyle)
if (hasBoxShadow) transformBoxShadow(normalStyle)
if (hasTransform) transformTransform(normalStyle)
if (hasBoxSizingAffectingStyle) transformBoxSizing(normalStyle)
if (hasFontFamily) transformFontFamily(normalStyle)
if (hasFlex) transformFlex(normalStyle)
if (shorthandKeys.length) transformShorthand(normalStyle, shorthandKeys)
if (needTransformBackground) transformBackground(normalStyle)
```

注意点：

1. 这些标志位完全在 `styleVisitor` 阶段从原始 `styleObj` 收集；`transformVar` 解析后只会回写原来的 `target[key]`，不会新增顶层 key，因此不需要再回写这些标志位。`fontWeight` / `transformOrigin` 只要顶层 key 存在就置位，具体是否需要转字符串交给 `transformStringify` 内部判断，覆盖运行期解析后才变成 number 的场景。
2. `transformBoxSizing` 签名同步去掉 `hasBoxSizingAffectingStyle` 参数：所有调用方（`useTransformStyle` / `mpx-simple-view` / `mpx-simple-text`）均改为外层 `if (hasBoxSizingAffectingStyle) transformBoxSizing(...)`，函数体只保留 `if (style.boxSizing === undefined)` 一条判断，"是否进入"完全由调用侧决定。
3. `transformPosition` 只判断 `position === 'fixed'` 一次，不值得再加标志位收集，直接内联到调用侧即可，顺带消掉 `positionMeta` 对象（见方案六）。
4. 不要把"是否会被改写"也作为收集条件——比如 `transformShorthand` 处理 `padding: '10px 20px'` 这种字符串简写，本来就走 `shorthandKeys.length` 通道，已经覆盖。

## 方案六：percentConfig 按需构造、positionMeta 用局部变量

```tsx
const percentConfig = {
  width, height,
  fontSize: normalStyle.fontSize,
  parentWidth, parentHeight, parentFontSize
}
const positionMeta = { hasPositionFixed: false }
```

两处都是每次 render 必然新建的对象。`percentConfig` 仅被 `transformPercent` / `transformCalc` 消费；`positionMeta` 只为携带一个布尔字段。

改造：

```tsx
// percentConfig 按需构造
if (percentKeyPaths.length || calcKeyPaths.length) {
  const percentConfig = {
    width, height,
    fontSize: normalStyle.fontSize,
    parentWidth, parentHeight, parentFontSize
  }
  if (percentKeyPaths.length) transformPercent(normalStyle, percentKeyPaths, percentConfig)
  if (calcKeyPaths.length) {
    transformCalc(normalStyle, calcKeyPaths, (value, key) => {
      // ... 沿用原 formatter 闭包
    })
  }
}

// positionMeta 改为局部变量
let hasPositionFixed = false
if (normalStyle.position === 'fixed') {
  normalStyle.position = 'absolute'
  hasPositionFixed = true
}

return {
  hasVarDec,
  varContextRef,
  setWidth,
  setHeight,
  normalStyle,
  hasSelfPercent,
  hasPositionFixed
}
```

注意点：

1. `transformCalc` 的 `formatter` 闭包需要捕获 `percentConfig` / `hasSelfPercent`，把 formatter 也放进 `if (calcKeyPaths.length)` 守卫内即可。
2. 必须沿用 `transformCalc` 内 `if (hasOwn(selfPercentRule, key)) hasSelfPercent = true` 的写入逻辑，不要因为 `hasSelfPercent` 是 `let` 闭包就漏掉。
3. `transformPosition` 调用整体内联，可以删掉 `transformPosition` 函数定义，少一处签名维护成本。

## 方案七：visitOther 展开 forEach

当前实现：

```tsx
function visitOther ({ target, key, value, keyPath }: VisitorArg) {
  if (typeof value === 'string' && (value.includes('%') || value.includes('calc(') || value.includes('env('))) {
    [envVisitor, percentVisitor, calcVisitor].forEach(visitor => visitor({ target, key, value, keyPath }))
  }
}
```

每次进入这条分支都会构造一个 3 项数组与一个箭头函数。每个非 var 字符串值都会走这条路径，量级不小。展开后按 boolean 短路，同时复用一次 `keyPath.slice()`，并去掉与 `includes('env(')` / `includes('calc(')` 等价的正则复核：

```tsx
function visitOther ({ key, value, keyPath }: StyleVisitorArg) {
  if (typeof value !== 'string') return
  const hasPercent = value.includes('%')
  const hasCalc = value.includes('calc(')
  const hasEnv = value.includes('env(')
  if (!(hasPercent || hasCalc || hasEnv)) return
  let resolvedKeyPath
  if (hasEnv) {
    resolvedKeyPath = keyPath.slice()
    envKeyPaths.push(resolvedKeyPath)
  }
  if (hasPercent) {
    const needRadiusPercent = transformRadiusPercent && hasOwn(radiusPercentRule, key)
    const needFontPercent = key === 'fontSize' || key === 'lineHeight'
    if ((needRadiusPercent || needFontPercent) && percentRegExp.test(value)) {
      if (needRadiusPercent) hasSelfPercent = true
      resolvedKeyPath = resolvedKeyPath || keyPath.slice()
      percentKeyPaths.push(resolvedKeyPath)
    }
  }
  if (hasCalc) {
    resolvedKeyPath = resolvedKeyPath || keyPath.slice()
    calcKeyPaths.push(resolvedKeyPath)
  }
}
```

注意点：

1. percent 仍按 `radiusPercentRule` / `fontSize` / `lineHeight` 过滤；`hasSelfPercent` 只在 radius 自身百分比路径置位，行为不变。
2. `envUseRegExp` / `calcUseRegExp` 是 `/env\(/` / `/calc\(/`，与已计算的 `includes` 结果重复，可直接删除。
3. `visitOther` 在 `transformVar` 解析后也会被复用，展开后语义保持一致。

## 非目标

### 不做 RouteContext 按需订阅

不在 `useTransformStyle` 内做 `useNavigation()` 按需调用，也不引入 `enable-env` 等用户属性来切换订阅行为。

原因：

1. RN 内建组件 view 链路上 `useLayout` 和 `useInnerProps` 都无条件调用 `useNavigation()`，单独优化 `useTransformStyle` 一处省不下 `RouteContext` 订阅。
2. `useContext` 订阅按组件粒度建立而非按调用次数，将多处 `useNavigation()` 抽到顶层统一调用对 render 性能无收益，仅有可读性 / 单一来源等结构收益。
3. 真要省 `RouteContext` 订阅，需要把 view 链路上所有 hook 一起方案化，超出本方案范围。

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

### 不做顶层 diffAndCloneA 按需化

`varVisitor` 在 `keyPath.length === 1` 命中普通 key 时执行 `normalStyle[key] = isObject(value) ? diffAndCloneA(value).clone : value`，对所有顶层对象/数组样式（如 `transform`、`shadowOffset` 数组）做深克隆，目的是避免后续 `transform*` 改写到外部 props。

理论上当该顶层 key 下不存在任何 var / env / percent / calc 候选 keyPath，并且不会进入 `transformShorthand` / `transformBackground` 等可能改写嵌套结构的阶段时，这次 clone 是多余的；但要按需化必须做两次遍历或写时克隆，复杂度高于实测收益。保持当前无条件 clone。

### 不做 keyPath 顶层特化

`varVisitor` / `visitOther` 等候选收集对 `keyPath.slice()` 的复制是必须的（外层 `keyPath` 数组在 `traverse` 中会复用 push/pop）。绝大多数候选都发生在 `keyPath.length === 1` 的顶层 key 上，理论上可以按 `if (keyPath.length === 1) push([key]) else push(keyPath.slice())` 特化省一次 slice，但收益高度依赖嵌套样式比例（`transform` / `shadowOffset` 等数组样式实际占比），且会增加每个 push 处的分支判断。本方案不动这块，未来若 profile 显示瓶颈再单独评估。

### 不做 parser 层优化

`transformVar` / `transformEnv` / `transformCalc` 都依赖 `parseFunc(value, name)` 与 `new ReplaceSource(value)`，每个 keyPath 内都会重新构造解析器实例。同一节点出现多个相同函数（如多 `env(...)`）时存在重复构造空间。

但 `parseFunc` / `ReplaceSource` 是 `./parser` 模块对外能力，影响范围超出 `useTransformStyle`；空阶段短路与外层缓存命中后，0 候选节点已不进入 parser，剩余热路径上的优化收益要先用 profile 量化。本方案不改 parser，留作后续单独评估。

## 改动范围

1. `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
   - `traverseStyle` 改为单 visitor，对象分支 `Object.entries` 改为 `Object.keys` 索引访问。
   - `useTransformStyle` 合并为单个 `styleVisitor`，仅在 `varVisitor` 部分补 `typeof value === 'string'` 守卫。
   - 在 `useTransformStyle` 调用侧给 `transformVar(varKeyPaths)` / `transformEnv` / `transformPercent` / `transformCalc` 补外层空阶段短路；删除 `transformShorthand` 内部 `if (shorthandKeys.length === 0) return`。
   - `transformEnv` 入口预合并 `insets`，token 级查表替代逐次 `extendObject`。
   - `enableVarRef.current` 路径按 `hasVarDec` 分流：有声明走 merge + 浅比较 + ref 更新（替换原 `diffAndCloneA`）；无声明直接用父 `varContext` 调用 `transformVar`，跳过 `extendObject` 与比对。
   - `styleVisitor` 收集 `hasTransform` / `hasBoxShadow` / `hasFontFamily` / `hasFlex` / `hasBackgroundLike` / `needStringify`，调用侧按标志位短路 `transform*`；`transformVar` 解析后只继续收集 env / percent / calc 候选。
   - `percentConfig` 移到 `if (percentKeyPaths.length || calcKeyPaths.length)` 守卫内构造；`positionMeta` 改为 `let hasPositionFixed = false` 局部变量并内联 `transformPosition` 逻辑，`transformPosition` 函数定义可移除。
   - `visitOther` 展开为 3 个 boolean 分支调用，去掉每次构造的临时数组与箭头函数。

不涉及 RN 内建组件 props 类型和外部文档变更。

## 测试建议

重点覆盖行为稳定性：

1. CSS var / UnoCSS var 仍能正常解析，并在解析后继续触发 env / percent / calc 候选收集；`varVisitor` 中加 `typeof` 守卫后非字符串值仍能命中 `visitOther` 路径。
2. `padding` / `border` 仍触发 boxSizing 默认补齐。
3. `position: fixed` 仍返回 `hasPositionFixed: true`，且 `position` 转为 `absolute`（注意标志位短路化后仍要在 `transformPosition` 内联逻辑中保留行为）。
4. `transform`、`boxShadow`、`fontFamily`、`flex`、`shorthand`、`background` 等现有 runtime 样式能力保持不变；尤其覆盖 `transform: var(--my-transform)`、`fontFamily: var(--my-font)` 这类经 `transformVar` 解析后才出现顶层字段的用例，确认对应 `transform*` 阶段不会因为标志位收集发生在 var 解析之前而被跳过。
5. `fontWeight: 400` / `transformOrigin: 20` 这类 number 值仍能被 `transformStringify` 转字符串。
6. `env(safe-area-inset-*)` 行为不变：单 token、多 token、含 fallback 三类用例都覆盖一遍；`useNavigation()` 仍无条件调用。
7. 顶层数组 / 对象样式（`transform`、`shadowOffset` 等）的深克隆行为不变，`transform*` 阶段不应回写到外部 `styleObj`。
8. CSS var 行为分两条路径校验：
   - 子节点声明 `--token` 并消费 `var(--token)`：`varContextRef.current` 引用稳定（同样输入下连续 render 不变）、`<VarContext.Provider>` value 不变、子节点不发生因 Provider 触发的重渲。
   - 子节点只消费 `var(--token)`：当前 render 的 `transformVar` 仍能解析到祖先声明的值；同时 `varContextRef.current` 在该路径不再被更新，但 `wrapChildren` 也不会读它，行为对外等价。
9. 同一组件在 render 之间从"无声明"切到"有声明"时，新声明能即时进入 `varContextRef`，下游 Provider value 与之同步。
10. 不含 percent / calc 的节点：`percentConfig` 不构造、`transformPercent` / `transformCalc` 不进入；含 percent 但不含 calc 的节点 `percentConfig` 仍构造。

建议执行与 RN runtime style 相关的 eslint / jest。

## 回滚策略

1. 单 visitor 出问题：恢复 `traverseStyle(styleObj, [varVisitor, boxSizingVisitor, shorthandVisitor])`，`Object.keys` 写法可一并回退到 `Object.entries`。
2. 字符串前置判断 / 空阶段短路出问题：分别局部回退到原有写法，不影响其他优化项。
3. `transformEnv` insets 预合并出问题：恢复原 `getSafeAreaInset` 内部 `extendObject`。
4. `hasVarDec` 分流出问题：恢复原有 "无条件 `extendObject` + `diffAndCloneA` + `transformVar(varContextRef.current)`" 路径，独立于其他优化项可单点回退。浅比较替换 `diffAndCloneA` 出问题：仅把 `shallowEqual` 调用换回 `diffAndCloneA(...).diff`，不影响 `hasVarDec` 分流。
5. 标志位短路出问题：恢复 `transform*` 无条件调用，`styleVisitor` 内的标志位收集可保留以备复用，也可一并回退。
6. `percentConfig` 按需构造 / `positionMeta` 局部变量化出问题：恢复每次 render 构造 `percentConfig` 与 `positionMeta` 对象。
7. `visitOther` 展开 forEach 出问题：恢复原有 `[envVisitor, percentVisitor, calcVisitor].forEach` 写法。
