# mpx / mpx2web 对比评测（iteration-13）

状态：**8/8 评测已完成并正常退出**。模型为 `gpt-6.1-sol`，思考强度为 `high`；保留 iteration-13 的输入、题目及评分断言，仅将比较组改为 `mpx / mpx2web`。

## 评测配置

| 用例 | 内容 | 每组断言数 |
| --- | --- | ---: |
| 0 style-config-adaptation | 最小应用样式、配置与导航适配 | 7 |
| 1 new-profile-component | 从零创建跨端组件 | 3 |
| 2 api-component-adaptation | 页面 API、组件与业务状态适配 | 11 |
| 3 ssr-state-adaptation | SSR 首屏、Pinia 状态与请求隔离 | 5 |

每组 4 个用例、26 条断言，每用例每组运行 1 次，共 8 次运行。两组均以 wx/web 为目标，输入和交付范围相同，只允许按需读取本组 Skill。采用独立 Codex 进程，固定 cwd 为 `.agents/skills/mpx2web-workspace`，不继承父会话上下文。隔离由提示词约束实现，不是文件系统读权限隔离。

正式全量语义复核及校准评分为 **mpx 25/26、mpx2web 24/26**。两组均存在视频初始化缺陷，mpx2web 另有地区绑定缺陷；两组也各有一项原断言未覆盖的 SSR 错误路径问题。原始 16/26、23/26 已归档到 `audit/original-scoring`。详见 [对比报告](benchmark.md)、[结果查看页面](review.html) 与 [评分复核](score-audit.md)。原始模型输出、真实日志与指标均已保存。

## 环境与验证

- Codex CLI 0.162.0 已安装，ChatGPT 登录有效；本轮 8 个模型请求均成功执行，实际调用使用 gpt-6.1-sol / high。
- 本地依赖已安装；Mpx CLI service / CLI plugin 2.2.32，Mpx core / api-proxy / webpack-plugin 2.11.1，Pinia 2.11.0，Vue 与 vue-server-renderer 均为 2.7.16。完整版本见 `environment.json`。
- Webpack 固定为 5.104.1，与仓库根目录现用版本一致。初次安装的 5.112.2 缺少 Mpx 所依赖的旧模块路径，解析回退到根目录旧版 Webpack 后导致混用；固定版本后已消除。
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
