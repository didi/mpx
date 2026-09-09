# Mpx2RN 组件默认样式与用户简写优先级修复方案

## 背景

各 RN 基础组件在调用 `useTransformStyle` 之前，会通过 `extendObject({}, defaultStyle, style, ...)` 把组件内置默认样式与用户传入的 `style` / `hoverStyle` 提前合并：

| 组件 | 默认样式 | 文件 |
| --- | --- | --- |
| `mpx-view` | `FLEX_DEFAULT_STYLE = { flexDirection: 'row', flexBasis: 'auto', flexShrink: 1, flexWrap: 'nowrap' }`（`display: flex` 分支） | [mpx-view.tsx:103](packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx#L103) |
| `mpx-button` | `defaultViewStyle`（`borderWidth: 1` / `borderStyle: 'solid'` / `borderColor` / `backgroundColor` / `marginHorizontal: 'auto'` 等）+ `defaultTextStyle` | [mpx-button.tsx:271](packages/webpack-plugin/lib/runtime/components/react/mpx-button.tsx#L271) |
| `mpx-checkbox` | `styles.container = { flexDirection: 'row', alignItems: 'center' }` | [mpx-checkbox.tsx:112](packages/webpack-plugin/lib/runtime/components/react/mpx-checkbox.tsx#L112) |
| `mpx-radio` | 同上 | [mpx-radio.tsx:100](packages/webpack-plugin/lib/runtime/components/react/mpx-radio.tsx#L100) |
| `mpx-checkbox-group` | `{ flexDirection: 'row', flexWrap: 'wrap' }` | [mpx-checkbox-group.tsx:62](packages/webpack-plugin/lib/runtime/components/react/mpx-checkbox-group.tsx#L62) |
| `mpx-radio-group` | 同上 | [mpx-radio-group.tsx:65](packages/webpack-plugin/lib/runtime/components/react/mpx-radio-group.tsx#L65) |
| `mpx-label` | `{ flexDirection: 'row' }` | [mpx-label.tsx:42](packages/webpack-plugin/lib/runtime/components/react/mpx-label.tsx#L42) |
| `mpx-video` | `styles.container` | [mpx-video.tsx:173](packages/webpack-plugin/lib/runtime/components/react/mpx-video.tsx#L173) |
| `mpx-image` | `{ width, height }` | [mpx-image.tsx:169](packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx#L169) |

`useTransformStyle` 内部 `transformShorthand` 在展开用户简写（`border` / `margin` / `padding` / `borderRadius` / `flexFlow` / `textShadow` / `textDecoration` 等）时遵循 [rn-runtime-shorthand-style.md:195-197](solutions/rn-runtime-shorthand-style.md#L195-L197) 的"展开属性低优先级"规则：

```ts
// transformShorthand
for (const [prop, val] of pairs) {
  if (!hasOwn(styleObj, prop)) styleObj[prop] = val
}
```

该规则的本意是"用户写的专项属性优先于自己同时写的简写属性"（例如 `{ margin: '10px', marginTop: '20px' }`，`marginTop` 不被 `margin` 覆盖）。但当 `defaultStyle` 在更早一步就把"专项属性"塞进了 `styleObj`，规则被错误地拓展为"组件默认的专项属性优先于用户的简写"——优先级颠倒。

## 问题表现

1. `mpx-button` 用户写 `style="border: 0"`：合并后 `styleObj` 已含 default 的 `borderWidth: 1` / `borderStyle: 'solid'` / `borderColor`，`transformShorthand` 展开 `border` 时发现三项都已存在，全部跳过，用户简写**完全失效**，按钮仍带边框。
2. `mpx-radio-group` / `mpx-checkbox-group` 用户写 `style="flex-flow: column nowrap"`：default 已注入 `flexDirection: 'row'` / `flexWrap: 'wrap'`，`flexFlow` 展开两项被跳过，用户的轴向与换行配置同时失效。
3. `mpx-view` 在 `display: flex` 分支用户写 `style="flex-flow: column wrap"`：被 `FLEX_DEFAULT_STYLE` 中的 `flexDirection: 'row'` / `flexWrap: 'nowrap'` 覆盖。
4. `mpx-button` 用户写 `style="margin: 0"`：default 中的 `marginHorizontal: 'auto'` 不被简写清零。

反向（用户专项覆盖 default 专项）由 `extendObject` 浅合并天然支持，无问题。

## 关键观察

各组件的 `defaultStyle` 都是 RN 原生支持的静态样式：

- 值为静态 length / keyword / 数字，**无** `var()` / `calc()` / `env()` / 百分比依赖。
- 都是长属性形态（`flexDirection` 而非 `flex-flow`、`borderWidth` 而非 `border`），**无简写需要展开**。
- 不含 `transform` / `boxShadow` / `background` 这类需要字符串解析的属性。

也就是说 `defaultStyle` **不需要也不依赖** `useTransformStyle` 的任何转换步骤。这一点是本方案的底层前提，也是 default 与 user 可以在 transform 链路中分开处理的原因。

唯一例外是 `transformBoxSizing`：当 default 含 `padding*` / `border*Width` 等会影响 box-sizing 的属性时，最终合并结果也应当补默认 `boxSizing`，否则 RN 默认 box-sizing 与 mpx 约定（默认 `content-box`）不一致。`transformBoxSizing` 严格说不是"转换 default 属性值"，只是基于 styleObj 整体补一个全局属性，逻辑上仍可一次性处理。

## 目标与约束

1. 修复"用户简写被组件默认专项静默覆盖"。
2. `useTransformStyle` 只对 user style 跑 transform 链路；default 直接参与最终合并，不进入解析。
3. user 自身的"简写 vs 专项"规则不变，由 `transformShorthand` 既有逻辑保留。
4. `transformBoxSizing` 触发条件覆盖 default + user 全集。
5. 不引入二次遍历完整 styleObj；不对 default 做深拷贝。
6. `style` / `hoverStyle` 等多路 user 输入由调用方按现状合并为单一 user style，不强制由 `useTransformStyle` 维护多入口。

## 采纳方案 B：default 由 `useTransformStyle` 接管合并

### `useTransformStyle` 入参变更

```ts
interface TransformStyleConfig {
  enableVar?: boolean
  parentFontSize?: number
  parentWidth?: number
  parentHeight?: number
  transformRadiusPercent?: boolean
  defaultStyle?: Record<string, any>   // 新增：组件内置默认样式
}
```

`defaultStyle` 可选；不传时 `useTransformStyle` 行为与现状完全一致。

### 内部处理流程

```ts
export function useTransformStyle (
  styleObj: Record<string, any> = {},
  { enableVar, transformRadiusPercent, parentFontSize, parentWidth, parentHeight, defaultStyle }: TransformStyleConfig
) {
  // ──── Step 1：只对 user style 跑既有 transform 链路 ────
  // traverseStyle(styleObj, styleVisitor)
  // 收集 hasBoxSizingAffectingStyle / hasFlex / hasBoxShadow / ... / shorthandKeys
  // 跑 var / env / percent / calc / position / stringify / boxShadow / transform / flex / shorthand / background
  // 此时 normalStyle 已是 user 的最终展开形态（简写已变长属性）

  // ──── Step 2：合并 default（default 在底层），顺带补 hasBoxSizingAffectingStyle ────
  if (defaultStyle) {
    // 直接遍历 default，缺位写入 normalStyle；user 已存在的 key（含 user 简写展开后的长属性）
    // 不被覆盖，user 简写完整生效。
    for (const k in defaultStyle) {
      if (!hasOwn(defaultStyle, k)) continue
      if (!hasOwn(normalStyle, k)) normalStyle[k] = defaultStyle[k]
      // 复用本次循环，避免单独再扫一遍 default
      if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(k)) {
        hasBoxSizingAffectingStyle = true
      }
    }
  }

  // ──── Step 3：boxSizing 兜底（移到合并之后）────
  // 原位置在 step 1 内部；现在改为：合并完成后判断 normalStyle.boxSizing 是否未设
  if (hasBoxSizingAffectingStyle) transformBoxSizing(normalStyle)

  return { normalStyle, ... }
}
```

要点：

1. **transform 只跑 user**：`traverseStyle` / `varStyle` / `shorthandKeys` / `hasFlex` 等全部基于 user style 收集，与现状一致。
2. **合并发生在 transform 之后**：user 的 `border: 0` 在 step 1 内已被展开为 `borderWidth: 0` / `borderStyle: ...` / `borderColor: ...`，step 2 直接遍历 default 写入 `normalStyle`，命中已有 key（含 user 简写展开后的长属性）则跳过——**用户简写完整生效**。
3. **`hasBoxSizingAffectingStyle` 在合并循环里顺带补齐**：default key 本来就要逐个判断是否写入，复用同一次 `for...in` 做一次 `isBoxSizingAffectingStyle` 判断，命中后置位、后续 default key 仍照常处理。无独立扫描遍历。
4. **`transformBoxSizing` 移到合并后**：当前实现是 `if (style.boxSizing === undefined) style.boxSizing = default`。挪到 step 2 之后能让 user 显式 boxSizing → default 显式 boxSizing → 全局默认 的优先级链正确。
5. **`varContextRef` 不变**：仍基于 user 的 varStyle 构造，default 不参与 var 解析（前提保证 default 无 var）。

### 性能与原引用保护

- `defaultStyle` 不在则完全退化为现状；唯一额外开销是 `if (defaultStyle)` 一次判断。
- `defaultStyle` 在时：单次遍历 default key（通常 ≤ 10）+ 每 key 一次 `hasOwn(normalStyle, k)`；`hasBoxSizingAffectingStyle` 扫描复用同一次循环。**不分配 merged 对象、不遍历 user key 集合**。
- 直接写入既有的 `normalStyle`：它是 step 1 内新建的对象，没有外部引用，可安全 mutate。
- 不污染 `defaultStyle` 原对象：循环只读 default、写 normalStyle。

### 调用侧接入

#### mpx-view.tsx

```tsx
// before
const styleObj: ExtendedViewStyle = extendObject(
  {},
  style.display === 'flex' ? FLEX_DEFAULT_STYLE : undefined,
  style,
  isHover ? hoverStyle as ExtendedViewStyle : undefined
)
const { normalStyle, ... } = useTransformStyle(styleObj, { enableVar, ... })

// after
const styleObj: ExtendedViewStyle = isHover
  ? extendObject({}, style, hoverStyle as ExtendedViewStyle)
  : style
const { normalStyle, ... } = useTransformStyle(styleObj, {
  enableVar,
  ...,
  defaultStyle: style.display === 'flex' ? FLEX_DEFAULT_STYLE : undefined
})
```

> hover 仍由调用方合到 user style。default 走 config 通道。`style.display === 'flex'` 仍以 user 原始 style 判断（user 没写 `display: flex` 时不应套用默认 flex 配置）。

#### mpx-button.tsx

```tsx
const defaultStyle = extendObject({}, defaultViewStyle, defaultTextStyle)
const styleObj = isHover ? extendObject({}, style, hoverStyle) : style
const { normalStyle, ... } = useTransformStyle(styleObj, { enableVar, ..., defaultStyle })
```

> 组装 `defaultViewStyle` / `defaultTextStyle` 自身的 `extendObject` 不动。

#### mpx-checkbox.tsx / mpx-radio.tsx

```tsx
const { normalStyle, ... } = useTransformStyle(style, {
  enableVar, ...,
  defaultStyle: styles.container
})

// useNodesRef 的暴露 style 改为直接复用 normalStyle（已含 default）
useNodesRef(props, ref, nodeRef, { style: normalStyle, change: onChange })

// createElement(View, { style: defaultStyle }, ...) 这一处是 Icon 容器 View，
// 与组件主样式无关，保留 styles.wrapper / styles.wrapperChecked / styles.wrapperDisabled 的组装不变
```

#### mpx-checkbox-group.tsx / mpx-radio-group.tsx / mpx-label.tsx

```tsx
const { normalStyle, ... } = useTransformStyle(style, {
  enableVar, ...,
  defaultStyle
})
```

#### mpx-video.tsx

```tsx
useTransformStyle(style, {
  enableVar, ...,
  defaultStyle: styles.container
})
```

#### mpx-image.tsx

```tsx
// { overflow: 'hidden' } 是强制覆盖 user 的固定值，不属于 default 兜底，
// 仍按 user 路径合到 styleObj 入参里
const styleObj = extendObject({}, style, { overflow: 'hidden' })
const { normalStyle, ... } = useTransformStyle(styleObj, {
  enableVar, ...,
  defaultStyle: { width: DEFAULT_IMAGE_WIDTH, height: DEFAULT_IMAGE_HEIGHT }
})

// useNodesRef 仍暴露 defaultStyle 引用本身（与 mpx-image 现有行为一致，未来调用方做尺寸 fallback 用）
useNodesRef(props, ref, nodeRef, { defaultStyle })
```

### `hasSelfPercent` / `splitStyle` 等下游不受影响

- `hasSelfPercent`：仅在 user `borderRadius` / `translateX` 等含百分比时触发，default 无百分比，合并不引入。
- `splitStyle`：按 key 分类，合并后的 normalStyle 中 key 集合是 default ∪ user，分类规则不变。
- `useLayout` / `useTextPassThrough`：依赖 `splitStyle` 结果，间接受益于 user 简写正确生效。

## 与方案 A、方案 C 的对比

之前评估的两个备选：

### 方案 A：default 后置兜底（外部合）

调用方在 `useTransformStyle` 之后做 `extendObject({}, defaultStyle, normalStyle)`：

- `hasBoxSizingAffectingStyle` 的检测只跑了 user，default 中的 padding/border 无法触发 boxSizing 兜底——需要每个组件自行判断、重复逻辑。
- `splitStyle` 在外部合并之后还要再跑一次（或在每个组件分别处理），逻辑分散。
- 不采纳。

### 方案 C：合并阶段剥离 default 中的同族专项

新增 `mergeDefaultStyle`，根据 user 简写从 default 中剥离对应长属性：

- 修复点确实精准，但对 `useTransformStyle` 缺少"default 是否影响 box-sizing 兜底"的统一感知。
- 多了一份 `runtimeAbbreviationMap` 的反向遍历逻辑与缓存维护。
- 调用方仍各自合并，default 路径与 user 路径在外部仍是混合的；后续若 default 需要扩能（如 hover 触发的 default 切换）每个组件都要协调。
- 不如方案 B 把"default 由 transform hook 统一接管"来得彻底。
- 不采纳。

## 风险与边界

1. **default 未来引入动态值**：当前 default 全部是 RN 原生静态值。如果未来某组件想在 default 中写 `var()` / `calc()` / shorthand / boxShadow 等，方案 B 不再适用——届时再讨论是否扩展 `useTransformStyle` 也对 default 做局部 transform。当前不预设该能力。
2. **default 引用稳定性**：方案 B 不修改 default 原对象，但调用方若每次 render 都新 `extendObject({}, ..., ...)` 构造 default（如 `mpx-button` / `mpx-checkbox` / `mpx-radio`），引用每次都变。这只影响 `useTransformStyle` 是否能用 WeakMap 缓存 default 特征——本方案没用缓存，无影响。模块级常量（如 `FLEX_DEFAULT_STYLE` / `styles.container`）天然稳定。
3. **`useNodesRef` 暴露的 style**：`mpx-checkbox` / `mpx-radio` 当前传 `extendObject({}, defaultStyle, normalStyle)`，方案 B 下 `normalStyle` 已含 default，直接传 `normalStyle` 即可——同样的引用，少一次合并。
4. **`mpx-image` 的 `{ overflow: 'hidden' }`**：走 user 入参覆盖，不归 default 兜底，与现状语义一致；`overflow` 在 transform 链路无副作用。
5. **回归覆盖**：未传 `defaultStyle` 的调用与现状逐字节一致；传了的，user 命中简写场景从"被 default 覆盖"变为"正确生效"，无非简写场景的回归。

## 测试用例

围绕"default 专项 vs user 简写"覆盖：

1. `mpx-button` 用户 `style="border: 0"` → 边框消失；default 的 `borderWidth/borderStyle/borderColor` 全部由 user `border: 0` 展开覆盖。
2. `mpx-button` 用户 `style="border: 2px dashed red"` → user 三项覆盖 default 三项。
3. `mpx-button` 用户 `style="margin: 0"` → `marginHorizontal: 'auto'` 失效，四方向归零。
4. `mpx-radio-group` 用户 `style="flex-flow: column nowrap"` → `flexDirection: 'column' / flexWrap: 'nowrap'`，default `row/wrap` 被覆盖。
5. `mpx-view` 用户 `style="display:flex; flex-flow: column wrap"` → 同上。
6. `mpx-view` 用户 `style="display:flex"` → `FLEX_DEFAULT_STYLE` 全部生效，无回归。
7. `mpx-checkbox` 用户 `style="padding: 4px 8px"` → user 简写展开 padding 四方向；default 仅含 `flexDirection / alignItems`，与简写无交集，default 维持；同时 `hasBoxSizingAffectingStyle` 因 user padding 触发，补 boxSizing。
8. `mpx-button` 用户不写 padding/border → default 含 `borderWidth: 1`，`hasBoxSizingAffectingStyle` 扩展到 default 后触发，补默认 boxSizing；与现状一致（现状是合并后 user 路径含 borderWidth）。
9. `mpx-button` hover 写 `border: 0`、style 不写边框 → hover 状态下 default 边框被清除；非 hover 状态下 default 维持。
10. `mpx-button` 用户 `style="border-width: 0"`（专项）→ user 仅 `borderWidth` 覆盖 default，`borderStyle/borderColor` 仍来自 default。
11. `mpx-image` 用户 `style="width: 100"` → `width` 来自 user，`height` 来自 default；`overflow: 'hidden'` 来自固定 override。
12. `mpx-view` 用户 `style="flex: 1"` + `display: flex` 分支 → `transformFlex` 展开 `flexGrow: 1 / flexShrink: 1 / flexBasis: 0`，合并后覆盖 default 的 `flexBasis: 'auto' / flexShrink: 1`；`flexDirection: 'row' / flexWrap: 'nowrap'` 不在 flex 简写覆盖范围内，维持 default。
13. `mpx-button` 用户 `style="box-sizing: border-box"` → user 显式 boxSizing 在合并后仍存在，`transformBoxSizing` 因 `boxSizing !== undefined` 不再覆盖。

## 实施步骤

1. [utils.tsx](packages/webpack-plugin/lib/runtime/components/react/utils.tsx) 修改：
   - `TransformStyleConfig` 加 `defaultStyle?: Record<string, any>`。
   - `useTransformStyle` 内：transform 链路保持只跑 user；末尾追加 default 合并 + `hasBoxSizingAffectingStyle` 扩展扫描；`transformBoxSizing` 移到合并之后。
2. 调用侧按上面清单逐文件改造：
   - `mpx-view` / `mpx-button` / `mpx-checkbox` / `mpx-radio` / `mpx-checkbox-group` / `mpx-radio-group` / `mpx-label` / `mpx-video` / `mpx-image`。
   - `mpx-checkbox` / `mpx-radio` 的 `useNodesRef` 同步简化为直接传 `normalStyle`。
3. `dist/*.jsx` 若为编译产物，由构建链路重新产出，不手改。
4. 对照测试用例逐项跑通。
