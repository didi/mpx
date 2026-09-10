# Mpx2Skyline 测试集设计文档

## 1. 目标与依据

本测试集验证：模型能否借助 mpx2skyline Skill，在保留微信 WebView 行为的前提下完成 Skyline 适配，以及从零创建符合 Mpx 语法与双渲染约束的页面和组件。

设计参考 Mpx2RN Benchmark 的“3项常规适配 + 3项复杂适配 + 3项新建”分层。复用文件式输入、稳定断言ID和两组对照方法，不移植RN专属的能力判断。目标平台仅为Mpx输出微信小程序后的WebView/Skyline，非RN、Mpx2Web或原生微信项目。

## 2. 测试结构与设计原则

9个case、24个输入文件，每项10条二元断言，共90条。

| 层次 | Case | 主要检验内容 |
| --- | --- | --- |
| 常规适配 | 0～2 | 高频样式、页面事件/配置、运行时数据与模板迁移 |
| 复杂适配 | 3～5 | 图文和动画、嵌套结构、层级、误报与视觉不变量 |
| 新建任务 | 6～8 | 选项式组件、组合式组件、组合式原子类页面 |

设计遵循五个原则：

1. **同时考察修复与保留。** 不支持的能力需要替换，合法伪元素、单阴影、业务字段、字体与已有配置不能被误删。
2. **从关联关系判断正确性。** enhanced必须属于被查询的容器；include检查循环祖先；层级判断实际节点关系；文本省略必须落在承载组件。
3. **保留用户可感知行为。** 检查刷新失败收尾、分页追加、禁用状态、父值同步、触摸取消及导航目标，而非仅检查关键字。
4. **迁移与新建分别验证。** 存量代码提供结构线索，新建任务要求模型自行补齐Mpx基础语法、生命周期/状态和配置。
5. **正确性与执行证据分开。** 局部断言得分、编译结果、审计流程、真机验证和资源成本分别记录，不用“已读取Skill”代替正确产物。

## 3. 各Case设计与预期结果

### Case 0：商品卡片样式适配

标识：`style-adaptation`。输入：[product-card.mpx](iteration-2/eval-0-style-adaptation/input/product-card.mpx)、[task.md](iteration-2/eval-0-style-adaptation/input/task.md)。

**设计意图**

验证模型能否同时处理布局、选择器、文本省略和媒体查询，而不是仅删除不支持的CSS。静态圆点作为合法能力对照，检验是否把Skyline规则泛化为“所有伪元素均不可用”。

**输入设计**

商品卡片包含两列Grid标签、属性选择器驱动的活动颜色、静态::before圆点、CSS单行省略，以及320px媒体查询。原组件有title属性与默认文案；任务只涉及组件。

**预期产物与行为**

完整 product-card.mpx 和 report.md。视觉保留两列标签、红色活动文案及圆点；标题两端均单行省略。WebView继续走媒体查询，Skyline通过renderer与宽度状态选择12rpx/24rpx，并避免小屏规则泄漏到大屏。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| WebView，屏宽320px/321px | padding分别为12rpx/24rpx，保留原媒体查询语义。 |
| Skyline，屏宽320px/321px | 同样分别为12rpx/24rpx；仅Skyline命中的默认类覆盖泄漏规则。 |
| 短标题/长标题 | 短文正常显示，长文单行省略；max-lines与overflow是组件属性。 |
| 活动标签与圆点 | 颜色、圆点及等宽双列均保留，不因扫描命中静态::before而误删。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e0_00` | 输出完整 product-card.mpx，保留 title String 属性、默认文案与所有业务内容。 |
| `e0_01` | 标题在实际承载节点设置 max-lines=1 与 overflow=ellipsis。 |
| `e0_02` | 保留 WebView 的 white-space/overflow/text-overflow 省略行为，插值紧贴文本标签。 |
| `e0_03` | 两列等宽标签使用 Skyline 支持的布局，不依赖 display:grid。 |
| `e0_04` | 活动颜色由受支持的选择器驱动，不依赖属性选择器。 |
| `e0_05` | 保留活动圆点视觉；合法静态 ::before 不得被当作必须删除的能力。 |
| `e0_06` | WebView 原媒体查询及 320px 阈值保留。 |
| `e0_07` | Skyline 使用 renderer 状态和相同屏宽阈值控制小屏样式。 |
| `e0_08` | Skyline 默认兜底位于媒体查询之后且仅作用于 Skyline，大屏24rpx、小屏12rpx。 |
| `e0_09` | 所有新增动态状态有定义与模板绑定，未向组件 JSON 写页面专属 renderer/navigationStyle。 |

**边界说明**

不要求处理运行时横竖屏切换；不应给单组件添加页面专属配置。单纯“移除媒体查询，全部改为一次性屏宽快照”不满足本case的WebView保留要求。

### Case 1：订单页滚动与配置迁移

标识：`page-scroll-adaptation`。输入：[orders.mpx](iteration-2/eval-1-page-scroll-adaptation/input/orders.mpx)、[service.js](iteration-2/eval-1-page-scroll-adaptation/input/service.js)、[app.json](iteration-2/eval-1-page-scroll-adaptation/input/app.json)、[task.md](iteration-2/eval-1-page-scroll-adaptation/input/task.md)。

**设计意图**

验证页面迁移是否覆盖模板、业务事件、导航和全局配置的完整链路。重点区分“换成scroll-view”与“刷新、分页、滚动位置及页面配置均完成迁移”。

**输入设计**

原页面依赖onPullDownRefresh/onReachBottom/onPageScroll；reload通过wx.stopPullDownRefresh结束刷新。service.js提供分页模拟数据；app.json保留既有页面、window和webview配置。

**预期产物与行为**

完整 orders.mpx、app.json、service.js 及 report.md。订单项直接置于具有明确高度和type的滚动容器中；刷新、触底和滚动监听迁移为容器事件。页面具备真实自定义导航，全局推荐配置补齐且旧配置不丢失。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| 首次进入 | 调用reload并展示首批订单。 |
| 下拉刷新成功/Promise拒绝 | 成功替换首屏数据；两条路径最终都退出容器刷新态。 |
| 触底加载下一页 | 追加而非覆盖已有订单，成功后推进页号。 |
| 容器滚动 | 从对应事件数据更新scrollTop，两端使用同一事件链路。 |
| 配置与导航复核 | 页面四项配置和app五项推荐配置齐全，模板实际显示“订单”导航。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e1_00` | orders.mpx 完整且 service 导入能解析，初次加载仍调用 reload。 |
| `e1_01` | 页面使用有明确可滚动高度的 scroll-view，显式 type，列表项为直接子节点。 |
| `e1_02` | 刷新事件绑定 bindrefresherrefresh，状态在请求成功与失败后均结束。 |
| `e1_03` | 触底 bindscrolltolower 仍调用分页逻辑，保留追加而非覆盖及页号推进。 |
| `e1_04` | bindscroll 使用对应事件数据更新 scrollTop，WebView 与 Skyline 使用同一滚动链路。 |
| `e1_05` | 不再依赖页面滚动生命周期或 wx.stopPullDownRefresh 结束容器刷新。 |
| `e1_06` | 页面 JSON 包含 skyline、glass-easel、custom 导航和 disableScroll:true。 |
| `e1_07` | 模板实际包含标题为订单的自定义导航，非只配置 navigationStyle。 |
| `e1_08` | app 顶层 lazyCodeLoading=requiredComponents，原 pages/window/webview 配置保留。 |
| `e1_09` | rendererOptions.skyline 内五项推荐配置完整且值正确，未误放到 app 顶层。 |

**边界说明**

输入service默认只返回成功；失败路径需要测试时注入拒绝响应，不能因样例请求总成功而省略检查。输入不是完整工程，缺少真实首页源码不作为漏交文件扣分。

### Case 2：运行时属性、查询与模板适配

标识：`runtime-template-adaptation`。输入：[user-list.mpx](iteration-2/eval-2-runtime-template-adaptation/input/user-list.mpx)、[row.wxml](iteration-2/eval-2-runtime-template-adaptation/input/row.wxml)、[task.md](iteration-2/eval-2-runtime-template-adaptation/input/task.md)。

**设计意图**

验证是否能区分属性描述与普通业务对象，并沿数据流、节点关系和模板祖先关系定位问题。other容器已开启enhanced，专门用于识别“文件里有该属性就算通过”的错误判断。

**输入设计**

label使用default而非value；payload使用type数组；data.config.default是必须保留的正常字段。items初始undefined，接口可能返回null。目标id以数字开头且未开启enhanced，另一个容器已开启。循环的间接子树使用include引用row.wxml。

**预期产物与行为**

完整 user-list.mpx、row.wxml 及 report.md。修正属性声明，保留String/Object合法输入；实际循环数据全路径为Array/Object。同步修改目标id与查询，给真实目标补enhanced，采用组件作用域查询；include改为具名模板并显式传入item/index。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| 初始化、接口返回null、正常数组 | visibleItems均为合法循环数据；正常数组仍按visible过滤。 |
| payload分别传String/Object | 两种输入均符合属性类型声明，不以type:null取消约束。 |
| 检查config.default | 值仍为keep，未被全局替换default误伤。 |
| 点击回到顶部 | 查询命中原users容器，该节点自身有enhanced，context调用保留。 |
| 检查嵌套模板 | 循环祖先下的include已替换，索引与条目正确传入user-row等具名模板。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e2_00` | label 属性默认值使用 value，保留原用户文案。 |
| `e2_01` | payload 使用主 type 和 optionalTypes 保留 String/Object，不以 type:null 逃避类型声明。 |
| `e2_02` | data.config.default 保持 keep，不将 properties 之外的 default 改名。 |
| `e2_03` | items 初始化与 setRows null 路径保证循环数据类型合法。 |
| `e2_04` | visibleItems 的所有返回路径为 Array/Object，过滤 visible 语义保留。 |
| `e2_05` | 数字 id 及查询字符串同步修改，查询仍命中原 users 容器。 |
| `e2_06` | 实际 users 查询目标开启 enhanced，不能用 other 的 enhanced 充数。 |
| `e2_07` | 组件内使用 this.createSelectorQuery，保留滚到顶部的 context 调用。 |
| `e2_08` | 所有 scroll-view 显式选择 type，users 容器有可滚动尺寸。 |
| `e2_09` | 循环祖先子树的 include 改为 import/template，row 定义具名模板且显式传入 item/index。 |

**边界说明**

冻结断言e2_05/e2_07明确要求保留查询/context实现。因此，完全改为scroll-top即使顶部功能等价，当前仍会扣这两项。这是实现约束与行为等价原则的已知张力，不应把扣分描述成顶部功能损坏；调整需另开版本。

### Case 3：优惠卡片图文混排与动画

标识：`mixed-text-animation`。输入：[promo-card.mpx](iteration-2/eval-3-mixed-text-animation/input/promo-card.mpx)、[logo.svg](iteration-2/eval-3-mixed-text-animation/input/logo.svg)、[task.md](iteration-2/eval-3-mixed-text-animation/input/task.md)。

**设计意图**

验证模型是否识别“图片和文字共同构成一行”的结构语义，以及是否按动画复杂度选择方案。与Case 0的合法静态伪元素形成对照：本例需改造的是伪元素上的动画。

**输入设计**

图片和标题依赖外层CSS截断；闪烁圆点由::before及animation-fill-mode:backwards实现。按钮调用wx.createAnimation，按下缩放0.96、透明度0.7，松开恢复，时长150ms。附带真实logo.svg资源。

**预期产物与行为**

完整 promo-card.mpx、logo.svg 及 report.md。按span方案组织混排与Skyline内联布局；圆点改为真实动画节点；简单按钮用状态驱动的通用transition，保留触摸取消恢复。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| 短标题/超长标题配图标 | 图标和文字保持同一视觉行，长内容共同截断；图片不嵌进text。 |
| 查看Skyline节点属性 | max-lines/overflow位于实际组件标签，图片具备inline-block，宽度可收缩。 |
| 持续展示圆点 | 8px、原颜色与循环闪烁语义保留，不依赖伪元素animation。 |
| 按下、松开、触摸取消 | 按下目标为scale(.96)/opacity(.7)，150ms过渡；松开或取消恢复1/1。 |
| 检查资源和依赖 | SVG路径仍有效，没有引入Worklet或按帧JS定时器。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e3_00` | 同段图文采用 reference 的 span 容器方案，不只是为外层加省略属性。 |
| `e3_01` | Skyline 单行容器设置 max-lines/overflow，并有可收缩宽度约束。 |
| `e3_02` | 图片在 Skyline 内联布局为 inline-block，renderer 状态实际定义并驱动模板。 |
| `e3_03` | WebView 保留图文单行截断，未让 text 包含 image。 |
| `e3_04` | 伪元素动画改为真实圆点节点，保留尺寸颜色与循环闪烁语义。 |
| `e3_05` | 动画 fill mode 采用支持值或等效逻辑，不依赖 backwards。 |
| `e3_06` | Skyline 可执行路径不调用 wx.createAnimation，简单按钮改为通用状态动画。 |
| `e3_07` | 按钮150ms驱动 transform/opacity，按下目标数值与松开恢复正确。 |
| `e3_08` | 触摸取消也能恢复，未引入 Worklet 或按帧 JS 定时器。 |
| `e3_09` | logo 资源路径有效，未删除图片或用无意义占位替代。 |

**边界说明**

不要求高级手势跟随或Worklet；不能为规避图片适配而删图，也不能将max-lines写成CSS声明。

### Case 4：分类面板嵌套滚动、吸顶与层级

标识：`nested-sticky-layer`。输入：[category-panel.mpx](iteration-2/eval-4-nested-sticky-layer/input/category-panel.mpx)、[task.md](iteration-2/eval-4-nested-sticky-layer/input/task.md)。

**设计意图**

验证复杂组件的结构性改造：纵横嵌套滚动、吸顶模式差异和fixed层级必须同时成立。该case特意使“只增大弹层z-index”无法解决问题。

**输入设计**

外层纵向滚动中包含分组与横向条目；原分组标题使用CSS sticky。弹层是滚动容器中的absolute节点，z-index为9999；悬浮按钮是fixed节点，z-index为2。外层还有transform层叠假设。

**预期产物与行为**

完整 category-panel.mpx 及 report.md。Skyline外层nested、内层显式选型并关联；吸顶采用sticky-section/sticky-header，WebView保留CSS sticky。弹层移到可比较的fixed层级，真正盖住按钮。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| 纵向滚动和组内横向滚动 | 两种方向保持可操作，内层type与associative-container关系正确。 |
| 分组滚至顶部 | Skyline标题吸顶，sticky-header为首子节点且自身有背景；WebView继续使用原吸顶路径。 |
| 点击打开弹层 | 弹层位于按钮之上，不能仅把absolute的数值继续调大。 |
| 关闭弹层 | opened恢复false，按钮及列表功能恢复。 |
| 多个section与多个entry | 内外循环变量没有串用，key稳定。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e4_00` | Skyline 外层嵌套滚动显式 type=nested，内层显式 list/custom。 |
| `e4_01` | 内层具有 associative-container=nested-scroll-view，嵌套关系正确。 |
| `e4_02` | 横向容器开启 enable-flex 并设置横向布局，保留横向滚动。 |
| `e4_03` | Skyline 用 sticky-section/sticky-header 实现组标题吸顶。 |
| `e4_04` | sticky-header 是 section 第一个子节点且有显式背景。 |
| `e4_05` | WebView 保留 CSS sticky 路径，Skyline 专属结构按 renderer 隔离。 |
| `e4_06` | 弹层调整到可比较的层级，使用高于按钮的 fixed 层而非增大 absolute z-index。 |
| `e4_07` | 未依赖 transform/opacity 创建 Skyline 层叠上下文或 scroll-view 直接子节点 z-index。 |
| `e4_08` | 保留 sections/entry 循环数据绑定与稳定 key，没有混淆内外层 item。 |
| `e4_09` | opened 状态、打开与关闭事件仍有效，无负 z-index，无新增依赖。 |

**边界说明**

背景不继承，不能仅因sticky-header内部子view有背景就认定该节点满足显式背景断言。源码结构检查不能替代真机手势协同与吸顶验收。

### Case 5：数据面板样式边界与布局守恒

标识：`style-boundary-layout`。输入：[data-panel.mpx](iteration-2/eval-5-style-boundary-layout/input/data-panel.mpx)、[task.md](iteration-2/eval-5-style-boundary-layout/input/task.md)。

**设计意图**

验证适配中的范围克制和视觉守恒：对合法与非法写法作成对判断，保留可用能力；对字体不确定性遵守用户禁止改字重的约束。

**输入设计**

布局依赖BFC和margin合并；同时包含rgba单阴影/双阴影、单blur/复合滤镜、合法text导航/含view的复杂导航。City-Semibold有独立@font-face，Trip-Medium依赖宿主。要求保留20px外沿、120px盒宽、16px块间距及500/600字重。

**预期产物与行为**

完整 data-panel.mpx 及 report.md。用显式布局维持三个尺寸不变量；双效果拆层而不删层；合法写法不误报。字体与路径保留，明确记录待确认项；两处详情导航仍有效。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| 计算父外沿、盒宽、兄弟间距 | 分别为20px、120px、16px，不成为重复padding、28px间距或零间距。 |
| 解析阴影声明 | rgba内部逗号不算多层分隔；双阴影保留两层及顺序。 |
| 检查滤镜 | 单blur保留，复合效果分层且保留先blur后brightness的组合。 |
| 复核字体 | 识别City独立字体族例外；保留两组字体和字重，报告Trip映射及机型风险。 |
| 点击两处详情 | 均跳转/pages/detail；合法text结构与复杂卡片导航语义均保留。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e5_00` | 父外沿20px由父 padding 表达，清理重复子 margin，不将 overflow:hidden 当作 BFC。 |
| `e5_01` | child 保持100px内容宽加两侧10px padding 的120px外宽。 |
| `e5_02` | 兄弟间距归到单侧16px，不能保留导致28px或删除成0px。 |
| `e5_03` | 保留单个 rgba 阴影，不把函数内逗号误判为多阴影。 |
| `e5_04` | 双阴影拆节点或其他等效方案保留两层效果，不直接删去其中一层。 |
| `e5_05` | 保留单 blur，复合 filter 分层实现且保留两种效果。 |
| `e5_06` | City-Semibold 独立 @font-face 例外被正确识别，不仅凭名称报错。 |
| `e5_07` | 保留两个字体与500/600字重，报告 Trip-Medium 待核实及机型风险，不擅改bold。 |
| `e5_08` | 合法 text 子节点 navigator 保留功能，含view的复杂导航改为支持结构或点击跳转。 |
| `e5_09` | 所有新结构和点击方法定义完整，双端导航仍到/pages/detail，字体资源保持宿主路径约定。 |

**边界说明**

宿主已提供默认布局基线，不改app。字体二进制明确未提供，不计为漏交依赖。border-box宽120px配两侧10px padding与content-box内容宽100px等价，允许通过。

### Case 6：新建选项式评分组件

标识：`new-rating-component`。输入：[rating-requirements.md](iteration-2/eval-6-new-rating-component/input/rating-requirements.md)、[task.md](iteration-2/eval-6-new-rating-component/input/task.md)。

**设计意图**

**新建组件能否同时满足 Skyline 兼容规则与完整业务需求**：验证模型脱离存量源码后能否一次生成可复用的Mpx组件，同时正确处理父属性同步、本地交互状态和双模式文本能力。普通class约束用于避免引入未提供的样式依赖。

**输入设计**

仅提供需求。指定createComponent选项式API，以及ratingKey/value/max/readonly/label五项属性；value=0、max=5、readonly=false、label为“评分”。要求change事件、等距星号、标签省略及150ms按压动画。

**预期产物与行为**

完整 rating-selector.mpx 和 report.md，含组件JSON。评分本地状态与父value同步；readonly在处理器中阻止更新和发事件；所有模板绑定、语义class与动画状态完整。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| value=2，max=5 | 展示5颗星与评分2，选中状态正确。 |
| 点击第4颗 | 本地评分变4，change.detail为{ratingKey,value:4}。 |
| readonly=true后点击第1颗 | 不更新评分、不发change事件。 |
| 父value改3、max改变 | 本地评分同步3；星号列表随max变化且key稳定。 |
| 长label和触摸取消 | 两端标签单行省略；按压scale(.96)，松开/取消恢复，150ms。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e6_00` | 完整 rating-selector.mpx 含 template/script/style/组件JSON，使用 createComponent 选项式API。 |
| `e6_01` | 五项属性类型、默认值正确，默认值使用 value。 |
| `e6_02` | 根据 max 渲染稳定 key 的星级列表，选中状态区分正确。 |
| `e6_03` | 点击第n颗更新本地评分并触发 detail={ratingKey,value:n} 的change。 |
| `e6_04` | readonly 在处理器中阻止更新与发事件，而非仅改样式。 |
| `e6_05` | 父value变化同步本地评分，未直接修改只读传入属性。 |
| `e6_06` | 标签在两端单行省略，Skyline max-lines/overflow 与 WebView 样式均完整。 |
| `e6_07` | 星级行使用支持的显式布局与语义class，没有未声明的原子类依赖。 |
| `e6_08` | 按下缩放.96，松开/取消恢复，150ms通用transition，无Worklet。 |
| `e6_09` | 组件无页面专属配置、未定义绑定或不支持的模板子节点关系。 |

**边界说明**

不属于页面任务，不加renderer/navigationStyle等页面配置；无须Worklet。断言检验行为，不要求特定本地状态变量名。

### Case 7：新建组合式分段选择器

标识：`new-segmented-control`。输入：[segmented-requirements.md](iteration-2/eval-7-new-segmented-control/input/segmented-requirements.md)、[task.md](iteration-2/eval-7-new-segmented-control/input/task.md)。

**设计意图**

**组合式组件中的横向滚动与文本适配**：在横向滚动组件中检验Mpx组合式API、属性响应性和事件契约，避免把Vue的script setup经验直接套用到Mpx。与Case 6共同区分“会修样式”和“能生成完整组件”。

**输入设计**

仅提供需求。指定script setup与普通class；props为controlKey/options/value/disabled/label。options元素有单项disabled。要求ref本地选择、watch父值、computed展示状态，以及至少100px宽的横向候选项。

**预期产物与行为**

完整 segmented-control.mpx 和 report.md。模板绑定通过Mpx支持的方式暴露，change事件可实际发出；横向容器配置、候选宽度和长标签省略完整。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| 初始化或父value变化 | 本地值及选中项名称正确同步，props响应性未因直接解构丢失。 |
| 点击正常候选项 | 更新选择并发出{controlKey,value}。 |
| 整体disabled或单项disabled | 两种情况下都不能选择或发事件。 |
| 长候选文案与超宽候选列表 | 单项不被压缩到100px以下，文案单行省略，容器可横向滚动。 |
| 运行Mpx script-setup编译检查 | 模板状态和方法通过defineExpose暴露；不能依赖未定义的defineEmits。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e7_00` | 输出完整script setup组件，使用Mpx组合式API，模板绑定正确暴露。 |
| `e7_01` | 五项props与默认值正确，options始终为数组。 |
| `e7_02` | 使用ref保存本地选择，watch同步父value，未因直接解构丢失响应性。 |
| `e7_03` | computed派生候选状态与选中项名称，循环使用稳定key。 |
| `e7_04` | 整体disabled和单项disabled在事件处理器中都阻止选择。 |
| `e7_05` | change事件detail包含controlKey与选中的value，更新本地显示。 |
| `e7_06` | 横向scroll-view显式type、enable-flex与横向布局，list时条目为直接子节点。 |
| `e7_07` | 候选宽度至少100px且不会被flex压缩为内容窄条。 |
| `e7_08` | 长标签两端单行截断，Skyline属性作用于文本承载节点，WebView样式保留。 |
| `e7_09` | 普通语义class有定义，无新依赖、页面专属JSON或未定义方法。 |

**边界说明**

编译器会强制检查defineExpose。编译失败作为阻断项单列；ref/watch/computed或CSS等局部断言仍按自身内容评分，不能全部级联归零。

### Case 8：新建组合式任务看板页面

标识：`new-task-board-page`。输入：[board-requirements.md](iteration-2/eval-8-new-task-board-page/input/board-requirements.md)、[app.json](iteration-2/eval-8-new-task-board-page/input/app.json)、[utilities.css](iteration-2/eval-8-new-task-board-page/input/utilities.css)、[task.md](iteration-2/eval-8-new-task-board-page/input/task.md)。

**设计意图**

**新建页面的滚动、导航和全局配置闭环**：组合验证从零开发页面的端到端能力：响应式业务状态、列表滚动、导航、页面注册、全局配置和原子类来源。与Case 1对照，检验规则能否从迁移任务泛化到新建任务。

**输入设计**

提供页面需求、既有app.json及utilities.css。初始任务为“确认行程”（待办）和“查看账单”（完成）；要求全部/待办/完成筛选、完成状态切换、刷新、触底追加和空态。指定script setup与原子类为主。

**预期产物与行为**

完整 pages/task-board.mpx、app.json、utilities.css 和 report.md。页面可编译，具备实际自定义导航、剩余高度滚动区域和双端文本省略；注册新页并保留原配置，所有样式有明确来源。

**建议验证场景**

下表是验证设计，不代表所有步骤已进行真机实测。

| 输入/操作 | 预期测试结果 |
| --- | --- |
| 首次展示并切换三类筛选 | 全部显示2项，待办/完成初始各1项；列表key稳定。 |
| 切换完成状态后筛选结果为空 | 条目即时更新，空列表显示“暂无任务”。 |
| 下拉刷新和连续触底 | 恢复初始数据并退出刷新；追加任务id不重复。 |
| 检查长标题与滚动区域 | 标题两端单行省略，主体占剩余高度且实际可滚动。 |
| 编译与配置检查 | defineExpose满足Mpx要求；真实导航、页面四项配置与app推荐项完整。 |
| 检查原子类来源 | utilities已保留并实际接入，新增类有定义，不假设不存在的UnoCSS能力。 |

**逐条通过标准**

| 断言ID | 预期结果 |
| --- | --- |
| `e8_00` | 完整pages/task-board.mpx使用script setup与ref/computed，模板绑定可访问。 |
| `e8_01` | 全部/待办/完成筛选正确，列表稳定key，点击切换完成状态。 |
| `e8_02` | 初始任务数据正确且空列表有暂无任务提示。 |
| `e8_03` | 下拉刷新恢复初始数据并结束refresher状态，触底追加不重复id的待办。 |
| `e8_04` | 主体scroll-view显式type且列表项直接参与列表结构，flex高度约束可形成滚动区域。 |
| `e8_05` | 长标题保留原子truncate在WebView的行为，Skyline有max-lines/overflow。 |
| `e8_06` | 页面配置renderer=skyline、glass-easel、custom导航与disableScroll:true。 |
| `e8_07` | 模板实际实现任务看板导航，app注册新页面且保留首页/window/webview。 |
| `e8_08` | app包含lazyCodeLoading及五项rendererOptions.skyline推荐配置，层级和值正确。 |
| `e8_09` | 原子类来自utilities或有补充定义，不引入未提供依赖；未强制配置disableABTest等选配项。 |

**边界说明**

允许少量补充style，不要求空style区块；不安装新依赖。不强制开启disableABTest等选配项。app.json只是配置载体，缺少未提供的首页工程不是本case失败条件。

## 5. 覆盖边界与后续扩展

本集覆盖主要适配和新建交付场景，不是Skyline能力全量兼容认证。普通组件的能力查询、只审不改、输入缺失、触发正负例与Worklet官方回源在[第一版扩展集](../mpx2skyline/evals/README.md)中，不能与本轮90条断言直接合并统计。

当前未充分覆盖真实工程的自定义组件树、路由/共享元素、复杂Worklet手势、SVG复杂值域、picker/swiper差异、基础库版本矩阵和多设备视觉表现。后续扩展优先考虑：

1. 加入最小可构建Mpx宿主，对两组统一执行构建和模板绑定检查，并维持与局部断言分数分开的报告。
2. 将明确要求保留的接口测试与可接受功能等价的任务分开，减少实现偏好对分数的影响。
3. 增加真实脱敏fixture与未用于优化Skill的保留集，检验泛化而非只记住当前9项。
4. 建立无Skill信息泄漏的基线环境，固定模型与版本后重复采样。
5. 为滚动协同、文本截断、层级、阴影滤镜和字体补充WebView/Skyline真机验收。

以上为后续设计建议，未作为新断言计入iteration-1，也未因首轮失败修改被测Skill或测试输入。
