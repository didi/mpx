# iteration-13 评分复核

本轮 8 个任务均正常退出，原始静态总分为 mpx **16/26**、mpx2web **23/26**。现有正则评分器存在明显的写法偏置，不能仅据此判断实际交付质量。以下为失败断言的定向复核，完整行为验收仍应结合实际宿主；原始评分保持可追溯。

## 分组结果

| 用例 | mpx | mpx2web |
| --- | ---: | ---: |
| 0 应用样式与配置 | 6/7 | 6/7 |
| 1 新建组件 | 1/3 | 3/3 |
| 2 业务页面 | 6/11 | 9/11 |
| 3 SSR 应用 | 3/5 | 5/5 |
| 合计 | 16/26 | 23/26 |

benchmark 的通过率采用四个用例通过率的等权平均，分别为 **58.40% / 91.88%**，与按断言计数的 **61.54% / 88.46%** 口径不同。每用例每组仅运行一次；标准差是不同用例间差异，不能解释成重复实验的稳定性。

## 失败断言复核

| 组 / 断言 | 发现与证据 |
| --- | --- |
| mpx / case 0 s5 | `publicPath` 使用按目标选择的三元表达式，Web 实际值为 `/help-demo/`；app 中 history/base、主包与分包注册完整。评分器只接受冒号后直接跟字符串。独立 VM 检查已确认配置值。 |
| mpx2web / case 0 s3 | 普通入口通过 `options.events.ready = ...` 注册通知，Web 确认通过 `choiceSelected` 回传，wx 保留 `receiveChoice`。评分器要求对象字面量中的 `ready:`。日志中的 DOM 检查覆盖普通入口、链接回传和直达入口。 |
| mpx / case 1 n0、n3 | 完整选项式组件使用 `data()` 返回新对象，评分器只识别 `data: {}`。独立 VM 检查创建两个实例状态、切换其中一个并验证另一个不受影响，结果通过。 |
| mpx / case 2 c2、c5 | JSON 用 `__mpx_mode__ === 'wx' ? {...} : {}` 隔离扫码和插件注册，模板用含编译常量的 `wx:if`。评分器只识别特定 if 语句与节点条件标记。独立检查确认 Web 注册为空、wx 注册完整、只读依赖相同；子任务最终 wx/Web 递归编译均无错误和警告。 |
| mpx / case 2 c4 | 从 `@mpxjs/api-proxy` 直接导入 `chooseLocation`，调用在 wx 分支内，结果赋值和 Web TODO 均保留。评分器只接受 `wx.chooseLocation` 或 `mpx.chooseLocation`。子任务业务状态测试覆盖该分支。 |
| mpx / case 2 c6 | picker/map 用含编译常量的 `wx:if` 隔离；Web 提供地区 selector、已有门店列表和地图接入说明。评分器没有识别该条件形式。地区/门店状态链已有子任务测试；真实地图与微信宿主行为仍未验证。 |
| mpx / case 2 c8 | `mpxTagName@web` 复用网格和筛选节点，`.filter-mask` 通过组合 CSS 规则固定定位，条件表达式控制可见性。评分器硬编码 `.filter-container` 或 `.filter-overlay` 与特定属性写法。子任务测试覆盖筛选的打开、取消、确认。 |
| mpx2web / case 2 c6 | 默认 `mode="region"` 与 `mode@web="selector"` 共用 picker，Web 通过 `bindchange@_web` 调用公共地区处理器，map 仅 wx 保留。评分器对模式、事件的识别组合不覆盖该写法。真机地区选择仍需验收。 |
| mpx2web / case 2 c8 | `.filter-panel` 固定定位并通过 `wx:if@_web` 控制显示，另有遮罩；评分器硬编码了其他 class 名。状态检查和编译已通过，真实浏览器布局未验收。 |
| mpx / case 3 r1 | 使用命名导入 `useArticleStore`，`mapState` 读取状态并显式调用当前 `$pinia` 的 action。评分器只接受同时使用 mapState/mapActions 或默认导入的两种组合。SSR 构建及请求隔离测试已通过。 |
| mpx / case 3 r3 | 使用安全的 `typeof window === 'undefined'` 判断服务端环境；评分器只要发现 window/document/navigator 单词就判失败。服务端构建和实际 SSR 渲染测试均通过。 |

独立执行的证据见 [semantic-evidence.json](audit/semantic-evidence.json)，检查脚本见 [semantic-checks.cjs](audit/semantic-checks.cjs)。其余证据来自交付源码和各任务的 `run-1/agent.jsonl`，汇总见 [execution-audit.json](audit/execution-audit.json)。这些定向检查不构成完整重评分，因此未给出新的“修正总分”。

## 编译和运行边界

- 两组应用配置用例均完成双端编译、完整 Web 构建和 DOM 运行检查。mpx 还补齐临时工程的开发者工具配置并通过 wx 完整构建；mpx2web 的 wx CLI 完整构建曾因输入缺少 `project.config.json` 在收尾失败，后续页面双端递归编译通过。DOM/JSDOM 结果不能替代真实浏览器的布局验收。
- 两组组件用例均通过 wx/Web 局部编译、ESLint 和相关测试。
- 两组业务页面用例均通过 wx/Web 局部编译和业务状态检查。mpx2web 的最终 Web 编译仍有 2 条 swiper 前后边距警告；该任务核对了内建实现和产物后保留属性。mpx 使用显式平台属性标记后无该警告。地图、扫码和分享服务均没有真实接入。
- 两组 SSR 用例均完成服务端和客户端构建及请求隔离验证；mpx 有 4 项、mpx2web 有 7 项相关 Jest 测试，包含 SSR/接管检查。两组都遇到环境内 `vue-demi` 默认指向 Vue 3、而 Vue 为 2.7 的问题，并在交付构建配置中增加 Vue 2.7 入口别名解决。准备阶段安装跳过了依赖生命周期脚本，最小组件 smoke test 未覆盖 Pinia SSR；这是本轮共同环境因素。

## 耗时与 Token

| 指标 | mpx | mpx2web |
| --- | ---: | ---: |
| 平均每用例耗时 | 344.5 秒 | 380.7 秒 |
| 四个任务耗时之和 | 1378.0 秒 | 1522.7 秒 |
| 输入 Token（含缓存） | 8,187,509 | 8,198,507 |
| 其中缓存输入 Token | 7,771,008 | 7,882,240 |
| 非缓存输入 Token | 416,501 | 316,267 |
| 输出 Token | 54,049 | 59,387 |

任务并行运行，耗时之和不等于本轮墙钟时间。benchmark 的 Token 指标是 CLI 报告的输入加输出，包含反复使用的缓存上下文；不应直接视为新增 Token 或费用。由于各用例的验证步骤不同，耗时也包含不同深度的自检。
