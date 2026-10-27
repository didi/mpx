# case1 / mpx 独立评分审计

本组 11 / 11，失败 ID：无。分母与顺序直接来自 iteration-7/evals.json 的 case1；采用 verification 的实际节点与数据链路语义。能力分数依据静态结构、真实编译记录及可复现脚本，不表示真机通过。

## 范围与隔离

- 读取本组 input/task.md、orders.mpx、app.json、service.js，outputs 的全部四份文件，以及 run-1/agent.jsonl 的 66 条记录、所有执行命令与返回状态、测试与静态审计源文件、各验证 JSON 和日志。
- 完成命令共23条，另5条完成的文件变更，合计28次工具动作与metrics相符。命令读取范围限于指定mpx Skill、其 base/Skyline references、编译脚本、宿主构建/检查配置、本组输入产物及验证目录；未发现读取其他组、历史评分或mpx2skyline Skill。
- source-snapshot.json 前后快照相同；逐一重算4份当前input哈希均一致，验证记录所列3份业务输出哈希也一致。service与输入内容相同。未修改业务outputs、评分定义或任何原始记录。

## 通用契约（不计入11分）

| check | 结果 | 独立核对 |
| --- | --- | --- |
| mpx-bindings | passed | orders.mpx:3-4,6,18 的动态样式均为wx:style对象表达式；全部class和普通style不存在动态Mustache。其余文本/属性数据使用Mpx模板绑定。 |
| renderer-exposure | passed | orders.mpx:26直接比较renderer==='skyline'，无isSkyline；使用选项式createPage，模板状态定义于data，事件全部定义于methods；不属于setup局部绑定暴露场景。依据指定mpx runtime参考可直接访问实例renderer。 |
| component-config | passed | 页面JSON含Skyline、glass-easel、自定义导航、disableScroll，app保留pages/home、pages/orders、window与webview并补全Skyline配置。仅内建组件，无约定自定义子树或未注册依赖。 |
| delivery-scope | passed | outputs仅orders.mpx、app.json、service.js、report.md，报告简述与链接而非重复整份代码；输入只读且哈希未变。额外测试、报告证据均在本组run-1。 |
| evidence | passed | report.md:15-26及validation.json明确区分静态、mock、真实编译、开发工具与真机；实际读取范围可追溯agent.jsonl。工具和真机均为not_run，没有沿用历史分数。 |

## 验证可信度与实际调用链

- ESLint：agent.jsonl:40-42实际执行页面与service，退出0，eslint.json两份文件都是0错误0警告；没有仅声明“检查过”。
- 真实编译：agent.jsonl:41,43,49记录compile-validate --type=page --target=wx的真实webpack产出，compile-wx.log/compile-wx.json一致，success=true且无错误/警告。覆盖页面SFC与service依赖，原首页未提供；完整原业务app构建not_run，app.json按结构解析核对。真实编译不验证宿主属性语义及几何。
- 原Jest：orders.test.cjs执行实际SFC脚本（仅剥离import）及原service，以VM模拟createPage/窗口/实例。首次agent.jsonl:46-47因Watchman fchmod EPERM未进入测试；:52-53关闭watchman后通过；:58、jest-results.json证实5项测试通过。未发生业务单测失败后的多轮修订，运行参数修复1次。stderr.log中的Codex配置、技能扫描警告与本组业务检查无因果阻断。
- 原测试刷新失败直接调用reload(true)，故独立新增grader-check.cjs，解析实际主容器事件名，通过该事件调用链注入fetchOrders(1,true)。grader-evidence.json记录两种renderer参数下初始4组×8项、连续触底2次后12组96项、第3页、刷新失败保留列表及页号并复位状态、后续分页成功到第4页、成功刷新回第1页、主scrollTop=237且其他来源不修改或分页。
- grader-check.cjs从wx:style表达式验证两层753px；从真实主容器事件属性获取处理器，不是只调用猜测的方法名。评分脚本首次因VM把未括起对象字面量当块语句而失败；为表达式补括号后通过，仅评分脚本修正1次，业务文件无改动。
- static-audit.json的48项是候选扫描加人工说明；audit.cjs:44,59通过预写notes及Jest状态生成结论，单凭“48项已复核”不足以证明业务。评分逐节点复核了高度链、数组消费、分支、直接子项、sticky首子与fixed层级，未依赖矩阵总数替代实质检查。

## 断言边界与等价实现

- s1_00：导航总高91px，844px窗口剩753px；外层子布局120+753=873px，外层有120px可滚范围。12组每组至少40+80=120px，总1440px超过主容器753px，列表确实在主容器内。初始4组加页尾可能不足一屏，报告明确说明并在主区域提供“加载更多订单”入口；这与初次4组需求相容，不虚称初始内容必然溢出。
- s1_01：refresher-enabled=!loading||refreshing在空闲及刷新进行中均求值true，仅分页请求期间暂时false；这是避免并发的门控，接受为启用刷新之等价实现。成功与失败沿同一主容器绑定复位triggered，失败后列表/页号不丢且可继续操作。不能将动态表达式只因字面上不是{{true}}判失败。
- s1_07：nested关联核对外层纵向→主订单纵向：主容器custom且associative-container=nested-scroll-view。组内横向list显式类型、直接tile，负责横排。参考规范的内外同向嵌套目标已满足，不从断言复合句额外推断横向也必须绑定同向滚动关联。建议未来评分文字将这一对象写得更明确。
- s1_09：外部block为透明条件节点；Skyline的section处于custom内、header首子且白底；WebView分支CSS sticky仅用于该分支。实际吸顶位置与嵌套手势不由静态或VM证明。
- s1_10：fab/modal同级fixed、3>2、弹层四边0；可按fixed-context静态判定覆盖关系。真实命中、触摸拦截与屏幕覆盖另记not_run。

## not_run 与评测建议

开发者工具双模式渲染、WebView/Skyline真机嵌套交接、概览离屏、真实刷新反馈、原生事件target/currentTarget形态、横纵手势、实际吸顶、弹层覆盖和导航几何均not_run。VM两种renderer参数运行的是同一逻辑，不能声称真实双模式呈现。测试事件人为构造，仅证明处理器对该事件形状的逻辑。

本例没有能力断言失败。当前静态定义允许内容增长后形成滚动；若未来要求初始4组就能实际触底分页，应明示初始视口/高度和分页可达性要求，以免将“程序调用两次触底处理器”等同于用户首屏可触发。s1_07宜明确关联对象，s1_01宜明确接受请求互斥期间关闭刷新；无需据未执行真机将已有静态证据充分的断言一律计0。

原执行metrics：duration_ms=372061（372.061秒）；input_tokens=1334454、output_tokens=16244、total_tokens=1350698；agent.jsonl的usage含cached_input_tokens=1259008，输入计数包含缓存，不能解释为全量未缓存成本。
