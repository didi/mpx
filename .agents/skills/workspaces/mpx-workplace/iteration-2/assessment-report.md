# 逐条评分与补充观察

本文件汇总清理前的评分记录。原输入、产物、Skill 快照和过程日志已按要求删除；文中的文件路径及行号仅作历史证据定位。评分保持当时结果，不根据后续文档修改追溯改分。

## Case 0 · 构建目标、条件文件与配置归属 · mpx

- **config.target-dialect：passed** — 构建目标使用 wx/ali/ios/android/harmony/web，微信源码方言保持 wx，Skyline 不成为 mode。
  outputs/plugin-options.js:3-13 接受六种目标并直接 mode:target，srcMode 固定 wx；outputs/src/components/status-card.ios.mpx:1-5 无 src-mode 覆写，微信 bindtap 模板继承 wx 方言。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.rn-file-fallback：passed** — RN 条件文件回退后在 ios/android/harmony 都保留可渲染模板。
  outputs/src/pages/home.mpx:101-103 引用默认 status-card.mpx；outputs/src/components/status-card.ios.mpx:1-5 模板不再含 mode=ios，:18-20 open 实际发出事件；按 skill-snapshot/references/base/conditional-compile.md:31-39，android/harmony 回退 .ios 而 web 使用默认。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.native-import-boundary：passed** — react-native 依赖只进入 RN 目标的模块图，三种 RN 目标仍可获得平台名。
  outputs/src/device-label.js:2-4 无原生 import；outputs/src/device-label.ios.js:2-5 仅 RN 条件文件导入 Platform 并返回 Platform.OS；两个 status-card 文件:10,15 都引用默认模块，经 RN 回退三端获得原生平台值，wx/ali/web 依赖图无需 react-native。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.skyline-json：passed** — 微信应用/页面具有正确层级的 Skyline 配置，其他目标配置不被污染。
  outputs/src/app.mpx:18-29 仅 wx 导出 lazyCodeLoading 与 rendererOptions.skyline，下含 defaultDisplayBlock/defaultContentBox；outputs/src/pages/home.mpx:106-110 的 wx 分支写 renderer、componentFramework、disableScroll，:100 配置 custom 导航。非 wx 无 renderer/rendererOptions/glass-easel；RN 单独使用其支持的 disableScroll。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.external-classes：passed** — 支付宝插件 externalClasses 保留三个仍被消费的外部类名称。
  outputs/plugin-options.js:14 数组保留 custom-class/i-class/accent-class；两个 status-card 文件:2-4 静态 class 实际使用、:13 声明 externalClasses；outputs/src/pages/home.mpx:12-16 调用时传入全部三者。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.component2：passed** — component2 在支付宝开发者工具工程配置中启用。
  outputs/mini.project.json:2 component2 为布尔 true；outputs/verification.md:18,23 明确仅复制到 ali 产物根目录并由开发者工具打开；outputs/src/app.mpx 与 plugin-options.js 无 component2。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。

补充观察：

静态设计评分：6 passed / 0 failed / 0 pending。

依据本轮正式 outputs、input/scenario.md、run-1 日志及指定参考；未执行构建或真机验证。agent.jsonl 逐项日志显示仅文件读取、交付和回读，无构建测试执行；verification.md:3,82-90 对验证缺失的声明与此一致。

额外观察（不计分）：输入缺少完整旧业务源码，因此 outputs/verification.md:5 已合理说明业务保真边界。Harmony Platform.OS 实际宿主值未验证；不能将静态条件文件隔离通过称为原生宿主通过。

交付后独立编译补充：validation/eval-0-target-config/mpx/compile.stdout 显示 wx/web 单文件通过；ali 对 home 的 navigationStyle 发出警告；ios/android/harmony 对 home.mpx:92 的 .home-feedback display:block 报 Module Error（日志预处理行91）。该附属反馈样式不属于本 case 六个配置能力，作为额外问题记录；6/6 静态配置得分绝不能称为交付六端可运行。组件自身也有 display:block（status-card.ios.mpx:32,37），完整工程仍需集成核验。


## Case 0 · 构建目标、条件文件与配置归属 · noskill

- **config.target-dialect：passed** — 构建目标使用 wx/ali/ios/android/harmony/web，微信源码方言保持 wx，Skyline 不成为 mode。
  outputs/plugin-options.js:4-17 六目标白名单、mode:targetMode、srcMode:wx，未把 Skyline/RN 当目标。两组件均保留微信 bindtap 模板、无源码方言覆写。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.rn-file-fallback：passed** — RN 条件文件回退后在 ios/android/harmony 都保留可渲染模板。
  outputs/src/pages/home.mpx:50-52 保留默认 status-card.mpx 引用；outputs/src/components/status-card.ios.mpx:1-5 模板无 mode 限制且 bindtap=open，:20-24 实际触发 open 事件。按照本轮 base/conditional-compile.md:31-39 的回退契约，android/harmony 均命中此文件，Web 命中默认；verification 中的相反说明不改变实际文件选择。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.native-import-boundary：passed** — react-native 依赖只进入 RN 目标的模块图，三种 RN 目标仍可获得平台名。
  outputs/src/device-label.js:2-4 完全无 react-native 依赖；outputs/src/device-label.ios.js、device-label.android.js、device-label.harmony.js 各:1-4 在对应目标导入 Platform 并返回 Platform.OS；outputs/src/pages/home.mpx:26,33-36 引用默认名并赋值展示。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.skyline-json：failed** — 微信应用/页面具有正确层级的 Skyline 配置，其他目标配置不被污染。
  outputs/src/app.mpx:7-30 与 src/pages/home.mpx:48-65 在 type=application/json lang=js 区块内写 const/if/module.exports；本轮独立黑盒诊断 validation/case0-json-compile.json:8-11 报该 home.mpx 第49行 JSON5 invalid character c，配置不能被求值，不能产出要求的 Skyline JSON。源码意图虽把 block/content-box 放入 skyline，并在 app 全局配置 glass-easel，但解析失败已直接破坏该契约。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.external-classes：passed** — 支付宝插件 externalClasses 保留三个仍被消费的外部类名称。
  outputs/plugin-options.js:17 保留全部三个外部类；两个 status-card 文件:2-4 的静态 class 与 :12 externalClasses 一致；outputs/src/pages/home.mpx:10-12 实际向组件传入三类。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **config.component2：passed** — component2 在支付宝开发者工具工程配置中启用。
  outputs/mini.project.json:2 为 component2:true；outputs/verification.md:10 明确与 ali 产物 app.json 同级、合并到已有工程文件、仅复制给 ali；app 与插件未错误声明 component2。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。

补充观察：

静态设计评分：5 passed / 1 failed / 0 pending。

config.skyline-json 失败：home.mpx:48-49 的动态 JSON 写法被实际编译当成 JSON5，validation/case0-json-compile.json:8-11 提供解析错误证据。此通用配置问题只在配置能力所属断言扣分，未对可独立判断的目标、模块边界或组件模板重复扣分。

额外观察（不计分）：verification.md:9,23-24,29,52 错称 android/harmony 不会回退 .ios；实际源码去掉 template mode 限制，因此 RN 模板能力仍通过。补写 android/harmony 标签模块虽多余但等价且可用。home.mpx:55 将 disableScroll 送给 ali，而本轮 ali-json-reference.md:40 明确不支持；作为额外集成问题记录，不新增断言。app 全局 componentFramework 可由页面继承，不因未重复在 home 声明单独扣分。

agent.jsonl 的完整事件记录仅有文件读写与回读，没有构建测试执行；verification.md:3,69-79 对自身未验证的声明属实。独立黑盒编译由评测主 Agent 在交付后进行，不是被测 Agent 的执行成绩。

交付后六目标独立编译补充：validation/eval-0-target-config/noskill/compile.stdout 证实 wx/ali/ios/android/harmony/web 均因同一动态 JSON5 解析错误失败。没有把这一根因扩展为多个扣分项。


## Case 1 · 图文布局、间距与样式作用范围 · mpx

- **layout.portable-grid：passed** — 卡片图片区域具有实际可用的跨端布局，RN 分支使用支持的选择器与布局声明。
  outputs/product-card.mpx:3-10 Hero/Photo 实际节点；:59-73 为简单类，纵向 Flex、明确图片宽高和禁止收缩；Grid/后代选择器不参与任一目标布局。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **layout.margin-geometry：passed** — 折叠块级间距与不折叠 Flex 间距分别保持 24rpx、20rpx、16rpx。
  outputs/product-card.mpx:52-58 Card 纵向 Flex；:74-95 TitleWrap 下24 + Summary 上0 = 24rpx，Details 上20 + DetailHeading 上0 = 20rpx；:96-103 Stats 纵向 Flex、相邻 Stat 下8 + 上8 = 16rpx。三个输入基线均被保留。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **layout.text-ellipsis：passed** — 同一长标题在各端均一行省略，并保留各端所需的文本约束。
  outputs/product-card.mpx:12-18 实际 Title 文本节点包含 wx max-lines=1/overflow=ellipsis、三 RN numberOfLines=1/ellipsizeMode=tail；:74-85 父和文本都宽240rpx，文本 overflow:hidden，wx/ali/web 保留 display:block/nowrap/text-overflow:ellipsis。所有分支有宽度与打点机制。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **layout.image-padding：passed** — 图片自身保持 240×80rpx，四边 24rpx 留白由外层承担。
  outputs/product-card.mpx:59-73 Hero content-box 的内容尺寸240×80rpx加四边padding24，外部占位288×128rpx；Photo 自身240×80rpx、无padding、flex-shrink:0。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **layout.responsive-breakpoint：passed** — 400px 断点在 Skyline 与其他端保持一致且随窗口变化更新。
  outputs/product-card.mpx:2 将 useMediaQuery/isSmall 绑定到 CardMedia/CardNarrow；:113-122 media只作用于CardMedia，CardNarrow宽560。outputs/use-card-viewport.js:8-15 Skyline不加CardMedia，按windowWidth<=400设置isSmall；:19-40 初始化并订阅onWindowResize、卸载同一监听。outputs/use-card-viewport.ios.js:7-27 使用Dimensions window.width初值与change持续更新；其余端media max-width:400px。399→401→399静态追踪宽度为560→600→560。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **layout.style-isolation：passed** — 支付宝同名 badge 类不在页面、组件和兄弟实例间串色。
  outputs/product-card.mpx:51,109-111 scoped样式将内部badge设蓝；outputs/demo.mpx:46,99-101 scoped样式将父badge设红；demo:8-16 同时保留两处父标签及两张独立卡实例，未删除冲突场景。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。
- **layout.text-tree：passed** — 保障文本与官方标签采用各端合法节点树并保持横向展示。
  outputs/product-card.mpx:28-31 Rich下两个兄弟text承载保障/官方，没有text嵌view；:104-110 横向Flex和官方蓝色同时保留，适用于Skyline和RN。
  未验证：已获得交付后六目标单文件编译诊断，详见本组 review-notes.md；仍未完成完整 App 集成构建与各宿主真机行为验证。静态设计得分不代表运行通过率。

补充观察：

静态设计评分：7 passed / 0 failed / 0 pending。

逐项追踪 product-card 模板、样式、viewport 条件模块及父页面；未依据 verification.md 的自查表直接给分。RN Dimensions 条件文件与窗口事件形成完整静态链路，宿主端口兼容尚未验证。agent.jsonl 所有工具事件为文件操作；没有执行构建/测试，verification.md:3 与此一致。

额外观察（不计分）：组件把省略样式从父容器移到实际 text 是等价实现；按输入完整支付宝 App 已有 white-space 继承的前提，没有把这种迁移本身算作得分理由。组件与父页面双 scoped 保留红/蓝冲突样本。内嵌 PNG 与演示导航安全区的运行表现未验证，不新增断言扣分。

交付后独立编译补充：validation/eval-1-layout-card/mpx/compile.stdout 的六目标 success 均为 true、errors/warnings 为空。这是单组件编译证据；未运行完整 App、宿主窗口/文本/图片或双 renderer 视觉检查。


## Case 1 · 图文布局、间距与样式作用范围 · noskill

- **layout.portable-grid：passed** — 卡片图片区域具有实际可用的跨端布局，RN 分支使用支持的选择器与布局声明。
  outputs/product-card.mpx:3-5 实际Hero/Photo节点；:100-115 简单类、列向Flex、align-self:flex-start使包装层按内容占位，图片明确240×80rpx且不收缩；未依赖Grid或复杂选择器。
  未验证：本轮独立单文件编译不能替代完整 App 与宿主视觉验证；实际图片、间距、打点、窗口事件及样式隔离待复验。
- **layout.margin-geometry：passed** — 折叠块级间距与不折叠 Flex 间距分别保持 24rpx、20rpx、16rpx。
  outputs/product-card.mpx:89-96 Card列向Flex；:116-150 TitleWrap margin0、Summary上24，Details上20；:151-170 DetailHeading margin0，Stats列向Flex且两Stat上下8，得到24/20/16rpx三条基线。
  未验证：本轮独立单文件编译不能替代完整 App 与宿主视觉验证；实际图片、间距、打点、窗口事件及样式隔离待复验。
- **layout.text-ellipsis：failed** — 同一长标题在各端均一行省略，并保留各端所需的文本约束。
  outputs/product-card.mpx:9-21 实际RN分支有numberOfLines=1/tail，其他分支有max-lines=1/ellipsis；但:127-133 同一标题类无条件包含white-space/text-overflow。validation/eval-1-layout-card/noskill/compile.stdout:32-47、59-74、86-99 分别证实三个RN目标因标题样式报Module Error，故RN标题截断路径不可交付；其余端宽240rpx及CSS约束存在。
  未验证：本轮独立单文件编译不能替代完整 App 与宿主视觉验证；实际图片、间距、打点、窗口事件及样式隔离待复验。
- **layout.image-padding：passed** — 图片自身保持 240×80rpx，四边 24rpx 留白由外层承担。
  outputs/product-card.mpx:100-115 Hero自然尺寸列向Flex，align-self:flex-start且padding24rpx；Photo 240×80rpx、padding0、margin0、flex-shrink0，外框自然为288×128rpx。
  未验证：本轮独立单文件编译不能替代完整 App 与宿主视觉验证；实际图片、间距、打点、窗口事件及样式隔离待复验。
- **layout.responsive-breakpoint：passed** — 400px 断点在 Skyline 与其他端保持一致且随窗口变化更新。
  outputs/product-card.mpx:2,63-68 将持续窗口订阅的size.width<=400赋给isNarrow并绑定宽度类，:93,97-99对应600/560rpx；outputs/window-size.js:59-73读取window逻辑宽度，:89-137按web resize/RN Dimensions change/小程序窗口事件或轮询更新，:140-168立即通知并按订阅销毁。399→401→399可静态追踪为560→600→560；不存在Skyline媒体规则泄漏。
  未验证：本轮独立单文件编译不能替代完整 App 与宿主视觉验证；实际图片、间距、打点、窗口事件及样式隔离待复验。
- **layout.style-isolation：passed** — 支付宝同名 badge 类不在页面、组件和兄弟实例间串色。
  outputs/product-card.mpx:88,179-181 scoped蓝badge；outputs/demo.mpx:74,104-106 scoped红badge；demo:9-18保留父标签、两实例和普通兄弟红标签，未删去冲突场景。
  未验证：本轮独立单文件编译不能替代完整 App 与宿主视觉验证；实际图片、间距、打点、窗口事件及样式隔离待复验。
- **layout.text-tree：passed** — 保障文本与官方标签采用各端合法节点树并保持横向展示。
  outputs/product-card.mpx:32-35 Rich内兄弟text分别保留保障/官方，:171-180 横向Flex和蓝色标签；没有text嵌view。
  未验证：本轮独立单文件编译不能替代完整 App 与宿主视觉验证；实际图片、间距、打点、窗口事件及样式隔离待复验。

补充观察：

静态设计评分：6 passed / 1 failed / 0 pending。

失败归属于 layout.text-ellipsis：product-card.mpx:131,133 未隔离 RN 不支持的标题样式，三RN编译均Module Error。其余静态布局契约独立判断，不因同一文本编译错误重复扣分。wx/ali/web 单组件编译通过，也不代表支付宝完整 App 或微信双renderer视觉通过。

agent.jsonl 完整事件均为文件读写/回读，verification.md:5声明未运行编译、测试或真机属实；上述编译来自交付后的独立评测。

额外观察（不计分）：采用显式编译常量分支内require原生依赖，应与公共模块顶层import区别对待，不因没有条件文件直接扣分；窗口链有事件和可注销轮询，未只取初始宽度。标题wx:if使用isRn数据使其他端仍含不相关属性，当前wx/ali/web编译没有报错，不按猜测额外扣分。


## Case 2 · 刷新、吸顶与节点定位 · mpx

- **scroll.refresh-entry：passed** — 刷新在四端都有可触发入口，支付宝不依赖不支持的 refresher 事件。
  outputs/feed.mpx:6 刷新按钮绑定reload，ali同样可触发；:42-44 仅wx/RN/web容器启用refresher并绑定onRefresh；:286-331 进入reload加载第1页、成功重置页码/items、finally复位refreshing/refresherTriggered及Promise锁；outputs/data.js:20-29 在发起时消费一次失败，下次同页重试恢复。
  未验证：已获独立单文件编译诊断，RN存在附属提示文本display:block错误；没有完整App与真机验证。实际手势刷新、吸顶推挤、横向布局、节点测量/定位和滚动条隐藏仍待宿主复验。
- **scroll.pagination：passed** — 触底分页从实际滚动容器触发并保留有界可滚动区域。
  outputs/feed.mpx:36-45 实际纵向容器scroll-y=true、scrolltolower=next；:471-485根高度（ali四边fixed），:563-576剩余Flex区域+绝对定位100%滚动视口形成高度链；:335-370 nextPromise防同页并发，成功才推进lastPage，items达到totalCount后hasMore=false；outputs/data.js:2-3,31-37每页20且总60。
  未验证：已获独立单文件编译诊断，RN存在附属提示文本display:block错误；没有完整App与真机验证。实际手势刷新、吸顶推挤、横向布局、节点测量/定位和滚动条隐藏仍待宿主复验。
- **scroll.event-payload：passed** — 滚动位置展示读取 scroll-view 的 detail.scrollTop。
  outputs/feed.mpx:45 bindscroll=onScroll，:276-283读取event.detail.scrollTop并写this.scrollTop，:4模板展示该值。onLoad建立runtime后传入{detail:{scrollTop:120}}会通过有限数值校验并赋值120，不使用e.scrollTop或滚动命令冒充实际位置。
  未验证：已获独立单文件编译诊断，RN存在附属提示文本display:block错误；没有完整App与真机验证。实际手势刷新、吸顶推挤、横向布局、节点测量/定位和滚动条隐藏仍待宿主复验。
- **scroll.sticky-renderer：passed** — 分组标题的吸顶实现按目标和微信 renderer 生效。
  outputs/feed.mpx:36,47-58 wx运行时renderer=skyline才使用custom内直接sticky-section，首个且唯一sticky-header显式白背景(:581-587)；RN/Web同分支且:40开启enable-sticky；wx WebView走:60-74普通分组并仅该端绑定feedCssSticky，:625-630定义position:sticky/top0；ali走普通分组并由:215-232几何计算当前标题/推挤，:83-85及:633-642渲染同级白背景覆盖标题，保留全部订单与分组。
  未验证：已获独立单文件编译诊断，RN存在附属提示文本display:block错误；没有完整App与真机验证。实际手势刷新、吸顶推挤、横向布局、节点测量/定位和滚动条隐藏仍待宿主复验。
- **scroll.horizontal-width：passed** — 横向分类的直接内容子节点分别具备视口宽和 1200rpx 宽的布局依据。
  outputs/feed.mpx:15-32 横向容器两个直接内容节点feedCategoryPanel/feedCategoryWide；:17仅wx启用enable-flex；:523-543显式横向Flex，直接节点分别width100%/1200rpx、flex-shrink0；其他端布局不依赖微信专属属性，没有只给深层min-width。
  未验证：已获独立单文件编译诊断，RN存在附属提示文本display:block错误；没有完整App与真机验证。实际手势刷新、吸顶推挤、横向布局、节点测量/定位和滚动条隐藏仍待宿主复验。
- **scroll.query-scope：passed** — 订单定位链路采用合法 id、实例作用域与 RN 可查询节点。
  outputs/feed.mpx:7按钮→:384-385 locate21→goToOrder；:404-417补齐第2页后等待视图再查order-21；:152-155实例createSelectorQuery对#ordersViewport和#order-21做简单id查询，目标和容器分别:36,53,68具备wx:ref。:420-429实际测量换算（减吸顶高度）或固定行高等价后备1156px，交给:373-381更新scrollCommand，:38绑定scroll-top。
  未验证：已获独立单文件编译诊断，RN存在附属提示文本display:block错误；没有完整App与真机验证。实际手势刷新、吸顶推挤、横向布局、节点测量/定位和滚动条隐藏仍待宿主复验。
- **scroll.scrollbar-boolean：passed** — 隐藏滚动条使用严格布尔 false，并仅对微信补 enhanced。
  outputs/feed.mpx:18,38 两个容器均show-scrollbar={{false}}，:17,37 enhanced仅@wx；:181-182配Web局部scrollbar:false并在:18,41传scroll-options。未使用全局滚动条CSS。
  未验证：已获独立单文件编译诊断，RN存在附属提示文本display:block错误；没有完整App与真机验证。实际手势刷新、吸顶推挤、横向布局、节点测量/定位和滚动条隐藏仍待宿主复验。

补充观察：

静态设计评分：7 passed / 0 failed / 0 pending。

每项按模板绑定、实际处理器、数据源和样式追踪；没有用 verification 的自查声明取代证据。支付宝吸顶采用固定几何覆盖层是等价实现：每组36+20*56=1156px，下一组靠近时按min(0,end-scrollTop-36)推走当前标题。查询不可见节点时有相同几何的定位后备。

额外编译观察（不增减断言）：validation/eval-2-scroll-feed/mpx/compile.stdout 显示 wx/web 单文件通过；RN三端因 feed.mpx:492,510,517 的状态/错误/提示文本 display:block 报Module Error，这些是通用展示样式问题，不是刷新/分页/scrollTop数据契约本身；7/7不能称为实际可运行。ali show-scrollbar、aria以及 @ali 节点内 wx:if/wx:style 有警告。尤其后一项与题设mode仅筛目标且继续wx转换的语义不一致，不能拿该发布包告警推翻本轮输入/参考契约；完整工程仍需验证。

agent.jsonl 完整工具事件仅文件读取、写入和回读；verification.md:7明确未构建、测试或真机，与日志一致。该页额外支持位置恢复、分类跳转和代次隔离，但不新增评分点。


## Case 2 · 刷新、吸顶与节点定位 · noskill

- **scroll.refresh-entry：passed** — 刷新在四端都有可触发入口，支付宝不依赖不支持的 refresher 事件。
  outputs/feed.mpx:6刷新按钮在全部目标调用refreshFromButton→reload(:375-380)；:67-83 wx/RN容器启用refresher并实际绑定；ali分支:110-126不含refresher，Web另有:623-665手势入口；:414-445 loadPage(1)成功重置rows/loadedPage，finally释放锁与refresherTriggered；outputs/data.js:29-35一次失败在发起时消费，重试可恢复。
  未验证：六目标单文件诊断已提供；完整App与各宿主真机未验证。固定几何吸顶/定位、横条实际宽度、刷新手势及局部裁边隐藏效果待运行复验。
- **scroll.pagination：passed** — 触底分页从实际滚动容器触发并保留有界可滚动区域。
  outputs/feed.mpx:71,83与:114,121两个有效纵向分支都有scroll-y及scrolltolower；:2,65,84,126通过窗口/列表明确像素尺寸构成有界区域，:361-368计算可用高度；:456-494 next以moreTask复用同页请求，成功核对页码后追加去重，并在rows=60后关闭hasMore。outputs/data.js:2-3,7-10,38-39固定60条、每页20。
  未验证：六目标单文件诊断已提供；完整App与各宿主真机未验证。固定几何吸顶/定位、横条实际宽度、刷新手势及局部裁边隐藏效果待运行复验。
- **scroll.event-payload：passed** — 滚动位置展示读取 scroll-view 的 detail.scrollTop。
  outputs/feed.mpx:82,120实际绑定onListScroll；:243-247优先读detail.scrollTop，:506-514更新actualScrollTop和scrollTopText，:61展示。传入{detail:{scrollTop:120}}得到实际值120、显示120.0，保持同一数值语义。
  未验证：六目标单文件诊断已提供；完整App与各宿主真机未验证。固定几何吸顶/定位、横条实际宽度、刷新手势及局部裁边隐藏效果待运行复验。
- **scroll.sticky-renderer：passed** — 分组标题的吸顶实现按目标和微信 renderer 生效。
  采用等价的全端固定几何吸顶，没有要求宿主识别sticky节点：outputs/feed.mpx:152-158在有界listViewport内、滚动容器外提供白底绝对定位标题，:743-756定义高度36及背景；:506-514由实际滚动驱动:521-534，组高36+20*64=1316，下一组前36px将当前标题推走；:90-97/:132-139保留原位标题和全组内容。两种wx renderer以及RN/ali/Web使用同一已实现算法，无按@wx错误区分renderer。
  未验证：六目标单文件诊断已提供；完整App与各宿主真机未验证。固定几何吸顶/定位、横条实际宽度、刷新手势及局部裁边隐藏效果待运行复验。
- **scroll.horizontal-width：passed** — 横向分类的直接内容子节点分别具备视口宽和 1200rpx 宽的布局依据。
  采用等价的显式总宽直接内容节点：outputs/feed.mpx:25,46 categoryTrack是scroll-view直接子节点，绑定categoryTrackWidth；:369-372令其等于W+1200W/750，其内部两区:26,30及:47,51明确W和1200rpx等值，:715-725横向Flex且禁止收缩。W=375时总975、区域375/600px；直接wrapper已明确总宽，不依赖深层min-width或Flex反撑。
  未验证：六目标单文件诊断已提供；完整App与各宿主真机未验证。固定几何吸顶/定位、横条实际宽度、刷新手势及局部裁边隐藏效果待运行复验。
- **scroll.query-scope：failed** — 订单定位链路采用合法 id、实例作用域与 RN 可查询节点。
  outputs/feed.mpx:604-610 明确移除了 selectorQuery，使用固定行高计算 scroll-top；模板订单节点:92,134和滚动容器均无 wx:ref，也不存在实例作用域查询、简单选择器、查询结果到滚动的数据链。因此不覆盖本条预定义的实例查询与 RN 可查询节点能力。；这不是判定定位功能损坏：:576-605会补页并等待渲染，:607-610计算1316px，再经:537-555与:74,117执行滚动；给定固定行高条件下订单21可露在吸顶标题下方。但仅几何定位未验证原断言明确要求的查询能力。
  未验证：六目标单文件诊断已提供；完整App与各宿主真机未验证。固定几何吸顶/定位、横条实际宽度、刷新手势及局部裁边隐藏效果待运行复验。
- **scroll.scrollbar-boolean：passed** — 隐藏滚动条使用严格布尔 false，并仅对微信补 enhanced。
  outputs/feed.mpx:22,43,73,116 所有有效横纵容器的show-scrollbar均为严格布尔false；微信横向分支:16-19与纵向分支:67-70均启用enhanced；未使用全局scrollbar CSS。；纵向分支额外向RN发送enhanced(:67-70)，属于冗余配置，未证明它破坏隐藏行为；与无害额外配置的等价口径一致，不据此否定布尔隐藏契约。:367-368及:713,730还提供局部裁边，真实效果尚未真机验证。
  未验证：六目标单文件诊断已提供；完整App与各宿主真机未验证。固定几何吸顶/定位、横条实际宽度、刷新手势及局部裁边隐藏效果待运行复验。

补充观察：

静态设计评分：6 passed / 1 failed / 0 pending。

等价性判断：全端白底吸顶浮层和显式总宽横向wrapper有可追踪的几何及交互数据链，满足相同结果契约，不要求机械复刻sticky-section/header或两个直接区域。两容器严格false且微信enhanced齐备；额外RN enhanced只是冗余配置，没有证据证明破坏隐藏，单列观察而不扣分。

唯一失败为scroll.query-scope：预定义断言明确覆盖实例作用域查询、简单选择器、RN可查询节点及渲染后的查询链；feed.mpx:604-610删除查询、:92,134没有wx:ref，完全绕过所测查询能力。不是判定“定位功能坏了”：按固定36px组头+64px订单行，订单21内容坐标1352px，减头后1316px命令可以定位。评分敏感性：若将本条放宽为只验证定位行为，固定几何方案可通过，该组将7/7；正式成绩保留原断言的查询能力覆盖要求为6/7。

额外问题（不增减分）：feed.mpx:27,32,48,53通过dataset传分类参数，:562-568只读currentTarget.dataset；本轮RN模板参考明确dataset不可用，分类点击在RN缺少有效业务载荷。它不属于horizontal-width的几何断言，也不影响独立定位21按钮，故只记录评测覆盖缺口。

独立编译validation/eval-2-scroll-feed/noskill/compile.stdout：wx/web通过；RN三端pageTitle(:701)、notice(:712)的display:block报Module Error；页面enablePullDownRefresh、refresherrestore/abort也告警，但刷新finally不依赖这些事件。ali disableScroll及show-scrollbar告警；后者与指定快照契约有版本差异，未用发布包告警覆盖本轮题设。静态得分不能解释成六端可运行。

agent.jsonl完整记录只有文件读写/回读，verification.md:5,57关于未执行构建测试真机的声明与日志一致。固定几何不支持任意可变行高，但输入为固定短订单记录，交付:179-180与CSS一致，不额外要求新能力。


## Case 3 · 弹层、键盘与窗口尺寸 · mpx

- **dialog.mask-scroll：passed** — 支付宝锁滚动仅作用于蒙层，内容区仍可滚动，微信背景触摸被正确拦截。
  checkout-dialog.mpx:2-14、28-35：mask 与 panel/scroll-view 为兄弟分支；disable-scroll@ali 仅 mask，根 catchtouchmove@wx 指向 220 的空处理器；289-306 关闭时移除 entryNodes 并发 close，无全局 page 修改。
  未验证：静态设计判定；未执行完整 App 构建及微信双 renderer、支付宝设备、RN 原生桥接和 Web 浏览器交互/键盘真机验证。
- **dialog.device-input：passed** — 仅复现问题的支付宝输入框按运行时 iOS/Android 设置 enableNative。
  checkout-dialog.mpx:48-51、69-72、142-146、194-197：支付宝 enableNative 绑定运行时 isIos；size.js:124-145 先读 getDeviceInfo/platform/system，RN 常量只用于对应 RN 目标兜底；manualKeyboardAvoidance 默认 false（123），微信 adjust-position 默认 true。
  未验证：静态设计判定；未执行完整 App 构建及微信双 renderer、支付宝设备、RN 原生桥接和 Web 浏览器交互/键盘真机验证。
- **dialog.focus-readiness：passed** — 支付宝首次聚焦等待实际渲染和入场完成。
  checkout-dialog.mpx:221-282：打开先清 focus，经宿主 $forceUpdate 回调与 boundingClientRect 渲染屏障启动 transform，真实 bindtransitionend（23）接 enterDone；完成后挂载 input 并再次等渲染才 focus；230-232、289-299 的 epoch/visible 检查拒绝关闭后的旧回调。
  未验证：静态设计判定；未执行完整 App 构建及微信双 renderer、支付宝设备、RN 原生桥接和 Web 浏览器交互/键盘真机验证。
- **dialog.keyboard-order：passed** — 焦点和键盘状态对两种输入框切换事件顺序均稳定。
  checkout-dialog.mpx:329-383：focus(B) 更新 currentField 后 blur(A) 被 347 排除；blur(A)→focus(B) 通过 blurEpoch、nextTick/0ms 确认延后复位，focus 取消任务；高度独立缓存、缺失 focus.height 不覆盖；最终 blur 在 366-370 清零。148-152 与 51、72 将手动和自动避让互斥，默认 offset 恒零。
  未验证：静态设计判定；未执行完整 App 构建及微信双 renderer、支付宝设备、RN 原生桥接和 Web 浏览器交互/键盘真机验证。
- **dialog.window-units：passed** — 尺寸封装使用窗口高度及同单位安全区，容忍缺失安全区并响应窗口变化。
  size.js:32-56：availableHeight=windowHeight，sample 700/800/bottom780 得 700/20，safeArea=null 分支保持 0，无 pixelRatio 换算；77-94 刷新覆盖缓存；97-120 订阅窗口变化，checkout-dialog.mpx:194-205 消费更新。
  未验证：静态设计判定；未执行完整 App 构建及微信双 renderer、支付宝设备、RN 原生桥接和 Web 浏览器交互/键盘真机验证。

补充观察：

# 静态设计审查

5/5 passed，0 failed，0 pending；此分数不是运行通过率。证据路径以本组 outputs 为基准。

已追踪完整正式组件、size.js、verification.md 和本次 run-1 日志。日志只有受限文件读写与源码自查，执行者未声称运行验证。

独立 validation 的 eslint summary：0 errors、4 warnings。compile-run 返回 1，但 compile.stdout 明确六目标均无 errors，只有支付宝 3 条 aria-label 不支持告警（组件第 12、47、68 行）；其余目标无 warnings。此额外无障碍问题未命中本 case 的五条断言，不另扣分，不把编译脚本非零返回当作所有契约失败。

额外边界：可选 manualKeyboardAvoidance 与触摸交接状态机超出最小任务范围；若原生触摸交接既不 focus 也不 touchcancel，handoffField 可能滞留（315-327、365）。输入给定的两种切换序列仍有明确处理，宿主异常事件须真机确认。窗口信息缺失时返回零高度也需集成检查。未用 verification 的成功声称代替源码证据。


## Case 3 · 弹层、键盘与窗口尺寸 · noskill

- **dialog.mask-scroll：passed** — 支付宝锁滚动仅作用于蒙层，内容区仍可滚动，微信背景触摸被正确拦截。
  checkout-dialog.mpx:4-16、44-49 正式引用交付的 panel；checkout-dialog-panel.mpx:2-25 的蒙层和 panel 为兄弟，disable-scroll@ali 仅叶节点，catchtouchmove@wx 指向 201 的空处理器；269-290 关闭移除 rendered，无 page/body 锁滚动。
  未验证：静态设计评分；完整工程、微信双 renderer、支付宝设备键盘及 RN/Web 宿主交互尚未验证。
- **dialog.device-input：passed** — 仅复现问题的支付宝输入框按运行时 iOS/Android 设置 enableNative。
  checkout-dialog-panel.mpx:34、50 使用 isAliIos；162-169 以 buildMode=ali 与 getDevicePlatform 的真实设备结果联合判断；size.js:30-48 用 getDeviceInfo/system/platform 识别 ios/android；微信 adjust-position:36、52 为 true。
  未验证：静态设计评分；完整工程、微信双 renderer、支付宝设备键盘及 RN/Web 宿主交互尚未验证。
- **dialog.focus-readiness：passed** — 支付宝首次聚焦等待实际渲染和入场完成。
  checkout-dialog-panel.mpx:210-267 的本地逐帧动画实际改变 opacity/transform，经 renderLayout 的 setData 回调（364-370）推进；最后一帧完成才 enterDone 再发 nameFocus，不是空等固定 300ms。251-255、269-274 的 session/open/disposed 检查拒绝关闭后的旧回调。
  未验证：静态设计评分；完整工程、微信双 renderer、支付宝设备键盘及 RN/Web 宿主交互尚未验证。
- **dialog.keyboard-order：failed** — 焦点和键盘状态对两种输入框切换事件顺序均稳定。
  checkout-dialog-panel.mpx:301-338 用字段身份和延后确认处理两种 focus/blur 顺序，341-347 独立缓存高度；但166 对 ali+iOS 无条件启用 manualAvoidance，352-366 据此额外 translateY。；同文件35、51 用 adjust-position@ali=false 假设关闭宿主上推，40、56 同时依赖 input keyboardheightchange@ali；skill-snapshot/references/ali/ali-template-reference.md:37、64 明确这些属性/事件不支持，不能成立“无自动/手动双重位移”的静态契约；额外全局高度监听179-182并不能关闭宿主自动上推。
  未验证：静态设计评分；完整工程、微信双 renderer、支付宝设备键盘及 RN/Web 宿主交互尚未验证。
- **dialog.window-units：passed** — 尺寸封装使用窗口高度及同单位安全区，容忍缺失安全区并响应窗口变化。
  size.js:53-80 保留逻辑 windowHeight，sample 700/800/safe.bottom780 得 availableHeight700/safeBottom20，null 安全区为0；58-63 事件新尺寸覆盖同步快照，84-96 回调重新读取；panel:172-176 更新打开面板布局。
  未验证：静态设计评分；完整工程、微信双 renderer、支付宝设备键盘及 RN/Web 宿主交互尚未验证。

补充观察：

# 静态设计审查

4/5 passed，1 failed，0 pending；不是运行通过率。证据路径以本组 outputs 为基准。

已读正式 wrapper、panel、size.js、verification.md 和本次日志。独立 ESLint 0 errors/0 warnings；六目标单文件编译 wrapper 的 errors/warnings 均空，属于 partial compile，不能据此认为 usingComponents 引入的 panel 已运行或所有内部路径无问题。

失败只记于 dialog.keyboard-order：支付宝 iOS 的手动补偿以不受支持的 adjust-position 关闭自动避让为前提，无法保证不双重位移。首次聚焦是实际逐帧动画末帧 setData 回调，接受此契约等价实现，不因它没有 transitionend 而扣分。

额外观察（不新增扣分）：panel:95-98 用 dataset 定位字段，RN 不支持该机制，会影响输入值和焦点处理；panel 全程 setData，而 Web 不提供该实例方法；Skyline list 内 fieldGroup/费用节点和实际滚动需要宿主核验。verification 坦诚没有编译/真机，但对支付宝 adjust-position 的平台策略属于错误假设。已向主 Agent 提醒单独验证 panel 能得到更有针对性的诊断。

补证：主 Agent 独立 validation/case3-noskill-panel.stdout 已六目标单独编译私有 panel；六目标均无 errors，ali 有一条第18行 aria-label 警告，其他目标无 warnings。该 partial compile 未报 adjust-position/keyboardheightchange 不能证明宿主支持；本次失败仍依据快照明确能力限制与实际手动位移策略。


## Case 4 · 登录适配、任务句柄与请求取消 · mpx

- **api.host-login：passed** — 微信与支付宝授权码进入各自兑换入口，RN/Web 使用约定宿主 session 能力。
  api.js:58-81：wx/ali 都由代理 login 取得 code，70 按 mode 分别选择 POST /session/wx 与 /session/ali；RN 三目标/Web 77-78 直接 await signIn 并校验 token，未冒用 login；auth-host.js:10-15 提供注入 Promise 契约，18-37 是可替换本地 stub。runtime.js:10-28 与 account.mpx:149-152 连接真实模式登录入口。
  未验证：静态业务契约判定；未运行离线脚本、完整工程或真实宿主授权/请求/取消。
  验证限制：RN 运行验证受 account.mpx:266-269 display:block 样式编译错误阻塞；不影响对独立 API/控制器数据流的静态判断，未据此重复扣分。
- **api.custom-contract：passed** — getSession 按实际目标注册且由安装后的代理调用，明确返回 Promise。
  api.js:85-105 使用默认导出的 apiProxy(mpx,...) 安装，custom 六个目标各注册 getSession；provider 返回 async 函数（63）；179 由安装代理 proxy.getSession().then 消费。runtime.js:35-41 的离线 getProxy 也按当前实际目标安装 Promise getSession，无不存在具名导出。
  未验证：静态业务契约判定；未运行离线脚本、完整工程或真实宿主授权/请求/取消。
  验证限制：RN 运行验证受 account.mpx:266-269 display:block 样式编译错误阻塞；不影响对独立 API/控制器数据流的静态判断，未据此重复扣分。
- **api.request-task：passed** — Promise 请求的取消句柄从请求发起时的 __returned 获取。
  api.js:118-138 在 proxy.request 立即返回时取 pending.__returned，再派生响应 Promise；cancel 调用所存 task.abort。account.mpx:34-35→165→controller.cancelSearch→api.js:220-227，未等待响应才取消。
  未验证：静态业务契约判定；未运行离线脚本、完整工程或真实宿主授权/请求/取消。
  验证限制：RN 运行验证受 account.mpx:266-269 display:block 样式编译错误阻塞；不影响对独立 API/控制器数据流的静态判断，未据此重复扣分。
- **api.stale-result：passed** — 查询身份阻止旧响应覆盖新结果或取消后的状态。
  api.js:220-227 先递增 searchEpoch 再 handle.cancel；276-301 请求捕获 epoch，success/catch/finally 均校验 active/disposed/epoch。A→B 后 A 无权写结果或 loading；取消/离开（339-359）先使身份失效。account.mpx:158-172 把真实输入及乱序按钮连到控制器。
  未验证：静态业务契约判定；未运行离线脚本、完整工程或真实宿主授权/请求/取消。
  验证限制：RN 运行验证受 account.mpx:266-269 display:block 样式编译错误阻塞；不影响对独立 API/控制器数据流的静态判断，未据此重复扣分。
- **network.cancel-token：passed** — xfetch 使用 CancelToken.token、exec 和 isCancel 完成取消链路。
  api.js:141-159 用 new CancelTokenClass、cancelToken:cancellation.token、cancellation.exec；183 保留 xfetch.isCancel；305-327 中 catch 区分取消与普通错误并发布 detailError，account.mpx:51 展示错误、56-57/167 接取消按钮。真实模式默认 CancelToken（112），离线明确注入等价 StubCancelToken（runtime.js:44）。
  未验证：静态业务契约判定；未运行离线脚本、完整工程或真实宿主授权/请求/取消。
  验证限制：RN 运行验证受 account.mpx:266-269 display:block 样式编译错误阻塞；不影响对独立 API/控制器数据流的静态判断，未据此重复扣分。
- **network.interceptor-dispose：passed** — 响应拦截器保留成功值/业务错误语义并通过 use 返回的函数释放自身。
  api.js:22-29 保留正常 response 引用，业务非0抛错；162-175 响应拦截器返回正常值/Promise.reject，保存 use 返回的 release 并幂等调用。331-359 enter/leave/dispose 只注册/释放自身一次，未使用 eject(id) 或清空共享实例。
  未验证：静态业务契约判定；未运行离线脚本、完整工程或真实宿主授权/请求/取消。
  验证限制：RN 运行验证受 account.mpx:266-269 display:block 样式编译错误阻塞；不影响对独立 API/控制器数据流的静态判断，未据此重复扣分。

补充观察：

# 静态设计审查

6/6 passed，0 failed，0 pending，仅代表本 case 六条独立业务契约的静态符合率，不代表页面可运行。

逐项追踪正式 api/account/runtime/auth-host/request-stub/demo-cases 及 app/config/verification；本次日志只有 case_files 读取和交付，没有执行复现脚本。脚本有可操作的手动完成乱序、取消、拦截器保留其他注册场景，但未把预期或按钮标签“通过”计作执行证据。

独立 validation：ESLint 0 errors/9 warnings；RN ios/android/harmony 每目标四条 display:block 错误，定位 account.mpx:266-269（heading/line/hint/error）；ali navigationStyle 不支持，Web placeholder-style 与 bindconfirm 不支持告警。业务 API/控制器不依赖 display:block，仍可静态确定六项数据流，因此仅在 blocked_by 记录 RN 运行阻塞，不把相同样式根因变成六次扣分。Web 的搜索按钮与 bindinput 仍构成入口，bindconfirm 缺失是额外交互差异。

真实模式要求应用启动注入既有 xfetch 和宿主 signIn，这与输入给定工程宿主契约一致；默认离线不联系服务。交付没有运行态声称，verification 的 RN 样式完整自查漏掉了 display:block，不能把静态满分称为可运行方案。


## Case 4 · 登录适配、任务句柄与请求取消 · noskill

- **api.host-login：passed** — 微信与支付宝授权码进入各自兑换入口，RN/Web 使用约定宿主 session 能力。
  api.js:56-84 按 wx/ali 构造 /session/平台，wx 用 mpx.login().code、ali 用 my.getAuthCode().authCode，均 POST {code}；86-90 RN/Web 调 authHost.signIn 的 token，不兑换为微信 code。auth-host.js:17-40 有真实注入和本地完成/取消 Promise stub；account.mpx:12/140→AccountModel.login（110-130）提供入口。
  未验证：静态业务契约评分；没有运行离线脚本或真实宿主登录/请求/取消。
  验证限制：RN 页面运行受 account.mpx:203-204 样式编译错误阻塞；Web 页面使用 setData（105、115等）且 RN 详情按钮依赖 dataset（159），均另记集成限制，不跨独立 API 断言重复扣分。
- **api.custom-contract：passed** — getSession 按实际目标注册且由安装后的代理调用，明确返回 Promise。
  api.js:95-105 六个实际目标均注册 custom.getSession；wx/ali 箭头返回 async nativeSession、RN/Web 的 hostSession 也 async，118-119 统一从 mpx 代理消费。bootstrap.js 在启动导入 api；README 唯一初始化说明明确替换原安装、合并其他 custom，不假设 ios 自动继承。
  未验证：静态业务契约评分；没有运行离线脚本或真实宿主登录/请求/取消。
  验证限制：RN 页面运行受 account.mpx:203-204 样式编译错误阻塞；Web 页面使用 setData（105、115等）且 RN 详情按钮依赖 dataset（159），均另记集成限制，不跨独立 API 断言重复扣分。
- **api.request-task：passed** — Promise 请求的取消句柄从请求发起时的 __returned 获取。
  api.js:42-52 发起请求后立即取 promise.__returned，cancel 只调用所存 task.abort；122-129 搜索使用此封装。account.mpx:33/157 连到 AccountModel.cancelSearch，account-model.js:57-62 失效身份后调用 operation.cancel。
  未验证：静态业务契约评分；没有运行离线脚本或真实宿主登录/请求/取消。
  验证限制：RN 页面运行受 account.mpx:203-204 样式编译错误阻塞；Web 页面使用 setData（105、115等）且 RN 详情按钮依赖 dataset（159），均另记集成限制，不跨独立 API 断言重复扣分。
- **api.stale-result：passed** — 查询身份阻止旧响应覆盖新结果或取消后的状态。
  account-model.js:57-62 在 stop 前递增 searchVersion；134-163 捕获 version，成功、catch、finally 均经 current() 校验。A→B/B→A 返回时 A 不写结果/错误/loading；73-86 离开/销毁也失效身份。该逻辑不依赖 abort 真正阻断，request-stub.js 明确保留晚到队列。
  未验证：静态业务契约评分；没有运行离线脚本或真实宿主登录/请求/取消。
  验证限制：RN 页面运行受 account.mpx:203-204 样式编译错误阻塞；Web 页面使用 setData（105、115等）且 RN 详情按钮依赖 dataset（159），均另记集成限制，不跨独立 API 断言重复扣分。
- **network.cancel-token：failed** — xfetch 使用 CancelToken.token、exec 和 isCancel 完成取消链路。
  api.js:151-173 正确传 source.token 并调用 source.exec，但 account-model.js:184-185 对任何仍为 current 的详情 rejection 都显示 detailError；api/detail-host/account-model 全链未调用 xfetch.isCancel 或等价取消标记判断。；自有取消按钮通过 detailVersion 失效可隐藏该次 rejection（account-model.js:65-70），不能替代 catch 区分取消/真实错误的要求：当前请求若 reject 带 __CANCEL__ 仍走“详情失败”显示。detail-host.js:19-51 的 stub 也没有 isCancel，故完整 cancel-token 契约不满足。
  未验证：静态业务契约评分；没有运行离线脚本或真实宿主登录/请求/取消。
  验证限制：RN 页面运行受 account.mpx:203-204 样式编译错误阻塞；Web 页面使用 setData（105、115等）且 RN 详情按钮依赖 dataset（159），均另记集成限制，不跨独立 API 断言重复扣分。
- **network.interceptor-dispose：passed** — 响应拦截器保留成功值/业务错误语义并通过 use 返回的函数释放自身。
  api.js:133-148 对响应先 unwrap 检查 HTTP/业务 code，成功返回原 response，错误 throw 保持 reject；保存 use 返回的 dispose，幂等调用，不用 eject。account-model.js:29-49、73-81、89-107 每次激活注册并在离开/切模式仅释放自身，其他订阅不被清空。
  未验证：静态业务契约评分；没有运行离线脚本或真实宿主登录/请求/取消。
  验证限制：RN 页面运行受 account.mpx:203-204 样式编译错误阻塞；Web 页面使用 setData（105、115等）且 RN 详情按钮依赖 dataset（159），均另记集成限制，不跨独立 API 断言重复扣分。

补充观察：

# 静态设计审查

5/6 passed，1 failed，0 pending。该分数不是运行通过率。

失败 network.cancel-token：token/exec 写对，但完整输出无 isCancel 或等价取消判断；当前详情 catch 对取消 rejection 与普通错误一律显示。自有按钮使版本失效能抑制其取消错误，但未完整满足该独立断言“catch 区分取消与普通错误”。没有因同样的页面集成缺陷重复扣其余 API 契约。

已追踪全部正式模块、演示脚本、入口和 README/verification；本轮日志没有执行脚本或构建。独立 ESLint 0 errors/0 warnings。六目标编译中 RN 三目标均有 account.mpx:203 border-bottom-style、204 非单类 button 选择器错误；wx/ali 无错误告警，Web bindconfirm 不支持告警。

额外问题：account.mpx:105、115、118 等依赖 Web 不具备的 setData；详情/手动传输按钮在159、163依赖 RN 不支持的 dataset，导致 RN 实际交互待修复。小程序真实登录路径允许直接宿主 my.getAuthCode，与断言要求的 code→ali 兑换等价，不因未统一使用 mpx.login 额外扣分。README 解释唯一插件安装替换，接受其与已启用代理工程的集成约定。


## Case 5 · 响应式动态组件与首次渲染能力 · mpx

- **script.props-live：passed** — title prop 在父级更新后继续驱动标题展示。
  detail-switcher.mpx:47-53 通过 toRefs(props) 持续消费 title，模板3/19分别展示与下传；basic-card.mpx:11-15、vip-card.mpx:11-15 同样响应式。demo.mpx:124-127 修改父级 title，29-35 绑定输入，无初值快照解构。
  未验证：静态设计判定；未执行完整组件树构建、真实点击/props更新/卸载或各宿主背景与过渡渲染验证。
  验证限制：独立编译在 RN 三目标报告 detail-switcher.mpx:175、182 的 display:block 不支持；该样式阻塞实际运行，不改变上述独立状态/绑定/能力预声明的静态判断。
- **script.setup-exposure：passed** — script setup 显式暴露模板所用的状态、计算值与方法。
  detail-switcher.mpx:151-166 显式暴露模板所用 title/disabled/currentKind/count/configStatus/coverStyle/panelStyle 与操作方法等；两个 card:15 暴露 title；demo.mpx:213-236 覆盖所有模板状态、计算值与方法，内部计时器无需暴露。
  未验证：静态设计判定；未执行完整组件树构建、真实点击/props更新/卸载或各宿主背景与过渡渲染验证。
  验证限制：独立编译在 RN 三目标报告 detail-switcher.mpx:175、182 的 display:block 不支持；该样式阻塞实际运行，不改变上述独立状态/绑定/能力预声明的静态判断。
- **script.lifecycle-registration：passed** — 生命周期同步注册，异步配置只更新存活实例状态。
  detail-switcher.mpx:124-149 在 setup 同步注册 onMounted/onUnmounted；挂载才启动本地 Promise，127/131 disposed 守卫拦截异步写入，卸载清 timer 并 settleConfig(null)。demo.mpx:195-211 同步注册并清本实例任务，184-190 的 nextTick/计时回调也守卫 disposed。
  未验证：静态设计判定；未执行完整组件树构建、真实点击/props更新/卸载或各宿主背景与过渡渲染验证。
  验证限制：独立编译在 RN 三目标报告 detail-switcher.mpx:175、182 的 display:block 不支持；该样式阻塞实际运行，不改变上述独立状态/绑定/能力预声明的静态判断。
- **template.dynamic-range：passed** — 动态组件候选与 usingComponents 注册一致且保留父层共享计数。
  detail-switcher.mpx:16-20 range 仅 basic-card,vip-card，215-218 同名注册实际文件；63-65 将 activeKind 限制到这两者；count:55 属于持续存在的 switcher，93-99 仅点击累加，子卡切换不会重置。demo.mpx:133-135 只改 activeKind，title 继续下传。
  未验证：静态设计判定；未执行完整组件树构建、真实点击/props更新/卸载或各宿主背景与过渡渲染验证。
  验证限制：独立编译在 RN 三目标报告 detail-switcher.mpx:175、182 的 display:block 不支持；该样式阻塞实际运行，不改变上述独立状态/绑定/能力预声明的静态判断。
- **template.event-chain：passed** — 点击处理和 change 事件在四端传递同一业务载荷并遵守 disabled。
  detail-switcher.mpx:8-13 绑定 handleAction(currentKind,$event)，93-99 先检查 disabled 与当前 kind 再 count++、context.triggerEvent(change,{count,kind})；demo.mpx:35→118-122 从 event.detail 保存真实载荷，40-44 展示。两次启用操作 count=2，禁用无写入/事件，链路不依赖 dataset。
  未验证：静态设计判定；未执行完整组件树构建、真实点击/props更新/卸载或各宿主背景与过渡渲染验证。
  验证限制：独立编译在 RN 三目标报告 detail-switcher.mpx:175、182 的 display:block 不支持；该样式阻塞实际运行，不改变上述独立状态/绑定/能力预声明的静态判断。
- **rn.background-priming：passed** — 动态背景节点在 RN 首次渲染即开启 enable-background 并具有唯一有效 key。
  detail-switcher.mpx:22-28 的真实 view 始终存在，RN 三目标第一次即带 enable-background=true 与稳定 key=detail-cover；70-83 初始空 cover 返回空样式，非空后提供 backgroundImage 等，demo.mpx:84/195-200 从空值更新。能力只给背景节点且目标后缀隔离。
  未验证：静态设计判定；未执行完整组件树构建、真实点击/props更新/卸载或各宿主背景与过渡渲染验证。
  验证限制：独立编译在 RN 三目标报告 detail-switcher.mpx:175、182 的 display:block 不支持；该样式阻塞实际运行，不改变上述独立状态/绑定/能力预声明的静态判断。
- **rn.animation-priming：passed** — 动态过渡节点在 RN 首次渲染即开启 enable-animation。
  detail-switcher.mpx:35-40 真实 view 首次即 enable-animation@ios|android|harmony=transition；59-60 初始 expanded=false/transitionEnabled=false，85-91 初始只有 opacity，102-105 展开后加 transition 再折叠，节点未 wx:if/key 变化，无全局动画开关。
  未验证：静态设计判定；未执行完整组件树构建、真实点击/props更新/卸载或各宿主背景与过渡渲染验证。
  验证限制：独立编译在 RN 三目标报告 detail-switcher.mpx:175、182 的 display:block 不支持；该样式阻塞实际运行，不改变上述独立状态/绑定/能力预声明的静态判断。

补充观察：

# 静态设计审查

7/7 passed，0 failed，0 pending；不等于运行通过或可合入即用。

已追踪 switcher、两个 card、demo 的完整状态/事件/注册/生命周期/动态样式，以及附加页面/App/配置和依赖说明。本次日志仅受限读写，verification 明确没有运行测试；未以其中自查声称作为给分依据。

独立 ESLint 0 errors/7 warnings。独立六目标单文件编译中 wx/ali/web 无 errors/warnings；RN 三目标各有 DetailTitle:175、DetailLine:182 display:block 错误。相同 CSS 约束属于全局样式能力而非七条独立状态/事件/首帧属性契约，不在各项反复扣分；均通过 blocked_by 说明运行阻塞。两个 card 与 demo 同样含 display:block（各卡25/31、demo251/258），尚非完整树编译，不能从父组件单文件诊断推断子树已验证。

额外观察：实现增加了完整示例入口和配置，远程图片只是演示地址，未验证可达。配置 Promise 取消还结算为 null，既清 timer 又阻止卸载写入；接受此实现。RN key 是同父级各异的稳定字面量，符合该节点唯一有效 key 的要求，不要求无关全局 UUID。


## Case 5 · 响应式动态组件与首次渲染能力 · noskill

- **script.props-live：passed** — title prop 在父级更新后继续驱动标题展示。
  detail-switcher.mpx:42-51 以 computed(() => props.title) 持续读响应式 props；两个 card:10-13 同样 computed。demo.mpx:88-90、111-115 修改 title、22 下传；这项响应性设计成立，模板可达问题单列 setup-exposure。
  未验证：静态评分；完整构建和各宿主实际 props/事件/背景/过渡/卸载均未验证。
  验证限制：script.setup-exposure：原始输出缺少 defineExpose，独立编译在首个 wx 阶段中止；其他项仅判其独立静态设计，未重复扣该根因。
- **script.setup-exposure：failed** — script setup 显式暴露模板所用的状态、计算值与方法。
  detail-switcher.mpx:39-129、basic-card/vip-card.mpx:7-14、demo.mpx:46-182 所有 script setup 均无 defineExpose；模板所用 displayTitle/count/方法等不能可达。；validation/eval-5-reactive-switcher/noskill/compile.stderr 明确抛出 Mpx script setup must define the variables for return using defineExpose，独立 ESLint 对各模板引用报告 mpx/valid-setup-define-expose；不仅是缺少某个字符串的推断。
  未验证：静态评分；完整构建和各宿主实际 props/事件/背景/过渡/卸载均未验证。
- **script.lifecycle-registration：passed** — 生命周期同步注册，异步配置只更新存活实例状态。
  detail-switcher.mpx:109-128 在 setup 同步注册挂载/卸载钩子；挂载后启动本地 Promise，112 disposed/null 守卫；卸载清 timer 并 resolve(null)，不会在配置返回后写失效实例。demo.mpx:172-180 同步钩子清自动任务。独立生命周期结构满足，不重复按 expose 根因扣分。
  未验证：静态评分；完整构建和各宿主实际 props/事件/背景/过渡/卸载均未验证。
  验证限制：script.setup-exposure：原始输出缺少 defineExpose，独立编译在首个 wx 阶段中止；其他项仅判其独立静态设计，未重复扣该根因。
- **template.dynamic-range：passed** — 动态组件候选与 usingComponents 注册一致且保留父层共享计数。
  detail-switcher.mpx:19-21 显式 if/else 只在 basic-card、vip-card 间切换，134-137 两个文件均注册；53-55 将非法类型归一化，66 的 count 在切换器外层持久保存。虽未使用 component range，但行为等价且候选集合更封闭；demo.mpx:122-125 只改类型不卸载整个切换器。
  未验证：静态评分；完整构建和各宿主实际 props/事件/背景/过渡/卸载均未验证。
  验证限制：script.setup-exposure：原始输出缺少 defineExpose，独立编译在首个 wx 阶段中止；其他项仅判其独立静态设计，未重复扣该根因。
- **template.event-chain：failed** — 点击处理和 change 事件在四端传递同一业务载荷并遵守 disabled。
  detail-switcher.mpx:48 以 defineEmits 取得 emit，24→94-100 点击处理依赖此 emit；虽 disabled 守卫和父级 demo.mpx:148-169 的 event.detail 消费写出，但实际事件发射能力不存在。；validation/probes/define-emits.json 的主 Agent 独立最小探针显示 wx 编译仍保留 setup 内 var emit = defineEmits([change])，未转换为宏；setupCallProbe 明确 ReferenceError: defineEmits is not defined。与快照 base/script-reference.md:405-411 的 useContext 契约一致。该缺失宏是独立于 missing defineExpose 的失败原因。
  未验证：静态评分；完整构建和各宿主实际 props/事件/背景/过渡/卸载均未验证。
  验证限制：script.setup-exposure：原始输出缺少 defineExpose，独立编译在首个 wx 阶段中止；其他项仅判其独立静态设计，未重复扣该根因。
- **rn.background-priming：failed** — 动态背景节点在 RN 首次渲染即开启 enable-background 并具有唯一有效 key。
  detail-switcher.mpx:9-17 背景 view 首次已 enable-background（三个 RN 后缀），但没有任何 key/wx:key；快照 rn-template-reference.md:141 明确开启背景需唯一 key，原断言 verify/fail_when 同样要求。57-64 仍是 view 动态背景，缺 key 为独立失败原因。
  未验证：静态评分；完整构建和各宿主实际 props/事件/背景/过渡/卸载均未验证。
  验证限制：script.setup-exposure：原始输出缺少 defineExpose，独立编译在首个 wx 阶段中止；其他项仅判其独立静态设计，未重复扣该根因。
- **rn.animation-priming：pending** — 动态过渡节点在 RN 首次渲染即开启 enable-animation。
  detail-switcher.mpx:27-35 首次即 enable-animation@ios/android/harmony=true，68-76 初始没有 transition，103-106 展开再折叠复用同一节点，按首次时机与局部范围设计满足。；快照 rn-template-reference.md:149 属性表写 boolean，但 rn-style-practice.md:290 对 transition 要求 enable-animation="transition"；原输出用 boolean true。资料内部冲突且原始编译先因 expose 中止，尚无确定证据判定该值是否可预启用 transition。
  未验证：静态评分；完整构建和各宿主实际 props/事件/背景/过渡/卸载均未验证。
  验证限制：script.setup-exposure：原始输出缺少 defineExpose，独立编译在首个 wx 阶段中止；其他项仅判其独立静态设计，未重复扣该根因。

补充观察：

# 静态设计审查

3 passed、3 failed、1 pending；通过率暂为3/7，判定覆盖率6/7。剩余 animation 不确定项不能转换为0或1，亦不能称本 case 完整运行通过。

确定失败：全树 script setup 无 defineExpose，独立原始编译明确报错；背景 view 无有效 key；defineEmits 不可用导致事件发射链断开。主 Agent 独立 validation/probes/define-emits.json 显示最小 wx 探针编译成功但生成 setup 原样保留 defineEmits 调用，独立调用诊断 ReferenceError。它证明 event-chain 的独立缺陷，不是再次处罚 missing expose。

computed props、同步生命周期与显式两组件 if/else 均可单独追踪成立，按静态能力判 passed；只在 blocked_by 记录 expose 阻塞，不重复扣分。显式 basic/vip 两分支的封闭候选与持久外层 count 作为 range 的契约等价实现接受。

唯一 pending：enable-animation boolean true 在 rn-template-reference.md:149 被列为合法类型，在 rn-style-practice.md:290 却要求 api/transition 字符串。首次时机、节点范围与 transition 状态切换均已写出，但不能因资料内部冲突硬扣，也不能以编译无诊断证明 RN 宿主首帧动画支持。原始输出在 expose 阶段中止，暂无足以裁定该值的独立运行证据。该项不同裁定会让本 case 静态得分在3/7与4/7之间变化；目前必须保留 pending。

独立 ESLint 61 errors/0 warnings，主要是模板未暴露和相应 unused；原始六目标编译在首个 wx 即因 defineExpose 抛错，没有六目标完成结果。额外 display:block（switcher146/demo200/204）未因编译提前中止而被诊断，不作额外分数。已读全部正式输出、verification 和本轮日志；执行者没有声称运行验证，但静态自查漏掉了 Mpx 必须显式暴露的基本契约。


## Case 6 · 路由参数、部署与异步分包 · mpx

- **routing.decoded-query：passed** — 页面使用 Mpx 提供的 decodedQuery 且不重复解码。
  outputs/detail.mpx:39-45 直接消费第二参数 decodedQuery.title，赋给 title；:11、20 显示同一 title，:52-57 将同值交给已安装 Promise API 的 setNavigationBarTitle。输入 %2F 不再 decode，结果仍为 %2F。
  未验证：未执行各宿主参数/标题显示验证。
- **routing.web-deploy：passed** — Web 路由 base、资源 publicPath 和 history 回退各自正确配置。
  outputs/runtime-config.js:7-16 配置运行时 history 与 base=/catalog/；outputs/plugin-options.js:15-20 移除旧编译期 routeConfig，:35-38 单独提供 CDN publicPath。；outputs/app.mpx:19-29 注册首页 index，outputs/app-json.js:17-23 设置合法 entryPagePath；outputs/packageDetail/app.mpx:7-12 注册详情。outputs/web-app-options.js:28-50 从已有生成记录取得异步组件并添加 /detail alias，未替换生成 routes；outputs/app.mpx:7 接入该包装。outputs/verification.md:25-39 给出 HTML/CDN 分离与深链 history fallback。
  未验证：未执行完整 App 构建、VueRouter alias 初始匹配与线上直达/刷新；独立单入口编译不覆盖应用路由配置。
- **routing.web-titlebar：passed** — Web 内建标题栏被运行时显式启用且页面未将其隐藏。
  outputs/app.mpx:3 在 createApp 前执行 runtime-config；outputs/runtime-config.js:7-14 显式 enableTitleBar=true。outputs/detail.mpx:108-133 仅 wx 改 custom，Web 保留 default；:39-57 从 decodedQuery 更新 title 并调用 setNavigationBarTitle，:47-49 挂载后再同步。
  未验证：未在浏览器实际确认标题栏渲染及动态标题。
- **subpackage.load-driver：passed** — RN 普通异步分包同时具备编译开关与真实宿主加载驱动，不承诺 RN/Web 独立启动。
  outputs/plugin-options.js:22-27 对 ios/android/harmony 开启 rnConfig.supportSubpackage；outputs/runtime-config.js:19-32 loadChunkAsync 读取 params.package 并等待 loadBundleWithTimeout。outputs/bundle-host.js:13-31 调用注入宿主的真实 loadBundle 并检查返回 Promise；:38-51 等执行完成才 resolve。；outputs/app-json.js:8-33 仅 wx/ali 保留 independent；outputs/packageDetail/app.mpx:1-4 保留独立包初始化；outputs/index.mpx:17-26 为 RN/Web 提供正常导航。outputs/verification.md:43-48 明确 RN/Web 普通异步分包且提供宿主注入边界，未承诺独立启动。
  未验证：未注入真实 RN 容器执行 bundle；未验证微信/支付宝独立包访问。
- **subpackage.prefetch-driver：passed** — RN 预下载单独接入只下载不执行的宿主方法，并明确 Web preloadRule 不生效。
  outputs/runtime-config.js:34-40 遍历预下载包名，仅调用 downloadBundle；outputs/bundle-host.js:34-35 转发到注入宿主 downloadBundle，没有执行 loadBundle。outputs/app-json.js:42-51 保留并合并首页预下载，outputs/app.mpx:27-29 注册首页规则。outputs/verification.md:49-50 明确 Web preloadRule 不生效，Web 导航见 outputs/index.mpx:21-24。
  未验证：未实测预下载时序、网络条件和宿主只下载不执行行为。

补充观察：

# 静态设计评分：5/5；failed 0；pending 0

逐项基于正式输出的数据流判定；未将 verification 的自查声明作为执行证据。run-1/agent.jsonl 记录仅文件读写及静态自查，末尾也声明未运行构建测试。

独立 validation/eval-6-routing-subpackage/mpx/summary.json：11 文件 ESLint 0 error / 0 warning。compile-run.json 是六目标 detail 单入口部分编译，不集成应用路由、分包和宿主配置，也不代表完整 App 通过。编译器为发布包 2.11.1，不能反向覆盖题设新版 mode/srcMode 语义。

额外观察（不增设扣分项）：
- wx 编译缺少 CustomNavigation.mpx；输入明确该组件已经存在但没有给源码，outputs/detail.mpx:124-125 与 verification.md:5 明确要求接回原实现，保留调用符合本题边界，实际微信页面仍待集成。
- RN 三目标部分编译对 outputs/detail.mpx:88、94、101 的 display:block 报错；这是静态输出额外样式问题，不把同一基础构建问题重复扣到解码、标题、加载和预下载契约。
- ali 编译提示 navigationStyle:default 不支持；默认原生导航没有因此被关闭，实际导航需真机验证。
- Web alias 实现复用生成记录并保留所有路由，但 outputs/web-app-options.js:28-50 依赖 VueRouter 3 addRoutes 与根 beforeCreate 时序，真实深链匹配尚未运行验证。

断言边界：本次均为静态设计通过，不是运行通过率；宿主执行、浏览器初始匹配、原导航组件和整包发布均在各条 unverified 保留。


## Case 6 · 路由参数、部署与异步分包 · noskill

- **routing.decoded-query：failed** — 页面使用 Mpx 提供的 decodedQuery 且不重复解码。
  outputs/detail.mpx:39-44 只声明 onLoad(query) 并消费第一参数 query.title，未消费第二参数 decodedQuery；题设输入 raw title=%252F、decoded title=%2F 时，赋给 title 的是 %252F。outputs/page-runtime.js:7 和 runtime-config.js:17 设置 decodeUrlQuery 并不能替代本题明确的 onLoad 第二参数契约；没有实现可改变这一数据流。
  未验证：未执行完整工程构建、浏览器或真机行为；此失败依据直接可判定的静态 API/配置或参数数据流。
- **routing.web-deploy：failed** — Web 路由 base、资源 publicPath 和 history 回退各自正确配置。
  outputs/runtime-config.js:19-24 将 history/base 放在 mpx.config.webRouteConfig，而非框架消费的 mpx.config.webConfig.routeConfig；因此无法建立要求的运行时 history/base。；outputs/webpack-fragment.js:40-42 的 CDN publicPath、outputs/nginx.conf.fragment:11-30 的短入口转向及 HTML fallback、outputs/app-json.js:15-17 的合法首页均存在，但不能补足运行时路由配置错误；未因地址规范化单独扣分。
  未验证：未执行完整工程构建、浏览器或真机行为；此失败依据直接可判定的静态 API/配置或参数数据流。
- **routing.web-titlebar：failed** — Web 内建标题栏被运行时显式启用且页面未将其隐藏。
  outputs/runtime-config.js:25-29 使用 enableShowNavBar:true，没有 enableTitleBar:true；outputs/detail-json.js:27 虽保留 Web navigationStyle=default，outputs/detail.mpx:47-52 虽更新标题，但内建标题栏所需的运行时开关缺失。
  未验证：未执行完整工程构建、浏览器或真机行为；此失败依据直接可判定的静态 API/配置或参数数据流。
- **subpackage.load-driver：failed** — RN 普通异步分包同时具备编译开关与真实宿主加载驱动，不承诺 RN/Web 独立启动。
  outputs/plugin-options.js:13-21 仅设置 asyncSubpackageRules，没有 rnConfig.supportSubpackage；outputs/runtime-config.js:42-55 注册 asyncChunkLoader(name)，没有 loadChunkAsync(params)。故 outputs/bundle-host.js:61-62 的真实 loadBundle 转发未连接到 Mpx 加载流程。；outputs/app-json.js:4-12 仅为 wx/ali 保留 independent，outputs/index.mpx:24-25 有正常详情导航；这些正确部分不能补足编译开关和驱动回调错误。
  未验证：未执行完整工程构建、浏览器或真机行为；此失败依据直接可判定的静态 API/配置或参数数据流。
- **subpackage.prefetch-driver：failed** — RN 预下载单独接入只下载不执行的宿主方法，并明确 Web preloadRule 不生效。
  outputs/runtime-config.js:50-52 定义 asyncChunkPreloader(name)，没有 Mpx preloadRule 调用的 downloadChunkAsync(packages)；尽管它转发 host.downloadBundle，框架预下载入口无法到达该回调。；outputs/app-json.js:28-35 保留 wx/ali/RN preloadRule，Web 排除；outputs/verification.md:62 明确 Web 不承诺原生预下载，这些部分正确。该条只判断独立的预下载回调错误，未重复计算 loadChunkAsync/supportSubpackage 问题。
  未验证：未执行完整工程构建、浏览器或真机行为；此失败依据直接可判定的静态 API/配置或参数数据流。

补充观察：

# 静态设计评分：0/5；failed 5；pending 0

五项各自存在明确独立缺陷：onLoad 取错参数、Web 路由配置层级错误、内建标题栏开关错误、RN 加载编译开关和运行时钩子缺失、RN 预下载钩子错误。未因文档列出待核实 API 而将不存在的连接视为通过。

run-1/agent.jsonl 的实际执行是只读 input 并写 outputs、静态自查；末尾明确未构建测试。独立 validation/eval-6-routing-subpackage/noskill/summary.json 显示 12 文件 lint 无错误警告。compile.stdout 六目标均失败，直接原因是 outputs/detail.mpx:63-64 用 application/json lang=js 承载 module.exports，被 JSON5 解析；app.mpx:14-15 也使用同类写法。此基础 SFC 问题另记，不横跨五项重复扣分；已有五条失败均可在静态数据流上独立确定。

编译器固定发布包 2.11.1，单入口部分编译没有完整集成 App/插件，不能宣称完整构建/运行，也不能反向覆盖题设新版 mode/srcMode 语义。

额外观察：交付将应保留的既有微信导航重新实现；文件路径需按 verification.md:13-25 人工迁位才能闭合，故输出目录原样不是完整工程；这些未增加评分断言。Web 以保留 query 的短入口重定向到生成分包路由属于可接受等价入口设计，本次 web-deploy 失败仅来自运行时配置错误。


## Case 7 · 共享业务的 Web SSR 请求隔离 · mpx

- **ssr.request-pinia：passed** — 每次 SSR 应用初始化同步创建并返回独立 Pinia，保留既有根选项。
  outputs/app.mpx:10-19 在同步 onAppInit 内调用 createPinia 并合并 appMarker:keep-me；模块顶层仅导入工厂。outputs/stores/detail.js:6-16 在 defineStore 工厂内创建响应式 state 与 pending/version 闭包，无顶层 useDetail 实例。；outputs/detail.mpx:33-38 在同步 setup 显式 useDetail(proxy.$pinia)，:102-108 的 SSR 预取复用该局部 store；outputs/stores/detail.js:40-64 异步恢复后仍写当前实例 refs，不再读取 active Pinia。并发 A/B 各自的 Pinia、store 与 context.fetchDetail 均独立。
  未验证：未执行真实并发 A/B renderToString，隔离结论为静态数据流判定。
- **ssr.await-prefetch：passed** — 服务端预取返回真正的数据 Promise，并保留各客户端的加载入口。
  outputs/detail.mpx:79-90 的 onLoad 在 SSR return，在 wx/ali/RN/browser 调 loadClient；:102-108 的 onServerPrefetch 返回 detail.fetchItem。outputs/stores/detail.js:40-64 返回 pending Promise，只有 fetcher 和状态赋值完成后才 resolve。；outputs/api/detail-core.js:21-47 的本地源是真实延迟 Promise（detail.config.json:5 A=60、B=5）；HTTP 源 :63-69 等待 transport，outputs/api/request.js:7-31 包装回调为 Promise，server.js:81-83、115-118 每请求注入 Node http/https transport。不是 RequestTask 或只依赖 onLoad。
  未验证：未验证最终 HTML 等待延迟响应和各端真实生命周期。
- **ssr.browser-import：passed** — 浏览器专用埋点在 SSR 中不会被导入求值，其他端无此依赖。
  outputs/analytics.web.js:2 保留导入求值即读 window 的模块。outputs/detail.mpx:119-130 仅在 onMounted 且 web/window 存在时动态 import(./analytics)，页面无静态 import。outputs/analytics.js:1-4 为非 Web 回退且不引入浏览器库；:131-134 清理挂载监听。
  未验证：未运行无 window/document 的完整 Node SSR，也未检查浏览器埋点实际监听。
- **ssr.hydration-cache：passed** — 首屏状态通过 Pinia 恢复并按请求参数复用，而非永久跳过后续请求。
  outputs/stores/detail.js:7-11、67 把 item/loadedId 等作为 Pinia refs 返回；app.mpx:18 返回请求 Pinia，server.js:68-72 使用默认注入 renderer，index.template.html:8 是标准 outlet，未接管默认 SSR 状态序列化/恢复。；outputs/stores/detail.js:25-28 仅当 loadedId 与当前 id 一致复用；:35-47 新请求清空旧 loadedId，校验成功才写入；:51-62 失败抛错并清理 pending。outputs/detail.mpx:111-115 监听同页面 query.id 变化加载 B，:136-137 提供 force 重试。因此 A hydration 复用不妨碍 B 获取或失败重试。
  未验证：未执行浏览器 hydration、请求计数、同页切 B 或失败重试。
- **ssr.dual-build：passed** — SSR 具有同入口的服务端/客户端产物与逐请求渲染 context，异步首屏正确等待路由。
  outputs/ssr-build.js:12-20 给现有 Mpx 插件开启 useSSR；:68-110 保留同一 entry，server target=node/commonjs2、禁 split/runtimeChunk 并添加 server-plugin，client target=web 与 client-plugin，分目录输出。outputs/build-integration.md:25-44 明确两次同入口构建与独立配置实例。；outputs/server.js:65-72 配对 server bundle/client manifest/template；:114-119 在每次 HTTP 请求内新建 context 并传真实 url 调 renderToString；index.template.html:8 提供 outlet。没有另建 Vue 应用或把 useSSR 当作 server 构建。
  未验证：未执行完整 server/client App 构建与服务启动；独立页面编译不验证 SSR pipeline，Web 编译另受环境 vue-demi 依赖错误影响。

补充观察：

# 静态设计评分：5/5；failed 0；pending 0

请求 Pinia、等待 Promise、浏览器模块隔离、按 id 恢复缓存、同入口双构建分别实际追踪。默认 Mpx SSR 入口负责状态输出与恢复，本输出没有覆盖该流程；无需为了评分额外要求手写序列化代码。run-1/agent.jsonl 为允许文件读写与静态自查；交付未声称运行通过。

独立诊断：validation/eval-7-ssr-shared-state/mpx/summary.json 为 14 文件 lint、1 error：outputs/api/request.node.cjs:43 全局 Buffer 违反 node/prefer-global/buffer 风格规则，不改变 Promise 或 Node 传输契约。未额外扣分。

compile.stdout：wx/ali/ios/android/harmony 页面单入口部分编译成功；Web 因依赖 vue-demi 缺 hasInjectionContext 导出失败。该诊断指向验证依赖组合，不能据此断定本题请求隔离或 SSR 代码错误。固定编译器发布包 2.11.1，与题设新版 mode/srcMode 语义有版本边界；所有结果均非完整 App、双 SSR 构建或宿主运行。

额外观察：outputs/ssr-build.js:21-26 默认关闭 RN 异步 chunk（仍保留普通分包源组织、客户端加载），build-integration.md:54 给出已有宿主可用时 rnAsync:true。属于明确的集成取舍；本题五条断言没有要求重做 RN 异步宿主加载，未另加扣分项。SSR 默认仍为异步分包，useSSR 等待路由。

服务端静态处理与路由白名单需要合入既有项目；Node HTTP 的完整地址与客户端真机地址也需实际配置。以上以及真实并发 HTML、hydration 请求计数均保留 unverified，不用部分编译冒充 SSR 运行证明。


## Case 7 · 共享业务的 Web SSR 请求隔离 · noskill

- **ssr.request-pinia：passed** — 每次 SSR 应用初始化同步创建并返回独立 Pinia，保留既有根选项。
  outputs/app.mpx:15-22 同步 onAppInit 调 createDetailRuntime，并返回其 pinia 和 appMarker:keep-me；outputs/stores/detail.js:37-47 每次工厂调用创建独立 Pinia、fetcher、requestsById，无模块级 Pinia/store。；outputs/stores/detail.js:73-98 的 action 在异步前保存 const store=this，异步后始终写该 store，:102 显式 useDetail(pinia)；outputs/stores/detail.js:120-126 从当前页面根选项获得当前 runtime，SSR 没有使用全局 getApp/active Pinia。
  未验证：未执行真实并发 SSR A/B；请求隔离结论仅为静态设计。
- **ssr.await-prefetch：passed** — 服务端预取返回真正的数据 Promise，并保留各客户端的加载入口。
  outputs/detail.mpx:45-49 的 onLoad 在 __detailSsr__ 的 Web server 分支跳过，其他目标 await loadDetail；:91-99 的 serverPrefetch 返回页面自己的 loadDetail Promise。:68-78 等待 store.fetchItem 并向 SSR 传播错误。；outputs/stores/detail.js:82-98 返回包含 fetchDetail 和数据写入的 task；outputs/api/detail.js:17-37 的本地源返回真实延迟 Promise，config/detail.js:8 设置 A=80/B=10；:63-109 的 Node HTTP 与 :113-176 的客户端传输均 Promise 化。ssr-build.js:9-15、104 为 server/client 定义 __detailSsr__，不是只靠 async onLoad 或返回 RequestTask。
  未验证：未执行延迟 HTML、真实钩子转发与 wx/ali/RN 生命周期验证。
- **ssr.browser-import：passed** — 浏览器专用埋点在 SSR 中不会被导入求值，其他端无此依赖。
  outputs/detail.mpx:51-59 仅在 onReady 且 web/client/window 存在时执行 require(./analytics.web)，无页面顶层静态导入；其他端分支不加载。outputs/analytics.web.js:1-31 进一步把浏览器对象访问移入 mountAnalytics 内，模块求值也不再触碰 window/document。；这是契约等价的延迟模块求值与副作用隔离：onReady 对应挂载完成，条件 require 只在回调执行才求值，无需限定必须使用 import() 拼写；SSR 不调用此分支，即使原模块仍保留顶层访问也不会在服务端执行。
  未验证：未检查最终各端产物裁剪及浏览器挂载时机；延迟求值为静态判断。
- **ssr.hydration-cache：passed** — 首屏状态通过 Pinia 恢复并按请求参数复用，而非永久跳过后续请求。
  outputs/server.js:38-59 在本次 renderToString 完成后读取 context.detailRuntime.snapshot，安全序列化到 detail-state JSON 节点，节点位于客户端脚本之前；outputs/stores/detail.js:143-150 将当前根 runtime 绑定到当前 ssrContext。outputs/app.mpx:5-17 读取该 JSON 并传给 runtime，stores/detail.js:19-41 在 useDetail(pinia) 前恢复成功数据到 Pinia state。；outputs/stores/detail.js:73-98 仅复用当前 id 的 itemsById[id:key]，成功校验后写缓存，失败不写且 finally 删除 pending。outputs/detail.mpx:100-107 监听同页 query.id 变化加载 B；:82-84 允许失败重试。缓存是 Pinia state，非局部 loaded 布尔；自定义序列化/恢复链可接受为等价实现。
  未验证：未执行真实 hydration 请求计数、同页面 A→B 与失败重试；useSSR 缺失的首屏挂载问题仅归 ssr.dual-build，不重复扣缓存机制。
- **ssr.dual-build：failed** — SSR 具有同入口的服务端/客户端产物与逐请求渲染 context，异步首屏正确等待路由。
  outputs/ssr-build.js:52-62 设置 webConfig.ssr:true 与放在 webConfig 下的 asyncSubpackageRules，没有设置框架规定的 webConfig.useSSR:true，也没有等价的客户端 router.onReady 挂载等待。输入详情为异步分包，所以首屏 hydration 的必要路由等待缺失；verification.md:72 对该配置的说明不能替代实现。；正确部分保留：ssr-build.js:64-109 有同入口 server node/commonjs2/client web、server/client manifests、禁 server split/runtimeChunk；server.js:38-59 每请求新建 context.url 并把 renderToString 的完整应用 HTML 插入页面外壳，同时插入状态/资源。这些满足双产物与逐请求渲染，但不能补足异步首屏路由等待。
  未验证：未执行完整 server/client 构建或实际 renderToString；独立页面编译不覆盖本配置集成。

补充观察：

# 静态设计评分：4/5；failed 1；pending 0

通过项按实际执行路径核对，不根据 verification 声明或字段出现次数给分。唯一计分失败是 ssr.dual-build 的异步客户端路由等待缺失：outputs/ssr-build.js:56-62 写 webConfig.ssr:true，没有 useSSR:true 或等价 router.onReady 流程。没有把该根因再扣到独立的 Pinia 缓存断言。

等价实现边界：
- 埋点用挂载后条件 require 而非 import()，执行模块求值仍延迟至 Web 客户端 onReady；且 analytics.web.js 已将浏览器读取移到函数体。SSR 与其他端无该调用路径，接受其行为契约。
- 状态不使用默认 __INITIAL_STATE__，而用自己闭合的 server snapshot → JSON 节点（先于脚本）→ onAppInit restore → Pinia state 链。允许这一等价序列化恢复；它不是仅改服务端变量名而未改读取端。默认恢复、实际框架时序与 hydration 仍未实测。

独立 validation/eval-7-ssr-shared-state/noskill/summary.json 为 10 文件 lint、1 error：outputs/api/detail.js:84 全局 Buffer 违反 node/prefer-global/buffer，不改变 Node 传输数据流。

compile.stdout 的 wx/ali/ios/android/harmony 单入口部分编译成功；Web 报 http/https 无法解析，以及 vue-demi 缺 hasInjectionContext。前者与单入口验证未集成交付 ssr-build.js:9-15 的 __detailSsr__ DefinePlugin 有关（交付 client 常量为 false），后者是验证环境依赖组合问题；不据这两类诊断额外扣 SSR 逻辑。固定发布编译器 2.11.1 与题设新版 mode/srcMode 有版本边界。此诊断不代表完整 App 或 SSR 构建/运行。

额外观察（不增加断言）：outputs/app.mpx:31-63 使用 application/json lang=js 承载 JS，以及 :34-38 将 packages 写成对象数组而非参考的入口路径数组，完整应用配置存在独立集成风险；页面单入口验证未覆盖 App JSON。app.mpx:24-26 在非 Web onLaunch 再次创建 runtime，是额外初始化，需真机核对其时机。页面注册别名 onServerPrefetch 不属于参考提供的选项式钩子，但同时正确提供 serverPrefetch，未因多余别名单扣。

评分不声称 Node render、并发隔离、hydration 或任一真机运行通过。运行期缺失已逐条保留 unverified。

