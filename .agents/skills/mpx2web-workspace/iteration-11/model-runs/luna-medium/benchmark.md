# Mpx2Web iteration-11 reliability benchmark

- 采样：每组 3 次，共 78 个候选结果
- 评分：隐藏配置标签的独立模型评审 + 三态确定性检查；UNKNOWN 保留独立评审结论
- 编译：每个可作为 page/component 入口的 `.mpx` 均单独执行真实 Web 编译
- 分数：功能、业务保真、编译和严格交付分别报告，不再以一次编译失败覆盖功能证据

| 配置 | 功能正确率 | 业务保真率 | 严格交付率 | 三轮功能分 | 场景宏平均 | 编译文件 | 编译候选 |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 使用 Skill | 87.6% | 91.7% | 84.5% | 89.1%, 86.4%, 87.3% | 87.5% ± 1.1% | 68/69 | 38/39 |
| 无 Skill | 46.4% | 65.3% | 45.5% | 44.5%, 45.5%, 49.1% | 45.0% ± 1.3% | 67/69 | 37/39 |

## 差异

- 功能正确率：+41.2pp
- 适配能力：+45.3pp
- 严格交付率：+39.1pp

## 稳定性与效率

- 使用 Skill：稳定通过/波动/稳定失败 81/28/1；tokens=10397778，耗时=5837.127s，工具调用=372，输出行数=10845
- 无 Skill：稳定通过/波动/稳定失败 36/26/48；tokens=4073500，耗时=5326.674s，工具调用=216，输出行数=10101

## 分场景结果

| Eval | 配置 | 功能通过 | 严格交付通过 | 编译候选 |
| --- | --- | ---: | ---: | ---: |
| eval-0 storefront-style-compat | 使用 Skill | 18/24 | 18/24 | 3/3 |
| eval-0 storefront-style-compat | 无 Skill | 9/24 | 9/24 | 3/3 |
| eval-1 community-publish-bridge | 使用 Skill | 23/24 | 23/24 | 3/3 |
| eval-1 community-publish-bridge | 无 Skill | 10/24 | 10/24 | 3/3 |
| eval-2 member-share-lifecycle | 使用 Skill | 21/21 | 21/21 | 3/3 |
| eval-2 member-share-lifecycle | 无 Skill | 15/21 | 15/21 | 3/3 |
| eval-3 order-center-realtime | 使用 Skill | 29/36 | 19/36 | 2/3 |
| eval-3 order-center-realtime | 无 Skill | 17/36 | 17/36 | 3/3 |
| eval-4 campaign-webview-sdk | 使用 Skill | 19/27 | 19/27 | 3/3 |
| eval-4 campaign-webview-sdk | 无 Skill | 12/27 | 12/27 | 3/3 |
| eval-5 ssr-product-platform | 使用 Skill | 32/33 | 32/33 | 3/3 |
| eval-5 ssr-product-platform | 无 Skill | 14/33 | 14/33 | 3/3 |
| eval-6 api-proxy-task-contract | 使用 Skill | 20/21 | 20/21 | 3/3 |
| eval-6 api-proxy-task-contract | 无 Skill | 3/21 | 3/21 | 3/3 |
| eval-7 route-tabbar-event-channel | 使用 Skill | 17/21 | 17/21 | 3/3 |
| eval-7 route-tabbar-event-channel | 无 Skill | 6/21 | 3/21 | 1/3 |
| eval-8 web-builtin-scroll-media | 使用 Skill | 21/21 | 21/21 | 3/3 |
| eval-8 web-builtin-scroll-media | 无 Skill | 5/21 | 5/21 | 3/3 |
| eval-9 vue2-web-file-isolation | 使用 Skill | 36/39 | 36/39 | 3/3 |
| eval-9 vue2-web-file-isolation | 无 Skill | 27/39 | 27/39 | 3/3 |
| eval-10 ssr-hydrate-async-package | 使用 Skill | 22/24 | 22/24 | 3/3 |
| eval-10 ssr-hydrate-async-package | 无 Skill | 17/24 | 17/24 | 3/3 |
| eval-11 web-accessibility-focus | 使用 Skill | 14/18 | 14/18 | 3/3 |
| eval-11 web-accessibility-focus | 无 Skill | 10/18 | 10/18 | 3/3 |
| eval-12 web-style-runtime-config | 使用 Skill | 17/21 | 17/21 | 3/3 |
| eval-12 web-style-runtime-config | 无 Skill | 8/21 | 8/21 | 3/3 |

## 未稳定通过的断言

### 使用 Skill

- eval-0 `w3`：1/3 — 小程序保留币种与单位的原始 10px 字号
- eval-0 `w4`：2/3 — 目标 WebView 中币种与单位先以不触发强制放大的基础字号排版，再缩放回约 10px 的视觉字号
- eval-0 `w5`：2/3 — 目标 WebView 的缩放补偿具有与基线方向一致的 transform-origin，且校正 flex 布局占位，不改变卡片宽度或价格行基线
- eval-0 `w6`：1/3 — 小字号补偿仅隔离在 Web 输出
- eval-1 `a1`：2/3 — Web 缺失能力只在 choosePlace、openPlace、choosePhoto 或由它们直接调用的专用 helper 中隔离；不得引入通用平台调用层，也不得改写请求、路由或提示能力
- eval-3 `r5`：1/3 — SocketTask 的 open、message、error、close 回调都校验捕获任务仍为当前任务
- eval-3 `r6`：1/3 — 重连与卸载先废弃当前任务身份再关闭旧任务
- eval-3 `r7`：1/3 — 每次 send 前都使用本次捕获的 SocketTask 同时校验当前任务身份与 readyState === task.OPEN，不能只依赖可能滞后的 connected 布尔值
- eval-3 `r8c`：2/3 — 订单删除或撤销操作及其列表状态更新链路保持完整
- eval-4 `h1`：2/3 — Web 宿主白名单只包含完整可信 origin https://campaign.example.com，避免后缀匹配误接纳相似恶意域名
- eval-4 `h3`：1/3 — H5 SDK 仅在 Web 客户端动态加载，不在模块顶层静态引入
- eval-4 `h4`：1/3 — SDK 动态加载和异步初始化的每个边界都阻止卸载后的晚到挂载
- eval-4 `h5`：1/3 — 活动切换使用代际或实例身份校验，旧活动异步结果不会覆盖当前活动
- eval-4 `h7`：2/3 — 没有额外手写 window message 监听时，内建 web-view 的 host 白名单与 clientUid 实例隔离加 bindmessage 即构成消息入口证据；若额外手写监听，则必须同时校验受信任 origin、当前 iframe source 和严格 campaignId
- eval-5 `p5`：2/3 — 推荐组件卸载或商品切换时销毁由 SDK create 返回的 tracker，并清理 Observer 和监听，旧回调不再上报
- eval-6 `q4`：2/3 — 详情跳转与错误提示继续走 Mpx 官方 API 链路；可保留会被跨端编译转换的 wx.navigateTo/wx.showToast，可沿用 mpx.xxx，也可在不依赖应用级配置时使用 @mpxjs/api-proxy 命名导入
- eval-7 `n2`：2/3 — 订单 tab 只通过 Mpx 官方 switchTab 打开，非 tab 页面分别按语义使用 navigateTo、redirectTo、reLaunch、navigateBack；调用可采用项目现有的 mpx.xxx 或会被跨端编译转换的 wx.xxx
- eval-7 `n4`：1/3 — Web 路由只通过 mpx.config.webConfig.routeConfig 配置 history 与 /shop/ base，output.publicPath 同为 /shop/
- eval-7 `n6`：2/3 — 地址展示、地址选择、返回、登录失效重启、支付结果替换和订单 tab 链路保持完整
- eval-9 `v6`：2/3 — customBuiltInComponents 使用原始 key scroll-view，不使用 mpx-scroll-view；自定义 Vue 组件保留 $attrs、$listeners 和默认 slot 的结构透传
- eval-9 `v8b`：2/3 — 自定义滚动组件按 upper/lower threshold 与实际滚动轴发出方向为 top/left、bottom/right 的 scrolltoupper/scrolltolower
- eval-9 `v9b`：2/3 — Web 图表在指标变化时安全 update 或销毁后重建，指标点击经 Vue select、Mpx bindselect 和 triggerEvent 逐层回传
- eval-10 `x2`：2/3 — 文章 store 同时维护 articleId、loaded 与请求代际；同 ID 注水可复用，新 ID 在 await 前失效旧缓存，晚到响应不能覆盖当前文章
- eval-10 `x6`：2/3 — 同构 article service 返回 Promise，服务端只从调用链传入的当前 SSR 上下文的 req 解析 origin，浏览器和小程序使用相对地址，不依赖特定参数名、不访问浏览器全局或硬编码 localhost
- eval-11 `c0`：1/3 — 通用筛选触发器、选项与确认入口具有可访问的控件语义和名称，并保留 tap/遮罩触摸链路；带可见文本的原生 button 不要求重复添加 aria-role/aria-label，非原生可点击节点使用 aria-role
- eval-11 `c1`：2/3 — 完整浏览器 role=dialog、aria-modal、tabindex 与键盘事件只存在于 Web 文件或 Web-only 模板逻辑
- eval-11 `c5`：2/3 — 选项选择、清空、确认、取消、焦点恢复和微信小程序触摸业务链路保持完整
- eval-12 `t1`：2/3 — webConfig.transRpxFn 实现明确的 100rpx=1rem 规则，0 值保持 0，不产生 0rem 或依赖运行环境的非确定结果
- eval-12 `t4`：0/3 — Web 弹层打开时记录并锁定 body/应用挂载容器的原 overflow，关闭、页面切换和卸载时幂等恢复原值

### 无 Skill

- eval-0 `w0`：0/3 — 候选商品卡文件通过 scoped 建立可直接验证的 Web 组件级样式隔离；小程序 JSON 的 styleIsolation 不能替代这项 Web 证据
- eval-0 `w3`：0/3 — 小程序保留币种与单位的原始 10px 字号
- eval-0 `w4`：0/3 — 目标 WebView 中币种与单位先以不触发强制放大的基础字号排版，再缩放回约 10px 的视觉字号
- eval-0 `w5`：0/3 — 目标 WebView 的缩放补偿具有与基线方向一致的 transform-origin，且校正 flex 布局占位，不改变卡片宽度或价格行基线
- eval-0 `w6`：0/3 — 小字号补偿仅隔离在 Web 输出
- eval-1 `a0`：0/3 — 非 Web 分支通过 wx.xxx 或应用入口已配置 API Proxy 的 mpx.xxx 直接调用 chooseLocation、openLocation 与 chooseMedia，不以动态方法名或自定义适配器改写宿主能力
- eval-1 `a1`：0/3 — Web 缺失能力只在 choosePlace、openPlace、choosePhoto 或由它们直接调用的专用 helper 中隔离；不得引入通用平台调用层，也不得改写请求、路由或提示能力
- eval-1 `a2`：2/3 — Web 位置选择在协议未确定时必须停留在可识别的待接入边界（空分支、注释或结构化占位均可，措辞不限），不得声明或调用虚构接口
- eval-1 `a3`：2/3 — Web 地图打开在协议未确定时必须停留在可识别的待接入边界（空分支、注释或结构化占位均可，措辞不限），不得声明或调用虚构接口
- eval-1 `a4`：2/3 — Web 媒体选择在协议未确定时必须停留在可识别的待接入边界（空分支、注释或结构化占位均可，措辞不限），不得声明或调用虚构接口
- eval-1 `a6`：0/3 — Web 已支持的请求、路由和提示继续走 Mpx 官方 API 链路：srcMode=wx 的源码可保留会被跨端编译转换的 wx.xxx，也可沿用项目现有的 mpx.xxx；仅在不依赖应用级 options/custom/Promise 化配置时使用 @mpxjs/api-proxy 命名导入。不得为输出 Web 改成 fetch、location.assign、alert 或无业务协议的自定义包装
- eval-1 `a7`：1/3 — 发布内容、图片、位置、话题、评论开关与提交后详情跳转业务链路保持完整
- eval-2 `s1`：0/3 — Web 构造选项中不存在没有浏览器触发源的分享生命周期；可使用 implement(remove: true) 或等价的编译期平台隔离，同时小程序仍保留原生命周期
- eval-2 `s5`：0/3 — 详情跳转与请求继续走 Mpx 官方 API 链路：srcMode=wx 源码可保留会被跨端编译转换的 wx.xxx，也可沿用项目现有的 mpx.xxx 或在不依赖应用级配置时使用 @mpxjs/api-proxy 命名导入；不得改成浏览器原生 API 的平行实现
- eval-3 `r1`：0/3 — start、move、end、cancel 均显式使用 @wx WXS 与同节点 @web 组件实例方法成对绑定，不用动态表达式混合 WXS 函数对象
- eval-3 `r2`：0/3 — Web 手势状态按组件实例隔离，并完整实现 -96 位移与 -48 展开阈值
- eval-3 `r4`：0/3 — 物流通道使用 connectSocket 返回的 SocketTask，而不是 Web 不支持的全局 Socket API
- eval-3 `r5`：0/3 — SocketTask 的 open、message、error、close 回调都校验捕获任务仍为当前任务
- eval-3 `r6`：0/3 — 重连与卸载先废弃当前任务身份再关闭旧任务
- eval-3 `r7`：0/3 — 每次 send 前都使用本次捕获的 SocketTask 同时校验当前任务身份与 readyState === task.OPEN，不能只依赖可能滞后的 connected 布尔值
- eval-3 `r8d`：2/3 — 物流入口、SocketTask 消息接收与物流状态更新链路保持完整
- eval-4 `h0`：2/3 — 微信小程序继续保留 web-view 会场、领券、下单跳转与活动埋点链路
- eval-4 `h1`：0/3 — Web 宿主白名单只包含完整可信 origin https://campaign.example.com，避免后缀匹配误接纳相似恶意域名
- eval-4 `h3`：0/3 — H5 SDK 仅在 Web 客户端动态加载，不在模块顶层静态引入
- eval-4 `h4`：0/3 — SDK 动态加载和异步初始化的每个边界都阻止卸载后的晚到挂载
- eval-4 `h5`：2/3 — 活动切换使用代际或实例身份校验，旧活动异步结果不会覆盖当前活动
- eval-4 `h7`：0/3 — 没有额外手写 window message 监听时，内建 web-view 的 host 白名单与 clientUid 实例隔离加 bindmessage 即构成消息入口证据；若额外手写监听，则必须同时校验受信任 origin、当前 iframe source 和严格 campaignId
- eval-4 `h8`：2/3 — Web 下 web-view bindmessage 的单向业务消息在领券或跳转前严格校验当前 campaignId；不要求改变微信小程序既有消息协议
- eval-5 `p0`：0/3 — onAppInit 为每次 SSR 请求创建并返回独立 Pinia 实例
- eval-5 `p1`：0/3 — serverPrefetch 返回 Promise 并等待商品与首屏推荐数据
- eval-5 `p2`：0/3 — store 以状态字段或请求记录维护当前商品与加载身份；同 ID 注水可复用，ID 变化立即使旧复用条件失效，快速 A→B→A 时 B 的晚到结果不能覆盖当前 A
- eval-5 `p4a`：1/3 — 浏览器曝光 SDK 仅在 Web 客户端动态加载，不进入 SSR 或小程序执行路径
- eval-5 `p4b`：0/3 — SDK 动态 import、create 等实际异步边界后复核挂载状态、初始化代际和商品身份，晚到实例不得挂载
- eval-5 `p4c`：1/3 — 商品切换触发重新初始化并推进身份代际，旧 productId 的异步结果不能覆盖当前商品
- eval-5 `p5`：0/3 — 推荐组件卸载或商品切换时销毁由 SDK create 返回的 tracker，并清理 Observer 和监听，旧回调不再上报
- eval-6 `q0`：0/3 — 应用入口安装 @mpxjs/api-proxy，并通过 mpx.use(apiProxy, { usePromise: true }) 明确启用 Promise 风格
- eval-6 `q1`：0/3 — Web 输出中的普通趋势词请求通过会返回 Promise 的 Mpx 官方 API 调用路径使用 await 或 Promise 链；可使用配置后的 mpx.request 或会被跨端编译转换到该入口的 wx.request。原始 @mpxjs/api-proxy 命名导入不会继承 Promise 化配置，不能直接按 Promise 使用；不得混用 success/fail 回调
- eval-6 `q2`：0/3 — 联想词请求保存可取消任务：可通过单次 usePromise: false 或原始 @mpxjs/api-proxy 命名导入直接取得 RequestTask，也可从已 Promise 化调用的 Promise.__returned 取得框架保留的原始任务；连续搜索与卸载会先废弃当前任务身份再 abort 旧任务
- eval-6 `q4`：0/3 — 详情跳转与错误提示继续走 Mpx 官方 API 链路；可保留会被跨端编译转换的 wx.navigateTo/wx.showToast，可沿用 mpx.xxx，也可在不依赖应用级配置时使用 @mpxjs/api-proxy 命名导入
- eval-6 `q5`：0/3 — 不用 fetch、location 或 alert 平行重写 request/navigateTo/showToast；若沿用 @mpxjs/api-proxy 命名导入，应明确这些调用不继承应用入口 mpx.use 的 options/custom/Promise 化配置
- eval-6 `q6`：0/3 — 趋势词、连续输入、清空搜索、取消旧请求、结果展示和商品详情业务链路保持完整
- eval-7 `n0`：0/3 — 结算页通过 Mpx 官方 navigateTo 调用的 events 建立 EventChannel，并在 success 中通过 res.eventChannel 向地址页发送当前选择；源码可以是 mpx.navigateTo 或会被跨端编译转换的 wx.navigateTo
- eval-7 `n1`：1/3 — 地址页从页面实例 getOpenerEventChannel 获取通道，确认时 emit 所选地址后通过 Mpx 官方 navigateBack 返回；源码可以是 mpx.navigateBack 或会被跨端编译转换的 wx.navigateBack
- eval-7 `n2`：2/3 — 订单 tab 只通过 Mpx 官方 switchTab 打开，非 tab 页面分别按语义使用 navigateTo、redirectTo、reLaunch、navigateBack；调用可采用项目现有的 mpx.xxx 或会被跨端编译转换的 wx.xxx
- eval-7 `n3`：1/3 — 需要 EventChannel 的地址入口使用 button 调用脚本中的 navigateTo，不强制保留 navigator；其他普通声明式导航若使用 navigator，open-type 使用模板值 navigate，而不是 API 名 navigateTo，也不使用不稳定的 switchTab 模板分支
- eval-7 `n4`：0/3 — Web 路由只通过 mpx.config.webConfig.routeConfig 配置 history 与 /shop/ base，output.publicPath 同为 /shop/
- eval-7 `n5`：2/3 — 业务代码不引入 this.$router、window.history、location 跳转或 getCurrentPages 回传地址
- eval-7 `n6`：0/3 — 地址展示、地址选择、返回、登录失效重启、支付结果替换和订单 tab 链路保持完整
- eval-8 `b0`：0/3 — sticky-header 在 Web 内建结构中是 scroll-view 或 sticky-section 的直接子节点，吸顶不依赖其内容中的 viewport fixed
- eval-8 `b1`：0/3 — 使用 binddragstart/binddragging/binddragend 时显式开启 enhanced，并保留完整的开始、过程、结束处理
- eval-8 `b2`：0/3 — 动态分类、异步商品和图片固有尺寸晚到后，使用运行时真实消费的观察机制或图片 load/metadata 后的 nextTick + scroll-view ref.refresh 保证滚动范围更新；ref 可使用标准 wx:ref 或可选的 Web 条件写法，必须隔离的是 Web-only refresh 调用链，可由 Web 条件事件或脚本平台/能力判断完成
- eval-8 `b3`：2/3 — 常驻购物车位于 scroll-view 变换内容之外，并在 Web 保持相对浏览器视口的 position: fixed；不得仅为规避 BetterScroll transform 将其降级为相对页面容器的 absolute
- eval-8 `b5`：0/3 — timeupdate 与 loadedmetadata 处理兼容 Web 原生转发事件，不无条件读取微信专属 detail.currentTime/detail.width 结构
- eval-8 `b6`：0/3 — 只使用参考中 Web 实际消费的视频属性和事件；商品分类、滚动选择、视频播放与购物车业务链路在微信小程序继续可执行
- eval-9 `v5`：2/3 — 卸载时销毁图表实例、disconnect ResizeObserver 并移除拥有的事件监听；数据变化可安全复用单一实例更新，但不得增加实例、Observer 或监听数量
- eval-9 `v6`：0/3 — customBuiltInComponents 使用原始 key scroll-view，不使用 mpx-scroll-view；自定义 Vue 组件保留 $attrs、$listeners 和默认 slot 的结构透传
- eval-9 `v7`：2/3 — 自定义滚动组件同时实现 scrollX/scrollY 横纵 overflow，并在挂载和 prop 更新时真正同步 scrollTop、scrollLeft；scrollIntoView 更新后只滚动当前容器内目标节点
- eval-9 `v8a`：1/3 — 自定义滚动组件发出的 scroll 事件包含 scrollTop、scrollLeft、scrollHeight、scrollWidth、deltaX 和 deltaY
- eval-9 `v8b`：0/3 — 自定义滚动组件按 upper/lower threshold 与实际滚动轴发出方向为 top/left、bottom/right 的 scrolltoupper/scrolltolower
- eval-9 `v8c`：2/3 — 上、左、下、右边界分别维护跨界状态，只在进入阈值时触发，离开后复位，避免阈值内重复泛滥
- eval-9 `v9b`：2/3 — Web 图表在指标变化时安全 update 或销毁后重建，指标点击经 Vue select、Mpx bindselect 和 triggerEvent 逐层回传
- eval-10 `x2`：0/3 — 文章 store 同时维护 articleId、loaded 与请求代际；同 ID 注水可复用，新 ID 在 await 前失效旧缓存，晚到响应不能覆盖当前文章
- eval-10 `x6`：0/3 — 同构 article service 返回 Promise，服务端只从调用链传入的当前 SSR 上下文的 req 解析 origin，浏览器和小程序使用相对地址，不依赖特定参数名、不访问浏览器全局或硬编码 localhost
- eval-10 `x7`：2/3 — 微信小程序 onLoad 文章加载、收藏、推荐展示和文章跳转不受 window 守卫阻断
- eval-11 `c0`：1/3 — 通用筛选触发器、选项与确认入口具有可访问的控件语义和名称，并保留 tap/遮罩触摸链路；带可见文本的原生 button 不要求重复添加 aria-role/aria-label，非原生可点击节点使用 aria-role
- eval-11 `c1`：0/3 — 完整浏览器 role=dialog、aria-modal、tabindex 与键盘事件只存在于 Web 文件或 Web-only 模板逻辑
- eval-11 `c2`：2/3 — Web 打开前记录真实触发元素，渲染完成后把焦点移入弹层；关闭后仅在元素仍连接文档时恢复焦点
- eval-11 `c4`：2/3 — document/window 键盘或焦点监听在每次关闭和 detached/unmounted 时成对移除，快速开关不会重复注册
- eval-11 `c5`：2/3 — 选项选择、清空、确认、取消、焦点恢复和微信小程序触摸业务链路保持完整
- eval-12 `t0`：2/3 — 跨组件主题 CSS 变量在宿主未注入时提供可用的颜色、间距等回退值
- eval-12 `t1`：0/3 — webConfig.transRpxFn 实现明确的 100rpx=1rem 规则，0 值保持 0，不产生 0rem 或依赖运行环境的非确定结果
- eval-12 `t3`：0/3 — hover、::-webkit-scrollbar 与浏览器 safe-area/私有 CSS 仅隔离在 Web 输出，不污染微信小程序样式
- eval-12 `t4`：0/3 — Web 弹层打开时记录并锁定 body/应用挂载容器的原 overflow，关闭、页面切换和卸载时幂等恢复原值
- eval-12 `t5`：0/3 — 滚动锁只保护浏览器客户端 DOM，不阻断微信小程序页面滚动、卡片点击和弹层关闭


## 结论边界

该结论只覆盖冻结的 13 个场景和当前三次采样，属于源码契约检查与隔离 Web 编译结果，不等同于真实浏览器 E2E。No Skill 仅在候选指纹完全匹配时允许通过 `--resume` 复用，最终评分均使用当前评分指纹。`app.mpx`、HTML 与配置文件不是 compile-validate 支持的独立入口，其完整性和可解析性在各 run 的 `compile.json` 中单独记录。
