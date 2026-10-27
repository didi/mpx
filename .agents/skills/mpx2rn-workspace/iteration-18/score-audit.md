# iteration-18 评分准确性复核

> 已根据用户提供的模拟器实测撤回“首帧 opacity:0 即扣分”的结论。当前复核与自动评分为 mpx 60/61、mpx2rn 59/61。上次 59/61 的记录保存在 [scoring-before-opacity-correction/](scoring-before-opacity-correction/)。

依据 12 份实际输出复核两组各 61 条断言（共 122 个判定）。采用源码审阅、真实 wx/iOS 编译、RN 模板/样式编译产物，以及执行输出脚本的针对性探针。未重跑模型或修改输出；原始评分与此前复核记录均已归档。透明度结论结合用户提供的模拟器测试修正，并非由本次评审重新运行模拟器。

**当前复核为 mpx 60/61（98.36%）、mpx2rn 59/61（96.72%）。相较最初评分，共纠正 11 次误扣分和 1 次误判通过。** 单轮、有限断言下的结果不能代表整体质量。

| 组别 | 原始得分 | 补回误扣分 | 撤销误判通过 | 复核得分 |
| --- | ---: | ---: | ---: | ---: |
| mpx | 53/61 | +7 | 0 | **60/61** |
| mpx2rn | 56/61 | +4 | -1 | **59/61** |

## 判定变更及证据

| 用例 / 组 | 断言 | 原判 → 复核 | 证据 |
| --- | --- | --- | --- |
| 0 / mpx | s8 | 失败 → 通过 | 模板新增 summary-accent view；真实 RN 样式解析得到 height=4rpx、backgroundColor=#1677ff，与输入伪元素一致。旧检查遗漏 background-color。 [输出](eval-0-style-layout-adaptation/mpx/outputs/data-panel.mpx) |
| 0 / mpx | l12 | 失败 → 通过 | 真实 RN 样式中 stat-cell 包装层的 paddingTop/paddingBottom 均为 16rpx；旧检查只识别两种写死的包装层类名。 [输出](eval-0-style-layout-adaptation/mpx/outputs/data-panel.mpx) |
| 0 / mpx2rn | s8 | 失败 → 通过 | 模板新增 summary-accent view；真实 RN 样式解析得到 height=4rpx、backgroundColor=#1677ff，与输入伪元素一致。旧检查遗漏 background-color。 [输出](eval-0-style-layout-adaptation/mpx2rn/outputs/data-panel.mpx) |
| 0 / mpx2rn | l12 | 失败 → 通过 | 真实 RN 样式中 stat-cell 包装层的 paddingTop/paddingBottom 均为 16rpx；旧检查只识别两种写死的包装层类名。 [输出](eval-0-style-layout-adaptation/mpx2rn/outputs/data-panel.mpx) |
| 1 / mpx | t3 | 失败 → 通过 | 两组 RN 编译产物均有 mpx-scroll-view、bindscrolltolower 和 refresher 事件；JSON 隔离/移除 RN 页面刷新配置。mpx 的 mpxTagName 和 @ios 属性被旧正则漏识别。loadMore 的空业务体来自输入，不是本条新增的计分要求。 [输出](eval-1-template-api-adaptation/mpx/outputs/order-list.mpx) |
| 1 / mpx | j0 | 失败 → 通过 | 两组都使用 api-proxy。mpx 的 api=getProxy({usePromise:true}) 等价于插件挂载后调用 mpx.xxx；install.js 的 getProxy 调用同一个 install 实现，不应强制变量名 mpx。 [输出](eval-1-template-api-adaptation/mpx/outputs/order-list.mpx) |
| 1 / mpx2rn | j1 | 通过 → 失败 | 以 __mpx_mode__=ios 执行输出脚本并捕获 createPage 实参：mpx 保留 onShareAppMessage；mpx2rn 的三个分享/Tab 钩子均不存在。旧 j9 只检查函数名出现而忽略平台可达性。 [输出](eval-1-template-api-adaptation/mpx2rn/outputs/order-list.mpx) |
| 2 / mpx | g8 | 失败 → 通过 | 用户提供的 iPhone 17 Pro / iOS 26.2 模拟器、RN 0.84.0 实测表明：同一节点 opacity 1→0→1 后点击恢复，无需重建。既有脚本探针确认 mpx 的卡片在 nextTick 后恢复为 1，遮罩最终也为 1；因此不应仅凭临时隐藏扣分。此处采用用户实测证据，没有重新运行模拟器；未推广数值阈值至其他设备。 [输出](eval-2-dynamic-capability-adaptation/mpx/outputs/carousel-card.mpx) |
| 2 / mpx | g10 | 失败 → 通过 | 真实 RN 模板编译确认两组分支分别生成 key:"toast-mask" 和 key:"toast-placeholder"；普通 key 也有效。method-selector 动态 CSS 变量具备 enable-var@ios。 [输出](eval-2-dynamic-capability-adaptation/mpx/outputs/carousel-card.mpx) |
| 3 / mpx | n13 | 失败 → 通过 | 模板内 readonly 三元表达式直接切换 is，range 精确含两个组件；向真实编译器提供需求约定的全局注册后无模板诊断。名称无需再次出现在 script。 [输出](eval-3-new-rating-component/mpx/outputs/rating-selector.mpx) |
| 3 / mpx2rn | n13 | 失败 → 通过 | 模板内 readonly 三元表达式直接切换 is，range 精确含两个组件；向真实编译器提供需求约定的全局注册后无模板诊断。名称无需再次出现在 script。 [输出](eval-3-new-rating-component/mpx2rn/outputs/rating-selector.mpx) |
| 5 / mpx2rn | a2 | 失败 → 通过 | 两组同步注册 onLoad；用 raw.category=life、decoded.category=work 调用均选中 work；decoded 非法时均回退 all。mpx2rn 的对象优先回退表达式与字面 decodedQuery.category 等价。 [输出](eval-5-new-task-board-page/mpx2rn/outputs/task-board.mpx) |

## 保留的失败项

- **两组 case 0 / l11**：父侧 margin 20rpx 和子侧 margin-top 12rpx 均保留，没有达到断言要求的单侧 20rpx。真实样式解析结果见 `audit/semantic-checks.json`。本复核没有运行微信真机布局；按断言给定的间距约束判定。
- **mpx2rn case 1 / j1**：在 iOS 模式执行输出脚本，createPage 收到的 options 不含 onShareAppMessage；wx 模式含有。违反“隔离不支持钩子并保留 RN 支持的 onShareAppMessage”。此项原判通过，复核改为失败。

## 逐用例复核分数

| 用例 | mpx | mpx2rn |
| --- | ---: | ---: |
| 0 style-layout-adaptation | 15/16 | 15/16 |
| 1 template-api-adaptation | 9/9 | 8/9 |
| 2 dynamic-capability-adaptation | 15/15 | 15/15 |
| 3 new-rating-component | 8/8 | 8/8 |
| 4 new-segmented-control | 5/5 | 5/5 |
| 5 new-task-board-page | 8/8 | 8/8 |

## 实际验证与边界

- **透明度证据修正**：既有探针的 before=0、after=1 数据不变；错误在于先前把“临时不可点击”推断成“显示后仍不可点击”。用户截图确认同一节点恢复为 1 后 tap/touchstart/touchend 均恢复，无需重建。同时，该环境中 0.001、0.01 也不能命中，因此不建议用极低 opacity 构造透明点击热区。[用户测试证据摘要](audit/opacity-user-evidence.json)。

- 使用评测工作区安装的 `@mpxjs/webpack-plugin@2.11.1` 和 `@mpxjs/mpx-cli-service@2.2.30`，按 8 个组件、4 个页面分批对 wx/iOS 重新编译。所有输出零编译错误；评分组件两组各有全局提示组件未注册警告。向 RN 模板编译器补充需求已约定的两个全局组件注册后，两组该模板零诊断。未新增虚假业务组件或改动输出消除警告。
- `semantic-audit.cjs` 执行实际输出 script，使用最小生命周期/响应性/API 桩捕获构造选项并验证评分点击、只读、父值同步、分段禁用、change payload、任务筛选/切换和 decodedQuery 优先级。这不是完整 Mpx/RN 容器测试。
- `uno-audit.cjs` 找到了仓库子包安装的 UnoCSS 依赖，并仅对本地 preset 的扩展名省略导入做解析适配。真实 RN preset 生成仍在 `preset-rn/variants/index.js:28` 抛出 `Cannot read properties of undefined (reading config)`。没有修补 preset 或把生成失败当成页面通过；case 5 原子类相关分数是源码规则/语义层面的通过，完整样式生成与呈现仍未验证。
- 源码复核还发现 **61 条断言的覆盖缺口**：两组评分组件及 mpx2rn 分段选择器都可能随 readonly/disabled 在有效 hover-class 与 none 之间切换。RN useHover 源码要求该能力在组件生命周期内稳定。此风险未在当前对应断言中明确覆盖，另列提示，不临时增加扣分项，也未将其冒充真机复现。
- u4 原文强调 computed 派生候选项状态；两份输出都以 computed 派生选中项文案、模板表达式派生候选项选中/禁用状态。按输入需求的功能等价认定通过，未因等价逻辑的位置不同扣分。
- 未验证原生宿主中的真实滚动、吸顶、布局或点击表现；编译通过不等于运行验收。

## 复现命令

在仓库根目录执行（输出到临时目录，不覆盖本次证据）：

```bash
node .agents/skills/mpx2rn-workspace/iteration-18/audit/compile-audit.cjs .agents/skills/mpx2rn-workspace /tmp/mpx-iteration18-audit-rerun
node .agents/skills/mpx2rn-workspace/iteration-18/audit/semantic-audit.cjs .agents/skills/mpx2rn-workspace /tmp/mpx-iteration18-audit-rerun
node .agents/skills/mpx2rn-workspace/iteration-18/audit/uno-audit.cjs .agents/skills/mpx2rn-workspace /tmp/mpx-iteration18-audit-rerun
```

[逐项机器可读复核结果](audit/audited-grading.json) · [脚本/编译探针证据](audit/semantic-checks.json) · [组件双端编译](audit/compile-component.json) · [页面双端编译](audit/compile-page.json) · [UnoCSS 异常](audit/uno-checks.json)

## 全部断言复核记录

此表为实际输出审阅记录；“通过”不表示该项均经过真机测试。

### 0 style-layout-adaptation

| 断言 | mpx | mpx2rn | 证据 / 边界 |
| --- | --- | --- | --- |
| s0 | 通过 | 通过 | RN 条件分支下为单类选择器，未保留复合选择器或伪类；双端编译无错误。 |
| s1 | 通过 | 通过 | stats-section 使用 flex / row / wrap，统计项改为 stat-cell 包装层；无 RN grid。 |
| s8 | 通过 | 通过 | 模板新增 summary-accent view；真实 RN 样式解析得到 height=4rpx、backgroundColor=#1677ff，与输入伪元素一致。旧检查遗漏 background-color。 |
| s6 | 通过 | 通过 | RN 样式使用 bold；mpx 隔离字体回退列表，mpx2rn 在 RN 使用单个 PingFang SC。 |
| s7 | 通过 | 通过 | summary-title 添加 numberOfLines@ios；white-space/text-overflow 仅留在非 RN 分支。 |
| s9 | 通过 | 通过 | 使用 @mpx-endif；wx/ios 编译无空规则诊断。 |
| s14 | 通过 | 通过 | wx:class 中保留 tag-highlight 对象键及对应样式。 |
| l1 | 通过 | 通过 | enable-sticky@ios 与 mpxTagName@ios="sticky-header" 已配置；position:sticky 仅在非 RN 分支。未做真机吸顶测试。 |
| l2 | 通过 | 通过 | 原有 /*use rpx*/、/*use px*/ 单位注释均保留。 |
| l3 | 通过 | 通过 | title 的背景裁剪样式被隔离到非 RN；RN text 未保留 background-image。 |
| l5 | 通过 | 通过 | 滚动目标 section-stats 和查询目标 chart 均有 wx:ref；查询分别为 .chart-container / #chart。 |
| l8 | 通过 | 通过 | 非触摸滚动事件 RN 使用 bindscroll；catchscroll 只在 wx/web 分支。 |
| l9 | 通过 | 通过 | RN 用 linear-gradient；radial-gradient 仅留在非 RN 分支。 |
| l10 | 通过 | 通过 | chart-title-wrapper margin-bottom=24rpx，chart-container margin-top 删除或为 0；保留单侧 24rpx。 |
| l11 | 失败 | 失败 | 两组 RN 样式均保留 detail-section margin=20rpx 和 detail-header margin-top=12rpx，未达到本断言规定的父侧 20rpx、子侧 0。 |
| l12 | 通过 | 通过 | 真实 RN 样式中 stat-cell 包装层的 paddingTop/paddingBottom 均为 16rpx；旧检查只识别两种写死的包装层类名。 |

### 1 template-api-adaptation

| 断言 | mpx | mpx2rn | 证据 / 边界 |
| --- | --- | --- | --- |
| t0 | 通过 | 通过 | 动态类使用 wx:class，class 中没有插值拼接。 |
| t2 | 通过 | 通过 | displayOrders computed 计算 statusColor/statusText，模板读取字段而非调用普通方法。 |
| t1 | 通过 | 通过 | 订单点击、长按、支付和确认事件均内联传入参数；脚本无 dataset 读取。 |
| t3 | 通过 | 通过 | 两组 RN 编译产物均有 mpx-scroll-view、bindscrolltolower 和 refresher 事件；JSON 隔离/移除 RN 页面刷新配置。mpx 的 mpxTagName 和 @ios 属性被旧正则漏识别。loadMore 的空业务体来自输入，不是本条新增的计分要求。 |
| j0 | 通过 | 通过 | 两组都使用 api-proxy。mpx 的 api=getProxy({usePromise:true}) 等价于插件挂载后调用 mpx.xxx；install.js 的 getProxy 调用同一个 install 实现，不应强制变量名 mpx。 |
| j1 | 通过 | 失败 | 以 __mpx_mode__=ios 执行输出脚本并捕获 createPage 实参：mpx 保留 onShareAppMessage；mpx2rn 的三个分享/Tab 钩子均不存在。旧 j9 只检查函数名出现而忽略平台可达性。 |
| j3 | 通过 | 通过 | TabBar 角标和 getUserProfile 调用被非 iOS 条件或提前 return 隔离；wx 分支保留。 |
| t8 | 通过 | 通过 | wx:style 对象键为未加引号的 color 等驼峰字段。 |
| t9 | 通过 | 通过 | 支付/收货相邻分支分别使用 key@ios="pay" / "receive"，允许不同 Hover 能力。 |

### 2 dynamic-capability-adaptation

| 断言 | mpx | mpx2rn | 证据 / 边界 |
| --- | --- | --- | --- |
| g0 | 通过 | 通过 | 静态与动态渐变的 transparent 均替换为对应红色 rgba(...,0)。 |
| g1 | 通过 | 通过 | item-badge 改用 wx:if="{{item.isNew}}"，RN 无 display:none。 |
| g2 | 通过 | 通过 | RN transition 为 opacity 与 transform，all 只留在非 RN 样式中。 |
| g3 | 通过 | 通过 | gradient-overlay 的动态背景节点具备 enable-background@ios。 |
| g4 | 通过 | 通过 | 绑定 animStyle 的 card-item 具备 enable-animation@ios="transition"。 |
| g5 | 通过 | 通过 | onMounted/onUnmounted 在 setup 同步注册，未放入 nextTick 等异步回调。 |
| g7 | 通过 | 通过 | mpx 使用有效静态 JSON；mpx2rn 用 script name=json 和 __mpx_mode__ 隔离占位配置，未使用样式注释伪装 JSON 条件。 |
| g8 | 通过 | 通过 | 用户提供的 iPhone 17 Pro / iOS 26.2 模拟器、RN 0.84.0 实测表明：同一节点 opacity 1→0→1 后点击恢复，无需重建。既有脚本探针确认 mpx 的卡片在 nextTick 后恢复为 1，遮罩最终也为 1；因此不应仅凭临时隐藏扣分。此处采用用户实测证据，没有重新运行模拟器；未推广数值阈值至其他设备。 |
| g9 | 通过 | 通过 | @keyframes 和 animation 均仅在非 iOS 分支。 |
| g10 | 通过 | 通过 | 真实 RN 模板编译确认两组分支分别生成 key:"toast-mask" 和 key:"toast-placeholder"；普通 key 也有效。method-selector 动态 CSS 变量具备 enable-var@ios。 |
| c2 | 通过 | 通过 | 真实 RN 样式解析：method-selector 使用 borderStyle:solid；mpx2rn 独立顶边节点的 border-top 简写生成统一 borderStyle:dashed，不是非法单边 border-style。 |
| c4 | 通过 | 通过 | pay-form 声明 wx:ref，selectComponent 使用 #pay-form。 |
| c6 | 通过 | 通过 | 均通过 toRefs(props) 获取 title/subtitle，脚本探针修改 props.title 后引用值同步更新。 |
| c7 | 通过 | 通过 | RN security-bg 使用 no-repeat；repeat-x 在非 RN 条件分支。 |
| c9 | 通过 | 通过 | item-price 在 RN 保留 dashed text-decoration-style 与 #ccc text-decoration-color。 |

### 3 new-rating-component

| 断言 | mpx | mpx2rn | 证据 / 边界 |
| --- | --- | --- | --- |
| n0 | 通过 | 通过 | 完整 template/普通 script/style/JSON；createComponent 包含 properties/data/computed/watch/methods。 |
| n2 | 通过 | 通过 | stars 根据 max 生成，wx:for 带 wx:key；选中星通过 wx:class 区分。 |
| n3 | 通过 | 通过 | 执行实际 selectRating：可编辑时更新评分并发出 ratingKey/value；只读时既不改值也不发事件。 |
| n4 | 通过 | 通过 | data.currentValue 保存本地评分；执行 watch.value.handler 可同步父值；无 id/data/dataset 实例键。 |
| n8 | 通过 | 通过 | 标签、星形、评分均显式位于 text 节点。 |
| n13 | 通过 | 通过 | 模板内 readonly 三元表达式直接切换 is，range 精确含两个组件；向真实编译器提供需求约定的全局注册后无模板诊断。名称无需再次出现在 script。 |
| n10 | 通过 | 通过 | 普通语义化 CSS；rating-stars 显式 flex-direction:row，无原子类或禁用 CSS。 |
| n11 | 通过 | 通过 | 点击目标使用 hover-class，未出现 :active，符合本条结构要求；readonly 变化导致 Hover 能力变化的运行风险另列为覆盖缺口。 |

### 4 new-segmented-control

| 断言 | mpx | mpx2rn | 证据 / 边界 |
| --- | --- | --- | --- |
| u0 | 通过 | 通过 | script setup 使用 defineProps 定义属性，defineExpose 暴露模板使用的绑定。 |
| u2 | 通过 | 通过 | 通过 toRefs(props) 读取 options/disabled/label，其他值按 props.xxx 读取，没有直接破坏响应性的解构。 |
| u3 | 通过 | 通过 | ref 保存 currentValue；探针改变 props.value 并执行注册 watch，选中值同步。 |
| u4 | 通过 | 通过 | computed 派生 selectedLabel；候选列表以 value 为 key，选中/禁用状态在模板表达式派生。按输入任务的功能等价认定通过，不额外强制将整个候选数组塞入 computed。 |
| u5 | 通过 | 通过 | 执行实际处理器验证整体禁用、单项禁用、change payload 和选中值；全部通过。 |

### 5 new-task-board-page

| 断言 | mpx | mpx2rn | 证据 / 边界 |
| --- | --- | --- | --- |
| a0 | 通过 | 通过 | 完整 template/script setup/JSON，没有 style 或 wx:style；布局与颜色均用原子类。完整 UnoCSS 生成被独立环境异常阻断，此项只确认结构。 |
| a2 | 通过 | 通过 | 两组同步注册 onLoad；用 raw.category=life、decoded.category=work 调用均选中 work；decoded 非法时均回退 all。mpx2rn 的对象优先回退表达式与字面 decodedQuery.category 等价。 |
| a4 | 通过 | 通过 | 带 key 的分类/任务列表，computed 筛选和空态模板存在；执行分类切换及完成状态切换通过。 |
| a7 | 通过 | 通过 | wx:class 分支使用完整静态原子 token，没有 class 插值或脚本拼接 token。 |
| a10 | 通过 | 通过 | 半透明选中背景使用 bg-indigo-500/15、bg-blue-600/15 等斜杠 alpha，未使用独立 bg-opacity/text-opacity 类。 |
| a11 | 通过 | 通过 | 源码采用 Flex/颜色/边框/尺寸等支持的工具类及 hover-class，未使用交互 variants。原子 CSS 的完整生成和呈现未验证，不能由本静态通过项推导运行成功。 |
| a13 | 通过 | 通过 | JSON 标题为任务看板，disableScroll=true；存在纵向 scroll-view，导航配置在 RN 支持范围。 |
| a14 | 通过 | 通过 | 无 wx/my 直连 API、无多余平台条件分支、无手动导入 uno.css。 |

