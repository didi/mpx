# Skyline 适配检查矩阵

本矩阵用于把 Skyline 适配从经验扫描收敛为固定门禁。执行适配、排障、Code Review 时，按任务 scope 跑完整矩阵；不要只扫描本次怀疑的问题类型。

## 使用方式

- **指定单个 `.mpx` 组件**：以该文件为 scope 跑完整矩阵。
- **指定页面**：以页面文件 + 模板实际引用的组件树为 scope 跑完整矩阵；若只处理部分子树，必须说明未覆盖范围。
- **最终输出**：对所有 `error` 命中给出处理结果：已修 / 保留原因 / 非目标平台分支 / 待确认。
- **例外规则**：`.ios.mpx`、RN-only、非 wx 分支可跳过，但要在结果中说明。

## 与 SKILL.md 的边界

- 本文件维护可扫描、可枚举的 Skyline 兼容规则。
- `SKILL.md` 只维护流程门禁和人工验收项。
- 新增可扫描规则时只改本文件，不要同步复制到 `SKILL.md` checklist。

## 聚合扫描

第一阶段可用以下命令兜底扫描；结构化场景（多行 `scroll-view` 等）仍需人工或脚本复核。

```bash
rg -n "@media screen|font-weight\\s*:?\\s*(500|600)|text-overflow|truncate|overflow-x|overflow-y|overflow\\s+scroll|float\\s|text-indent|overflow-wrap|justify-items|box-shadow:.*?,|background-image|mask-image|background-size|background-repeat|<scroll-view|movable-area|movable-view|web-view|editor|progress|navigation-bar|\\.animate\\(|\\.applyAnimation\\(|wx\\.createAnimation|wx-if|wx-for" <scope> -g '*.mpx'
```

## 规则矩阵

| id | level | scope | pattern | 判定 | 标准修复 | 允许例外 |
| --- | --- | --- | --- | --- | --- | --- |
| `STYLE_MEDIA_SCREEN` | error | style | `@media screen` | Skyline 下静默失效，且可能把内部规则当裸样式应用 | WebView 保留 `@media`；Skyline 用 `isSkyline && isSmall` 动态类兜底，必要时加 normal 类反向兜底 | 非 wx / RN-only / `.ios.mpx` |
| `STYLE_FONT_WEIGHT` | warn | style/template/script | `font-weight\\s*:?\\s*(500\|600)` | 部分机型数字字重不稳定 | 改 `bold` / `700`；WebView 对齐 | iOS 专用分支可保留 |
| `STYLE_TEXT_OVERFLOW` | warn | template/style | `text-overflow\\s+ellipsis\|truncate` | Skyline 省略需由组件属性承载，`view` / `text` / `rich-text` / `special-text` 均可直接补属性 | 承载文本的节点补 `max-lines` + `overflow="ellipsis"` | 容器只做裁剪时说明 |
| `COMP_SCROLL_TYPE` | error | template | `<scroll-view` | Skyline 下 `scroll-view` 必须显式声明 `type` | 补 `type="list"` / `nested` / `custom` | 无 |
| `STYLE_OVERFLOW_AXIS` | error | style | `overflow-x\|overflow-y\|overflow\\s+scroll` | Skyline 不支持单轴 overflow 与 scroll overflow | 改 `scroll-view` 或统一 `overflow hidden` | 非 wx 分支 |
| `STYLE_UNSUPPORTED_PROP` | warn | style | `float\\s\|contain\|resize\|writing-mode\|text-indent\|overflow-wrap\|justify-items` | Skyline 不支持或静默失效 | 替换实现、删除或给出降级说明 | 确认无视觉依赖 |
| `STYLE_BACKGROUND_LIMIT` | warn | style | `background-image\|mask-image\|background-size\|background-repeat` | 背景/遮罩多值能力有限 | 限制到支持范围；多层背景拆节点 | 单值且已确认支持 |
| `STYLE_BOX_SHADOW_MULTI` | warn | style | `box-shadow:.*?,` | Skyline 不支持多个 shadow 叠加 | 合并为单 shadow 或拆节点 | 无 |
| `COMP_UNSUPPORTED` | error | template | `movable-area\|movable-view\|web-view\|editor\|progress\|navigation-bar` | Skyline 不支持组件 | 替代组件、独立 WebView 页面或 renderer 降级 | 明确 WebView-only 页面 |
| `GLASS_WX_DASH` | warn | template | `wx-if\|wx-for` | glass-easel 推荐/要求冒号写法 | 改 `wx:if` / `wx:for` | 旧编译链确认兼容时可延后 |
| `ANIMATION_WEBVIEW_API` | error | script/template | `\\.animate\\(\|\\.applyAnimation\\(\|wx\\.createAnimation` | Skyline 不支持或静默不生效 | CSS transition/animation 或 Worklet；Skyline 专属逻辑运行时隔离 | WebView-only 分支 |

## 复核要求

1. `rg` 命中只是候选项，必须结合 SFC 区块和平台条件判断。
2. 多行 `<scroll-view>` 不能只靠单行 pattern 判定，需读取完整标签。
3. 保留 `@media screen` 时必须说明 WebView 路径仍需要它；Skyline 路径必须有动态类兜底。
4. 最终结果中 `error` 不允许无说明残留。
