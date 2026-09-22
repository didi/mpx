# Skyline 测试设计 v7

4个case、38条能力断言，定义已同步，模型评测未执行。

## Case 0：样式与布局

[需求](iteration-7/eval-0-style-layout/input/task.md) · adaptation

| 断言 | 要求 | 验证方法 |
| --- | --- | --- |
| s0_00 | Skyline 标题的实际 text 承载节点设置 max-lines=1、overflow=ellipsis，并与 WebView 单行省略样式共同实现长标题截断。 | 检查标题节点属性和有界宽度；分别审查两种 renderer 的单行省略路径。 |
| s0_01 | Skyline 两列标签使用显式横向 Flex 和等分子项布局，实现两列等宽。 | 检查父子布局关系及 flex basis/width，计算两列可用宽度。 |
| s0_02 | Skyline 活动状态通过受支持的 class 选择器映射到红色活动文案。 | 追踪实际活动节点 class 与颜色声明的匹配关系。 |
| s0_03 | WebView 仅在 renderer !== skyline 时添加媒体查询专用类；Skyline 按运行时窗口宽度通过 wx:class 切换 padding，窗口宽度≤320px 为12rpx、>320px 为24rpx，并响应窗口变化。 | 代入两种 renderer 和319/320/321px，检查媒体查询每个选择器仅匹配非Skyline专用类；模拟媒体条件被忽略后Skyline结果仍正确；触发窗口变化并验证状态更新与监听清理，不以CSS源码顺序覆盖作为兼容依据。 |
| s0_04 | Skyline 内容与父容器上外沿的20px距离由父 padding 表达，子节点从父内容区起始位置布局。 | 检查 .outer/.child 的盒模型，计算父外沿到首个子盒的20px距离。 |
| s0_05 | Skyline 相邻块的垂直间距集中由一侧的16px margin承担，最终相邻盒间距为16px。 | 计算第一块下边界到第二块上边界的间距，核对两侧 margin 的实际贡献。 |
| s0_06 | Skyline 将双阴影分配到同尺寸的嵌套节点或等效分层结构，呈现原有两层阴影的参数和前后关系。 | 追踪0 2px 4px #000与0 4px 8px #333分别作用的节点、尺寸和绘制层次。 |
| s0_07 | Skyline 将复合滤镜分层为内层blur(2px)和外层brightness(.8)，组合呈现原有两种效果。 | 检查滤镜节点嵌套与作用顺序，逐层核对单函数参数。 |
| s0_08 | Skyline 字体处理识别 City-Semibold 的同名独立字体族，明确 Trip-Medium 的宿主字体与 PostScript 映射核验点，并记录500/600字重的机型验证要求。 | 结合 @font-face 与报告核对两个字体来源；宿主二进制缺失时，记录待核验信息及保持现有视觉的集成方案。 |
| s0_09 | Skyline 单阴影节点以单个 box-shadow 呈现原有 0 2px 4px rgba(0,0,0,.2) 效果，颜色函数作为完整颜色值解析。 | 核对 .single-shadow 的实际阴影层数为1，偏移、模糊半径和颜色透明度均与输入一致。 |
| s0_10 | Skyline 单滤镜节点采用受支持的 blur(2px)，呈现原有独立模糊效果。 | 追踪 .single-filter 的实际滤镜节点和参数，确认独立内容仍具有2px模糊效果。 |
| s0_11 | Skyline 在宿主 defaultContentBox=true 条件下，child 保持100px内容宽度及左右各10px padding，实际外宽为120px。 | 结合宿主默认盒模型和实际节点 box-sizing、width、padding、border 计算内容宽与外宽，分别核对100px和120px。 |

## Case 1：页面滚动、吸顶与层级配置

[需求](iteration-7/eval-1-page-scroll-sticky-layer-config/input/task.md) · adaptation

| 断言 | 要求 | 验证方法 |
| --- | --- | --- |
| s1_00 | Skyline 订单页面的外层与主订单纵向scroll-view均具有明确可滚动高度，概览与分组主体按嵌套层次布局，分组实际参与主滚动区域。 | 检查导航下方的外层高度、概览占位和主订单容器高度链，以多组数据核对主区域可滚动；具体类型及吸顶结构分别按s1_07/s1_09验证。 |
| s1_01 | Skyline 主订单纵向scroll-view启用refresher-enabled=true，通过bindrefresherrefresh启动刷新，refresher-triggered绑定刷新状态，请求成功和失败均结束该容器刷新态。 | 定位承载sections的主纵向容器，检查refresher-enabled求值为true以及刷新事件和状态绑定，分别注入fetchOrders(1)成功和失败，核对刷新态复位；刷新开关、事件和状态应共同作用于主区域。 |
| s1_02 | Skyline 主订单纵向scroll-view通过bindscrolltolower连接分页加载，触底后下一页分组追加到同一sections列表并继续展示。 | 从主订单容器实际触底绑定连续调用两次，核对页号推进、新分组追加和原分组保留；确认横向触底不触发纵向分页。 |
| s1_03 | Skyline 主订单纵向scroll-view通过bindscroll读取event.detail.scrollTop并更新概览中的滚动位置。 | 给主区域滚动处理器传入detail.scrollTop并核对展示；检查外层及横向滚动事件不会被误当作主订单区域位置。 |
| s1_04 | Skyline 页面配置 renderer=skyline、componentFramework=glass-easel、navigationStyle=custom、disableScroll=true，并在模板实现订单自定义导航。 | 解析页面JSON并检查真实导航节点和主体布局关系。 |
| s1_05 | Skyline 接入所需的 lazyCodeLoading=requiredComponents 配置于 app.json 顶层。 | 解析 app.json 并检查顶层属性值。 |
| s1_06 | Skyline 在 app.rendererOptions.skyline 中配置 defaultDisplayBlock=true、defaultContentBox=true、tagNameStyleIsolation=legacy、enableScrollViewAutoSize=true、keyframeStyleIsolation=legacy。 | 逐项解析五个字段的层级、类型和值。 |
| s1_07 | Skyline 外层纵向scroll-view采用type=nested，主订单纵向容器显式选择type=custom，内层横向容器显式选择list/custom，并通过associative-container=nested-scroll-view建立嵌套关联。 | 沿外层、主区域及横向列表的父子关系核对类型和关联；主区域的custom用于承载吸顶分组，横向列表承担订单排列。 |
| s1_08 | Skyline 横向列表显式选择type=list/custom，开启enable-flex并设置横向Flex布局；采用list时条目为直接子节点，项目保持120px宽度和相应的收缩约束。 | 检查横向容器的type、scroll-x、enable-flex、flex-direction及条目宽度/收缩；采用list时检查直接子节点，多项目排列后形成横向内容。 |
| s1_09 | Skyline 主订单custom容器内使用sticky-section/sticky-header实现分组标题吸顶，header为section首子节点且具有背景；WebView分支采用对应CSS sticky实现。 | 核对主区域type=custom、每组sticky节点关系、标题背景和renderer分支；真实吸顶与嵌套手势另外记录真机验证状态。 |
| s1_10 | Skyline 弹层与悬浮按钮组织为可比较的fixed层，通过层级值使弹层覆盖按钮。 | 追踪实际fixed兄弟或等效可比较层级，比较最终覆盖关系及z-index。 |

## Case 2：模板运行时、图文混排与动画

[需求](iteration-7/eval-2-template-runtime-inline-animation/input/task.md) · adaptation

| 断言 | 要求 | 验证方法 |
| --- | --- | --- |
| s2_00 | Skyline/glass-easel 的 wx:for 在初始化、数据返回前、null返回及正常数组更新阶段均接收 Array/Object 类型的数据。 | 检查初始渲染数据及computed所有消费路径，分别模拟undefined/null/空数组/有效数组。 |
| s2_01 | Skyline/glass-easel 的用户容器使用合法的非数字开头id，通过正确的组件查询作用域定位同一容器。 | 关联模板id、组件查询作用域和select字符串，核对查询目标一致；接受this.createSelectorQuery()或wx.createSelectorQuery().in(this)等具有正确组件作用域的等价实现。this.createSelectorQuery的性能推荐另记观察项。 |
| s2_02 | Skyline 的实际用户滚动目标开启 enhanced，节点查询返回的 ScrollViewContext 用于执行回到顶部操作。 | 从user-list.mpx实际回顶按钮的点击绑定追踪查询目标、enhanced属性及node().exec后的scrollTo({top:0})调用，确认不是other容器。 |
| s2_03 | Skyline/glass-easel 循环中的外部片段采用 import 加具名 template 调用，并显式传递当前 item/index。 | 检查导入路径、模板名称和循环数据参数，代入两行不同数据确认作用域。 |
| s2_04 | Skyline 的简单 navigator 使用 text 或纯文本子节点；卡片导航采用符合该子节点结构的内容，或由外层点击事件实现同一详情跳转。 | 检查两个导航入口的实际子节点和/pages/detail目标；复杂外层事件方案核对绑定与跳转调用。 |
| s2_05 | Skyline 图标与标题置于同一个可收缩的 span 内联容器，容器设置 max-lines=1、overflow=ellipsis，图片采用 inline-block，使同段图文在有限宽度内共同单行截断；WebView 对应分支保留同段图文单行截断。 | 检查user-list.mpx标题中logo与label共同承载的实际span、省略属性、图片display及renderer路径和宽度约束；使用长label核对两者共同截断。 Mpx 内联容器使用 view 的 mpxTagName@wx="span" 写法，结合实际编译结果核对标签。 |
| s2_06 | Skyline 闪烁圆点由真实节点承载 CSS animation，采用支持的fill-mode（如both或forwards），实现原有1秒循环和透明度变化。 | 追踪user-list.mpx提示圆点的真实节点、关键帧、fill-mode与1秒周期，核对8px、#f50及opacity .3到1。 |
| s2_07 | Skyline 按钮通过响应式状态，以wx:class或wx:style驱动transform/opacity的150ms CSS transition，完成按下及恢复的视觉过渡；WebView 保持对应体验。 | 追踪user-list.mpx同一个回顶按钮的按下/松开/取消绑定、响应式状态及wx:class或wx:style到CSS transition的完整链路，核对150ms、scale(.96)/opacity(.7)及恢复值；点击回顶链路另由s2_02验证。 |

## Case 3：从零创建任务看板页面与组件

[需求](iteration-7/eval-3-new-task-board-page/input/task.md) · creation

| 断言 | 要求 | 验证方法 |
| --- | --- | --- |
| n3_00 | Skyline 新页面配置renderer=skyline、componentFramework=glass-easel、navigationStyle=custom和disableScroll=true，实际呈现任务看板导航；app顶层lazyCodeLoading及rendererOptions.skyline五项推荐配置完整。 | 解析页面与app配置，逐项核对requiredComponents及defaultDisplayBlock/defaultContentBox/enableScrollViewAutoSize=true、tagNameStyleIsolation/keyframeStyleIsolation=legacy，检查实际导航节点。 |
| n3_01 | Skyline 新页面通过有明确高度约束的type=list纵向scroll-view承载任务，任务项为直接子节点，标题及筛选区位于滚动主体之外。 | 检查页面父子高度与Flex收缩链、scroll-y及任务列表直接子节点；顶部两个组件位于滚动主体之外，以超出一屏的任务验证有界滚动布局。 |
| n3_02 | Skyline 新页面在scroll-view上启用refresher-enabled=true，将下拉刷新接到bindrefresherrefresh，refresher-triggered绑定状态，成功及失败路径均结束容器刷新态。 | 检查实际滚动容器的refresher-enabled求值为true、bindrefresherrefresh事件及refresher-triggered状态绑定；沿该绑定触发刷新，分别注入resolve/reject，核对刷新态最终false且容器可继续操作。 |
| n3_03 | Skyline 新页面将scroll-view的bindscrolltolower接入分页追加，每次容器触底后新任务进入同一滚动列表。 | 从实际模板触底绑定调用处理器两次，核对每次新增2条且原列表保留；分类和唯一键另作业务验证。 |
| n3_04 | Skyline 页面任务标题、选项式评分组件标题和组合式分类组件候选文案，在实际text承载节点设置max-lines=1、overflow=ellipsis，并在有界可收缩宽度内与WebView单行省略路径共同生效。 | 分别检查三个SFC的实际文本节点、组件内部宽度与收缩、父级分配宽度及WebView样式；插值紧贴text标签，代入长任务标题、长评分标题及长候选label，核对各自截断且相邻星级/分数保持可见。逐目标记录子检查结果。 |
| n3_05 | Skyline 选项式评分组件的星级与组合式分类组件的候选项，通过各实例响应式状态，以wx:class或wx:style驱动transform/opacity的150ms CSS transition，按下达到scale(.96)/opacity(.7)，松开和取消均恢复1。 | 从页面真实注册找到两个组件，分别追踪触摸绑定、局部状态和CSS transition；模拟start/end/cancel，核对数值、时长和恢复，并挂载同类两个实例核对反馈隔离。逐组件记录子检查结果。 |
| n3_06 | Skyline/glass-easel 新建组合式分类组件的候选列表在初始化、异步返回前、null输入和数组更新阶段均向wx:for提供Array/Object类型的数据。 | 结合真实setup编译产物、初始渲染数据及模板保护检查首帧，再通过props更新options为null、空数组和有效数组，验证循环实际消费值；手动调用computed不能替代首帧检查。 |

通用Mpx门槛见[验证契约](iteration-7/common-validation.json)，创建业务门槛见[创建契约](iteration-7/creation-validation.json)。两类门槛不增加专项分母。
