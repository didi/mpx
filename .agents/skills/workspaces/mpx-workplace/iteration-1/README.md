# Mpx 多端兼容评测集 · iteration-1

状态：**已完成16次模型执行与静态设计评审；完整构建和真机运行未验证**。共8个case、每组48条断言。模型为`gpt-6.1-sol / high`，每组每case运行1次。结果：mpx 48/48，noskill 44/48；见[结果审计](score-audit.md)、[benchmark](benchmark.md)和[对照页](review.html)。分数不代表产物可运行，检查失败及未计分风险见审计。

参考 mpx2rn-workspace/iteration-18 的 evals、eval_metadata、input 与未来运行目录结构；内容依据当前 mpx Skill 重新设计。保留用户指定目录名 `mpx-workplace`。不复制旧运行结果，不沿用只认识 wx/ios 的正则评分器，也不将旧分数换算为四端分数。

## Case 分工

| ID | 场景 | 类型 | 断言数 |
| --- | --- | --- | ---: |
| 0 | [构建目标、条件文件与配置归属](eval-0-target-config/input/scenario.md) | migration | 6 |
| 1 | [图文布局、间距与样式作用范围](eval-1-layout-card/input/scenario.md) | migration | 7 |
| 2 | [刷新、吸顶与节点定位](eval-2-scroll-feed/input/scenario.md) | migration | 7 |
| 3 | [弹层、键盘与窗口尺寸](eval-3-checkout-dialog/input/scenario.md) | migration | 5 |
| 4 | [登录适配、任务句柄与请求取消](eval-4-account-search/input/scenario.md) | migration | 6 |
| 5 | [响应式动态组件与首次渲染能力](eval-5-reactive-switcher/input/scenario.md) | new-component | 7 |
| 6 | [路由参数、部署与异步分包](eval-6-routing-subpackage/input/scenario.md) | integration | 5 |
| 7 | [共享业务的 Web SSR 请求隔离](eval-7-ssr-shared-state/input/scenario.md) | migration | 5 |

每个 case 均同时要求微信 Skyline（并保留 WebView 回退）、支付宝、RN、Web。构建目标为 `wx,ali,ios,android,harmony,web`；`skyline` 不是独立 mode。运行维度另区分微信 renderer 与支付宝设备系统。case 7 额外包含 Web SSR，其余场景不强加 SSR 约束。

输入采用自包含的 `input/scenario.md`：包含旧代码片段、复现条件、具体数据、已有工程前提与业务需求；它们不是可直接编译的完整工程。迁移 case 要把片段补成完整文件，新建 case 按需求实现。选择该形式是为了避免将有意存在的缺陷混入仓库运行时代码，也避免复制一份易过期的 CLI 工程。后续执行须使用同一可构建业务工程，依赖版本在运行记录中固定。

## 文件与路径

- `evals.json` 是计分的唯一来源；断言包含 id、capability、text、verify、fail_when、sources。
- `eval-*/eval_metadata.json` 镜像该 case 的 prompt 和断言，方便接入原工作流；镜像不新增分数。
- `files` 相对 case 目录，`outputs` 相对未来运行的 outputs 目录。允许额外条件文件和必要依赖，交付清单列出的入口须存在。
- `sources` 相对 workspace 根目录旁的 `../../mpx/references/`，用于评分者核实口径，不放入被测执行提示词。
- `prompt_templates.json` 提供共同任务及固定的 `mpx` / `noskill` 两组配置，与 `evals.json` 的 `comparison.groups` 对应。`mpx` 组仅使用 mpx Skill，`noskill` 组不加载任何 Skill。两组使用相同模型、思考强度、输入、工程、工具与评分标准；本轮使用 gpt-6.1-sol、high，每组每case执行1次。
- [评分说明](grading-guide.md) 定义去重、证据与缺失实现判定。真实 run、timing、grading 与 benchmark 已生成，见本目录结果文件。

## 去重原则

一条能力只有一个全局 ID 和一个计分归属。相同能力在多个业务里出现时仍须保证正确，但只在归属 case 计分；例如其他页面也可能需要布局与事件修正，不再额外加“无 dataset”“有 defineExpose”“能编译”等分数。断言中的多个目标、正反例和检查步骤是同一契约的证据，不分别计分。

有些内容相关但失败条件不同，保留独立分数：RN 条件文件回退与区块筛选（case 0）不等于 API custom 目标键注册（case 4）；模块图跨目标隔离（case 0）不等于 Web 内 SSR/浏览器导入时机（case 7）；请求句柄获取不等于乱序响应保护；异步分包加载执行不等于仅预下载；背景能力与动画能力分别有独立开关。

通用交付要求只作为可评估前提，不另计分。仅字符串相同的检查不足以证明语义去重，因此维护下面的能力归属表；新增断言前先检查是否已经有同一修复原因/失败条件。

| 唯一能力 ID | Case | 计分契约 |
| --- | ---: | --- |
| `config.target-dialect` | 0 | 构建目标使用 wx/ali/ios/android/harmony/web，微信源码方言保持 wx，Skyline 不成为 mode。 |
| `config.rn-file-fallback` | 0 | RN 条件文件回退后在 ios/android/harmony 都保留可渲染模板。 |
| `config.native-import-boundary` | 0 | react-native 依赖只进入 RN 目标的模块图，三种 RN 目标仍可获得平台名。 |
| `config.skyline-json` | 0 | 微信应用/页面具有正确层级的 Skyline 配置，其他目标配置不被污染。 |
| `config.external-classes` | 0 | 支付宝插件 externalClasses 保留三个仍被消费的外部类名称。 |
| `config.component2` | 0 | component2 在支付宝开发者工具工程配置中启用。 |
| `layout.portable-grid` | 1 | 卡片图片区域具有实际可用的跨端布局，RN 分支使用支持的选择器与布局声明。 |
| `layout.margin-geometry` | 1 | 折叠块级间距与不折叠 Flex 间距分别保持 24rpx、20rpx、16rpx。 |
| `layout.text-ellipsis` | 1 | 同一长标题在各端均一行省略，并保留各端所需的文本约束。 |
| `layout.image-padding` | 1 | 图片自身保持 240×80rpx，四边 24rpx 留白由外层承担。 |
| `layout.responsive-breakpoint` | 1 | 400px 断点在 Skyline 与其他端保持一致且随窗口变化更新。 |
| `layout.style-isolation` | 1 | 支付宝同名 badge 类不在页面、组件和兄弟实例间串色。 |
| `layout.text-tree` | 1 | 保障文本与官方标签采用各端合法节点树并保持横向展示。 |
| `scroll.refresh-entry` | 2 | 刷新在四端都有可触发入口，支付宝不依赖不支持的 refresher 事件。 |
| `scroll.pagination` | 2 | 触底分页从实际滚动容器触发并保留有界可滚动区域。 |
| `scroll.event-payload` | 2 | 滚动位置展示读取 scroll-view 的 detail.scrollTop。 |
| `scroll.sticky-renderer` | 2 | 分组标题的吸顶实现按目标和微信 renderer 生效。 |
| `scroll.horizontal-width` | 2 | 横向分类的直接内容子节点分别具备视口宽和 1200rpx 宽的布局依据。 |
| `scroll.query-scope` | 2 | 订单定位链路采用合法 id、实例作用域与 RN 可查询节点。 |
| `scroll.scrollbar-boolean` | 2 | 隐藏滚动条使用严格布尔 false，并仅对微信补 enhanced。 |
| `dialog.mask-scroll` | 3 | 支付宝锁滚动仅作用于蒙层，内容区仍可滚动，微信背景触摸被正确拦截。 |
| `dialog.device-input` | 3 | 仅复现问题的支付宝输入框按运行时 iOS/Android 设置 enableNative。 |
| `dialog.focus-readiness` | 3 | 支付宝首次聚焦等待实际渲染和入场完成。 |
| `dialog.keyboard-order` | 3 | 焦点和键盘状态对两种输入框切换事件顺序均稳定。 |
| `dialog.window-units` | 3 | 尺寸封装使用窗口高度及同单位安全区，容忍缺失安全区并响应窗口变化。 |
| `api.host-login` | 4 | 微信与支付宝授权码进入各自兑换入口，RN/Web 使用约定宿主 session 能力。 |
| `api.custom-contract` | 4 | getSession 按实际目标注册且由安装后的代理调用，明确返回 Promise。 |
| `api.request-task` | 4 | Promise 请求的取消句柄从请求发起时的 __returned 获取。 |
| `api.stale-result` | 4 | 查询身份阻止旧响应覆盖新结果或取消后的状态。 |
| `network.cancel-token` | 4 | xfetch 使用 CancelToken.token、exec 和 isCancel 完成取消链路。 |
| `network.interceptor-dispose` | 4 | 响应拦截器保留成功值/业务错误语义并通过 use 返回的函数释放自身。 |
| `script.props-live` | 5 | title prop 在父级更新后继续驱动标题展示。 |
| `script.setup-exposure` | 5 | script setup 显式暴露模板所用的状态、计算值与方法。 |
| `script.lifecycle-registration` | 5 | 生命周期同步注册，异步配置只更新存活实例状态。 |
| `template.dynamic-range` | 5 | 动态组件候选与 usingComponents 注册一致且保留父层共享计数。 |
| `template.event-chain` | 5 | 点击处理和 change 事件在四端传递同一业务载荷并遵守 disabled。 |
| `rn.background-priming` | 5 | 动态背景节点在 RN 首次渲染即开启 enable-background 并具有唯一有效 key。 |
| `rn.animation-priming` | 5 | 动态过渡节点在 RN 首次渲染即开启 enable-animation。 |
| `routing.decoded-query` | 6 | 页面使用 Mpx 提供的 decodedQuery 且不重复解码。 |
| `routing.web-deploy` | 6 | Web 路由 base、资源 publicPath 和 history 回退各自正确配置。 |
| `routing.web-titlebar` | 6 | Web 内建标题栏被运行时显式启用且页面未将其隐藏。 |
| `subpackage.load-driver` | 6 | RN 普通异步分包同时具备编译开关与真实宿主加载驱动，不承诺 RN/Web 独立启动。 |
| `subpackage.prefetch-driver` | 6 | RN 预下载单独接入只下载不执行的宿主方法，并明确 Web preloadRule 不生效。 |
| `ssr.request-pinia` | 7 | 每次 SSR 应用初始化同步创建并返回独立 Pinia，保留既有根选项。 |
| `ssr.await-prefetch` | 7 | 服务端预取返回真正的数据 Promise，并保留各客户端的加载入口。 |
| `ssr.browser-import` | 7 | 浏览器专用埋点在 SSR 中不会被导入求值，其他端无此依赖。 |
| `ssr.hydration-cache` | 7 | 首屏状态通过 Pinia 恢复并按请求参数复用，而非永久跳过后续请求。 |
| `ssr.dual-build` | 7 | SSR 具有同入口的服务端/客户端产物与逐请求渲染 context，异步首屏正确等待路由。 |

## 后续执行方式

1. 从 evals 选择 case，将其 scenario.md 与展开后的 prompt 单独分发给执行者；不得分发评分断言。用共同的业务工程、版本与工具，分别执行 `mpx` 与 `noskill` 两组；每组完整执行一遍为 8 次任务，两组合计 16 次。
2. 每次执行使用独立上下文和输出目录，例如 `eval-0-target-config/mpx/run-1/outputs/` 与 `eval-0-target-config/noskill/run-1/outputs/`。同一 case 的所有目标由同一次实现覆盖，不能各端各生成一套无关联答案。
3. 真实运行后记录模型、思考强度、输入/Skill 哈希、时长与 token 使用量，再由独立评分者依据 grading-guide 判定；未采集指标保持缺失。
4. 两组产物均由独立验证阶段在可用业务工程中调用 mpx/scripts/compile-validate.js，显式 `--target=wx,ali,ios,android,harmony,web` 并按页面/组件类型执行。涉及注册及依赖时使用 `--no-ignore-sub-components` 或完整 App 构建；配置、SSR 和原生宿主须做对应集成验证。该命令不会创建 Skyline 独立构建。
5. 对输出执行项目适用的 ESLint/Jest，再验证 renderer、支付宝两类设备、RN 三端和浏览器。缺宿主时记录未覆盖项，不能用“静态可接受”替代真机通过。Skyline 修改范围按 Skill 完整检查矩阵审查，矩阵结果作为质量记录，不再重复计分。

本目录提供可分发数据与人工/Agent评分协议；自动执行及证据聚合入口见下文，语义评分仍由独立评审完成。旧 RN runner 对输出文件、目标和 checker 的假设不适用本集，不能直接重定向到本目录。

## 独立执行与评分入口

本轮自带 `run_evals.py`、`grade.py` 与回归测试，不读取其他 workspace 或 iteration。`mpx` 与 `noskill` 分组保持一致；本轮真实模型评测与静态评分已完成，构建和宿主限制见结果审计。执行器复用已有独立 Codex 进程协议，真实日志、用量和耗时写入各组 `run-1/`，交付写入 `outputs/`，拒绝覆盖已有运行。

```bash
# 在本 iteration 目录执行；模型与思考强度须显式指定。
python3 run_evals.py --model <model-id> --reasoning-effort <effort>
# 正式执行时加 --execute；可用 --evals / --groups 选择范围。
# 如需完整工程构建，两组传入相同的 --project-root /absolute/business-project。
python3 grade.py --prepare
# 按 grading-guide.md 填写 assessment.json 的 status / evidence / unverified / blocked_by。
python3 grade.py
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py'
```

不提供 `--project-root` 时提示词明确标记工程未提供，不能声称完整构建通过。`grade.py` 在任意断言仍为 pending 时只生成 `review-status.json`，返回非零并移除过期的最终汇总；全部评审完成后才生成 grading、benchmark 和加权总分。聚合工具使用工作区外的公共 `skill-creator`，不依赖其他评测工作区。旧轮次可独立清理；保留本轮、被测 `mpx` Skill 与公共工具即可。Skill 未冻结时，后续重跑使用当前版本，执行前后均采集指纹。

## 共享发布包测试环境

五个测试集共用 `workspaces/package.json`、本地生成的 `package-lock.json` 和唯一的 `node_modules/`。框架统一使用 npm 官方源 `@mpxjs/*@latest`，不引用仓库 `packages/` 或复制/修改框架源码。

在 `workspaces/` 顶层准备一轮评测环境：

```bash
npm install
npm run update-framework
npm run check-env
npm test
```

子测试集仅保留自己的 `mpx.config.js`、Babel/ESLint 配置和执行脚本，Vue CLI 通过 `vuePlugins.resolveFrom` 从顶层发现插件；编译命令显式传入当前测试集 `--project-root=.`。各组共用本轮锁定版本，运行期间不更新。`npm ci` 仅复现锁文件，不保证最新版本。Webpack 使用与当前 Mpx 发布编译器兼容的 5.104.1，避免旧模块路径回退到仓库 Webpack 导致混用。

Skill 快照仅用于两组隔离。已有最终汇总来自历史环境，不代表当前发布包已完成模型评测；产物回归检查需要重新生成已清理的模型产物。重新评测应新建轮次，保留历史汇总。
