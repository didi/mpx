# Skyline 任务入口

仅当微信小程序实际使用 Skyline，或任务涉及 WebView / Skyline 双渲染模式适配时使用本页。Skyline 是 `wx` 目标下的渲染模式，不是独立的 `mode` 或源码方言；微信 WebView 也不是 `web` 输出目标。Mpx 核心能力与基准用法由 base 维护，本目录补充 Skyline 的支持情况、限制与专属扩展。

## 按需索引

| 涉及任务 | 读取内容 |
| --- | --- |
| 基础组件、属性、模板结构、glass-easel、SVG | [模板与基础组件差异](./skyline-template-reference.md)，通用绑定、事件与 Slot 见 [模板基准](../base/template-reference.md)。 |
| 明确查询某个选择器、单位、样式属性或默认值 | [样式差异](./skyline-style-reference.md)，按属性核对支持范围、条件与行为。 |
| 布局改造、margin、层级、图文混排、sticky、文本省略、Flex、媒体查询 | 优先 [样式最佳实践](./skyline-style-practice.md) 命中的场景，能力存疑再查样式差异。 |
| renderer 判断、页面滚动、SelectorQuery、ScrollViewContext、类型报错、列表性能 | [运行时最佳实践](./skyline-runtime-practice.md)，通用响应式、props 与 setup 见 [脚本基准](../base/script-reference.md)。 |
| 应用/页面 JSON、renderer、rendererOptions | [JSON 配置参考](./skyline-json-reference.md)，区块语法见 [JSON 基准](../base/json-reference.md)。 |
| 编译目标、Worklet Babel、开发者工具 | [配置参考](./skyline-config-reference.md)。 |
| Worklet 动画、手势、自定义路由、共享元素 | 本页 [高级能力](#高级能力)，只读取实际涉及的官方资料。 |
| 适配完成前检查、排障、Code Review | [适配检查矩阵](./skyline-audit-matrix.md)，在指定 scope 内执行完整矩阵；能力查询与方案讨论无需执行。 |

各参考是差异说明，不是完整组件或属性手册。未收录的能力不得反推为支持；用目录或 `rg` 定位相关小节，不预读全部参考。能力事实与实现方案以对应参考为准，扫描与分级以检查矩阵为准，本页维护执行顺序与验收要求。

## 双渲染模式与实现选型

- **保留 WebView 功能**：优先采用两种渲染模式均可用的通用方案。Skyline 专属逻辑通过 `renderer === 'skyline'` 或项目封装运行时隔离；只有细则明确要求保留或确认 WebView 下无副作用时才省略分支。判断方式见 [运行时 renderer](./skyline-runtime-practice.md#判断当前渲染模式)。
- **区分输出目标与渲染模式**：条件文件、区块 `mode` 与 `@wx` 只能筛选微信输出，不能区分 WebView / Skyline。涉及 RN/Web 时按 [条件编译基准](../base/conditional-compile.md) 隔离目标端依赖，再在微信内部判断 renderer。
- **静默失效仍需核对副作用**：既有 WebView 方案在 Skyline 下无副作用时可以保留并新增兼容实现；无法确认时仍按 renderer 隔离。低版本通过 Skyline 开量开关降级为 WebView，不单独实现 Skyline 低版本兼容。
- **按参考中的适用条件改造**：有明确方案时先读取相关小节并采用；需要偏离时先核对语义和上下文。资料歧义、没有等效方案或会改变业务视觉/交互时，说明不确定点及取舍，必要时确认后再改，不推断未记录的支持能力。

## 开发与评审约束

方案设计、开发、适配、排障与评审开始前先读取本节及上述双模式选型要求，完成后按受影响维度复查；复查不替代适用任务在指定范围内的完整检查矩阵。

### 配置与布局

- **配置基线**：在 `rendererOptions.skyline` 开启 `defaultDisplayBlock` / `defaultContentBox`，对齐 block / content-box；需要静态定位时仍显式声明 `position: static`。页面配置 `renderer: 'skyline'`、`componentFramework: 'glass-easel'`、`navigationStyle: 'custom'`、`disableScroll: true` 并实现自定义导航。全局 `lazyCodeLoading`、样式隔离等按 [JSON 配置参考](./skyline-json-reference.md) 核对；组件任务不添加页面专属配置。
- **margin 与 BFC**：Skyline 没有 BFC 与 margin 合并，`overflow: hidden` 只用于裁剪。先确认 WebView 是否发生折叠，再将同一有效间距归到单侧或用 padding 表达内部留白；不把所有垂直 margin 都合并。负 margin 依赖父节点占位链时按 [布局实践](./skyline-style-practice.md#布局适配) 处理，不见负值就统一改 Flex。
- **页面滚动**：用 `scroll-view` 承载滚动，将 `onPullDownRefresh` / `onReachBottom` / `onPageScroll` 业务逻辑分别迁移到 `bindrefresherrefresh` / `bindscrolltolower` / `bindscroll`；WebView 采用同一事件链路。滚动事件字段与容器设置见 [滚动实践](./skyline-runtime-practice.md#页面滚动替代方案)。
- **横向滚动**：开启 `enable-flex` 并设置横向布局；直接内容子节点预期铺满视口时声明 `width: 100%`，预期宽于视口时声明明确的 `rpx` / `px` 宽度。不要依赖内部 Flex、min-width 或 max-width 反向撑开容器，见 [横向宽度实践](./skyline-style-practice.md#横向-scroll-view-内-flex-子节点无法自动撑满)。
- **层级**：非 fixed 节点按共同父级下的兄弟分支比较；fixed 节点全局提升并按自身 z-index 排序，整体高于非 fixed。transform / opacity 不抬升层级，scroll-view 直接子节点的 z-index 不生效；调整为可比较的兄弟结构，避免负 z-index，见 [层叠实践](./skyline-style-practice.md#z-index-与层叠适配)。
- **吸顶**：Skyline 用 `scroll-view type="custom"` 内的 `sticky-section` / `sticky-header`，WebView 保留 CSS sticky。header 是 section 的第一个子节点且显式设置背景色，见 [吸顶实践](./skyline-style-practice.md#sticky-吸顶替代方案)。

### 模板与脚本

- **Mpx 绑定沿用基准**：动态类/样式用 `wx:class` / `wx:style`，普通 class/style 放静态内容；Mustache 表达式调用与事件传参按[模板基准](../base/template-reference.md)核对。setup 中供模板使用的状态、计算值与方法通过 `defineExpose` 暴露，见 [script setup](../base/script-reference.md#script-setup)，不重复导出内部辅助数据；实例字段命名遵循[保留字段约束](../base/script-reference.md#页面与组件实例属性与方法)。
- **scroll-view 显式选型**：每个容器声明 `type`；list 的列表项须为直接子节点，单一 wrapper 会使按需渲染退化。嵌套滚动外层用 nested，内层声明 list/custom 与 `associative-container="nested-scroll-view"`。自定义刷新节点设 `slot="refresher"`，内容撑高按需开启 `enableScrollViewAutoSize`，见 [结构与行为差异](./skyline-template-reference.md)。
- **组件结构与能力**：navigator 只嵌套 text 或纯文本，复杂卡片用外层点击事件；text 只嵌套 text，同段图文用 [span 内联混排](./skyline-style-practice.md#内联混排)。不支持组件按参考选择替代或 WebView 页面降级；WebView-only 属性/取值不能作为 Skyline 实现，保留前先核对副作用。
- **glass-easel 模板**：绑定外与属性定界冲突的引号用 XML 实体，绑定内去掉为外层属性添加的多余转义；模板片段用 import + template，见 [模板结构适配](./skyline-template-reference.md#模板结构适配)。
- **节点查询与类型**：id 不以数字开头，组件实例内优先 `this.createSelectorQuery()`；通过 `NodesRef.node()` 获取 ScrollViewContext 时，对应 scroll-view 开启 enhanced。wx:for 的数据在初始化与更新阶段均为 Array/Object，properties 声明与实际值匹配，节点查询、类型报错和修复见 [运行时常见问题](./skyline-runtime-practice.md#运行时常见问题)。

### 样式与动画

- **选择器与值**：不使用通配/属性选择器，伪元素限 before/after，其他伪类按版本核对。长度优先 rpx/px，百分比按属性核对支持范围与参照尺寸；calc 采用非嵌套长度计算，不计算角度。详见 [样式差异](./skyline-style-reference.md)，待核验项不当作稳定支持。
- **滚动与特殊布局**：overflow auto/scroll、overflow-x/y 改用 scroll-view；grid/flow-root 改 Flex / grid-view 或显式布局；sticky 用上面的双模式方案，不直接删除原功能。
- **文本省略与字体**：保留 WebView 的 text-overflow / line-clamp 样式，同时给文本组件加 max-lines / overflow。新增或替换 text 时插值紧贴标签，避免字面空白影响截断。500/600 字重及加粗 PostScript name 先核对字体资源，再确认视觉取舍；多值 text-decoration-line 拆节点，见 [样式实践](./skyline-style-practice.md#样式适配)。
- **背景、边框与滤镜**：非零圆角时四边边框颜色和样式保持一致；多层背景、遮罩或阴影超出范围时拆节点。mask-image 不用渐变，filter / backdrop-filter 不用 url()、drop-shadow() 或多函数组合，具体范围见 [背景边框](./skyline-style-reference.md#背景边框与阴影差异) 与 [遮罩滤镜](./skyline-style-reference.md#遮罩与滤镜差异)。
- **媒体查询**：保留 WebView 的 @media screen，将内部每个选择器限定到仅非 Skyline 节点具有的专用类；Skyline 用运行时窗口宽度与动态类实现相同断点。它会忽略媒体条件而可能保留内部规则，不能全局覆盖，见 [媒体查询实践](./skyline-style-practice.md#media-screen-兼容方案)。
- **动画选型**：简单状态切换优先 CSS transition，循环或多步骤用真实节点的 animation / keyframes。伪元素 animation 不生效，fill-mode 用 forwards/both，迁移时核对 keyframeStyleIsolation。wx.createAnimation 及 animate/applyAnimation/clearAnimation/setInitialRenderingCache 需替代，静态属性支持不代表可动画，见 [动画范围](./skyline-style-reference.md#动画与过渡差异)。手势跟随、滚动联动等需要 UI 线程实时反馈时再使用 Worklet。

## 高级能力

本目录只负责方案路由与 Mpx 接入边界。涉及以下能力时，先读取对应官方 Skill 或参考，核对 API、事件参数、版本、线程与完整实现，再补 Mpx 接入；不要仅凭本地摘要补全实现细节。

| 能力 | 官方来源 | Mpx 接入边界 |
| --- | --- | --- |
| Worklet 动画 | [skyline-worklet](https://github.com/wechat-miniprogram/skyline-skills/tree/master/skills/skyline-worklet) | 判断是否需要 UI 线程驱动；补 [Babel 配置](./skyline-config-reference.md#worklet-babel-插件)、renderer 隔离与 WebView 降级。 |
| 手势系统 | [gesture-system](https://github.com/wechat-miniprogram/skyline-skills/blob/master/skills/skyline-components/references/gesture/gesture-system.md) / [gesture-negotiation](https://github.com/wechat-miniprogram/skyline-skills/blob/master/skills/skyline-components/references/gesture/gesture-negotiation.md) | 核对手势需求、Mpx 模板/脚本接入与双模式隔离。 |
| 自定义路由 | [skyline-route](https://github.com/wechat-miniprogram/skyline-skills/tree/master/skills/skyline-route) | 核对转场需求、页面配置、生命周期与 WebView 降级。 |
| 共享元素 | [share-element](https://github.com/wechat-miniprogram/skyline-skills/blob/master/skills/skyline-components/references/special/share-element.md) | 核对页面结构、双模式隔离与降级。 |

官方 Skill 未明确支持的能力不得依据本地经验推断；资料冲突时，Skyline 能力事实以官方 Skill 为准，Mpx 接入方式以本目录为准。

## 验证

适配完成前、排障或评审时，读取并在已明确的 scope 内执行 [完整检查矩阵](./skyline-audit-matrix.md)，不能只扫描当前怀疑的问题。单组件以该文件为范围；页面包含页面 JSON、app.json 与约定组件树。候选命中须结合区块、节点关系和 renderer 分支判定，逐项处理 error 或说明例外，并报告 warn 残留原因及未覆盖子树。

按 [编译校验](../base/compile-validation.md) 显式 `--target=wx`；多端任务追加实际输出目标。执行项目 ESLint 与相关现有测试，再在微信环境分别验证 WebView / Skyline：渲染分支、配置与 Worklet 编译、滚动/刷新/触底事件、横向直接子节点宽度、层级与吸顶、文本及媒体查询。涉及原生组件时补真机验证；编译成功不能证明渲染模式与交互正常，缺少容器或配置时说明未验证范围，不宣称检查全部通过。
