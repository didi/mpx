/**
 * preset-rn 专用 postprocess：
 *   将 unocss 颜色 / shadow / ring 等 utility 中的 `var(--un-*)` cssVar 表达式
 *   inline 为字面量，并丢弃所有 `--un-*` 声明行。
 *
 * 处理两类 cssVar：
 *   1) `var(--un-{name}-opacity)`：颜色 utility 内成对出现，使用同一 utility
 *      内 `--un-{name}-opacity: <n>` 的字面值替换；缺省时回退为 '1'。
 *   2) `var(--un-shadow-color, fallback)` / `var(--un-shadow-inset)` 等：
 *      优先用同 utility 内自描述字面值，否则用 var() 自带 fallback，
 *      都没有时整段替换为空字符串。
 *
 * 这样一来，preset-mini / preset-wind3 中**所有**通过共享 `colorResolver`
 * 生成 cssVar 的 utility（bg / text / border / decoration / fill / stroke /
 * text-stroke / ring / shadow 等）一次性 flat 化，无需逐条 override。
 *
 * 同时，原本「全是 --un-* 行」的 utility（如 `bg-opacity-50`）在剥离后
 * entries 为空，自然不会被推到 `varUtilities` layer，也不再产出 RN 不可识别的
 * cssVar key，运行时 `useTransformStyle.varVisitor` 在颜色路径上零命中。
 *
 * ⚠️ 白名单：
 *   transform / filter 系列 cssVar **必须保留**——这些是「跨 utility 累加」
 *   的关键机制（例如 `<view class="transform translate-x-2 rotate-45">`，
 *   依赖 mpx-runtime 的 transformVar visitor 在运行时把 `--un-translate-x`
 *   等具体值合入 `transform` utility 的模板字符串）。一旦 inline，
 *   `transform` utility 就被锁死成默认值，单独的 `translate-*` / `rotate-*`
 *   等 utility 也变成空，整个 transform 体系失效。
 */

// 形如 var(--un-bg-opacity)
const OPACITY_VAR_RE = /var\(\s*--un-([\w-]+?)-opacity\s*\)/g

// 形如 var(--un-shadow-color, rgb(0 0 0 / 0.1)) 或 var(--un-shadow-inset)
// 支持 fallback 中嵌套一层括号（rgb()/rgba() 等）
const ANY_UN_VAR_RE = /var\(\s*(--un-[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g

// 必须保留 cssVar 的 var name 前缀（不会被 inline、不会被丢弃）
// 这些 var 的共同特点是「跨多个 utility 累加」：根 utility（如 `transform` /
// `filter` / `backdrop` / `bg-gradient-to-r`）输出一个引用了若干 var 的模板
// 字符串，配套的子 utility（如 `translate-x-2` / `blur-5` / `from-red-500`）
// 各自只修改其中一个 var。这套机制必须由 mpx-runtime 的 `transformVar` visitor
// 在 RN 上下文中合并，不能在编译期 inline，否则会破坏组合用法。
//
// ⚠️ 例外：`--un-drop-shadow-color` 是**单个 utility 内自给自足**的颜色 var，
// 应当被 inline；前缀匹配 `--un-drop-shadow` 会误中它，因此不要直接前缀匹配。
// 这里通过精确白名单 + 否定列表组合实现。
const PRESERVED_VAR_PREFIXES = [
  // transform 体系
  '--un-translate-',
  '--un-rotate',
  '--un-scale-',
  '--un-skew-',
  '--un-transform',
  // filter 体系
  '--un-blur',
  '--un-brightness',
  '--un-contrast',
  '--un-drop-shadow', // 见下方 NON_PRESERVED_VAR_NAMES 排除 --un-drop-shadow-color
  '--un-grayscale',
  '--un-hue-rotate',
  '--un-invert',
  '--un-saturate',
  '--un-sepia',
  // backdrop-filter 体系（与 filter 对称）
  '--un-backdrop-',
  // gradient 体系（bg-gradient-to-r + from-* + via-* + to-*）
  '--un-gradient',
  // ring 体系（preset-rn 当前整体 block，预防解 block 后翻车）
  '--un-ring-color',
  '--un-ring-inset',
  '--un-ring-offset-color',
  '--un-ring-offset-shadow',
  '--un-ring-offset-width',
  '--un-ring-shadow',
  '--un-ring-width'
  // 注：--un-ring-opacity / --un-ring-offset-opacity 是颜色透明度 var，
  // 单 utility 内自给自足，保持 inline 行为。
]

// 落在 PRESERVED_VAR_PREFIXES 命中范围内但应当被 inline 的精确名（防误伤）
const NON_PRESERVED_VAR_NAMES = new Set([
  '--un-drop-shadow-color',
  '--un-drop-shadow-opacity'
])

function isPreservedVar (name) {
  if (NON_PRESERVED_VAR_NAMES.has(name)) return false
  for (let i = 0; i < PRESERVED_VAR_PREFIXES.length; i++) {
    if (name.startsWith(PRESERVED_VAR_PREFIXES[i])) return true
  }
  return false
}

// unocss 的 `important` variant（`!` 前缀 / `important:` 前缀）会把 ' !important'
// 追加到当前 utility 内**每一条** entry 的 value 字符串上，包括 `--un-*-opacity: 1`
// 这种内部声明。我们把这些 var 的字面值收集进 map 时，必须先把 `!important` 后缀
// 剥掉，否则会跟着被代入 `rgba(... var(--un-border-opacity))` 替换槽，产出
// `rgba(239, 68, 68, 1 !important)` 这种格式错乱的结果。
//
// 真正承载样式的 entry（如 `border-color: rgba(...) !important`）的 `!important`
// 后缀我们保持原样：mpx PostCSS pipeline 会基于 `decl.important` 读取并搬到
// `_inlineLayer.important` 里，再由 `transformStyleObj` 通过 `endsWith('!important')`
// 切掉，最终 RN runtime 拿到的就是干净字面值。
function stripImportantSuffix (str) {
  // 兼容 ' !important' / '!important' / 末尾多空格
  return str.replace(/\s*!important\s*$/, '')
}

function buildOpacityMap (entries) {
  const map = Object.create(null)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const k = entry[0]
    const v = entry[1]
    if (typeof k !== 'string') continue
    const m = /^--un-([\w-]+?)-opacity$/.exec(k)
    if (m && (typeof v === 'string' || typeof v === 'number')) {
      map[m[1]] = stripImportantSuffix(String(v))
    }
  }
  return map
}

function buildLocalVarMap (entries) {
  const map = Object.create(null)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const k = entry[0]
    const v = entry[1]
    if (typeof k === 'string' && k.startsWith('--un-') &&
        !isPreservedVar(k) &&
        (typeof v === 'string' || typeof v === 'number')) {
      map[k] = stripImportantSuffix(String(v))
    }
  }
  return map
}

function inlineValue (value, opacityMap, localVarMap) {
  if (typeof value !== 'string') return value
  if (value.indexOf('var(--un-') === -1) return value

  // 1) 优先替换 --un-{name}-opacity（最高频）；opacity var 不在保留白名单内
  let next = value.replace(OPACITY_VAR_RE, (_, name) => {
    return opacityMap[name] != null ? opacityMap[name] : '1'
  })

  // 2) 替换其他 --un-* (shadow / ring / 自定义)；命中保留白名单的整段保留原样
  next = next.replace(ANY_UN_VAR_RE, (match, name, fallback) => {
    if (isPreservedVar(name)) return match
    if (localVarMap[name] != null) return localVarMap[name]
    if (fallback != null) return fallback.trim()
    return ''
  })

  // 3) 清理多余空白（替换 fallback 后可能出现 "  " 或前导空格）
  next = next.replace(/\s{2,}/g, ' ').trim()

  return next
}

export function flattenColorVars (util) {
  const entries = util.entries
  if (!entries || entries.length === 0) return

  // 快速通道：utility 内既无可处理的 --un-* 声明也无 var(--un-*) 引用
  let touched = false
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const k = entry[0]
    const v = entry[1]
    if (typeof k === 'string' && k.startsWith('--un-') && !isPreservedVar(k)) {
      touched = true
      break
    }
    if (typeof v === 'string' && v.indexOf('var(--un-') !== -1) {
      // value 里只要含 var(--un-* 就需要进入处理（保留白名单的 var 在 inlineValue 内会被跳过）
      touched = true
      break
    }
  }
  if (!touched) return

  const opacityMap = buildOpacityMap(entries)
  const localVarMap = buildLocalVarMap(entries)

  const next = []
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const k = entry[0]
    const v = entry[1]
    // 保留 transform / filter 等白名单 cssVar 声明行
    if (typeof k === 'string' && k.startsWith('--un-') && !isPreservedVar(k)) continue
    next.push([k, inlineValue(v, opacityMap, localVarMap)])
  }

  util.entries = next
}
