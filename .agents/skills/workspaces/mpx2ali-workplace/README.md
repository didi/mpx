# Mpx2Ali Skill 评测工作区

参考 RN 评测框架的组织方式，基于 [mpx2ali](../../mpx2ali/SKILL.md) 的支付宝适配知识建立。目录名按本次需求保留为 `mpx2ali-workplace`。

当前评测集为 [iteration-3](iteration-3/README.md)。后续执行使用 npm latest 发布版本；此前本地源码环境下的历史对比为两组均 15/15，见 [报告](iteration-3/benchmark.md) 与 [HTML 查看页](iteration-3/review.html)。历史成绩不代表当前发布包验证结果。

旧轮次和运行中间结果已清理，仅保留当前轮次最终汇总。

## 与参考框架的对应

| 层次 | 本工作区 |
| --- | --- |
| 独立宿主 | package.json、mpx.config.js、Babel 与 ESLint 配置；源码方言 wx |
| 迭代配置 | iteration-3/evals.json、prompt_templates.json、每例 eval_metadata.json |
| 用例输入 | eval-N-name/input，2 个存量适配 + 1 个新建页面 |
| 独立执行 | run_evals.py；Codex 独立进程、固定 cwd、显式模型与思考强度 |
| 每组交付 | eval-N-name/{mpx,mpx2ali}/outputs |
| 执行证据 | 每组 run-1/agent.jsonl、stderr.log、dispatch.json、run.json、metrics.json、timing.json、source-snapshot.json |
| 评分与汇总 | assessment.json → grading.json → benchmark.json / benchmark.md / grading-summary.json |
| 人工查看 | 复用 skill-creator 的 generate_review.py 生成 review.html |

运行器与评分器保存在各自 iteration 内，不读取 RN、Web 或 Skyline 工作区。汇总和查看器使用公共 skill-creator 工具。

## 用例覆盖

| ID | 类型 | 主题 | 断言 |
| --- | --- | --- | ---: |
| 0 | 改造 | 文本打点、图片 padding、scoped、布局查询边界 | 4 |
| 1 | 改造 | 输入框属性、首次聚焦、切换、弹层拦截、滚动条 | 5 |
| 2 | 新建页面 | 公共尺寸入口、窗口高度、安全区、更新、导航、固定布局 | 6 |

由 6 个用例、36 条断言合并为 **3 个用例、15 条独立能力断言**；双组共 6 次运行。每个能力只在一个断言中计分，发布包编译产物核对合入对应能力，不再单独加分。旧断言归属保存在当前 evals.json 的 consolidation 中。

交付完整、保留业务属性/事件/组件依赖、局部适配和如实记录验证范围，仍是所有任务的共同要求，不再各占一条重复计分断言。参考文档中的 RN 文本裁切案例不纳入支付宝评分。

## 使用

当前轮次的快照入口与复现说明见 [iteration-3/README.md](iteration-3/README.md)。下方为当前框架用法；已有运行不可覆盖，重跑需创建新轮次。

在 workspaces 顶层统一安装 npm 官方源依赖；版本更新与校验见下文。

```bash
npm install --ignore-scripts
npm run check-env
npm test
cd iteration-3

# 替换为此次对比实际选择的模型与思考强度，两组保持一致。
# 默认仅准备 dispatch 和辅助依赖，不启动模型，不写结果指标。
python3 run_evals.py --model <model-id> --reasoning-effort <effort> > dispatches.json

# 真正启动 6 个模型任务；--evals 0 1 / --groups mpx 可用于小范围运行。
python3 run_evals.py --execute --model <model-id> --reasoning-effort <effort> --max-workers 3

# 全部运行完成后生成待评审表，每条 passed 初始为 null。
python3 grade.py --prepare
# 评审各组 outputs 和实际产物/日志，填写 run-1/assessment.json 的 passed 与 evidence。
python3 grade.py
python3 ../../../skill-creator/eval-viewer/generate_review.py . \
  --skill-name 'mpx vs mpx2ali' --benchmark benchmark.json --static review.html
```

执行器拒绝覆盖已有运行或交付文件。重跑时创建新的 iteration，复制配置、输入与脚本后更新迭代编号；不要混入旧输出。调度器的 dry-run 会创建 outputs 并复制非交付依赖，但不会把需要模型改写的文件当作答案预先复制进去。

两组采用提示词隔离，不是文件系统读权限隔离；执行前后记录输入与本组 Skill 的 SHA-256。新一轮若需要冻结版本，可保留 Skill 快照并调整配置和模板入口。模型只读取任务、输入及本组 Skill，评分断言不注入任务提示词。运行日志中的 `input_tokens` 已包含缓存输入，`cached_input_tokens` 单列但不再次累加；缺失 usage 记为 null，不能伪造为 0。

## 编译与评分边界

```bash
# 从工作区根目录执行；page 用 --type=page，组件用 component。
npm run compile-validate -- <output.mpx> --type=component
npm run lint -- <output.mpx>
```

编译入口复用统一 Skill 的工具脚本，但不自动加载其知识文档；默认显式检查 wx、ali。脚本属于单文件校验工具，不能据此判断完整 App 的支付宝兼容样式入口已生效。App 集成需单独检查生成的 app.acss、文本兼容规则和滚动条隐藏规则；独立分包和插件需按实际集成环境验证。

执行前必须通过发布包模块真实解析路径校验。导航、文本默认样式及滚动条转换均以发布包和实际产物为准；必须按实际安装的 npm 发布版本记录支持情况。运行器同时记录编译器源码哈希，执行期间源码变化会使结果失效。

键盘事件顺序、设备差异和背景穿透不适合用字符串命中自动判分。评分器只接受显式布尔结论与非空证据；证据应指向输出代码位置、调用链、构建产物或实际日志，接受行为等价写法。未执行、交付缺失、指标缺失、未评审或两组模型不同均阻止正式汇总。主指标为通过断言数 / 15 的加权通过率；各 case 的 4/5/6 条断言数不同，不能与逐 case 平均值混用。单次运行不用于推断统计显著性。

微信/支付宝 × iOS/Android 的交互回归需要真机。没有真机时，`validation.md` 必须列明未验证范围，不将编译通过写成宿主交互通过。

2026-10-29 [语义复核记录](iteration-2/audit/semantic-review-20261029/summary.json)：原 mpx 13/15 的两处扣分经证据复核及 verification 口径校准撤回；原评分与报告已保存。其余 28 项判定不变，未重跑模型或修改输入、模型输出、运行日志与用量。潜在初始聚焦竞态及标题继承风险仍待目标宿主验证。

`npm test` 自动发现现存 iteration，并分别启动独立测试进程，删除旧轮次无需修改测试入口。

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
