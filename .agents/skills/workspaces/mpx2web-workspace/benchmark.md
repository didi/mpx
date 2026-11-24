# Mpx2Web Skill Benchmark

## 当前轮次

[iteration-13](iteration-13/evals.json) 按 Mpx2RN iteration-17 重组。仍为 **4 个 case、2 个对照组**，每组 26 条断言，每个 case 每组运行一次，共 8 次运行。当前尚未执行模型评测，没有本轮分数、Token 或耗时数据。

[iteration-12](iteration-12/benchmark.md) 的输入、输出和报告保留为历史记录。本轮按组件、页面和应用作用域重新设计输入，历史产物不能直接按本轮规则评分，也不作为新版模型运行结果。

## 组织与执行

与 RN 相同，根目录保留平台依赖、Babel、ESLint 和 Mpx 配置；每轮独立维护 `evals.json`、`prompt_templates.json`、`run_evals.py`、`grade.py` 及回归测试。每个 case 使用如下结构：

```text
eval-N-name/
├── input/                  需求、待改造源码及只读依赖
├── eval_metadata.json      与 evals.json 同步的任务元数据
├── mpx2web/
│   ├── outputs/            本题组件、页面或最小应用
│   └── run-1/              agent.jsonl、stderr.log、run.json、metrics.json、timing.json、grading.json
└── no_skill/
    ├── outputs/
    └── run-1/
```

组目录与报告由实际运行生成。`files` 相对各 case 目录，`outputs` 相对各组输出目录。适配题提供需求与缺陷源码，新建题只提供需求；评分断言不进入子 agent 提示词。

提示词沿用 RN 的任务、目标平台、工作目录、输入、Skill/基线、隔离和输出分段。两组共用业务需求，Skill 组按需读取参考，no_skill 明确禁用所有 Skill。模型与思考强度显式匹配父会话，`fork_turns=none`，`codex -C` 与 subprocess cwd 均固定为本 workspace。隔离方式与 RN 相同，依赖提示词约束，不声称具有独立文件系统隔离。

执行器在生成调度描述时复制非交付依赖，不复制需求文档或待生成答案；通过 `--execute` 才启动子 agent。沿用 RN 的单次运行与真实 usage 记录，移除新版流程中的临时工程映射、fingerprint、reuse receipt、resume/fresh 和多采样机制。重新评测时使用新轮次，避免覆盖历史结果。

局部差异采用单组件或单页面，不生成 App、构建配置和无关路由。只有断言需要验证应用级链路时才保留最小 `src`：case 0 验证编译配置、路由和页面回传，case 3 验证 SSR 初始化、预取和请求级状态。目标为 wx/web，仍只有 mpx2web 与 no_skill 两组。

## Case 与原测试意图

| Case | 设计 | 原断言 → 新断言 | 保留的测试意图 |
| --- | --- | --- | --- |
| [0：基础适配](iteration-13/eval-0-style-config-adaptation/input/options-app-requirements.md) | 最小应用；首页兼作样式展示，选择页验证回传 | C1.4～C1.6、C4.1～C4.4 → s0～s6 | 同名样式隔离、虚拟宿主等宽、外部类、导航回传、胶囊与导航栏、路由及资源路径、固定 rpx 换算 |
| [1：从零生成](iteration-13/eval-1-new-profile-component/input/profile-card-requirements.md) | 单文件 profile-card.mpx；选项式 API + 普通 class | C2.1、C2.3、C2.4 → n0、n2、n3 | 完整组件、标题外部类、实例独立折叠及响应式更新 |
| [2：业务兼容](iteration-13/eval-2-api-component-adaptation/input/business-page-requirements.md) | 单文件 business-page.mpx + 只读扫码依赖 | C3.1～C3.6、C5.1～C5.4 → c0～c9；C2.5 → c10 | 响应式赋值、名称确认/取消、依赖隔离、视频事件、位置、插件、地区地图、局部属性、结构组件、草稿状态、分享边界 |
| [3：SSR](iteration-13/eval-3-ssr-state-adaptation/input/article-ssr-requirements.md) | 复杂适配：文章首屏与状态迁移 | C6.1～C6.5 → r0～r4 | 路由与预取、共享 Pinia、请求级实例、服务端环境边界、微信原交互 |

case 0 移除未被断言消费的 worker、重复分包和单独样式页；只读分包入口由执行器复制。case 1 不再重新实现应用和调用方：宿主约定与默认 externalClasses 已提供，workspace 配置包含 accent-class；端到端外部类配置由 case 0 覆盖。原 n1 与 s5 重复的路由能力合并到 s5，原 n4 分享断言移到 case 2 的 c10，因此总数由 27 收敛为 26，case 数量不变。

case 2 将原多页面和包装组件中的差异收敛到一个页面，减少展示样式和重复数据，保留足以验证状态变化的样本。应用注册、插件服务及凭据属于已给定宿主契约；本题检查页面引用能否正确隔离。评分器分别检查扫码、插件、位置、视频和分享，不允许一个能力的条件分支替另一个能力通过检查。SSR 保留五个必要交付文件，避免丢失请求级状态与客户端恢复链路。

## 运行与评分

在 `iteration-13` 中执行以下命令，将模型参数替换为父会话实际值：

```bash
python3 run_evals.py --model <父会话模型> --reasoning-effort <父会话思考强度>
python3 run_evals.py --execute --model <父会话模型> --reasoning-effort <父会话思考强度>
python3 grade.py
python3 aggregate_benchmark.py --model <父会话模型> --reasoning-effort <父会话思考强度>
```

使用 `--evals 0 1`、`--groups mpx2web no_skill` 筛选调度，`--max-workers` 控制并发。`grade.py` 同样支持按 case/组筛选；完整汇总要求所有 8 次运行、真实指标和评分齐全且模型参数一致，生成 `benchmark.json`、`benchmark.md` 和 `review.html`。

评分沿用 RN 的 Python 确定性 PASS/FAIL 检查及 grading/metrics/timing 结构。轮次报告对各 case 的通过率取平均；若另行报告整体断言通过率，应明确写为“通过数 / 26”，两种口径不能混用。

编译验证由各组提示词与 Skill 决定，runner 不追加编译任务。静态得分不等于构建、浏览器交互或 SSR 请求验证通过；报告应另行说明实际验证范围。历史断言仍是源码模式检查，不能作为完整语义证明。

维护回归检查：`python3 -m unittest discover -s iteration-13 -p 'test_*.py'`。这些是执行器和评分器的单元测试，不增加模型评测 case。
