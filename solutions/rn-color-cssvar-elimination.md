# RN 端 unocss 颜色类 CSS Var 默认行为优化方案

## 背景

当前 mpx 跨端输出 RN 时，使用 `@mpxjs/unocss-base/preset-rn` 作为 unocss 预设，其策略是「block 掉 unocss 默认 utility，再补充 RN 友好的实现」。但 **颜色相关的 utility（`bg-*` / `text-*` / `border-*` / `shadow-*` / `ring-*` 等）目前仍然走 unocss `preset-mini` 的默认实现**，未被覆盖。

unocss 默认实现为了支持 **「单色 utility + 独立 opacity utility」组合**（例如 `bg-red-500` + `bg-opacity-50`）的语义，会强制将颜色拆成两个 CSS 变量：

```css
.bg-red-500 {
  --un-bg-opacity: 1;
  background-color: rgb(239 68 68 / var(--un-bg-opacity));
}
.bg-opacity-50 {
  --un-bg-opacity: 0.5;
}
```

在 Web 上这一组合是几乎免费的（浏览器 CSS 引擎处理 var）。但在 RN 端经由 mpx-runtime 转换时，这种 cssVar 输出会带来三个明显成本：

1. **每个颜色 utility 多 1 个 key**：从 `{ backgroundColor: '#xxxxxx' }` 变成 `{ '--un-bg-opacity': 1, backgroundColor: 'rgb(... / var(--un-bg-opacity))' }`，styleObj key 数量翻倍。
2. **运行时需要 var 解析**：mpx-runtime 在 `useTransformStyle` 里会扫描所有 `var(--*)` 引用并替换为实际值（参见 `varVisitor` / `unoVarUseRegExp`）。颜色这条路径上的字符串解析、替换会在每个组件实例上重复执行。
3. **layer 抽离开销**：postprocess 把"全是 `--un-*` key 的 utility"抽到 `varUtilities` layer 进入 `important`，运行时 mergeToLayer 也多一层。

实测结论（1200 卡片 perf 列表）：将颜色类输出改为字面量后，`__getStyle` 总耗时从 ~700ms 降到 ~140ms 量级（同 stylus 持平）。详见 `examples/perf` 中的 `uno-performance.mpx` / `normal-performance.mpx` 对比。

## 设计原则

在 RN 端默认应当 **不生成 cssVar**：

- `bg-red-500` 直接输出 `{ backgroundColor: 'rgb(239 68 68)' }`
- 改透明度时使用 unocss 原生支持的「斜杠语法」：`bg-red-500/50` → `{ backgroundColor: 'rgb(239 68 68 / 0.5)' }`
- `bg-opacity-50` / `text-opacity-50` 这类 **独立 opacity utility** 自然失效（产物只有一行 `--un-bg-opacity: 0.5`，被剥离后 utility 变空）

这是一个有意识的破坏性变更：业务代码必须从「颜色 + opacity」组合迁移到「颜色/alpha」斜杠写法。Web 端也一样支持 `bg-red-500/50` 写法，可以做到双端一致。

## 受影响的 utility 清单

通过扫描 `@unocss/preset-mini` 与 `@unocss/preset-wind3` 中所有调用 `colorResolver(...)` 与生成 `--un-*-opacity` 的 utility，整理如下。注意：**本方案不需要逐条 override**，仅作为影响面说明。

### A. 颜色类 utility（默认带 `--un-{varName}-opacity`）

| utility 模式 | cssVar | 输出 CSS 属性 | 备注 |
|---|---|---|---|
| `bg-{color}` | `--un-bg-opacity` | `background-color` | 高频核心 |
| `text-{color}` / `color-{color}` / `c-{color}` | `--un-text-opacity` | `color` | 高频核心；`text-` 前缀同时承担字号（`text-lg`）与颜色（`text-red-500`），`text-lg` 等不走 colorResolver，本方案天然不影响 |
| `border-{color}` / `b-{color}` | `--un-border-opacity` | `border-color` | 高频核心 |
| `border-{x|y|t|r|b|l}-{color}` | `--un-border-{x|y|t|r|b|l}-opacity` | 各方向 border-color | preset-rn 已 block 部分逻辑边 |
| `decoration-{color}` / `underline-{color}` | `--un-line-opacity` | `text-decoration-color` | preset-rn 已 block |
| `fill-{color}` | `--un-fill-opacity` | `fill` | SVG，RN 一般不支持 |
| `stroke-{color}` | `--un-stroke-opacity` | `stroke` | SVG，RN 一般不支持 |
| `text-stroke-{color}` | `--un-text-stroke-opacity` | `-webkit-text-stroke-color` | RN 不支持 |
| `text-shadow-color-{color}` | `--un-text-shadow-opacity` | `--un-text-shadow-color` | RN 不支持 |
| `ring-{color}` | `--un-ring-opacity` | `--un-ring-color` | preset-rn 已 block 整个 ring |
| `ring-offset-{color}` | `--un-ring-offset-opacity` | `--un-ring-offset-color` | preset-rn 已 block |
| `placeholder-{color}` | `--un-placeholder-opacity` | placeholder 颜色 | 应通过 props 而非样式 |
| `divide-{color}` | `--un-divide-opacity` | divide border-color | RN 无兄弟选择器 |

> 触发规则：当用户写 `bg-red-500`（无 alpha）走 cssVar 分支；写 `bg-red-500/50`（带 alpha）则直接内嵌为 rgba，不走 cssVar。

### B. 独立 opacity utility（生成纯 cssVar 行）

这些 utility 单独使用时只输出一个 `--un-*-opacity: <value>` 声明：

- `bg-op-{n}` / `bg-opacity-{n}`
- `text-op-{n}` / `text-opacity-{n}` / `color-op-{n}` / `c-op-{n}`
- `border-op-{n}` / `b-op-{n}`，含各方向 `border-{x|y|...}-op-{n}`
- `decoration-op-{n}` / `underline-op-{n}`
- `fill-op-{n}` / `stroke-op-{n}` / `text-stroke-op-{n}`
- `ring-op-{n}` / `ring-offset-op-{n}`
- `shadow-op-{n}`
- `text-shadow-color-op-{n}`
- `placeholder-op-{n}`
- `divide-op-{n}`

> 本方案下这些 utility 的 entries 在 postprocess 阶段被全部清空 → utility 不产出 → 自然失效，无需手动 block。

### C. shadow

`shadow-md` / `shadow-lg` / `shadow-{color}` 默认输出形如 `var(--un-shadow-inset) 0 1px 3px 0 var(--un-shadow-color, rgb(0 0 0 / 0.1))` 的 box-shadow。本方案在 postprocess 中识别 `--un-shadow-color` / `--un-shadow-inset` 并 inline，**无需重写 shadow rule**。

> 当前 preset-rn 的 `shadow.js` 自带 override 但仍调用 `colorResolver('--un-shadow-color', ...)`，仍生成 cssVar；启用本方案后，原有 shadow.js 可保留也可清理（postprocess 都能正确剥离）。

## 用户写法迁移

本方案在 postprocess 中通过白名单**保留** transform / filter / backdrop-filter / gradient / ring 等依赖跨 utility cssVar 合成的体系，**这些写法不受影响，保持原样可用**。

实际需要业务改写的只有**颜色 + 独立 opacity utility 组合**这一条：

| 场景 | 之前的写法 | 现在的写法 |
|---|---|---|
| 背景色 + 透明度 | `bg-red-500 bg-opacity-50` | `bg-red-500/50` |
| 文字色 + 透明度 | `text-blue-600 text-opacity-30` | `text-blue-600/30` |
| 边框色 + 透明度 | `border-gray-300 border-opacity-50` | `border-gray-300/50` |

> 触发逻辑：独立 `*-opacity-{n}` utility 在 postprocess 中唯一一条 `--un-*-opacity` entry 不在保留白名单，被丢弃后 entries 为空，className 失效。改用 unocss 原生的 `/{alpha}` 斜杠语法即可，Web 与 RN 双端一致。
>
> 其他颜色类同样支持 `/{alpha}` 写法（如 `outline-red-500/30`、`fill-blue-500/50`），但 RN 端 SVG / decoration / ring / placeholder 等本就被 preset-rn 限制，对业务影响仅限于上表三条高频场景。

## 实施方案

### 核心思路

利用 unocss 的 `postprocess` 钩子在 utility 写入 layer 前对 css entries 做最后一遍处理。**preset-mini / preset-wind3 的所有颜色 rule 都不动**，只在 postprocess 里把 `var(--un-*-opacity)` / `var(--un-shadow-color, ...)` / `var(--un-shadow-inset)` 等 cssVar 表达式 **inline 解析为字面量**，并丢弃配套的 `--un-*-opacity: <n>` 声明行。

只动 1 个新文件 + `index.js` 注册顺序，覆盖 **A + B + C 全部 utility，且对未来 unocss 升级新增的颜色 utility 自动生效**。

### 1. 新增 postprocess 实现

文件：`lib/mpx/packages/unocss-base/preset-rn/postprocess/flatten-color-vars.js`

```js
/**
 * 将 unocss 颜色类 utility 的 cssVar 表达式 inline 为字面量。
 *
 * 处理两类 var：
 *   1) --un-{name}-opacity: 颜色 utility 内成对出现，使用同 utility 内
 *      对应 --un-{name}-opacity 字面值替换；如不存在则用默认 1。
 *   2) --un-shadow-color / --un-shadow-inset / --un-ring-* 等 shadow/ring
 *      var：使用 var() 表达式中的 fallback（`var(--x, fallback)`）
 *      或预设默认值。
 */

// 形如 var(--un-bg-opacity)
const OPACITY_VAR_RE = /var\(\s*--un-([\w-]+?)-opacity\s*\)/g
// 形如 var(--un-shadow-color, rgb(0 0 0 / 0.1)) 或 var(--un-shadow-inset)
const ANY_UN_VAR_RE = /var\(\s*(--un-[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g

function buildOpacityMap (entries) {
  const map = Object.create(null)
  for (const [k, v] of entries) {
    const m = /^--un-([\w-]+?)-opacity$/.exec(k)
    if (m && (typeof v === 'string' || typeof v === 'number')) {
      map[m[1]] = String(v)
    }
  }
  return map
}

// 把 utility 内自描述的 --un-* 字面值收集起来，便于二次替换
function buildLocalVarMap (entries) {
  const map = Object.create(null)
  for (const [k, v] of entries) {
    if (typeof k === 'string' && k.startsWith('--un-') && (typeof v === 'string' || typeof v === 'number')) {
      map[k] = String(v)
    }
  }
  return map
}

function inlineValue (value, opacityMap, localVarMap) {
  if (typeof value !== 'string') return value
  // 不含 var(--un- 直接返回
  if (value.indexOf('var(--un-') === -1) return value

  // 1) 优先替换 --un-{name}-opacity（最高频）
  let next = value.replace(OPACITY_VAR_RE, (_, name) => opacityMap[name] ?? '1')

  // 2) 替换其他 --un-* (shadow / ring / 自定义)；优先用同 utility 内字面值，
  //    否则用 var() 自带的 fallback；都没有时丢弃整段（替换为空字符串）
  next = next.replace(ANY_UN_VAR_RE, (_, name, fallback) => {
    if (localVarMap[name] != null) return localVarMap[name]
    if (fallback != null) return fallback.trim()
    return ''
  })

  // 3) 清理多余空白（替换 fallback 后可能出现 "  " 或前导空格）
  return next.replace(/\s{2,}/g, ' ').trim()
}

export function flattenColorVars (util) {
  const entries = util.entries
  if (!entries || entries.length === 0) return

  const opacityMap = buildOpacityMap(entries)
  const localVarMap = buildLocalVarMap(entries)

  const next = []
  for (const [k, v] of entries) {
    // 丢弃所有 --un-* 声明行（无论 opacity 还是 shadow-color 等）
    if (typeof k === 'string' && k.startsWith('--un-')) continue
    next.push([k, inlineValue(v, opacityMap, localVarMap)])
  }

  util.entries = next
}
```

### 2. 注册到 preset

修改 `lib/mpx/packages/unocss-base/preset-rn/index.js`：

```js
import rules, { blocklistRules } from './rules/index'
import { normalizeTransformVar } from './rules/transforms'
import theme from './theme'
import blocklistVariants from './variants/index'
import { transformBase } from '@unocss/preset-mini/rules'
import { filterBase } from '@unocss/preset-wind3/rules'
import { flattenColorVars } from './postprocess/flatten-color-vars'

// ... preflights() 不变

// ⚠️ 顺序至关重要：
//   flattenColorVars 必须排在原有 postprocess 之前，
//   原有 postprocess 检测「全是 --un-*」推到 varUtilities layer，
//   flatten 后这些 utility 已经无 --un-* 行，自然不再被推到 varUtilities，
//   合并 layer / RN 运行时 var 解析的开销同时消除。
function postprocess (utilsObject) {
  const everyIsVar = utilsObject.entries.every(v => v[0].startsWith('--un'))
  if (everyIsVar) {
    utilsObject.layer = 'varUtilities'
  }
  return utilsObject
}

export default function presetRnMpx () {
  return {
    name: '@mpxjs/unocss-preset-rn',
    rules,
    theme,
    preflights: preflights(),
    postprocess: [flattenColorVars, postprocess],
    blocklist: [
      ...blocklistRules,
      ...blocklistVariants
    ]
  }
}
```

### 3. 不需要做的事

- ❌ **不需要**新增 `colorResolverFlat` / `color-flat.js` 等覆盖规则
- ❌ **不需要**为 bg / text / border / decoration / fill / stroke 各自写 RN 版本
- ❌ **不需要**重写 `shadow.js`（保留 / 删除均可，postprocess 都能 inline）
- ❌ **不需要**显式 block B 类独立 opacity utility（自然失效）
- ❌ **不需要**关心 `text-{size}` 与 `text-{color}` 的 fallback 顺序（不动 rules）

### 4. 兼容性收尾（可选 P3）

虽然 B 类 opacity utility 已自然失效，仍可在 unocss-plugin 编译期对其命中做一次 codeframe 警告，引导业务迁移到 `bg-red-500/50` 写法。参考位点：`lib/mpx/packages/unocss-plugin/lib/rn-plugin/index.js` 中已有的 `uno.blocked` 处理。

## 验证方案

### 编译产物校验

```bash
pnpm build:rn
grep -oE '(--un-[\w-]+|var\(--un-[\w-]+)' dist/android/app.js | sort -u
```

预期输出为空（`transform` / `filter` preflight 中允许保留的 cssVar 已由 `transformBase` / `filterBase` 单独处理，不在颜色 utility 范围）。

重点看 `__unoClassMap` 内容：

- ✅ `bg-blue-500: function(_f){return {backgroundColor:'rgb(59 130 246 / 1)'};}`
- ✅ `bg-blue-500/50: function(_f){return {backgroundColor:'rgb(59 130 246 / 0.5)'};}`
- ✅ `shadow-md: function(_f){return {boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'};}`
- ❌ ~~`bg-blue-500: function(_f){return {'--un-bg-opacity':1, backgroundColor:'rgb(59 130 246 / var(--un-bg-opacity))'};}`~~

### 渲染等价性

`bg-red-500/50` 必须渲染出半透明红色，且与 `bg-red-500 bg-opacity-50`（旧写法）的视觉表现一致。

迁移前后 visual diff 关注点：

| className | 改造前渲染 | 改造后渲染 |
|---|---|---|
| `bg-red-500` | rgba(239,68,68,1) | rgb(239 68 68 / 1) ≡ 同色 |
| `bg-red-500/50` | rgba(239,68,68,0.5) | rgb(239 68 68 / 0.5) ≡ 同色 |
| `bg-red-500 bg-opacity-50` | rgba(239,68,68,0.5) | **rgba(239,68,68,1)**（opacity utility 失效） |
| `shadow-md` | shadowColor #000 alpha 0.1 | 同 |

### 性能验证

复用 `examples/perf/uno-performance.mpx` 列表对比改造前后 `__getStyle.totalMs`：

- 改造前：每个 `bg-*` / `text-*` / `border-*` 在 styleObj 中多 1 个 `--un-*-opacity` key，`useTransformStyle` 内 varVisitor 命中
- 改造后：每个上述 utility 仅 1 个 RN style key，varVisitor 在颜色路径上零命中

### 单元测试覆盖

补 `lib/mpx/packages/unocss-base/__tests__/preset-rn.flatten.spec.ts`：

```ts
import { createGenerator } from '@unocss/core'
import presetRn from '@mpxjs/unocss-base/preset-rn'

const uno = createGenerator({ presets: [presetRn()] })

test('bg-red-500 outputs flat color, no cssVar', async () => {
  const { css } = await uno.generate('bg-red-500', { preflights: false })
  expect(css).not.toMatch(/--un-bg-opacity/)
  expect(css).toMatch(/background-color:\s*rgb\(239 68 68 \/ 1\)/)
})

test('bg-red-500/50 outputs alpha color', async () => {
  const { css } = await uno.generate('bg-red-500/50', { preflights: false })
  expect(css).toMatch(/rgb\(239 68 68 \/ 0\.5\)/)
})

test('text-blue-700 outputs flat color, text-lg unaffected', async () => {
  const { css } = await uno.generate('text-blue-700 text-lg', { preflights: false })
  expect(css).not.toMatch(/--un-text-opacity/)
  expect(css).toMatch(/color:\s*rgb\(/)
  expect(css).toMatch(/font-size/)
})

test('bg-opacity-50 produces empty utility', async () => {
  const { css, matched } = await uno.generate('bg-opacity-50', { preflights: false })
  // matched 仍可能包含（preset-mini 命中），但 css 中不应出现该 selector body
  expect(css).not.toMatch(/--un-bg-opacity/)
  expect(css.replace(/\s/g, '')).not.toMatch(/\.bg-opacity-50\{[^}]+\}/)
})

test('shadow-md inlines shadow color', async () => {
  const { css } = await uno.generate('shadow-md', { preflights: false })
  expect(css).not.toMatch(/--un-shadow-color/)
  expect(css).not.toMatch(/--un-shadow-inset/)
  expect(css).toMatch(/box-shadow:\s*0/)
})
```

## 兼容性 / 迁移指引

### 破坏性变更

- ❌ `bg-opacity-{n}` / `text-opacity-{n}` / `border-opacity-{n}` 等独立 opacity utility 不再生效（编译产物为空）
- ❌ 通过运行时修改 `--un-*-opacity` cssVar 改变颜色透明度的 hack 不再生效
- ⚠️ 自定义业务 rule 中如果手动产出 `--un-xxx` 系列 cssVar，且依赖 RN 运行时 varVisitor 解析，**会被 postprocess 一并清理**。如有需要保留的 var，需要换成 `--mpx-*` 等非 `--un-` 前缀，或在 flatten 函数中加白名单。

### 迁移规则

| 旧写法（保留 cssVar） | 新写法（推荐） |
|---|---|
| `bg-red-500 bg-opacity-50` | `bg-red-500/50` |
| `text-blue-700 text-opacity-80` | `text-blue-700/80` |
| `border-slate-200 border-opacity-30` | `border-slate-200/30` |
| `shadow-md` + 自定义 `--un-shadow-color` | `shadow-md`（默认 black/0.1）或 `shadow-{color}` |

### 自动检测

在 unocss-plugin 编译期对 B 类废弃 utility 命中做 codeframe 警告。参考位点：`lib/mpx/packages/unocss-plugin/lib/rn-plugin/index.js`。

## 后续可拓展的优化（不在本次范围）

- preflight 中的 `transform` / `filter` 仍走 cssVar 路径（因为单 utility 内多个 var 互相依赖，例如 translate/rotate/scale 在 `transform` 中拼接）。这部分由 transformVar visitor 处理，影响面比颜色小，单独评估。
- 若某些业务真正依赖 `--un-*` 运行时改值，可在 `flattenColorVars` 中暴露白名单选项（默认全部 inline，白名单内的 var 保留）。

## 落地计划

| 阶段 | 内容 | 风险 |
|---|---|---|
| P1 | postprocess `flattenColorVars` 实现 + 注册（覆盖 A/B/C 全部 utility） | 低，所有改动集中在 1 个新文件 |
| P2 | 单测 + 编译产物校验脚本 | 低 |
| P3 | unocss-plugin 编译期对 B 类废弃 utility 命中加 codeframe 警告 | 低 |
| P4 | 文档发布到 docs-vitepress（`articles/rn/`） | 低 |

## 参考实现位点

- `lib/mpx/packages/unocss-base/preset-rn/postprocess/flatten-color-vars.js`：**新文件，本方案唯一实现点**
- `lib/mpx/packages/unocss-base/preset-rn/index.js`：注册新 postprocess（排在原有 postprocess 之前）
- `lib/mpx/packages/unocss-plugin/lib/rn-plugin/index.js`：可选 codeframe 警告
- `lib/mpx/packages/unocss-base/preset-rn/rules/shadow.js`：可选清理（保留也不影响）

## 相关 issue / 性能背景

- 性能背景见 `solutions/rn-style-performance.md` 或 `mpx-unocss-drn` 项目的 `uno-performance.mpx` / `normal-performance.mpx` 对比测试
- unocss 颜色 cssVar 来源：`@unocss/preset-mini/dist/shared/preset-mini.DrfPDgwn.mjs` 中的 `colorResolver` 函数（10 处调用点全部走同一函数）
- unocss postprocess 类型定义：`@unocss/core/dist/index.d.mts` 中的 `Postprocessor` / `UtilObject`
