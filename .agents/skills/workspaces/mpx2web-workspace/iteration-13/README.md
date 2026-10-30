# mpx / mpx2web 对比评测（iteration-13）

状态：**8/8 评测已完成并正常退出**。模型为 `gpt-6.1-sol`，思考强度为 `high`；保留 iteration-13 的输入、题目及评分断言，仅将比较组改为 `mpx / mpx2web`。

## 评测配置

| 用例 | 内容 | 每组断言数 |
| --- | --- | ---: |
| 0 style-config-adaptation | 最小应用样式、配置与导航适配 | 7 |
| 1 new-profile-component | 从零创建跨端组件 | 3 |
| 2 api-component-adaptation | 页面 API、组件与业务状态适配 | 11 |
| 3 ssr-state-adaptation | SSR 首屏、Pinia 状态与请求隔离 | 5 |

每组 4 个用例、26 条断言，每用例每组运行 1 次，共 8 次运行。两组均以 wx/web 为目标，输入和交付范围相同，只允许按需读取本组 Skill。采用独立 Codex 进程，固定 cwd 为 `.agents/skills/workspaces/mpx2web-workspace`，不继承父会话上下文。隔离由提示词约束实现，不是文件系统读权限隔离。

正式全量语义复核及校准评分为 **mpx 26/26、mpx2web 24/26**。c3 已按当前仓库 Web 生命周期修正，mpx 通过；mpx2web 仍有重复解码及此前编译环境下的地区绑定缺陷；两组也各有一项原断言未覆盖的 SSR 错误路径问题。原始 16/26、23/26 已归档到 `audit/original-scoring`。详见 [对比报告](benchmark.md)、[结果查看页面](review.html) 与 [评分复核](score-audit.md)。仅保留最终汇总，原始模型输出、日志和中间指标已清理。

## 环境与验证

- Codex CLI 0.162.0 已安装，ChatGPT 登录有效；本轮 8 个模型请求均成功执行，实际调用使用 gpt-6.1-sol / high。
- 框架依赖通过 npm latest 安装，实际版本以本轮锁文件和 `npm run check-env` 输出为准。
- Webpack 版本及共享依赖准备方式见下文。
- 40 项 Python 调度与评分器测试通过，含全量语义结论对齐及正反例。模型执行使用 mock；校准检查实际调用 Node 探针与安装版模板编译器，不调用模型。
- 输入中的 16 个 JS / Mpx 文件通过仓库 ESLint；明确启用 `.mpx` HTML 脚本解析，关闭输入片段的依赖路径缺失规则。
- Web 模板和样式相关 Jest：2 个套件、17 项测试通过。
- 两组各自的 `compile-validate.js` 均已对临时最小组件完成 wx/web 编译：4 项检查通过，零错误、零警告。这只是依赖环境检查，不是评测题目执行，也不代表 SSR 或浏览器功能验证。

## 执行命令

以下为本轮使用的命令，在本目录运行。当前结果已完成；再次执行会覆盖对应组的结果，应另建新轮次保存后续对比。

```bash
# 准备调度和依赖，不启动模型
PYTHONDONTWRITEBYTECODE=1 python3 run_evals.py --model gpt-6.1-sol --reasoning-effort high --groups mpx mpx2web > dispatches.json

# 正式执行（本轮已完成）
python3 run_evals.py --execute --model gpt-6.1-sol --reasoning-effort high --groups mpx mpx2web --max-workers 3 > execution-results.json

# 所有模型任务完成后再评分和汇总
python3 grade.py
python3 aggregate_benchmark.py --model gpt-6.1-sol --reasoning-effort high
```

运行器要求显式传入模型参数；`evals.json` 中记录本轮约定。两组模型与思考强度必须一致。参数含义见 [OpenAI 配置参考](https://developers.openai.com/codex/config-reference)。

评分器已按全量语义复核校准，保持原有 26 条断言文本，汇总仍采用逐用例通过率的平均值。`semantic-review.json` 保存全部 52 条人工结论；`semantic_probe.cjs` 用安装版编译器、Vue Router 和受限 VM 验证关键行为，新增反例测试防止放宽规则后误过。额外 SSR 缺陷单列，不计入原分母。正式执行前如果修改题目、Skill 或依赖，应重新生成调度并记录变化。本次未修改两个被测 Skill，也未更改其他评测工作区。汇总器已修正通用脚本将运行次数写死为 3 的元数据，本轮实际为每用例每组 1 次。

正式复核验证了 34 个交付与依赖文件的哈希未变。本轮仅更新评分逻辑和报告，未修复原始交付缺陷；修复交付或优化 Skill 应另建轮次以保持可比性。

c3 评分探针直接执行当前仓库 Web `created` 方法体，实际传参和源码 SHA-256 见 `audit/local-runtime-c3.json`。本次仅切换 c3 生命周期基准，其他检查仍使用原评测依赖；原安装运行时的评分已归档至 `audit/installed-runtime-scoring`。

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
