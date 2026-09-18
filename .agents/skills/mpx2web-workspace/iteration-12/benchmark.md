# Mpx2Web 静态源码评测

本 Benchmark 仅检查源码、配置、编译规则、引用关系和交付说明，不执行构建、E2E、浏览器、SSR 渲染或真机验收。规则中的点击、加载、跳转、并发、刷新和展示只用于描述需要静态推导的代码场景，不表示执行对应操作。评分模型是否与生成模型不同由报告单独标记。

当前为**开发级源码结果**：1/3 次采样，同模型盲审独立会话。

主分每次采样 25 项（Web 20 + SSR 5），按断言等权；先汇总每次采样的四个 Case，再统计跨采样均值。当前共 4 个 eval；从零生成单列。

| 范围 | Has Skill | No Skill |
| --- | --- | --- |
| 适配主分 25 项 | 96.00%（24/25） | 84.00%（21/25） |
| Web 20 项 | 95.00%（19/20） | 90.00%（18/20） |
| SSR 源码 5 项 | 100.00%（5/5） | 60.00%（3/5） |
| 从零生成 5 项 | 100.00%（5/5） | 100.00%（5/5） |

Case 宏平均只用于观察不同题目的难度差异，不作为主分：

| 范围 | Has Skill Case 宏平均 | No Skill Case 宏平均 |
| --- | --- | --- |
| 适配主分 | 95.00%（Case 范围 80.00%–100.00%） | 84.44%（Case 范围 77.78%–100.00%） |
| Web | 95.00%（Case 范围 80.00%–100.00%） | 90.00%（Case 范围 80.00%–100.00%） |
| SSR 源码链路 | 100.00%（Case 范围 100.00%–100.00%） | 60.00%（Case 范围 60.00%–60.00%） |
| 从零生成 | 100.00%（Case 范围 100.00%–100.00%） | 100.00%（Case 范围 100.00%–100.00%） |

全部 30 项的每次采样汇总与生成成本：

| 指标 | Has Skill | No Skill |
| --- | --- | --- |
| 全部断言通过率 | 96.67% | 86.67% |
| 整套生成耗时（秒） | 2253.4 | 1926.5 |
| 整套生成 Tokens | 11559690 | 5960002 |

范围有效性（不计分；失败会使比较不可发布）：

| 配置 | 已检查有效 | 待确认 | 无效 | 无需检查 |
| --- | ---: | ---: | ---: | ---: |
| mpx2web | 1 | 0 | 0 | 3 |
| no_skill | 1 | 0 | 0 | 3 |

交付说明检查（不计分）：

| 配置 | 已说明 | 缺少说明 | 待确认 | 不适用 |
| --- | ---: | ---: | ---: | ---: |
| mpx2web | 1 | 5 | 0 | 0 |
| no_skill | 1 | 4 | 0 | 1 |

待运行验证（不计分）：

- **Case 1 / mpx2web / run-1**：真实 Web/微信运行环境中的视觉布局、fixed 视口表现、展开交互和路由跳转未执行；本结论仅依据静态源码、配置及题目给定的编译器证据。；实际 helpUrl 的微信业务域名白名单与 Web iframe 许可仍需在部署环境确认。
- **Case 2 / mpx2web / run-1**：Web 与微信小程序的实际编译、运行交互及视觉一致性超出本次静态源码评审范围，未进行实测。
- **Case 3 / mpx2web / run-1**：真实浏览器及微信环境中的分享、位置、扫码、插件、原生输入和视频播放交互属于本次静态评审范围外，未进行运行验证。；delivery-notes.txt 声称真实局部编译通过；本次按要求未运行构建，因此该自述未被独立验证。
- **Case 4 / mpx2web / run-1**：需在安装候选说明中的 Pinia 依赖后实际执行 Web client/server 构建，确认产物与宿主 renderer 集成。；需在部署服务器验证 /help-demo/ 静态资源处理、页面请求转交及详情页直接访问和刷新。；需运行 SSR 与浏览器接管验证首屏 HTML、注水后同文章去重、并发请求隔离及 a 慢 b 快竞态行为。；需在 Web 和微信环境实测自定义导航布局、页面交互及最终视觉效果。
- **Case 1 / no_skill / run-1**：真实 helpUrl 的微信业务域名许可及 Web iframe 加载许可属于部署环境条件，无法由本次静态源码评审确认。
- **Case 2 / no_skill / run-1**：按要求未运行 Web、微信小程序或真机环境；实际渲染布局及交互效果属于本次静态评审范围外。
- **Case 3 / no_skill / run-1**：微信分享、chooseLocation、camera 扫码及 foo 插件的实际可用性依赖测试环境、授权和插件环境，超出本次静态源码评审范围。；Web 名称编辑交互以及 video 在真实浏览器中透传的媒体事件数值、播放与布局效果仍需目标环境验证；本次未运行浏览器或构建。
- **Case 4 / no_skill / run-1**：需在实际部署环境确认 /help-demo/ 下静态资源与 SSR 页面请求的服务器转发、直接访问及刷新行为。；修复 Pinia 状态链和请求隔离后，需运行确认首屏 HTML 包含对应文章、客户端 hydration 正常且不会重复加载同一文章。；需在 375px、750px Web 视口及微信真机确认最终布局、导航外观、选择页通信和文章展开/收起交互。

## Case 1：组件样式布局与帮助卡片生成 / mpx2web / run-1

范围状态：**valid**

- S1.1 / passed：input 中原有页面和六个组件在 outputs 中按适配需求完整交付；help-card.mpx、help-item.mpx 为 input 中不存在的新组件。必要变更仅涉及对应源码、sample.png 和保留 srcMode:'wx' 的 mpx.config.js；outputs 未改写只读 WebView/宿主页，也未增加平台副本或无关业务文件。

待运行验证：

- 真实 Web/微信运行环境中的视觉布局、fixed 视口表现、展开交互和路由跳转未执行；本结论仅依据静态源码、配置及题目给定的编译器证据。
- 实际 helpUrl 的微信业务域名白名单与 Web iframe 许可仍需在部署环境确认。

### C1.1：通过

静态检查 .image-row 中图片的模板、选择器和样式，确认 Web 端仍保留输入源码规定的 80px 宽高和 12px 圆角。实现方式不限。本项只检查图片；红蓝卡片隔离、两格等分和 externalClasses 分别由 C1.4、C1.5、C1.6 判断。

outputs/src/pages/style/index.mpx:3-4 为 image-row 内图片增加 preview-image 类；同文件 49 行直接对该类声明 width:80px、height:80px、border-radius:12px。该选择器可随 class 落到 Web 端 mpx-image 的实际根节点，保留输入外观。

### C1.2：通过

只检查源码中的节点位置、祖先布局、定位声明和事件绑定。两个悬浮入口在 Web 有效代码中必须保留 position: fixed，祖先结构不能把它们变成相对局部内容的 absolute 定位；若移动节点，原样式、bindtap 处理函数和纵向列表节点仍须可达。已支持的 scroll-view 不要求替换。

outputs/src/pages/style/index.mpx:15-24 将 scroll-action 和 move-action 分别移至 scroll-view、movable-view/movable-area 之外，祖先 style-page 无定位或 transform；51、54 行仍为 position:fixed，两个节点均保留 bindtap="recordTap"。row-group 仍位于 scroll-view 中，滚动列表可达。

### C1.4：通过

静态检查红色卡片和蓝色卡片的样式作用域与选择器，确认两个组件即使使用同名类也不会互相覆盖。可以使用 scoped、项目配置或其他有效隔离方式。

outputs/src/components/red-card.mpx:9 与 blue-card.mpx:9 均使用 <style scoped>；两组件同名 .card、.title 选择器会获得各自独立作用域，不会在 Web 端互相覆盖。

### C1.5：通过

静态检查 layout-cell 的虚拟节点声明、实际生效的编译配置和 Web 最终节点层级，确认“甲”和“较长的乙”平分 240px，flex 作用在真实布局子项上。只声明 options.virtualHost 不能直接证明 Web 布局正确；可以使用精确配置或等价布局方案。若使用 autoVirtualHostRules，只能加入有源码或编译产物证据表明宿主节点会破坏该布局的组件，不能把同一页面或组件链中的 row-group、row-list 等无关组件一并加入。

outputs/src/pages/style/index.mpx:11-14 的 equal-row 是宽 240px 的 flex 容器；layout-cell.mpx:13 的真实根 view 使用 flex:1、min-width:0。outputs/mpx.config.js:7-9 的 autoVirtualHostRules 精确只匹配 layout-cell.mpx；结合给定 processTemplate/getVirtualHostRoot 证据，Web 编译会去除该组件宿主包装，使两个根 view 成为真实 flex 子项，各占 120px。规则未包含 row-group、row-list 等无关组件。

### C1.6：通过

静态追踪调用方样式类、theme-card 的 externalClasses 声明、组件内部节点和 Web 编译配置，确认外部样式真正作用到内容节点：两处文字颜色来自各自的调用方，custom-class 提供的 12px 内边距也必须保留。只保留 externalClasses 声明，或只配置新增的 tone-class，不能证明适配完成；允许采用其他能保留两端调用契约的实现，不要求保留未使用的默认类。本项不重复判断 C1.1 和 C1.4。

调用方 outputs/src/pages/style/index.mpx:9-10 分别传入 warm-tone/cool-tone 和 spaced-label，44-46 行定义 #bb3311、#2255cc 及 12px padding。theme-card.mpx:11 声明 tone-class、custom-class，模板第 3 行将二者消费在实际 theme-label 内容节点；outputs/mpx.config.js:6 同时配置这两个外部类。根据给定 processExternalClasses 规则，Web 会从 $attrs 取调用方类并传递 scoped module id，因此颜色和内边距均能作用到内容节点。

### C1.7：通过

只检查 help-card、help-item 的 SFC 文件、usingComponents、模板引用、属性传递和状态处理代码。父组件必须真实引用子组件；源码中应有标题绑定、初始收起状态、展开与收起的状态更新函数及对应条件渲染，两端共用同一套源码。只创建未引用的子组件，或仍把全部帮助项写在父组件中，不满足要求。选项式和组合式 API 均可，状态可由任一组件管理。

outputs/src/components/help-card.mpx:4-8 实际引用 help-item，50-54 行通过 usingComponents 注册，并传递 description、helpUrl；标题在第 3 行绑定。help-item.mpx:29-35 以 expanded:false 初始化并由 toggleDescription 反转状态，模板 8-9 行同步切换文案并用 wx:if 条件渲染说明。两端共用同一组 .mpx 文件。

### C1.8：通过

只检查源码中的 helpUrl 传递和路由调用链：面板属性传给帮助项，帮助入口的事件处理函数调用已有 WebView 路由，并按现有 url 参数约定完成一次正确编码。原地址中的查询参数和百分号转义必须能从表达式中静态推导为完整保留，不能重复解码，也不能只打印链接。子组件直接调用路由或通知父组件调用均可；不要求新建 WebView 或通信桥。

help-card.mpx:6 将 helpUrl 传给 help-item；help-item.mpx:23-26 接收属性，36-40 行的入口处理函数调用 @mpxjs/api-proxy 的 navigateTo，路由为 /pages/common/webview?url=${encodeURIComponent(this.helpUrl)}。完整 URL 仅编码一次；原查询分隔符及已有百分号会被编码并由 fixtures/src/pages/common/webview.mpx:9-11 按平台约定解码一次，因而可保留原地址。

### C1.9：通过

只检查 CSS 声明、变量作用域和回退表达式。帮助项按钮背景必须引用 --btn_wrapper_bg，并在未定义时回退到 #2A2F3F；从宿主到 help-card、help-item 的样式链中不能出现会遮蔽宿主变量的固定定义。允许使用 var 回退或等价的可靠默认值。

outputs/src/components/help-item.mpx:64-71 的按钮背景明确为 var(--btn_wrapper_bg, #2A2F3F)。help-card 和 help-item 样式中没有重新定义 --btn_wrapper_bg，宿主 fixtures/src/pages/review/index.mpx:5、24-26 设置的变量可沿组件宿主继承，未设置时使用规定回退色。

### C1.10：通过

静态检查 help-card 和 help-item 的样式作用域与选择器，确认它们不会污染宿主已有的 .title 和 .action，宿主原有字号、颜色和间距保持不变。可以使用 scoped、局部命名或其他有效隔离方式，不能通过修改宿主样式规避污染。

help-card.mpx:32 与 help-item.mpx:45 均使用 scoped 样式，且选择器统一采用 help-card__*、help-item__* 命名；没有定义通用 .title 或 .action，因此不会覆盖 fixtures 宿主 31-32 行的既有字号、颜色和间距。

### C1.11：通过

只检查宿主 item-class、help-card 属性或外部类传递、help-item 声明以及内部内容节点的类绑定，必要时同时检查 Web 编译配置。源码链必须能分别把两处调用方指定的文字颜色和内边距传到各自帮助项内容。样式只绑定在面板外壳、只声明但未用于内部节点，或按实例位置写死样式，都不满足要求。按钮变量、样式污染和已有 theme-card 分别由 C1.9、C1.10、C1.6 判断。

fixtures/src/pages/review/index.mpx:6-7 分别把 help-red/help-blue 作为 item-class 传入，33-34 行定义各自颜色及 12px/20px padding。help-card.mpx:29 声明 item-class，并在 4-8 行把它转传给 help-item；help-item.mpx:28 再次声明，模板第 2 行将 item-class 绑定到实际 help-item__content 内容节点。outputs/mpx.config.js:6 包含 item-class；依给定 Web 外部类转换规则，调用方类值会经 $attrs 穿过两层组件并携带所需作用域信息，而非只作用于面板外壳。


## Case 2：事件绑定与实例方法 / mpx2web / run-1

范围状态：**not_applicable**

待运行验证：

- Web 与微信小程序的实际编译、运行交互及视觉一致性超出本次静态源码评审范围，未进行实测。

### C2.1：通过

只检查模板事件绑定、WXS 或组件处理函数、change 事件参数、页面处理函数和模板状态引用。点击与 touchend 两条源码链都必须可达，并分别把对应操作值写入页面展示所引用的状态；空处理函数不能代替原行为。方法名和适配方式不限。

outputs/src/components/event-actions.mpx:5-11 分别为微信端 tap/touchend 绑定 WXS、Web 端绑定组件方法；17-22 的 WXS 与 30-35 的 Web 方法均调用 recordAction 并传入对应操作值，36-38 发送 change.detail.action。outputs/src/pages/panel/index.mpx:3、41-42 接收 change 并写入模板 4 行展示的 actionText，两条链路均可达且非空实现。

### C2.2：通过

只检查 notice 的源码传递链：叶子组件发送的 event.detail.message 经过包装组件到达页面监听函数，监听函数对通知计数只包含一次增量，其他事件处理函数不能复用该增量逻辑。只删除 bubbles/composed、添加 TODO 或硬编码消息，不能证明链路成立。

outputs/src/components/notice-leaf.mpx:9-13 发送 notice.detail.message。Web 端由 outputs/src/components/notice-wrapper.mpx:2、9-10 接收并原样转发 event.detail，再由 outputs/src/pages/panel/index.mpx:12、50-52 接收、展示 message 并仅递增一次 noticeCount；微信端通过 leaf 的 bubbles/composed 到达页面 11 行监听。Web 页面没有外层重复监听，其他处理函数也未调用 onNotice 或复用计数增量。

### C2.3：通过

静态检查 composition-counter 使用的实例 API、返回结构和调用链，确认挂载就绪通知指向当前正确的组件实例。不强制采用某一种 proxy 解构方式。

outputs/src/components/composition-counter.mpx:11-19 在 setup 中取得 useReadyNotice 返回函数，注册到 onMounted，并暴露修改当前组件 readyText 的 recordReady。outputs/src/composables/use-ready-notice.js:3-5 在 setup 调用期间取得 current，挂载时通过 current.proxy.recordReady() 调用当前实例。结合给定框架证据，Web 的 Vue getCurrentInstance 返回含 proxy 的对象，小程序的 MpxProxy 也统一令 proxy 指向 target，因此同一可达调用链在两端均指向正确实例。

### C2.5：不通过

只检查组件查询表达式、目标组件标识、Web 编译后的标识形态和当前 matcher 源码。静态推导结果必须表明“选中首项”的查询可匹配第一项，“清空两项”的查询可匹配全部两项。不能只修复首项，同时保留 matcher 无法读取的批量 class 查询。可以使用 id、ref、有效选择器、数据驱动或其他等价方案。

outputs/src/pages/panel/index.mpx:6-7 仅以 class="choice" 标识两个目标，45 与 48 分别使用 .choice 查询首项和全部项。给定 processWebClass 会把静态 class 改造成动态 :class 数组，而给定 matchSelector 只读取 vnode.data.staticClass（以及 attrs.id），不读取动态 class 数据；候选又没有 id、ref 或数据驱动兜底。因此 Web 静态推导中 selectComponent('.choice') 无法匹配首项，selectAllComponents('.choice') 也无法匹配两项。

### C2.6：通过

只检查 orderedItems、倒序方法、稳定 key、摘要计算代码以及 relation-list 的数据引用。源码应表明摘要直接取自当前数组顺序，因此初始数据推导为“甲、乙、丙”，倒序表达式推导为“丙、乙、甲”。实现不能依赖 Web 未消费的 relations.target 或 linkChanged 才能更新；保留未使用的关系元数据本身不判错。允许数据驱动等价实现，不要求完整 relations 引擎；普通 Behavior 已受支持，不强制改成 mixins。

outputs/src/pages/panel/index.mpx:31-35 的 orderedItems 初始顺序为甲、乙、丙且具有稳定 id，19 行使用 wx:key="id"；38-40 通过当前数组副本 reverse 后重新赋值，可再次点击恢复。18 行把 orderedItems 传给 relation-list，outputs/src/components/relation-list.mpx:12-25 的 orderText 直接按当前 items 顺序映射 label 并以顿号连接，因此初始推导为“甲、乙、丙”，倒序后为“丙、乙、甲”；非空 items 路径不依赖 relations.target、linked 或 linkChanged。


## Case 3：平台 API、分享与组件引用 / mpx2web / run-1

范围状态：**not_applicable**

待运行验证：

- 真实浏览器及微信环境中的分享、位置、扫码、插件、原生输入和视频播放交互属于本次静态评审范围外，未进行运行验证。
- delivery-notes.txt 声称真实局部编译通过；本次按要求未运行构建，因此该自述未被独立验证。

### C3.1：通过

只检查分享声明、平台条件、模板入口和可达处理代码。微信有效分支必须保留分享入口与原分享配置；Web 有效分支必须完成真实登记或明确隔离。题目未提供 Web 分享协议时，源码或交付说明应标出未接入边界，不能返回伪造的成功结果；说明不要求出现字面量 TODO。

outputs/src/pages/content/index.mpx:4 为微信保留 open-type@wx="share"，Web 点击绑定 shareOnWeb；63-65 行明确显示“Web 分享服务尚未接入”，未伪造成功结果；72-75 行仅在 __mpx_mode__ === 'wx' 时登记 onShareAppMessage，且保留原 title 与 path。

### C3.2：通过

只检查名称编辑相关的模板入口、状态字段、确认与取消回调、赋值语句和平台条件。Web 有效源码中必须存在可输入名称、确认后赋值、取消时不赋值的完整链路；可以使用目标端其他原生交互，不要求弹窗外观一致。不能因局部选项不支持而停用整个功能，也不能写入伪造结果。JS 中的 @mpx 条件注释不是有效平台分支，如果两端实际会执行同一段不兼容代码，则不满足要求。

outputs/src/pages/content/index.mpx:9 保留名称编辑入口；47-61 行通过 __mpx_mode__ 形成真实平台控制流。Web 使用 window.prompt 提供输入，返回非 null 时才赋值 displayName，取消返回 null 时不赋值；微信继续使用 editable showModal，并仅在 result.confirm 时写入 result.content。

### C3.3：通过

只检查业务模板、usingComponents、模块顶层引用、平台条件和可达调用。微信有效源码必须保留只读扫码组件及结果通知；题目未提供 Web 扫码协议时，Web 有效源码必须移除对该组件的解析链，并提供不可用提示和待接入说明。只隐藏模板节点不够：Web JSON 若仍通过 usingComponents 解析包含 camera 的原生组件，则不满足要求；JSON 中的 @mpx 注释也不能移除引用。直接保留不可用调用、使用空组件、伪造扫码结果或修改只读依赖均不满足要求。不强制采用平台文件。

outputs/src/components/scan-entry.mpx:37-46 使用动态 JSON，仅微信配置 native-scanner；Web JSON 不再解析包含 camera 的只读组件。14-21 行使 Web 点击仅显示“Web 扫码服务尚未接入”，不会生成扫码结果；微信仍启动扫描。23-30 行及 outputs/src/pages/content/index.mpx:66-68 保留真实结果通知链。input 与 outputs 中 vendor/native-scanner/index.mpx 逐字一致，未修改只读依赖。

### C3.4：通过

只检查 video 的组件引用、src 与播放属性绑定、事件绑定和事件字段读取代码。微信有效源码应优先读取 event.detail；当前 Web video 通过 inheritEvent 透传原生 target，因此 detail 缺字段时可以从真实 target 数值属性做安全回退，也可以隔离无法可靠提供的辅助字段，不能构造伪造值。

outputs/src/components/video-info.mpx:3-10 保留 video、src、controls，并将 timeupdate/loadedmetadata 事件限定为微信；26-33 行微信处理优先读取 event.detail 的真实字段。Web 保留核心播放，同时在12-16行隔离无法可靠提供的辅助进度和尺寸字段并明确说明降级，未构造伪造数值。

### C3.5：通过

只检查位置功能的平台条件、API 调用和提示代码。微信有效源码必须保留原位置调用；题目未提供 Web 位置协议时，Web 有效源码必须使 wx.chooseLocation 不可达，并提供未接入说明或 TODO，不能写入伪造位置。JS 中的 @mpx 条件注释不是有效平台分支；若 Web 仍可达微信 API，或微信会执行 Web 兜底代码，则不满足要求。

outputs/src/pages/content/index.mpx:35-45 中 Web 分支先设置“Web 位置服务尚未接入”并立即 return，因此 wx.chooseLocation 在 Web 不可达；微信分支仍调用原 chooseLocation，并仅用真实成功结果更新 placeName。

### C3.6：通过

只检查 app plugins、plugin:// 组件声明、usingComponents、平台条件和模板引用。微信有效源码必须保留插件卡片；Web 有效源码不能解析或渲染该插件。题目未提供 Web 插件协议时，可以隔离并提供不可用提示和待接入说明，但不能使用空组件或伪造插件内容。JSON 中的 @mpx 注释不能隔离 plugins 或 usingComponents，只隐藏模板节点也不能证明构建依赖已移除；保留未被 Web 消费的微信元数据本身不判错。

outputs/src/app.mpx:13-21 仅微信动态加入 plugins；outputs/src/pages/content/index.mpx:83-93 仅微信动态加入 plugin://foo/component；模板14-15行仅微信渲染 foo-card，Web 显示未接入提示。因此 Web 不解析或渲染插件，也没有空组件或伪造插件内容。


## Case 4：路由配置与旧版 Store 详情页 SSR / mpx2web / run-1

范围状态：**not_applicable**

待运行验证：

- 需在安装候选说明中的 Pinia 依赖后实际执行 Web client/server 构建，确认产物与宿主 renderer 集成。
- 需在部署服务器验证 /help-demo/ 静态资源处理、页面请求转交及详情页直接访问和刷新。
- 需运行 SSR 与浏览器接管验证首屏 HTML、注水后同文章去重、并发请求隔离及 a 慢 b 快竞态行为。
- 需在 Web 和微信环境实测自定义导航布局、页面交互及最终视觉效果。

### C4.2：通过

只检查平台条件、页面 JSON、导航模板和布局赋值代码。Web 有效源码不能调用微信胶囊相关 API，且配置与模板组合不能同时保留系统导航和自定义导航；微信有效源码必须保留原导航链。导航高度等尺寸依据属于 D4.1，缺少说明不影响本项功能判定。

outputs/src/app.mpx:25-30 保留主包、分包页面且 window.navigationStyle 仍为 custom，未形成系统导航与自定义导航并存。outputs/src/pages/home/index.mpx:21-25 在 Web 路径先返回，胶囊 API 仅在非 Web 有效路径调用；微信路径仍保留胶囊尺寸读取及原自定义导航模板。

### C4.3：通过

只检查构建过程实际读取的配置和生成代码。Web 的资源前缀、运行时 history/base、服务端路由和客户端路由必须统一为 /help-demo/；服务端与客户端的文章路由代码必须从同一路径读取同一个 query id，主包和两个分包页面也必须保留。未被构建代码消费的同名字段或另一套 # 地址不能作为证据。服务器 rewrite、部署配置和真实刷新归 D4.2。

outputs/mpx.config.js:2 将构建资源前缀设为 /help-demo/；outputs/src/app.mpx:8-14 设置实际运行时 history 路由及 base=/help-demo/。文章页服务端 serverPrefetch 与客户端 onLoad 分别在 outputs/src/pages/article/index.mpx:24-31 从同一路由的 query.id 读取参数。outputs/src/app.mpx:25-30 同时保留三个主包页面以及 packageA、packageB 两个分包页面；fixtures/runtime-contract.md:6 约定宿主仅在交给 renderer 前移除部署前缀，与该内部路由一致。

### C4.4：通过

静态检查 Web 构建实际使用的尺寸配置和换算公式。根据公式计算后，在 375px 和 750px Web 视口下，200rpx 都应等于 100 CSS px，28rpx 都应等于 14 CSS px；微信原有换算规则必须保留，配置必须能够正确序列化。

outputs/mpx.config.js:7-13 的构建实际使用 webConfig.transRpxFn，公式为 Number(value)/2 px，因此 200rpx=100px、28rpx=14px，且不依赖 375px 或 750px 视口。该配置是可序列化的普通函数；它位于 Web 专用配置中，没有改变微信换算规则。

### C4.5：通过

只检查服务端预取入口、路由 id 读取、文章加载 action 或等价异步函数、Promise 返回或 await 关系以及模板状态引用。源码链必须表明：预取函数把文章 id 传入加载逻辑，并将其 Promise 返回或等待完成，模板随后读取该状态。只调用异步函数但丢失等待链不满足要求。

outputs/src/pages/article/index.mpx:28-31 的 serverPrefetch 从 this.$route.query.id 取 id，传给并返回 this.loadArticle(...) 的 Promise。该 action 映射到 outputs/src/store/article.js:15-52，内部等待 fetchArticle；页面模板第3-9行通过 mapState 第23行读取同一 store 的 loading、errorText 和 article。

### C4.6：通过

只检查旧 createStore 到 @mpxjs/pinia 的迁移代码，以及 Mpx 官方 SSR 状态链中的应用注册、服务端状态写入、序列化入口、客户端恢复时机和页面 store 引用；这些位置必须指向同一份 Pinia 状态。不要求自行实现框架已有的注水逻辑。请求隔离由 C4.7 检查，客户端异步竞态由 C4.8 检查；重复请求和展开/收起效果只进入待运行验证，不在本项扣分。

旧 createStore 已在 outputs/src/store/article.js:1-57 迁移为 @mpxjs/pinia defineStore。outputs/src/app.mpx:17-20 在 onAppInit 创建并返回 pinia，页面第15-16、23、33行通过同一 useArticleStore 映射状态和 action。结合题面给出的 Mpx 官方运行时链，每次服务端应用把该 pinia 注入 Vue，rendered 时写入 pinia.state.value，客户端在挂载前把 window.__INITIAL_STATE__ 恢复到同一 pinia，状态传输链完整。

### C4.7：通过

只检查应用初始化、SSR context、store 创建位置和页面获取 store 的引用关系。源码必须表明每次 SSR 请求创建独立状态实例，并且页面实际使用该请求实例；文章 a 与文章 b 的状态引用不能指向同一个模块级活动 store。只新增未被页面使用的工厂、继续导入模块级单例，或在请求开始前清空共享状态，都不满足要求。Pinia 迁移与恢复由 C4.6 判断，客户端竞态由 C4.8 判断。

outputs/src/app.mpx:17-20 把 createPinia() 放在每次应用实例执行的 onAppInit 中；题面框架源码表明 SSR 每个 context 都重新 createApp 并将该返回值注入当前 Vue。outputs/src/pages/article/index.mpx 使用 mapState/mapActions 从当前组件注入的 pinia 获取 store，没有导入模块级 store 单例。outputs/src/store/article.js 的模块级 WeakMap 仅以请求内 store 实例为键，不共享 article 状态。

### C4.8：通过

只检查文章加载方法中的过期请求保护。源码应在发起请求时记录请求标识，并在成功、失败和 finally 分支修改 article、errorText、loading 前判断返回结果是否仍属于最新请求。结合输入中 a=40ms、b=10ms 的固定条件，从这些判断表达式静态推导晚返回的 a 是否会被忽略。缺少保护、只保护 article，或无条件提交异步结果，都不满足要求。

outputs/src/store/article.js:31-51 为每次请求建立 record，并把最新 record 存入按 store 隔离的 WeakMap，同时记录 activeId。成功分支第34行、失败分支第40行、finally 第45行均在修改 article/resolvedId、errorText 或 loading 前校验 record 和 activeId。a 后于 b 返回时，WeakMap 已指向 b 或已被 b 删除，所以 a 无法覆盖 b。

### C4.9：通过

只检查实际生效的配置、应用初始化、服务端预取函数和平台条件中对 window、document、navigator 等浏览器对象的引用。所有服务端可达路径都必须避开这些对象；仅客户端可达的分支可以使用。微信 onLoad 源码链由 C4.10 判断。

实际配置、outputs/src/app.mpx 和文章 serverPrefetch 均不读取 window、document 或 navigator。outputs/src/pages/home/index.mpx:21-23 在 Web/SSR 路径到达 wx.getMenuButtonBoundingClientRect 前返回；其余 wx 导航调用只位于客户端交互方法。文章服务端路径只使用 SSR 可用的 this.$route 和 store/service。

### C4.10：通过

只检查微信端有效的源码分支。页面源码中必须保留 onLoad，从 query.id 取得文章 id，并将该 id 传给文章加载方法；模板使用的 article、loading 和 errorText 必须来自该加载方法更新的同一状态。Web/SSR 改造不能删除、覆盖或切断这条引用链。本项不重复检查 Pinia 状态传输、请求隔离或服务端浏览器 API 安全。

outputs/src/pages/article/index.mpx:24-26 保留 onLoad，从 query.id（缺省 a）取得文章 id并传给 loadArticle。第23、33行把模板使用的 article、loading、errorText 与 loadArticle 映射到同一个 useArticleStore；outputs/src/store/article.js:26-47 由该 action 更新这些状态，微信加载链未被切断。


## Case 1：组件样式布局与帮助卡片生成 / no_skill / run-1

范围状态：**valid**

- S1.1 / passed：help-card.mpx、help-item.mpx 仅存在于 outputs，属于从零生成；outputs 未包含或改写 fixtures 中的只读宿主页和 WebView。其余交付仅包括既有页面、相关组件、图片资源及保留 srcMode: 'wx' 的必要 mpx.config.js 调整，没有平台副本或无关业务文件。

待运行验证：

- 真实 helpUrl 的微信业务域名许可及 Web iframe 加载许可属于部署环境条件，无法由本次静态源码评审确认。

### C1.1：不通过

静态检查 .image-row 中图片的模板、选择器和样式，确认 Web 端仍保留输入源码规定的 80px 宽高和 12px 圆角。实现方式不限。本项只检查图片；红蓝卡片隔离、两格等分和 externalClasses 分别由 C1.4、C1.5、C1.6 判断。

outputs/src/pages/style/index.mpx:3-4、50-51 保留了 <image> 和 80px×80px、12px 圆角，但选择器仍是 .image-row image。题面提供的 Web 运行时 mpx-image.vue 表明 aspectFill 模式最终渲染为带 mpx-image 类的 div，因此该标签选择器无法命中 Web 最终图片节点，尺寸和圆角没有 Web 端有效样式保障。

### C1.2：通过

只检查源码中的节点位置、祖先布局、定位声明和事件绑定。两个悬浮入口在 Web 有效代码中必须保留 position: fixed，祖先结构不能把它们变成相对局部内容的 absolute 定位；若移动节点，原样式、bindtap 处理函数和纵向列表节点仍须可达。已支持的 scroll-view 不要求替换。

outputs/src/pages/style/index.mpx:15-24 将两个入口分别移到 scroll-view 和 movable-area/movable-view 之外，成为仅含 padding 的 .style-page 的直接后代；53、56 行仍为 position: fixed，且 bindtap="recordTap"、recordTap 方法及 scroll-view 内 row-group 均保留。

### C1.4：通过

静态检查红色卡片和蓝色卡片的样式作用域与选择器，确认两个组件即使使用同名类也不会互相覆盖。可以使用 scoped、项目配置或其他有效隔离方式。

outputs/src/components/red-card.mpx:11 和 blue-card.mpx:11 均使用 scoped；各自同名 .card、.title 规则因此具有独立作用域，红蓝卡片样式不会互相覆盖。

### C1.5：通过

静态检查 layout-cell 的虚拟节点声明、实际生效的编译配置和 Web 最终节点层级，确认“甲”和“较长的乙”平分 240px，flex 作用在真实布局子项上。只声明 options.virtualHost 不能直接证明 Web 布局正确；可以使用精确配置或等价布局方案。若使用 autoVirtualHostRules，只能加入有源码或编译产物证据表明宿主节点会破坏该布局的组件，不能把同一页面或组件链中的 row-group、row-list 等无关组件一并加入。

outputs/src/pages/style/index.mpx:11-14、49 的 240px flex 容器直接调用两个 layout-cell；outputs/mpx.config.js:7-9 的 autoVirtualHostRules 精确只匹配 layout-cell.mpx，结合题面给出的 Web 模板编译逻辑会移除其 Web 实体宿主。outputs/src/components/layout-cell.mpx:9 声明小程序 virtualHost，15-19 将真实根节点固定为 flex: 0 0 120px 和 width: 120px，因此两个真实 flex 子项各占 120px；规则未误纳 row-group、row-list。

### C1.6：通过

静态追踪调用方样式类、theme-card 的 externalClasses 声明、组件内部节点和 Web 编译配置，确认外部样式真正作用到内容节点：两处文字颜色来自各自的调用方，custom-class 提供的 12px 内边距也必须保留。只保留 externalClasses 声明，或只配置新增的 tone-class，不能证明适配完成；允许采用其他能保留两端调用契约的实现，不要求保留未使用的默认类。本项不重复判断 C1.1 和 C1.4。

outputs/src/pages/style/index.mpx:9-10、46-48 从调用方分别传入 warm-tone/cool-tone 和 spaced-label；theme-card.mpx:3 将 tone-class、custom-class 同时绑定到内容节点，11-12 声明两者为 externalClasses；outputs/mpx.config.js:6 将 tone-class 与默认 custom-class 纳入 Web externalClasses。结合题面给出的 processExternalClasses/moduleId 传递逻辑，调用方 scoped 的 #bb3311、#2255cc 和 12px padding 均能落到内容节点。

### C1.7：通过

只检查 help-card、help-item 的 SFC 文件、usingComponents、模板引用、属性传递和状态处理代码。父组件必须真实引用子组件；源码中应有标题绑定、初始收起状态、展开与收起的状态更新函数及对应条件渲染，两端共用同一套源码。只创建未引用的子组件，或仍把全部帮助项写在父组件中，不满足要求。选项式和组合式 API 均可，状态可由任一组件管理。

outputs/src/components/help-card.mpx:3 显示 title，4-8 实际引用 help-item 并传递 description、helpUrl，43-49 注册子组件。help-item.mpx:21-27 以 false 初始化 expanded 并由 toggleDescription 更新，3 行按状态条件渲染说明，4-6 行提供展开/收起入口；两端共用同一组 .mpx 源码。

### C1.8：通过

只检查源码中的 helpUrl 传递和路由调用链：面板属性传给帮助项，帮助入口的事件处理函数调用已有 WebView 路由，并按现有 url 参数约定完成一次正确编码。原地址中的查询参数和百分号转义必须能从表达式中静态推导为完整保留，不能重复解码，也不能只打印链接。子组件直接调用路由或通知父组件调用均可；不要求新建 WebView 或通信桥。

help-card.mpx:6 将 helpUrl 传给 help-item；help-item.mpx:13、28-32 调用 @mpxjs/api-proxy 的 navigateTo，并且仅用一次 encodeURIComponent 将完整 helpUrl 放入 /pages/common/webview?url= 参数。fixtures/src/pages/common/webview.mpx:9-12 按现有约定在 Web 使用路由已解码值、在小程序端 decodeURIComponent 一次，因此原 URL 自带查询参数和百分号转义可完整恢复。

### C1.9：通过

只检查 CSS 声明、变量作用域和回退表达式。帮助项按钮背景必须引用 --btn_wrapper_bg，并在未定义时回退到 #2A2F3F；从宿主到 help-card、help-item 的样式链中不能出现会遮蔽宿主变量的固定定义。允许使用 var 回退或等价的可靠默认值。

outputs/src/components/help-item.mpx:57-68 的按钮背景为 var(--btn_wrapper_bg, #2A2F3F)。help-card 和 help-item 均未固定定义 --btn_wrapper_bg；fixtures/src/pages/review/index.mpx:5、24-26 将变量定义在两组件的宿主祖先上，因此可继承宿主值，未定义时使用规定回退色。

### C1.10：通过

静态检查 help-card 和 help-item 的样式作用域与选择器，确认它们不会污染宿主已有的 .title 和 .action，宿主原有字号、颜色和间距保持不变。可以使用 scoped、局部命名或其他有效隔离方式，不能通过修改宿主样式规避污染。

outputs/src/components/help-card.mpx:25 和 help-item.mpx:38 均使用 scoped，且选择器统一采用 help-card__*、help-item__* 局部命名；没有声明宿主使用的 .title 或 .action。fixtures/src/pages/review/index.mpx:30-35 的原有标题和操作区样式未被修改。

### C1.11：通过

只检查宿主 item-class、help-card 属性或外部类传递、help-item 声明以及内部内容节点的类绑定，必要时同时检查 Web 编译配置。源码链必须能分别把两处调用方指定的文字颜色和内边距传到各自帮助项内容。样式只绑定在面板外壳、只声明但未用于内部节点，或按实例位置写死样式，都不满足要求。按钮变量、样式污染和已有 theme-card 分别由 C1.9、C1.10、C1.6 判断。

fixtures/src/pages/review/index.mpx:6-7 分别向 help-card 传入 help-red/help-blue，33-34 定义各自颜色及 12px/20px padding。help-card.mpx:7、21 将收到的 item-class 外部类继续传给 help-item；help-item.mpx:2、20 声明并把 item-class 绑定到内部内容根节点。outputs/mpx.config.js:6 配置 item-class，结合题面所给 Web 外部类和父 moduleId 传播逻辑，两处调用方 scoped 类可分别作用到各自内容节点，而非仅面板外壳。


## Case 2：事件绑定与实例方法 / no_skill / run-1

范围状态：**not_applicable**

待运行验证：

- 按要求未运行 Web、微信小程序或真机环境；实际渲染布局及交互效果属于本次静态评审范围外。

### C2.1：通过

只检查模板事件绑定、WXS 或组件处理函数、change 事件参数、页面处理函数和模板状态引用。点击与 touchend 两条源码链都必须可达，并分别把对应操作值写入页面展示所引用的状态；空处理函数不能代替原行为。方法名和适配方式不限。

outputs/src/components/event-actions.mpx 中 tap 与 touchend 分别绑定 onTap、onTouchEnd，两者调用 recordAction 并以 change 的 event.detail.action 发送“点击”或“触摸结束”；outputs/src/pages/panel/index.mpx 的 bindchange 指向 onActionChange，该函数将 event.detail.action 写入模板展示的 actionText。两条链路均完整可达。

### C2.2：通过

只检查 notice 的源码传递链：叶子组件发送的 event.detail.message 经过包装组件到达页面监听函数，监听函数对通知计数只包含一次增量，其他事件处理函数不能复用该增量逻辑。只删除 bubbles/composed、添加 TODO 或硬编码消息，不能证明链路成立。

outputs/src/components/notice-leaf.mpx 的 sendNotice 发送 notice，detail.message 为“来自内层组件”；outputs/src/components/notice-wrapper.mpx 通过 bindnotice 接收并由 forwardNotice 原样转发 event.detail；outputs/src/pages/panel/index.mpx 在 notice-wrapper 上监听 onNotice，读取 event.detail.message，并仅在该函数中执行一次 noticeCount += 1。其他处理函数未复用计数逻辑。

### C2.3：通过

静态检查 composition-counter 使用的实例 API、返回结构和调用链，确认挂载就绪通知指向当前正确的组件实例。不强制采用某一种 proxy 解构方式。

outputs/src/components/composition-counter.mpx 每次 setup 都创建当前组件专属的 readyText 与 recordReady 闭包，useReadyNotice(recordReady) 返回挂载回调，onMounted 调用该回调后执行同一 setup 中的 recordReady，将 readyText.value 更新为“已就绪”；setup 同时返回 readyText 和 recordReady。该等价实现不依赖跨平台结构不同的内部实例字段，调用链明确指向当前组件状态。

### C2.5：不通过

只检查组件查询表达式、目标组件标识、Web 编译后的标识形态和当前 matcher 源码。静态推导结果必须表明“选中首项”的查询可匹配第一项，“清空两项”的查询可匹配全部两项。不能只修复首项，同时保留 matcher 无法读取的批量 class 查询。可以使用 id、ref、有效选择器、数据驱动或其他等价方案。

outputs/src/pages/panel/index.mpx 的 selectFirst 使用 .choice-first，resetChoices 使用 .choice，目标类分别写在第一项和两项 choice-item 上；但给定 processWebClass 会把静态 class 转换为动态 :class 数组，而当前 matchSelector 只读取 vnode.data.staticClass，不读取动态 class。故 Web 编译后两条 class 查询均无法由 matcher 证明可匹配，且源码没有 id、ref 或数据驱动兜底：首项选择不能静态推导为命中第一项，批量清空也不能静态推导为命中全部两项。

### C2.6：通过

只检查 orderedItems、倒序方法、稳定 key、摘要计算代码以及 relation-list 的数据引用。源码应表明摘要直接取自当前数组顺序，因此初始数据推导为“甲、乙、丙”，倒序表达式推导为“丙、乙、甲”。实现不能依赖 Web 未消费的 relations.target 或 linkChanged 才能更新；保留未使用的关系元数据本身不判错。允许数据驱动等价实现，不要求完整 relations 引擎；普通 Behavior 已受支持，不强制改成 mixins。

outputs/src/pages/panel/index.mpx 的 orderedItems 初始顺序为甲、乙、丙，reverseItems 使用 slice().reverse() 生成倒序，循环采用稳定的 wx:key="id"；同文件将当前 orderedItems 传给 relation-list。outputs/src/components/relation-list.mpx 的 orderText 直接对当前 items 执行 map(item => item.label).join('、')，因此可静态推导初始摘要为“甲、乙、丙”，倒序后为“丙、乙、甲”，再次调用可恢复，且不依赖 relations.target 或 linkChanged。


## Case 3：平台 API、分享与组件引用 / no_skill / run-1

范围状态：**not_applicable**

待运行验证：

- 微信分享、chooseLocation、camera 扫码及 foo 插件的实际可用性依赖测试环境、授权和插件环境，超出本次静态源码评审范围。
- Web 名称编辑交互以及 video 在真实浏览器中透传的媒体事件数值、播放与布局效果仍需目标环境验证；本次未运行浏览器或构建。

### C3.1：通过

只检查分享声明、平台条件、模板入口和可达处理代码。微信有效分支必须保留分享入口与原分享配置；Web 有效分支必须完成真实登记或明确隔离。题目未提供 Web 分享协议时，源码或交付说明应标出未接入边界，不能返回伪造的成功结果；说明不要求出现字面量 TODO。

outputs/src/pages/content/index.mpx:1-14 的微信模板保留 open-type="share"，39-83 的微信脚本保留 onShareAppMessage 及原 title/path 配置。Web 模板 15-38 使用 showShareUnavailable，Web 脚本 96-137 明确显示“Web 分享服务未接入”，且微信分享钩子被 mode="wx" 隔离，没有伪造分享成功。

### C3.2：通过

只检查名称编辑相关的模板入口、状态字段、确认与取消回调、赋值语句和平台条件。Web 有效源码中必须存在可输入名称、确认后赋值、取消时不赋值的完整链路；可以使用目标端其他原生交互，不要求弹窗外观一致。不能因局部选项不支持而停用整个功能，也不能写入伪造结果。JS 中的 @mpx 条件注释不是有效平台分支，如果两端实际会执行同一段不兼容代码，则不满足要求。

outputs/src/pages/content/index.mpx:23-29 提供 Web 名称输入框及确认、取消入口；101-102 定义 draftName/editingName；117-125 打开编辑并接收真实输入；126-132 仅在确认时将 draftName 赋给 displayName，取消只关闭编辑状态。微信端 67-76 保留原 editable showModal 链路。

### C3.3：通过

只检查业务模板、usingComponents、模块顶层引用、平台条件和可达调用。微信有效源码必须保留只读扫码组件及结果通知；题目未提供 Web 扫码协议时，Web 有效源码必须移除对该组件的解析链，并提供不可用提示和待接入说明。只隐藏模板节点不够：Web JSON 若仍通过 usingComponents 解析包含 camera 的原生组件，则不满足要求；JSON 中的 @mpx 注释也不能移除引用。直接保留不可用调用、使用空组件、伪造扫码结果或修改只读依赖均不满足要求。不强制采用平台文件。

outputs/src/components/scan-entry.mpx:1-32 的微信分支保留 native-scanner、扫码结果转发和相机失败提示，51-55 的微信 JSON 保留只读扫码组件声明；57-60 的 Web JSON 已彻底移除 native-scanner 引用，Web 模板也不解析该组件，34-46 仅给出“Web 扫码服务未接入”的真实边界。outputs/src/vendor/native-scanner/index.mpx 与输入只读依赖一致。

### C3.4：通过

只检查 video 的组件引用、src 与播放属性绑定、事件绑定和事件字段读取代码。微信有效源码应优先读取 event.detail；当前 Web video 通过 inheritEvent 透传原生 target，因此 detail 缺字段时可以从真实 target 数值属性做安全回退，也可以隔离无法可靠提供的辅助字段，不能构造伪造值。

outputs/src/pages/content/index.mpx:11、33 及两端 usingComponents 均保留 video-info 和 src 绑定。outputs/src/components/video-info.mpx:3 保留 video 的 src、controls、timeupdate、loadedmetadata 绑定；微信处理 16-23 继续读取 event.detail。Web 处理 30-51 优先读取 detail，缺字段时回退到 inheritEvent 透传的真实 target/currentTarget 数值属性，并通过 Number 转换及零值降级避免直接使用无效字段。

### C3.5：通过

只检查位置功能的平台条件、API 调用和提示代码。微信有效源码必须保留原位置调用；题目未提供 Web 位置协议时，Web 有效源码必须使 wx.chooseLocation 不可达，并提供未接入说明或 TODO，不能写入伪造位置。JS 中的 @mpx 条件注释不是有效平台分支；若 Web 仍可达微信 API，或微信会执行 Web 兜底代码，则不满足要求。

outputs/src/pages/content/index.mpx:39-83 的 mode="wx" 脚本保留 wx.chooseLocation 及成功赋值；84-138 的 mode="web" 脚本中 choosePlace 只显示“Web 位置服务未接入”，不存在可达的 wx.chooseLocation，也没有写入伪造位置。两端模板分别绑定各自平台脚本中的同名方法。

### C3.6：通过

只检查 app plugins、plugin:// 组件声明、usingComponents、平台条件和模板引用。微信有效源码必须保留插件卡片；Web 有效源码不能解析或渲染该插件。题目未提供 Web 插件协议时，可以隔离并提供不可用提示和待接入说明，但不能使用空组件或伪造插件内容。JSON 中的 @mpx 注释不能隔离 plugins 或 usingComponents，只隐藏模板节点也不能证明构建依赖已移除；保留未被 Web 消费的微信元数据本身不判错。

outputs/src/app.mpx:8-19 的微信 JSON 保留 foo 插件声明，outputs/src/pages/content/index.mpx:147-155 保留 plugin://foo/component，微信模板 1-14 保留 foo-card。Web app JSON 20-24 不含 plugins，Web 页面 JSON 156-163 不含 foo-card，Web 模板不渲染插件，仅明确提示服务卡片未接入。


## Case 4：路由配置与旧版 Store 详情页 SSR / no_skill / run-1

范围状态：**not_applicable**

待运行验证：

- 需在实际部署环境确认 /help-demo/ 下静态资源与 SSR 页面请求的服务器转发、直接访问及刷新行为。
- 修复 Pinia 状态链和请求隔离后，需运行确认首屏 HTML 包含对应文章、客户端 hydration 正常且不会重复加载同一文章。
- 需在 375px、750px Web 视口及微信真机确认最终布局、导航外观、选择页通信和文章展开/收起交互。

### C4.2：通过

只检查平台条件、页面 JSON、导航模板和布局赋值代码。Web 有效源码不能调用微信胶囊相关 API，且配置与模板组合不能同时保留系统导航和自定义导航；微信有效源码必须保留原导航链。导航高度等尺寸依据属于 D4.1，缺少说明不影响本项功能判定。

outputs/src/app.mpx:11 保持 navigationStyle="custom"，模板继续使用 outputs/src/pages/home/index.mpx:3-5 的自定义头部，不存在系统导航与自定义导航同时启用。home/index.mpx:21-27 在 __mpx_mode__ === 'web' 时先返回，Web 不会调用微信胶囊 API；微信分支仍调用 wx.getMenuButtonBoundingClientRect() 并赋值 topInset、headerHeight，原导航链保留。

### C4.3：通过

只检查构建过程实际读取的配置和生成代码。Web 的资源前缀、运行时 history/base、服务端路由和客户端路由必须统一为 /help-demo/；服务端与客户端的文章路由代码必须从同一路径读取同一个 query id，主包和两个分包页面也必须保留。未被构建代码消费的同名字段或另一套 # 地址不能作为证据。服务器 rewrite、部署配置和真实刷新归 D4.2。

outputs/mpx.config.js:7 的 publicPath、14-17 的 history/base 均统一为 /help-demo/，且位于宿主明确读取的 mpx.config.js 中。outputs/src/app.mpx:10、13-15 保留三个主包页面及 packageA、packageB 两个分包页面。框架生成的服务端与客户端路由均为 /pages/article/index；outputs/src/pages/article/index.mpx:23-27 统一从 onLoad 的 query.id 读取文章 id。未发现另一套 hash 路由。

### C4.4：通过

静态检查 Web 构建实际使用的尺寸配置和换算公式。根据公式计算后，在 375px 和 750px Web 视口下，200rpx 都应等于 100 CSS px，28rpx 都应等于 14 CSS px；微信原有换算规则必须保留，配置必须能够正确序列化。

outputs/mpx.config.js:18-21 在仅供 Web 使用的 webConfig.transRpxFn 中返回 Number(value)/2 px；200rpx 和 28rpx 分别静态计算为 100px、14px，与视口宽度无关。该函数能由框架直接嵌入生成代码，微信构建不使用这项 Web 换算配置，原 rpx 规则未改动。

### C4.5：通过

只检查服务端预取入口、路由 id 读取、文章加载 action 或等价异步函数、Promise 返回或 await 关系以及模板状态引用。源码链必须表明：预取函数把文章 id 传入加载逻辑，并将其 Promise 返回或等待完成，模板随后读取该状态。只调用异步函数但丢失等待链不满足要求。

依据给定框架源码，SSR 页面 created 阶段会以 router.currentRoute.query 调用 onLoad。outputs/src/pages/article/index.mpx:23-27 将 query.id（缺省 a）传给 loadArticle，并保存、返回其 Promise；29-30 的 serverPrefetch 返回同一 Promise，Vue SSR renderer 会等待它。store/article.js:23-40 的 action await fetchArticle(id) 后更新状态，模板 3-9 随后读取 loading、errorText、article。

### C4.6：不通过

只检查旧 createStore 到 @mpxjs/pinia 的迁移代码，以及 Mpx 官方 SSR 状态链中的应用注册、服务端状态写入、序列化入口、客户端恢复时机和页面 store 引用；这些位置必须指向同一份 Pinia 状态。不要求自行实现框架已有的注水逻辑。请求隔离由 C4.7 检查，客户端异步竞态由 C4.8 检查；重复请求和展开/收起效果只进入待运行验证，不在本项扣分。

outputs/src/store/article.js:1-4 仍使用 @mpxjs/core 的 createStore，未迁移到 @mpxjs/pinia；outputs/src/app.mpx:5-6 只是 createApp({})，没有在 onAppInit 中 createPinia 并把 pinia 注册到应用。页面 15、22、32 仍引用旧 store。给定的 Mpx 官方 SSR 链只会把该请求 pinia.state.value 写入 context.state，并在客户端恢复到 Pinia；候选没有同一份 Pinia 状态可供服务端序列化和客户端恢复。store 中声称 createStore 会从 window.__INITIAL_STATE__ 恢复的注释不能构成实现证据。

### C4.7：不通过

只检查应用初始化、SSR context、store 创建位置和页面获取 store 的引用关系。源码必须表明每次 SSR 请求创建独立状态实例，并且页面实际使用该请求实例；文章 a 与文章 b 的状态引用不能指向同一个模块级活动 store。只新增未被页面使用的工厂、继续导入模块级单例，或在请求开始前清空共享状态，都不满足要求。Pinia 迁移与恢复由 C4.6 判断，客户端竞态由 C4.8 判断。

outputs/src/store/article.js:4 在模块作用域创建并默认导出单个 store；outputs/src/pages/article/index.mpx:15 直接导入该对象，并通过其 mapState/mapActions 消费。outputs/src/app.mpx 没有在每次 SSR 请求的 onAppInit 中创建状态实例，也没有把请求实例传给页面。因此文章 a、b 的 SSR 请求会指向同一个模块级活动状态，源码不能证明请求级隔离。

### C4.8：通过

只检查文章加载方法中的过期请求保护。源码应在发起请求时记录请求标识，并在成功、失败和 finally 分支修改 article、errorText、loading 前判断返回结果是否仍属于最新请求。结合输入中 a=40ms、b=10ms 的固定条件，从这些判断表达式静态推导晚返回的 a 是否会被忽略。缺少保护、只保护 article，或无条件提交异步结果，都不满足要求。

outputs/src/store/article.js:12-16 在发起请求时把 id 写入 requestedId。成功分支 34、失败分支 37 和 finally 分支 39 在分别修改 article、errorText、loading 前都检查 state.requestedId === id。按 a=40ms、b=10ms，b 启动后 requestedId 为 b；晚返回的 a 无法提交 article，也无法改写错误或 loading。

### C4.9：通过

只检查实际生效的配置、应用初始化、服务端预取函数和平台条件中对 window、document、navigator 等浏览器对象的引用。所有服务端可达路径都必须避开这些对象；仅客户端可达的分支可以使用。微信 onLoad 源码链由 C4.10 判断。

实际配置、outputs/src/app.mpx、文章 serverPrefetch 和文章 store 的运行代码均不引用 window、document、navigator。outputs/src/pages/home/index.mpx:24 在 Web/SSR 路径先返回，后续微信胶囊调用不可达；choice 页中的 getCurrentPages/wx.navigateBack 只位于用户 confirm 事件方法内，不在服务端预取或初始化路径。store 中 window.__INITIAL_STATE__ 仅出现在注释里。

### C4.10：通过

只检查微信端有效的源码分支。页面源码中必须保留 onLoad，从 query.id 取得文章 id，并将该 id 传给文章加载方法；模板使用的 article、loading 和 errorText 必须来自该加载方法更新的同一状态。Web/SSR 改造不能删除、覆盖或切断这条引用链。本项不重复检查 Pinia 状态传输、请求隔离或服务端浏览器 API 安全。

outputs/src/pages/article/index.mpx:23-27 保留 onLoad，从 query.id 取得 id（并保留默认 a），把它传给 loadArticle。页面 22、32 通过同一个 articleStore 映射 article、loading、errorText 和 loadArticle；store/article.js:23-40 的该 action 更新的正是模板 3-9 消费的三项状态，微信加载引用链未被切断。

