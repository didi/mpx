# Case 1 / mpx2skyline 独立评分审计

能力断言11/11通过，失败ID：无。assessment.json保留evals.json的原序、原ID和原文。此结论由本组实际产物与日志重新核对，未对照其他组输出或评分。

读取范围：本组outputs四份完整文件、agent.jsonl命令与结果、原测试/静态/编译/lint证据、source-snapshot与metrics；能力参考仅指定mpx2skyline快照。允许的基础编译工具只作为执行工具核验。本组当前交付文件哈希全部与validation.json一致，输入和Skill前后快照不变，service.js与input逐字节相同。

## 通用契约（独立于能力分）

- mpx-bindings：通过。orders.mpx:3、6、18均以wx:style绑定动态样式，普通class为静态；完整模板条件与循环合法。
- renderer-exposure：通过。26直接判断实例renderer，选项式createPage不涉及setup暴露要求；无isSkyline副本，模板状态与方法均可从data/methods获得。
- component-config：通过。页面JSON与app.json完整；页面仅原生组件，无漏审业务组件树。原首页、window、WebView配置保留。
- delivery-scope：通过。四份授权交付文件齐全，report说明集成与验证范围；输入/Skill未改，首页正文未在任务范围内扩写。
- evidence：通过。static、Node mock、真实wx SFC编译、工具/真机not_run区分清楚；完整应用/首页构建不包含在单页编译通过结论内。

## 实际验证与边界

原执行真实编译：agent.jsonl:39命令exit0，41输出完整成功日志。命令为workspace的npm compile-validate，package script显式附加--target=wx，页面入口且保留依赖编译；compile.json的success=true、errors=[]、warnings=[]。原ESLint实际执行lint.cjs，47退出0；eslint.json两文件均0 error/0 warning。

原Jest第一次在启动时遇Watchman权限，49退出1且51给出完整错误；54禁用Watchman后6/6通过。45的静态解析探查因旧parser不支持ecmaVersion2022失败，56改为2020后正常。均未发生业务测试失败后的代码修复，不能把环境探查失败误写为业务能力失败。

评分者新增grader-event-check.cjs及grader-event-check.json，直接解析主容器catch事件名并执行实际业务脚本：双renderer标签分别验证首屏4组、两次分页至12组、刷新替换、在真实onRefresh链路注入reject保留数据及页号并复位、分页恢复、分页期间刷新禁用与完成后恢复、主detail.scrollTop和横向ignoreScroll归属以及弹层开关。执行exit0；未重跑会覆盖原mock-evidence的原测试。

高度按盒模型推导：概览height120px且border-box含16px padding，不是152px；外层视口H、其内容H+120，能滚出概览。主区每组40+80=120px。原mock窗口844、status47、胶囊top51/height32，导航40，H757；首屏480不足一屏，两次分页960/1440超过H。新增mock窗口500、status24、胶囊top28/height32，H436，首屏480即可超出。没有将短列表在所有窗口强称为可滚动。

s1_01接受!loadingMore门控：空闲与刷新时启用，分页期间暂关，成功/失败finally均复位。catchrefresherrefresh/catchscrolltolower/catchscroll均接受为对应bind的等价实际链。s1_07核对外纵nested→主custom关联；横向本身list且直接120px条目，不额外要求横向关联外nested。

WebView/Skyline原生容器运行、开发者工具可视验收和真机嵌套/吸顶/手势/原生刷新反馈/实际遮挡均not_run，独立列示；不将Node renderer标签或编译成功当真实渲染通过。

## 评测缺口及失败

无能力断言失败。原mock以reload(true)覆盖刷新失败，不从onRefresh绑定注入reject，评分者已补验真实绑定链；后续可把该路径直接纳入常规测试。大窗口短首屏的原生触底触发与内外手势接力尚待容器验收。静态扫描direction命中flex-direction属误报，原audit已明确解释，不是未处理样式错误。
