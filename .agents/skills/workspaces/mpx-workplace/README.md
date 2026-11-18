# Mpx Skill 评测工作区

本目录维护跨轮次共用的执行约束、[用例定义](evals.json)、case 输入与宿主配置。`iteration-*/` 只承载各轮报告和运行产物，可按需删除，不影响共用输入与规则。

## 分组与执行条件

| 条件 | Skill 组（`mpx`） | 无 Skill 组（`noskill`） |
| --- | --- | --- |
| 可读取内容 | 当前 case 的 `input/`、本轮固定的 Mpx Skill 快照、自身 `outputs/` | 当前 case 的 `input/`、自身 `outputs/` |
| Skill 使用 | 先读取快照中的 `SKILL.md`，按需读取其中相关参考 | 不加载任何 Skill |
| 输入与交付要求 | 使用同一份 case 输入、任务提示词和交付清单 | 相同 |
| 模型与执行次数 | 默认 `gpt-6.1-sol / high / priority`，每个 case 独立执行一次 | 相同 |

模型、思考强度、服务层级及执行次数如需调整，必须同时应用于两组并记录在本轮报告中。每个 case、每个分组使用独立会话和输出目录，不能读取其他 case、其他组或历史运行结果。

两组都只能使用允许的文件工具读取白名单路径，写入自身 `outputs/`；不得联网、搜索、读取仓库或依赖源码、外部文档、评分资料或其他 Skill。不得通过 shell、浏览器、其他 MCP 或子 Agent 绕过边界。允许使用模型已有知识；Skill 中的外链与核实要求也不能突破本次信息源限制。

执行器应通过真实路径白名单限制文件访问，记录工具调用，并检查输入及 Skill 快照前后哈希一致。提示词约束不能替代访问控制；工具白名单和访问审计也不等同于操作系统级文件系统隔离。

## 交付与独立验证

case 执行阶段不安装依赖、不运行编译、Lint 或测试；交付后由独立验证者执行检查和评分，结果不回传给 case，也不据此改写原始交付。编译和验证使用共享锁定发布包，轮次执行期间不更新依赖。

交付完整实现与 `verification.md`，按目标说明设计、自查及未验证项，不把静态检查或单文件编译写成完整 App、真机、浏览器或 SSR hydration 通过。代码遵守小驼峰普通变量、帕斯卡组件/Class 命名，运行时代码用 `Object.assign` 合并对象。

评分依据 [evals.json](evals.json) 的 48 条唯一能力断言，每条 1 分，不按目标端重复计分；接受满足同一契约的等价实现，不确定项保留 pending。评分断言只提供给独立评分者，执行 case 时仅分发当前任务提示词、输入、交付清单和对应组指令。静态能力分数、编译诊断、Lint 和运行验证分别报告。

## 共用输入与用例定义

[evals.json](evals.json) 保留任务提示词、交付要求与断言，`cases/eval-{id}-{name}/input/` 保留输入。两者长期维护，清理旧轮次时不要删除。

| Case | 输入 |
| --- | --- |
| 0 · 构建目标、条件文件与配置归属 | [scenario.md](cases/eval-0-target-config/input/scenario.md) |
| 1 · 图文布局、间距与样式作用范围 | [scenario.md](cases/eval-1-layout-card/input/scenario.md) |
| 2 · 刷新、吸顶与节点定位 | [scenario.md](cases/eval-2-scroll-feed/input/scenario.md) |
| 3 · 弹层、键盘与窗口尺寸 | [scenario.md](cases/eval-3-checkout-dialog/input/scenario.md) |
| 4 · 登录适配、任务句柄与请求取消 | [scenario.md](cases/eval-4-account-search/input/scenario.md) |
| 5 · 响应式动态组件与首次渲染能力 | [scenario.md](cases/eval-5-reactive-switcher/input/scenario.md) |
| 6 · 路由参数、部署与异步分包 | [scenario.md](cases/eval-6-routing-subpackage/input/scenario.md) |
| 7 · 共享业务的 Web SSR 请求隔离 | [scenario.md](cases/eval-7-ssr-shared-state/input/scenario.md) |

输入从 Git `0508ba54c` 恢复，并与 iteration-2 本地评审记录中的 8 份正文逐项核对一致；48 条断言也与当时两组评分报告一致。[恢复记录](input-recovery.json) 保留来源与哈希。该记录描述恢复时的版本，后续输入修订应单独记录，不能覆盖历史结果的来源。

## 轮次与归档

新评测使用独立的 `iteration-N/`。准备阶段从顶层用例定义与 `cases/` 分发本轮输入，从 `evals.json` 指定的 Skill 源复制固定快照；执行阶段只向 Skill 组开放快照。记录本轮模型配置、输入和 Skill 版本/哈希及验证环境，不依赖旧轮次目录，也不将当前 Skill 冒充历史快照。

最终报告放在本轮根目录或 `reports/`；中间工程、探针与原始诊断放入 `.artifacts/`。输出、日志、快照等运行产物由 [共享 .gitignore](../.gitignore) 忽略，case 输入、用例定义、共用配置与汇总报告保留。删除任一 `iteration-*/` 仅清理该轮历史记录，共用输入与执行约束不受影响。

目前保留了输入、用例定义、执行约束和宿主配置，原执行器与完整运行提示词尚未恢复。这些约束是后续执行器必须遵守的要求，不代表当前已有可直接运行的完整评测命令。
