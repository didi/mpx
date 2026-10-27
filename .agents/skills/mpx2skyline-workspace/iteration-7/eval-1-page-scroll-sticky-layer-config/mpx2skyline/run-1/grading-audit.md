# eval-1 / mpx2skyline / run-1 独立评分审计

**11 / 11，失败 ID：无。** assessment.json 按本次 evals.json case 1 的11条原文及原顺序逐项评分。遵循 grading-standard.md v7 与 common-validation.json：允许等价实现，静态充分可证明的要求不因真机未跑而扣分；真实编译、mock、真机分别记录。本次未读取 mpx Skill、另一配置组或历史输出。

## 完整运行记录与范围

读取本case input/task.md、orders.mpx、app.json、service.js，四份完整输出、全部验证脚本与原始结果，并完整解析 agent.jsonl 的139行：43个 command_execution、20个 web_search、8条 agent_message、2条配置诊断。全部命令、结果、内联写文件与改写脚本均纳入检查；本运行通过shell heredoc/Python写文件，没有独立file_change事件。

- agent.jsonl:7读取本组Skill，9/11/13读取并发现本case全部输入；15/20-23/29-30/34点读本组configuration/runtime/style/template/audit参考。27/32/36/42/45检查package、lint和共享真实编译工具源码；未读取另一Skill。
- 38写初版orders/app并原样复制service；47写Jest/ESLint配置与业务测试。103的第一次结构改写在写入前因substring定位失败，105修正后完成Skyline header/body及WebView分支改造。107/112/127仅再修整格式及验证工具。137写验证聚合脚本与validation记录。
- 43、122、135均有真实wx page编译命令，最终135对应最终页面；134为最终ESLint JSON，133为最终Jest，129为最终静态审计。最终日志与交付文件哈希吻合。
- 非零shell结果共5项：49 Jest首次Watchman权限失败，66/68两次curl获取官方文档失败，107静态审计脚本括号语法错误，112审计正则误报flex-direction。54禁用Watchman后Jest通过；116修正正则后审计通过。所有业务Jest用例都通过；工具修复分别1次、2次，未超过3次约束。
- **退出码不能单独代表命令链成功。** 103虽然shell退出0，结果有Python `ValueError: substring not found`，因为后续sed成功掩盖退出码；该步没有写出改造，105才真正完成。109也退出0但只是cat展示上一轮审计SyntaxError，不能算新验证成功。已据最终源文件和后来独立成功命令确认修复。
- 58-101共20个web事件包含第三方搜索摘要、官方/GitHub目录尝试与多次Internal Error；66/68为代理或DNS失败。日志中出现第三方Skill搜索命中摘要，不等于加载其Skill正文。report:32如实说明官方嵌套组件正文不可获取；这些浏览尝试不作为本次能力通过的证据。本次grader判断仅依据本组Skill、定义、源码及本组可验证结果。
- source-snapshot.json的before/after相同，grader重算当前input及本组Skill哈希也一致。validation.json四个artifact哈希逐一匹配当前outputs；service.js与input逐字节相同。四个约定输出齐全，没有写入额外业务文件或修改输入。

## 通用契约（不加入11条能力分母）

| 契约 | 判定 | 实际证据 |
| --- | --- | --- |
| mpx-bindings | passed | orders:2-6/21/38/49的动态高度、导航padding只放wx:style；普通class均静态。refresher等原生属性使用合法数据绑定，非class/style混用。 |
| renderer-exposure | passed | orders:6直接renderer===skyline，38使用wx:else，未声明isSkyline。选项式createPage的data/methods提供模板绑定；无script setup，不适用defineExpose额外要求。 |
| component-config | passed | 页面JSON含skyline/glass-easel/custom/disableScroll。app保留首页路由/window/webview并补Skyline必需项；本页只有内建组件，无漏注册的业务子组件。首页未提供且报告明确未覆盖。 |
| delivery-scope | passed | outputs仅orders/app/service/report完整版本，验证证据在本组run-1。service与所有input哈希未变。报告未重复贴整份代码。 |
| evidence | passed，分层明确 | 最终编译0错误0警告、Jest6/6、ESLint0/0和静态审计均有真实命令/结果；完整宿主构建、微信预览、真机各自not_run，报告没有以mock代替真实派发或视觉。 |

## 高度、结构与事件链实核

**s1_00 高度链。** orders:2的page高为windowHeight，导航实际占statusBarHeight+navigationHeight，外层和主区域的wx:style均为scrollHeight；92-99按窗口与胶囊计算剩余空间。以原测试800px窗高、状态栏24、胶囊top28/height32为例，navigationHeight=max(44,40)=44，剩余高度732px。summary:137为border-box，含padding的总高确实120px；外层nested-header承载它，nested-body含732px主区域，故外层内容852px、可滚出120px概览。resize窗高600时外/主变532px。

主custom直接循环sticky-section，每组header40px加strip80px为120px，没有将数据渲染到主容器以外。初始4组480px在732px视口属于短内容；8/12组为960/1440px，主区域可独立纵向滚动。高度有界并且数据可产生溢出，s1_00通过。**没有声称初始4组在所有机型上都溢出**；短内容或大屏下原生scrolltolower何时派发未被mock证明，沿用report:38的真机待验边界，不据自然短内容额外扣分，也不将手工调用分页伪称为真实触底。

**s1_07 纵向关联。** 实际Skyline树为外层scroll-view(type=nested) → nested-scroll-header(summary) / nested-scroll-body → 主scroll-view(type=custom,associative-container=nested-scroll-view) → sticky-section → 横向scroll-view(type=list)。本条关联关注外层纵向nested与主订单纵向custom；横向strip只浏览订单，没有同方向纵向嵌套衔接职责，不额外要求它也带associative-container。WebView普通嵌套scroll分支与Skyline专属节点隔离。

**s1_01 刷新开关与复位。** 主节点22-24的`!loading || refreshing`在空闲true、刷新中true、分页时false，门控避免与分页并发，可接受。onRefresh→reload→fetchOrders(1)成功替换列表并归页1，失败catch仅toast保留原列表/页号，finally均将refreshing/loading复位。原Jest通过两种renderer检查这些路径；独立grader脚本另从实际主节点bindrefresherrefresh分派，注入真实service的fetchOrders(1,true)失败，验证保留同一列表/页2、刷新期间开关true、结束恢复true且可继续请求页3。

**s1_02 / s1_03 真实模板绑定。** 主节点以catchscrolltolower连接loadMore、catchscroll连接onScroll；catch与bind都连接同一原生事件，前者额外阻止冒泡，属于等价实现。独立检查读取实际属性再分派处理器，两次触底处理请求2/3页，12组96项且保留原分组/订单数组对象；不是只检查存在loadMore函数。onScroll接detail.scrollTop=186后概览插值值为186。横向scroll/scrolltolower均catch到ignoreScroll，随后传入999也不改主位置、不发新请求；外层没有分页/刷新/主位置业务处理器。

**s1_08 横向、s1_09 吸顶。** strip为list+scroll-x+enable-flex，样式row Flex；8个直接tile子节点各120px、flex-shrink:0，内容宽960px，可横向浏览。Skyline的custom主区域直接生成sticky-section，首子唯一sticky-header且背景白；WebView对应group首标题为position:sticky/top:0，也有同一白背景。未将CSS sticky当Skyline方案。

**s1_04-06 配置、s1_10层级。** 页面真实导航显示“订单”，页面JSON四必需项和app顶层lazyCodeLoading、rendererOptions.skyline五字段层级/类型/值正确；原首页/window/webview保留。fab/modal都为page直接fixed子节点，分别z2/z3，modal四边0全屏覆盖，移出滚动树，不依赖transform或跨祖先z-index猜测。按实际tap绑定验证open/close，未将其称为真实像素覆盖。

## 验证可信度与独立检查

- **真实wx编译：passed。** agent.jsonl:135退出0，compile.log JSON target=wx/success=true/errors=[]/warnings=[]，durationMs=3317；使用--type=page --no-ignore-sub-components。app.json只静态解析，未构建缺失首页的完整宿主应用。
- **ESLint：passed。** 134最终命令退出0，eslint-results.json对orders.mpx/service.js分别0 errors、0 warnings，使用本组eslint.config.cjs导入已安装@mpxjs/eslint-config。
- **原Jest/mock：passed，6/6。** 133最终命令退出0，jest-results.json与jest.log吻合，测试确实提取交付脚本与原样service。两renderer逻辑fixture覆盖首屏、两次分页、刷新成功、失败保留、继续操作、scrollTop、窗口、modal、并发与分页失败重试。它们是VM宿主模拟，不是原生事件派发或Mpx响应式验收。原测试afterAll会重写mock-evidence.json，grader没有直接重跑它以免改动原始证据。
- **静态矩阵：passed，48条中15个passed、33个not_applicable。** audit.cjs有实际断言与简单XML树核对，不只是把48个标签写成passed。其扫描/树解析适用于本fixture，但不能证明手势或像素；本评分另逐节点核对高度、事件和renderer分支。
- **独立grader检查：passed，两renderer。** 新增`grader-check.cjs`与`grader-check.json`，不修改原验证文件。脚本从完整模板解析main/outer/strip和tap绑定，用实际页面脚本+service执行事件；以真实CSS声明计算组高/概览占位，核验刷新门控和失败复位、连续分页保留对象、位置归属、resize、sticky/横向/fixed结构。复跑方式（workspace cwd）：`node iteration-7/eval-1-page-scroll-sticky-layer-config/mpx2skyline/run-1/grader-check.cjs`。JSON记录请求链`1,2,3,1,2,1(true),3`、主scrollTop186以及静态几何结果。
- **完整应用、开发者工具和真机：not_run。** 真实嵌套衔接、标题吸顶、横纵手势、原生下拉反馈/触底派发、初始短内容/大屏行为及modal像素覆盖均未执行。不因这些未跑而否定本次可静态证明的11条能力，也不把编译或VM测试升级为真机通过。
- **指标：available。** run.json为gpt-6.1-sol/high、returncode0、736499ms；timing为736.499秒。metrics total_tokens=4569492（input4543064/output26428）；agent.jsonl最终usage相符，cached_input_tokens=4427392。不以耗时/token判断能力得分。

本组未发现需要扣除现有能力断言的实现错误。一个可改进的测试点是直接沿绑定注入刷新失败，避免只有reload(true)直接调用证据；本次独立grader检查已补足该验证，但未修改原测试或评分定义。初始短内容的真实触底派发属于已公开的设备验证空白。
