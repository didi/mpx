# Case 1 / mpx 独立评分审计

Skyline 能力断言 11/11 通过，失败 ID：无。assessment.json 保留 evals.json 的 11 条原序、原 ID 与原文。

依据为本组 agent.jsonl 的完整命令/退出状态与实际产物、测试脚本、原始编译结果和 mock 状态，未读取其他组或历史轮次评分。能力参考限本 suite 的 mpx Skill 及 Skyline/base。当前三个业务文件 SHA256 均与本组 validation.json 一致，service 与输入逐字相同。没有修改 outputs、原始日志、metrics、validation 或 Skill。

## 通用契约（不计入能力分）

- mpx-bindings：通过。所有动态样式均为 wx:style（orders.mpx:3、7、14、36），普通class为静态字符串；循环与条件为合法指令。
- renderer-exposure：通过。选项式createPage直接消费实例renderer（19）；无isSkyline副本，无setup暴露缺口；模板所用状态与方法均在data/methods中存在。
- component-config：通过。页面JSON及app配置完整，只有原生组件，没有未注册业务组件子树；app保留原首页、window及webview配置。
- delivery-scope：通过。仅交付任务允许的四份完整文件，原input只读；service保持原样。
- evidence：通过。静态、mock、真实编译与原生运行边界分开，原始input/Skill快照前后哈希有记录；报告没有把renderer标签mock当原生双模式运行。

## 验证与边界

- 原执行 ESLint exit 0：agent.jsonl:68；真实wx SFC页面编译 exit 0：69、75，compile-wx.json 的 success=true、errors=[]、warnings=[]。它不是完整app构建，也不证明原生渲染。
- 原执行 Jest：73首次exit 1，75显示Watchman状态目录权限导致测试尚未运行；79加--watchman=false后exit 0，81原始输出为7/7通过。未出现业务代码失败后反复修复。
- 独立补验：评分者以Node执行实际业务脚本，解析主容器模板绑定后调用onRefresh/loadMore/onMainScroll。两个renderer标签分别验证首屏4组、连续两次分页至12组、刷新替换、在实际刷新绑定注入reject后保留列表且loading/refreshing复位、失败后可分页以及detail.scrollTop=137。输出exit 0。此补验是mock，未执行原生模板事件分派；未重跑会覆盖原证据的原始测试。
- 高度推导：窗口500px、状态栏24px、胶囊top28px/height32px时，navHeight40px，主/外层H436px。概览120px使外层内容556px；首屏分组480px、两次分页后1440px，均能构成所需滚动范围。原mock窗口800px时H736px，首屏480px不足一屏，分页后960/1440px可滚；报告亦说明短内容场景，没有宣称所有窗口首屏均溢出。
- s1_01允许空闲/刷新为true、分页暂禁用的等价门控；s1_07核对外nested→主custom关联，横向显式list但无需额外nested关联。横向项直接子节点各120px不收缩，共960px，未用内部Flex反向撑宽。
- WebView容器运行、Skyline容器运行、真机嵌套接力/吸顶/手势/实际刷新反馈与遮挡均为not_run。静态与mock可证明的能力照常评分。

## 评测缺口与失败

无能力断言失败。原始mock失败注入直接调用reload(true)，但onRefresh只有return reload()，评分者已额外从真实绑定注入reject检验同一路径；若后续自动化沿模板绑定触发可避免方法测试与绑定脱节。首次Watchman失败属环境启动错误，关闭Watchman后通过。大窗口首屏不足一屏时分页手势是否触发、内外手势接力属于尚未运行的原生验收边界，不把静态评分当真机结论。
