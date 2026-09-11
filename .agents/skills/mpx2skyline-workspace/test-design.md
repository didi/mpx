# Skyline 适配测试集设计 v3

当前有效测试定义为 [iteration-3/evals.json](iteration-3/evals.json)，**5个case、31条正向适配断言，已完成Skill/no_skill各一轮**。旧版结果不参与新集计分。

## 设计原则

每条断言回答“Skyline需要实现什么”，并附对应规则与验证动作。其他平台的合法条件分支按各自规则实现。通用交付、Mpx语法和业务逻辑纳入独立验证，不占专项分数；真实编译错误影响目标实现时仍会导致相应适配断言失败。

普通文本截断在case 0计分；case 3验证span内图文共同截断，覆盖不同承载结构。页面滚动类型与事件、运行时查询、嵌套滚动分别使用各自消费场景，重复属性不单独再加分。

## 场景总览

| Case | 场景 | 断言数 | 主要来源 |
| --- | --- | ---: | --- |
| 0 | 样式与布局 | 12 | 原0、5，收拢原6–8重复样式点 |
| 1 | 页面滚动与配置 | 7 | 原1、8 |
| 2 | 模板与运行时 | 5 | 原2及原5导航结构 |
| 3 | 图文混排与动画 | 3 | 原3及原6重复动画点 |
| 4 | 嵌套滚动、吸顶与层级 | 4 | 原4及原7横向列表 |

## Case 0：样式与布局

输入：[style-card.mpx](iteration-3/eval-0-style-layout/input/style-card.mpx) · [task.md](iteration-3/eval-0-style-layout/input/task.md)

| 断言 | 正向适配要求 | 对应规则 | 验证方法 |
| --- | --- | --- | --- |
| `s0_00` | Skyline 标题的实际 text 承载节点设置 max-lines=1、overflow=ellipsis，并与 WebView 单行省略样式共同实现长标题截断。 | [文本溢出省略适配](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.text-ellipsis` | 检查标题节点属性和有界宽度；分别审查两种 renderer 的单行省略路径。 |
| `s0_01` | Skyline 两列标签使用显式横向 Flex 和等分子项布局，实现两列等宽。 | [布局、盒模型与层叠差异](../mpx2skyline/references/skyline-style-reference.md)；`skyline.equal-columns` | 检查父子布局关系及 flex basis/width，计算两列可用宽度。 |
| `s0_02` | Skyline 活动状态通过受支持的 class 选择器映射到红色活动文案。 | [选择器支持](../mpx2skyline/references/skyline-style-reference.md)；`skyline.class-selector` | 追踪实际活动节点 class 与颜色声明的匹配关系。 |
| `s0_03` | Skyline 通过 renderer 与屏宽状态选择容器 padding，宽度≤320px 为12rpx、>320px 为24rpx；Skyline 默认覆盖位于媒体查询之后，WebView 继续使用原媒体查询。 | [@media screen 替换方案](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.responsive-padding` | 分别代入 renderer 两值和320/321px，按选择器优先级与源码顺序计算最终 padding。 |
| `s0_04` | Skyline 内容与父容器上外沿的20px距离由父 padding 表达，子节点从父内容区起始位置布局。 | [不要依赖 BFC 和 margin 合并](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.parent-spacing` | 检查 .outer/.child 的盒模型，计算父外沿到首个子盒的20px距离。 |
| `s0_05` | Skyline 相邻块的垂直间距集中由一侧的16px margin承担，最终相邻盒间距为16px。 | [不要依赖 BFC 和 margin 合并](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.sibling-spacing` | 计算第一块下边界到第二块上边界的间距，核对两侧 margin 的实际贡献。 |
| `s0_06` | Skyline 将双阴影分配到同尺寸的嵌套节点或等效分层结构，呈现原有两层阴影的参数和前后关系。 | [背景、边框与遮罩差异](../mpx2skyline/references/skyline-style-reference.md)；`skyline.layered-shadows` | 追踪0 2px 4px #000与0 4px 8px #333分别作用的节点、尺寸和绘制层次。 |
| `s0_07` | Skyline 将复合滤镜分层为内层blur(2px)和外层brightness(.8)，组合呈现原有两种效果。 | [滤镜差异](../mpx2skyline/references/skyline-style-reference.md)；`skyline.layered-filters` | 检查滤镜节点嵌套与作用顺序，逐层核对单函数参数。 |
| `s0_08` | Skyline 字体处理识别 City-Semibold 的同名独立字体族，明确 Trip-Medium 的宿主字体与 PostScript 映射核验点，并记录500/600字重的机型验证要求。 | [字体 PostScript name 兼容](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.font-resolution` | 结合 @font-face 与报告核对两个字体来源；宿主二进制缺失时，记录待核验信息及保持现有视觉的集成方案。 |
| `s0_09` | Skyline 单阴影节点以单个 box-shadow 呈现原有 0 2px 4px rgba(0,0,0,.2) 效果，颜色函数作为完整颜色值解析。 | [背景、边框与遮罩差异](../mpx2skyline/references/skyline-style-reference.md)；`skyline.single-shadow` | 核对 .single-shadow 的实际阴影层数为1，偏移、模糊半径和颜色透明度均与输入一致。 |
| `s0_10` | Skyline 单滤镜节点采用受支持的 blur(2px)，呈现原有独立模糊效果。 | [滤镜差异](../mpx2skyline/references/skyline-style-reference.md)；`skyline.single-filter` | 追踪 .single-filter 的实际滤镜节点和参数，确认独立内容仍具有2px模糊效果。 |
| `s0_11` | Skyline 在宿主 defaultContentBox=true 条件下，child 保持100px内容宽度及左右各10px padding，实际外宽为120px。 | [非标准默认值](../mpx2skyline/references/skyline-style-reference.md)；`skyline.content-box-width` | 结合宿主默认盒模型和实际节点 box-sizing、width、padding、border 计算内容宽与外宽，分别核对100px和120px。 |

## Case 1：页面滚动与配置

输入：[app.json](iteration-3/eval-1-page-scroll-config/input/app.json) · [orders.mpx](iteration-3/eval-1-page-scroll-config/input/orders.mpx) · [service.js](iteration-3/eval-1-page-scroll-config/input/service.js) · [task.md](iteration-3/eval-1-page-scroll-config/input/task.md)

| 断言 | 正向适配要求 | 对应规则 | 验证方法 |
| --- | --- | --- | --- |
| `s1_00` | Skyline 页面主体使用具有明确可滚动高度的 scroll-view，显式选择type=list，订单项作为列表的直接子节点。 | [页面滚动替代方案](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.list-scroll` | 检查列表直接子节点与高度约束链；使用超出容器高度的订单数据核对滚动结构。 |
| `s1_01` | Skyline 通过 bindrefresherrefresh 启动刷新，refresher-triggered 关联刷新状态，并在请求成功和失败后结束容器刷新态。 | [页面滚动替代方案](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.container-refresh` | 触发容器刷新事件，分别模拟请求resolve/reject，检查触发态最终为false。 |
| `s1_02` | Skyline 通过 scroll-view 的 bindscrolltolower 连接原分页加载方法，容器触底后显示追加的订单。 | [页面滚动替代方案](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.container-bottom` | 从实际模板事件绑定调用分页方法，核对下一页结果进入同一滚动列表。 |
| `s1_03` | Skyline 通过 scroll-view 的 bindscroll 读取 event.detail.scrollTop 并更新滚动位置展示。 | [页面滚动替代方案](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.container-scroll` | 向实际滚动处理器传入detail.scrollTop，核对展示状态对应更新。 |
| `s1_04` | Skyline 页面配置 renderer=skyline、componentFramework=glass-easel、navigationStyle=custom、disableScroll=true，并在模板实现订单自定义导航。 | [适配参考](../mpx2skyline/references/skyline-configuration.md)；`skyline.page-renderer-navigation` | 解析页面JSON并检查真实导航节点和主体布局关系。 |
| `s1_05` | Skyline 接入所需的 lazyCodeLoading=requiredComponents 配置于 app.json 顶层。 | [app.json 顶层配置](../mpx2skyline/references/skyline-configuration.md)；`skyline.lazy-components` | 解析 app.json 并检查顶层属性值。 |
| `s1_06` | Skyline 在 app.rendererOptions.skyline 中配置 defaultDisplayBlock=true、defaultContentBox=true、tagNameStyleIsolation=legacy、enableScrollViewAutoSize=true、keyframeStyleIsolation=legacy。 | [rendererOptions.skyline 配置项](../mpx2skyline/references/skyline-configuration.md)；`skyline.renderer-baseline` | 逐项解析五个字段的层级、类型和值。 |

## Case 2：模板与运行时

输入：[row.wxml](iteration-3/eval-2-template-runtime/input/row.wxml) · [task.md](iteration-3/eval-2-template-runtime/input/task.md) · [user-list.mpx](iteration-3/eval-2-template-runtime/input/user-list.mpx)

| 断言 | 正向适配要求 | 对应规则 | 验证方法 |
| --- | --- | --- | --- |
| `s2_00` | Skyline/glass-easel 的 wx:for 在初始化、数据返回前、null返回及正常数组更新阶段均接收 Array/Object 类型的数据。 | [[必须] 确保 wx:for 数据始终为 Array 或 Object](../mpx2skyline/references/skyline-runtime-practice.md)；`skyline.loop-data` | 检查初始渲染数据及computed所有消费路径，分别模拟undefined/null/空数组/有效数组。 |
| `s2_01` | Skyline/glass-easel 的用户容器使用合法的非数字开头id，组件内通过 this.createSelectorQuery 定位同一容器。 | [[推荐] 用 this.createSelectorQuery 替代 wx.createSelectorQuery](../mpx2skyline/references/skyline-runtime-practice.md)；`skyline.scoped-selector` | 关联模板id、组件查询作用域和select字符串，核对查询目标一致。 |
| `s2_02` | Skyline 的实际用户滚动目标开启 enhanced，节点查询返回的 ScrollViewContext 用于执行回到顶部操作。 | [[必须] ScrollViewContext：开启 enhanced 属性](../mpx2skyline/references/skyline-runtime-practice.md)；`skyline.scroll-context` | 从查询目标追踪其enhanced属性及node().exec后的scrollTo({top:0})调用。 |
| `s2_03` | Skyline/glass-easel 循环中的外部片段采用 import 加具名 template 调用，并显式传递当前 item/index。 | [[必须] wx:for 内嵌 &lt;include&gt; 时改为 &lt;template&gt;](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.loop-template` | 检查导入路径、模板名称和循环数据参数，代入两行不同数据确认作用域。 |
| `s2_04` | Skyline 的简单 navigator 使用 text 或纯文本子节点；卡片导航采用符合该子节点结构的内容，或由外层点击事件实现同一详情跳转。 | [navigator 嵌套限制](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.navigator-children` | 检查两个导航入口的实际子节点和/pages/detail目标；复杂外层事件方案核对绑定与跳转调用。 |

## Case 3：图文混排与动画

输入：[logo.svg](iteration-3/eval-3-inline-animation/input/logo.svg) · [promo-card.mpx](iteration-3/eval-3-inline-animation/input/promo-card.mpx) · [task.md](iteration-3/eval-3-inline-animation/input/task.md)

| 断言 | 正向适配要求 | 对应规则 | 验证方法 |
| --- | --- | --- | --- |
| `s3_00` | Skyline 图标与标题置于同一个可收缩的 span 内联容器，容器设置 max-lines=1、overflow=ellipsis，图片采用 inline-block，使同段图文在有限宽度内共同单行截断；WebView 对应分支保留同段图文单行截断。 | [图文混排](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.inline-flow` | 检查微信输出实际 span 容器的省略属性、图片 display、renderer 分支及父级宽度和收缩约束；使用超长标题核对图标与文字共同截断的实现路径。普通 text 的省略属性不能替代此混排容器检查。 |
| `s3_01` | Skyline 闪烁圆点由真实节点承载 CSS animation，采用支持的fill-mode（如both或forwards），实现原有1秒循环和透明度变化。 | [动画与过渡差异](../mpx2skyline/references/skyline-style-reference.md)；`skyline.node-animation` | 追踪真实圆点节点的关键帧、fill-mode与周期，确认尺寸颜色及opacity变化对应原效果。 |
| `s3_02` | Skyline 按钮通过状态类驱动 transform/opacity 的150ms CSS transition，完成按下及恢复的视觉过渡；其他渲染目标可使用各自适配实现。 | [animation API 不支持 → 使用 CSS transition](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.state-transition` | 追踪按下/松开/取消绑定到Skyline状态及CSS，核对scale(.96)、opacity(.7)与恢复值。 |

## Case 4：嵌套滚动、吸顶与层级

输入：[category-panel.mpx](iteration-3/eval-4-nested-sticky-layer/input/category-panel.mpx) · [task.md](iteration-3/eval-4-nested-sticky-layer/input/task.md)

| 断言 | 正向适配要求 | 对应规则 | 验证方法 |
| --- | --- | --- | --- |
| `s4_00` | Skyline 外层纵向滚动采用type=nested，内层滚动显式选择list/custom，并通过associative-container=nested-scroll-view建立关联。 | [Skyline 必填属性与结构约束](../mpx2skyline/references/skyline-component-reference.md)；`skyline.nested-association` | 沿模板父子关系检查nested祖先、内层类型和关联值。 |
| `s4_01` | Skyline 横向列表显式选择type=list/custom，开启enable-flex并设置横向Flex布局；采用list时条目为直接子节点，项目保持120px宽度和相应的收缩约束。 | [Skyline 相对 WebView 的高频差异补充](../mpx2skyline/references/skyline-component-reference.md)；`skyline.horizontal-list` | 检查横向容器的type、scroll-x、enable-flex、flex-direction及条目宽度/收缩；采用list时检查直接子节点，多项目排列后形成横向内容。 |
| `s4_02` | Skyline 分支使用sticky-section/sticky-header实现组标题吸顶，header为section首子节点且具有背景；WebView分支采用对应的CSS sticky实现。 | [sticky 吸顶替代方案](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.sticky-structure` | 分别选择renderer分支，检查sticky节点关系、背景与WebView样式；真机吸顶另记验证状态。 |
| `s4_03` | Skyline 弹层与悬浮按钮组织为可比较的fixed层，通过层级值使弹层覆盖按钮。 | [z-index 与层叠适配](../mpx2skyline/references/skyline-layout-practice.md)；`skyline.fixed-layer` | 追踪实际fixed兄弟或等效可比较层级，比较最终覆盖关系及z-index。 |

## 原断言处理

[完整90条迁移映射](iteration-3/assertion-migration.json)逐条记录新位置或退出专项计分的理由。

- 多个case中的标题省略、横向Flex、页面配置和事件迁移集中计分。
- 原“不得删静态伪元素”“不得使用Worklet”“不依赖某API”等改为实际Skyline目标实现的正向检查，或从专项评分移除。
- defineExpose、props默认值、联合类型、普通状态/事件、readonly、key、资源及交付完整性进入validation.json。原用户组件输入中的默认值和联合类型声明已预先规范，避免把通用Mpx修复混入Skyline能力分。
- 原评分组件、分段选择器和任务看板不再独立占case，其特有的Skyline适配点分配到上述场景；普通业务测试不再单列。
- 补齐单rgba阴影、单blur滤镜和实际盒宽三条断言；混排共同截断补入s3_00，横向列表类型及直接子节点补入s4_01。共31条；e0_05静态伪元素检查按要求继续退出计分。

## 后续比较

先以当前独立mpx2skyline在v3重新建立基线，再用同样输入、断言、模型参数和验证方式测试合并Skill。仅替换Skill路径，记录逐条通过转失败、编译与行为问题以及Token/耗时。本次Skill/no_skill单轮结果见[基线报告](iteration-3/benchmark.md)。合并Skill尚未执行。

## 本轮发现

s0_04的输入“内容距outer上外沿20px”与verification“首个子盒距外沿20px”存在观察点歧义。原执行中Skill按内容起点实现，因此该项按既定断言记失败，单独标记用例歧义。case 0 输入已明确为子盒顶部距outer外沿20px、内部内容顶部距外沿30px；当前两组case 0结果仍来自修改前输入，待同时重跑。历史评分保持不变。 s0_04及Skill保持不变。
