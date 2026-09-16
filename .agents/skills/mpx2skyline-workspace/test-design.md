# Skyline 适配测试集设计 v4

当前为4个case、37条Skyline正向断言，尚未执行。旧[iteration-3结果](iteration-3/benchmark.md)保持历史归属。

| Case | 名称 | 断言数 | 来源 |
| --- | --- | ---: | --- |
| 0 | 样式与布局 | 12 | 原case 0 |
| 1 | 页面滚动、吸顶与层级配置 | 11 | 原case 1,4 |
| 2 | 模板运行时、图文混排与动画 | 8 | 原case 2,3 |
| 3 | 从零创建任务看板页面 | 6 | 新建需求场景 |

## 合并与计分边界

合并保留各输入文件和独立业务接口，按一个任务共同交付，不为合并引入额外组件调用。旧31条断言保持ID/正文/verification；来源章节名称与当前Skill对齐。

新增case通过仅提供需求而不提供待修复页面，验证从零实现Skyline适配。业务与通用Mpx语法单独验证，不纳入专项断言。创建入口与迁移入口有意复用核心能力，分开报告31条迁移分数和6条创建分数。

## Case 0：样式与布局

适配组件样式、间距、视觉效果及字体兼容。

[需求](iteration-4/eval-0-style-layout/input/task.md)

| 断言 | Skyline适配要求 | 验证方法 |
| --- | --- | --- |
| `s0_00` | Skyline 标题的实际 text 承载节点设置 max-lines=1、overflow=ellipsis，并与 WebView 单行省略样式共同实现长标题截断。 | 检查标题节点属性和有界宽度；分别审查两种 renderer 的单行省略路径。 |
| `s0_01` | Skyline 两列标签使用显式横向 Flex 和等分子项布局，实现两列等宽。 | 检查父子布局关系及 flex basis/width，计算两列可用宽度。 |
| `s0_02` | Skyline 活动状态通过受支持的 class 选择器映射到红色活动文案。 | 追踪实际活动节点 class 与颜色声明的匹配关系。 |
| `s0_03` | Skyline 通过 renderer 与屏宽状态选择容器 padding，宽度≤320px 为12rpx、>320px 为24rpx；Skyline 默认覆盖位于媒体查询之后，WebView 继续使用原媒体查询。 | 分别代入 renderer 两值和320/321px，按选择器优先级与源码顺序计算最终 padding。 |
| `s0_04` | Skyline 内容与父容器上外沿的20px距离由父 padding 表达，子节点从父内容区起始位置布局。 | 检查 .outer/.child 的盒模型，计算父外沿到首个子盒的20px距离。 |
| `s0_05` | Skyline 相邻块的垂直间距集中由一侧的16px margin承担，最终相邻盒间距为16px。 | 计算第一块下边界到第二块上边界的间距，核对两侧 margin 的实际贡献。 |
| `s0_06` | Skyline 将双阴影分配到同尺寸的嵌套节点或等效分层结构，呈现原有两层阴影的参数和前后关系。 | 追踪0 2px 4px #000与0 4px 8px #333分别作用的节点、尺寸和绘制层次。 |
| `s0_07` | Skyline 将复合滤镜分层为内层blur(2px)和外层brightness(.8)，组合呈现原有两种效果。 | 检查滤镜节点嵌套与作用顺序，逐层核对单函数参数。 |
| `s0_08` | Skyline 字体处理识别 City-Semibold 的同名独立字体族，明确 Trip-Medium 的宿主字体与 PostScript 映射核验点，并记录500/600字重的机型验证要求。 | 结合 @font-face 与报告核对两个字体来源；宿主二进制缺失时，记录待核验信息及保持现有视觉的集成方案。 |
| `s0_09` | Skyline 单阴影节点以单个 box-shadow 呈现原有 0 2px 4px rgba(0,0,0,.2) 效果，颜色函数作为完整颜色值解析。 | 核对 .single-shadow 的实际阴影层数为1，偏移、模糊半径和颜色透明度均与输入一致。 |
| `s0_10` | Skyline 单滤镜节点采用受支持的 blur(2px)，呈现原有独立模糊效果。 | 追踪 .single-filter 的实际滤镜节点和参数，确认独立内容仍具有2px模糊效果。 |
| `s0_11` | Skyline 在宿主 defaultContentBox=true 条件下，child 保持100px内容宽度及左右各10px padding，实际外宽为120px。 | 结合宿主默认盒模型和实际节点 box-sizing、width、padding、border 计算内容宽与外宽，分别核对100px和120px。 |

## Case 1：页面滚动、吸顶与层级配置

一次适配订单页及分类面板，覆盖页面接入、滚动事件、嵌套与横向滚动、吸顶及弹层层级。

[需求](iteration-4/eval-1-page-scroll-sticky-layer-config/input/task.md)

| 断言 | Skyline适配要求 | 验证方法 |
| --- | --- | --- |
| `s1_00` | Skyline 页面主体使用具有明确可滚动高度的 scroll-view，显式选择type=list，订单项作为列表的直接子节点。 | 检查列表直接子节点与高度约束链；使用超出容器高度的订单数据核对滚动结构。 |
| `s1_01` | Skyline 通过 bindrefresherrefresh 启动刷新，refresher-triggered 关联刷新状态，并在请求成功和失败后结束容器刷新态。 | 触发容器刷新事件，分别模拟请求resolve/reject，检查触发态最终为false。 |
| `s1_02` | Skyline 通过 scroll-view 的 bindscrolltolower 连接原分页加载方法，容器触底后显示追加的订单。 | 从实际模板事件绑定调用分页方法，核对下一页结果进入同一滚动列表。 |
| `s1_03` | Skyline 通过 scroll-view 的 bindscroll 读取 event.detail.scrollTop 并更新滚动位置展示。 | 向实际滚动处理器传入detail.scrollTop，核对展示状态对应更新。 |
| `s1_04` | Skyline 页面配置 renderer=skyline、componentFramework=glass-easel、navigationStyle=custom、disableScroll=true，并在模板实现订单自定义导航。 | 解析页面JSON并检查真实导航节点和主体布局关系。 |
| `s1_05` | Skyline 接入所需的 lazyCodeLoading=requiredComponents 配置于 app.json 顶层。 | 解析 app.json 并检查顶层属性值。 |
| `s1_06` | Skyline 在 app.rendererOptions.skyline 中配置 defaultDisplayBlock=true、defaultContentBox=true、tagNameStyleIsolation=legacy、enableScrollViewAutoSize=true、keyframeStyleIsolation=legacy。 | 逐项解析五个字段的层级、类型和值。 |
| `s4_00` | Skyline 外层纵向滚动采用type=nested，内层滚动显式选择list/custom，并通过associative-container=nested-scroll-view建立关联。 | 沿模板父子关系检查nested祖先、内层类型和关联值。 |
| `s4_01` | Skyline 横向列表显式选择type=list/custom，开启enable-flex并设置横向Flex布局；采用list时条目为直接子节点，项目保持120px宽度和相应的收缩约束。 | 检查横向容器的type、scroll-x、enable-flex、flex-direction及条目宽度/收缩；采用list时检查直接子节点，多项目排列后形成横向内容。 |
| `s4_02` | Skyline 分支使用sticky-section/sticky-header实现组标题吸顶，header为section首子节点且具有背景；WebView分支采用对应的CSS sticky实现。 | 分别选择renderer分支，检查sticky节点关系、背景与WebView样式；真机吸顶另记验证状态。 |
| `s4_03` | Skyline 弹层与悬浮按钮组织为可比较的fixed层，通过层级值使弹层覆盖按钮。 | 追踪实际fixed兄弟或等效可比较层级，比较最终覆盖关系及z-index。 |

## Case 2：模板运行时、图文混排与动画

一次适配用户列表及推广卡片，覆盖数据与查询、外部模板、导航、同段图文和状态动画。

[需求](iteration-4/eval-2-template-runtime-inline-animation/input/task.md)

| 断言 | Skyline适配要求 | 验证方法 |
| --- | --- | --- |
| `s2_00` | Skyline/glass-easel 的 wx:for 在初始化、数据返回前、null返回及正常数组更新阶段均接收 Array/Object 类型的数据。 | 检查初始渲染数据及computed所有消费路径，分别模拟undefined/null/空数组/有效数组。 |
| `s2_01` | Skyline/glass-easel 的用户容器使用合法的非数字开头id，组件内通过 this.createSelectorQuery 定位同一容器。 | 关联模板id、组件查询作用域和select字符串，核对查询目标一致。 |
| `s2_02` | Skyline 的实际用户滚动目标开启 enhanced，节点查询返回的 ScrollViewContext 用于执行回到顶部操作。 | 从查询目标追踪其enhanced属性及node().exec后的scrollTo({top:0})调用。 |
| `s2_03` | Skyline/glass-easel 循环中的外部片段采用 import 加具名 template 调用，并显式传递当前 item/index。 | 检查导入路径、模板名称和循环数据参数，代入两行不同数据确认作用域。 |
| `s2_04` | Skyline 的简单 navigator 使用 text 或纯文本子节点；卡片导航采用符合该子节点结构的内容，或由外层点击事件实现同一详情跳转。 | 检查两个导航入口的实际子节点和/pages/detail目标；复杂外层事件方案核对绑定与跳转调用。 |
| `s3_00` | Skyline 图标与标题置于同一个可收缩的 span 内联容器，容器设置 max-lines=1、overflow=ellipsis，图片采用 inline-block，使同段图文在有限宽度内共同单行截断；WebView 对应分支保留同段图文单行截断。 | 检查微信输出实际 span 容器的省略属性、图片 display、renderer 分支及父级宽度和收缩约束；使用超长标题核对图标与文字共同截断的实现路径。普通 text 的省略属性不能替代此混排容器检查。 |
| `s3_01` | Skyline 闪烁圆点由真实节点承载 CSS animation，采用支持的fill-mode（如both或forwards），实现原有1秒循环和透明度变化。 | 追踪真实圆点节点的关键帧、fill-mode与周期，确认尺寸颜色及opacity变化对应原效果。 |
| `s3_02` | Skyline 按钮通过状态类驱动 transform/opacity 的150ms CSS transition，完成按下及恢复的视觉过渡；其他渲染目标可使用各自适配实现。 | 追踪按下/松开/取消绑定到Skyline状态及CSS，核对scale(.96)、opacity(.7)与恢复值。 |

## Case 3：从零创建任务看板页面

仅给定产品需求和宿主配置，验证从零选择Skyline页面、滚动、文本及状态动画方案。通用语法和业务功能单独验证。

[需求](iteration-4/eval-3-new-task-board-page/input/task.md)

| 断言 | Skyline适配要求 | 验证方法 |
| --- | --- | --- |
| `n3_00` | Skyline 新页面配置renderer=skyline、componentFramework=glass-easel、navigationStyle=custom和disableScroll=true，实际呈现任务看板导航；app顶层lazyCodeLoading及rendererOptions.skyline五项推荐配置完整。 | 解析页面与app配置，逐项核对requiredComponents及defaultDisplayBlock/defaultContentBox/enableScrollViewAutoSize=true、tagNameStyleIsolation/keyframeStyleIsolation=legacy，检查实际导航节点。 |
| `n3_01` | Skyline 新页面通过有明确高度约束的type=list纵向scroll-view承载任务，任务项为直接子节点，标题及筛选区位于滚动主体之外。 | 检查父子高度与Flex收缩链、scroll-y及列表直接子节点；以超出一屏的任务验证有界滚动布局。 |
| `n3_02` | Skyline 新页面将下拉刷新接到scroll-view的bindrefresherrefresh，refresher-triggered绑定状态，成功及失败路径均结束容器刷新态。 | 沿实际事件绑定触发刷新，注入resolve/reject，核对刷新态最终false且容器可继续操作。 |
| `n3_03` | Skyline 新页面将scroll-view的bindscrolltolower接入分页追加，每次容器触底后新任务进入同一滚动列表。 | 从实际模板触底绑定调用处理器两次，核对每次新增2条且原列表保留；分类和唯一键另作业务验证。 |
| `n3_04` | Skyline 新页面长任务标题在实际text承载节点设置max-lines=1、overflow=ellipsis，并在有界可收缩宽度内与WebView单行省略路径共同生效。 | 检查text属性、父级宽度/收缩约束和WebView样式；代入长标题审查两种renderer的实际截断路径。 |
| `n3_05` | Skyline 新页面分类按钮通过状态类驱动transform/opacity的150ms CSS transition，按下达到scale(.96)/opacity(.7)，松开和取消均恢复1。 | 追踪真实触摸绑定到响应状态和CSS，分别模拟按下/松开/取消，核对数值、持续时间和恢复。 |

## 后续执行

使用同一模型/参数先建立独立Skill与no_skill基线，再比较合并Skill。保存输入、Skill哈希和实际执行证据。本次只更新测试定义，未执行模型评测。

[完整定义](iteration-4/evals.json) · [评分标准](iteration-4/grading-standard.md) · [迁移表](iteration-4/assertion-migration.json)
