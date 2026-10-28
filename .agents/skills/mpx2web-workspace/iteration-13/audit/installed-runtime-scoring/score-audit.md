# iteration-13 正式语义复核与评分校准

已逐条复查两组全部 4 个 case、52 条原始断言，包括原先通过项。正式结论为 **mpx 25/26、mpx2web 24/26**。新评分器与独立语义结论逐项一致（52/52 对齐，其中 49 项通过、3 项失败）。

此前仅对失败项进行的定向复核遗漏了真实问题；特别是 mpx2web 的 c6 并非单纯正则误判，本次实际编译与运行已推翻旧判断。原始报告、评分器和每组评分保存在 [original-scoring](audit/original-scoring/benchmark.md)。本次未重新请求模型、未修改题目与断言文本，也未修复模型交付文件；34 个交付/依赖文件的 SHA-256 与复核前一致。

## 得分

| 用例 | mpx 原始 → 校准 | mpx2web 原始 → 校准 |
| --- | ---: | ---: |
| 0 应用样式与配置 | 6/7 → **7/7** | 6/7 → **7/7** |
| 1 新建组件 | 1/3 → **3/3** | 3/3 → **3/3** |
| 2 业务页面 | 6/11 → **10/11** | 9/11 → **9/11** |
| 3 SSR 应用 | 3/5 → **5/5** | 5/5 → **5/5** |
| 合计 | 16/26 → **25/26** | 23/26 → **24/26** |

按断言计数的通过率为 **96.15% / 92.31%**；benchmark 沿用四用例等权平均，分别为 **97.73% / 95.46%**。每用例每组只执行一次，标准差来自不同用例，不表示重复实验的稳定性。

## 计分内的真实缺陷

1. **mpx / case 2 / c3：Web 页面初始化异常。** `onLoad(query, decodedQuery)` 直接读取 `decodedQuery.videoUrl`；本轮安装的 core 2.11.1 Web 生命周期只传入一个 query，实测触发 `Cannot read properties of undefined`，视频 src 无法初始化。源码见 [business-page.mpx](eval-2-api-component-adaptation/mpx/outputs/business-page.mpx)。
2. **mpx2web / case 2 / c3：视频 URL 被重复解码。** Vue Router 传入的 query 已解码，再调用 `decodeURIComponent` 会破坏路径/签名里的 `%2F`、`%25` 等内容。独立测试使用真实 Vue Router 构造 query，并通过实际生命周期传参重现。源码见 [business-page.mpx](eval-2-api-component-adaptation/mpx2web/outputs/business-page.mpx)。
3. **mpx2web / case 2 / c6：地区选择器动态属性失效。** 当前安装版编译器将 `value@web` / `range@web` 按 Web 原生方言保留为 `value="{{regionIndex}}" range="{{regionLabels}}"`，同时遗留 `:value="(regionCodes)"`；实际 picker helper 收到字符串后抛出 `range.map is not a function`。`bindchange@_web` 正确并不能弥补属性绑定错误。编译产物见 [Web template](audit/formal-semantic/case2-mpx2web-web.template)。

本次纠正 12 个原评分假失败，同时识别 2 个原先通过但实际失败的项目（两组 c3）。mpx2web 的 c6 保持失败，但失败证据从源码匹配改为真实编译与运行结果。

## 原断言未覆盖的 SSR 缺陷

原 r0–r4 的五个契约均通过，不等于 SSR 完整需求全部正确。以下问题已独立运行真实生产 client/server bundle 复现，作为扩展验收缺陷列出，不临时改变原 26 分分母：

- **mpx：错误首屏接管失败（高影响）。** `id=missing` 的 SSR 错误首屏在客户端 `onLoad` 中再次请求、清空错误态，接管同步抛出 `HierarchyRequestError: Node can't be inserted in a #comment parent`。正常 a/b 首屏接管通过。
- **mpx2web：错误状态后切换文章无法恢复（中影响）。** missing 首屏接管成功，但随后 `router.push(...?id=a)`，URL 已变化，页面仍显示“文章不存在”且未请求新文章；mounted 的 `loading || (article && article.id !== id)` 在旧错误态下恒为 false。

证据：[SSR 独立运行结果](audit/formal-semantic/mpx2web-ssr-probe-results.json)；[SSR 全项评审](audit/formal-semantic/mpx2web-semantic-case3.json)。后续扩展评测集应单列“错误首屏 hydration”与“错误后客户端导航恢复”，两组当前均不能视为满足全部应用验收要求。

## 全部断言复核表

每项具体源码位置、运行证据和验证边界见 [semantic-review.json](semantic-review.json)。

| Case / ID | 断言 | mpx | mpx2web |
| --- | --- | --- | --- |
| 0 / s0 | 样式：red-card 与 blue-card 的同名类使用独立作用域，不互相覆盖 | 通过 | 通过 |
| 0 / s1 | 布局：layout-cell 的虚拟宿主在 Web 生效，两个实例在 240px Flex 容器中等宽 | 通过 | 通过 |
| 0 / s2 | 样式：theme-card 的 externalClasses 从调用方贯通到内容节点，并保留默认外部类配置 | 通过 | 通过 |
| 0 / s3 | 导航：保留微信 navigator、普通入口 ready 状态和选择结果回传链路 | 通过 | 通过 |
| 0 / s4 | 导航栏：微信胶囊 API 不在 Web 执行，Web 不重复显示系统导航与自定义导航 | 通过 | 通过 |
| 0 / s5 | 路由：Web publicPath、history base 均为 /help-demo/，主包与分包页面保持注册 | 通过 | 通过 |
| 0 / s6 | 尺寸：Web 使用固定二分之一 rpx 换算，微信换算配置保持不变 | 通过 | 通过 |
| 1 / n0 | 结构：生成包含 template/script/style/json 的完整 Mpx 组件，使用选项式 createComponent | 通过 | 通过 |
| 1 / n2 | 样式：组件声明 accent-class 外部类并应用于标题，保留默认外部类约定 | 通过 | 通过 |
| 1 / n3 | 交互：expanded 保存在组件实例内，点击只切换当前实例且不调用 Web 不支持的 setData | 通过 | 通过 |
| 2 / c0 | 状态更新：源码中的 this.setData 已改为两端可共用的 Mpx 响应式赋值，Web 不调用不存在的实例方法且扫码结果链路保持有效 | 通过 | 通过 |
| 2 / c1 | 名称编辑：Web 具备输入、确认赋值和取消不赋值链路，微信原交互保持有效 | 通过 | 通过 |
| 2 / c2 | 扫码：微信保留原生扫码组件，Web 构建不解析该组件且只读依赖未修改 | 通过 | 通过 |
| 2 / c3 | 视频：保留 src 与播放事件，Web 在 detail 缺字段时从真实 target 安全回退 | **失败** | **失败** |
| 2 / c4 | 位置：微信保留 chooseLocation，Web 不执行微信 API 且说明真实服务接入边界 | 通过 | 通过 |
| 2 / c5 | 插件：微信保留插件卡片，Web 隔离页面模板与 usingComponents 中的插件引用 | 通过 | 通过 |
| 2 / c6 | 地区与地图：微信原 picker/map 数据链保留，Web 隔离缺失能力并标明接入点 | 通过 | **失败** |
| 2 / c7 | Swiper 与图片：保留公共能力，只隔离 Web 未实现的局部属性并标明接入点 | 通过 | 通过 |
| 2 / c8 | 结构组件：微信保留 grid-view 与 page-container，Web 隔离缺失组件并标明接入点 | 通过 | 通过 |
| 2 / c9 | 状态：门店确认与商品筛选的草稿、取消、确认状态链保持不变 | 通过 | 通过 |
| 2 / c10 | 分享：微信保留正确标题和路径，Web 隔离分享钩子并呈现未接入边界 | 通过 | 通过 |
| 3 / r0 | SSR：history 路由匹配 /help-demo/，首屏渲染前按当前 query.id 等待文章数据 | 通过 | 通过 |
| 3 / r1 | 状态：文章状态完整迁移到共享 @mpxjs/pinia，并通过 onAppInit 注入应用 | 通过 | 通过 |
| 3 / r2 | 隔离：每次 SSR 请求在 onAppInit 中创建独立 Pinia，文章页使用当前请求实例 | 通过 | 通过 |
| 3 / r3 | 环境：服务端可达的初始化与预取代码不访问 window、document 或 navigator | 通过 | 通过 |
| 3 / r4 | 兼容：微信 onLoad 继续按 query.id 调用共享 action，并保留文章页面状态与交互 | 通过 | 通过 |

## 评分器修改

- `grade.py` 配合 `semantic_probe.cjs` 使用本评测环境的 compiler 2.11.1 和 Vue Router 3.6.5；直接检查生效配置、编译后的节点/属性和关键方法调用。保留原 26 项契约与指标，不读取人工分数来决定自动分数。
- 接受 `data()` 工厂、条件 publicPath、按需注册 ready 事件、API 命名导入/别名、三元 usingComponents、Pinia 命名导入、安全 `typeof window`。构造调用和 component JSON 仍必须有效。
- 媒体检查使用含转义签名的真实 router query 和单参数 onLoad，并验证 target 回退、detail 数据及零值；地区选择检查编译后的动态 range/value 与事件。
- 样式检查关联到实际商品循环父节点和筛选节点，允许不同 class 命名；筛选检查覆盖取消、确认及重新打开。JSON/模板执行失败不会按空配置/空模板判隔离成功；TODO 不能掩盖已有坏 picker。
- SSR 预取检查限定在预取函数体内，防止其他生命周期的 return 误满足；微信 onLoad 必须实际调用共享 action；浏览器全局用 AST 区分安全 typeof、注释/字符串和真实访问。
- `test_calibrated_grade.py` 覆盖 52 项与人工结论对齐及正反变异；原评分器与测试继续保留历史可追溯性。自动探针仍为受限执行和结构检查，不替代完整框架、原生宿主或所有新增代码形式的验收。

## 验证与证据

- 40 项 Python 测试通过，包含原有 25 项和 15 项校准测试方法（内部覆盖多组正反例）；新 Node 评分探针通过 ESLint；相关 Web Jest 2 套件、17 项通过。
- case 0/1：重跑实际 Web bundle 的样式与通信检查；新建临时宿主完整编译并挂载两个 profile 实例，验证状态独立和外部样式。微信行为结合产物、源码和方法执行核对。
- case 2：实际安装编译器、动态 JSON、业务方法与 Web 生命周期独立执行；48 个双端细分检查中只有上述 3 处失败。地区绑定还执行了真实 picker helper。
- case 3：在校验临时工程五个源文件与交付字节一致后，独立运行 SSR 并发 a/b/missing/default 渲染及真实 client bundle 的 JSDOM 接管、展开和错误后导航，发现上述两项未计分问题。
- 原始 agent.jsonl 已完整盘点，用于核对实际验证过程；没有仅凭子任务“测试通过”的自述判分。正式审计证据位于 [audit/formal-semantic](audit/formal-semantic/)。部分独立审计脚本复用原临时编译目录，重建方式与原路径保留在日志中；常规重评分只需本工作区依赖。
- 边界：未做真实微信设备及真实浏览器几何测量。DOM、CSS 和交互由 JSDOM/产物检查支持；虚拟宿主等宽依布局规则与实际 DOM 判断。地图、扫码、分享 SDK 仍按题目约定未接入。

## 重评分

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py' -v
python3 grade.py
python3 aggregate_benchmark.py --model gpt-6.1-sol --reasoning-effort high
```

重评分不重新运行模型。原耗时与 Token 指标保持不变；当前 [benchmark](benchmark.md) 与 [review 页面](review.html) 展示校准结果，原始结果在 audit/original-scoring。
