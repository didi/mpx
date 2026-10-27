# Mpx2RN 精简评测集（iteration-18）

基于 iteration-17 整合 case 设计：**9 → 6 个 case，110 → 61 条计分断言**。本次仅比较 **mpx / mpx2rn** 两组，共 **12 次运行**，不包含无 Skill 或精简版。模型固定使用 `gpt-6.1-sol`，思考强度 `high`。本轮 12/12 个任务已执行完成并正常退出。评分器已按实际输出校准，按用户实测修正动态透明度判定后，重新评分为 **mpx 60/61（98.36%）、mpx2rn 59/61（96.72%）**，122 个判定与复核记录一致。详见 [当前对比报告](benchmark.md)、[结果查看页面](review.html) 和 [评分复核证据](score-audit.md)。修复前评分与报告保存在 [scoring-before-fix/](scoring-before-fix/)。

## Case 分工

| 新 case | 原 case | 交付文件 | 独立计分断言 | 保留的重点 |
| --- | --- | --- | ---: | --- |
| 0 style-layout-adaptation | 0 + 4，接收 5 的字体检查 | data-panel.mpx | 16 | 选择器、Grid、伪元素、文字、粘性布局、节点查询、单位注释、三种 margin 场景 |
| 1 template-api-adaptation | 1 + 2 | order-list.mpx | 9 | 动态绑定、事件传参、页面滚动、宿主 API、生命周期与 Hover 分支复用 |
| 2 dynamic-capability-adaptation | 3 + 5 | carousel-card.mpx | 15 | 动态背景/动画/CSS 变量、同步注册、组件引用、setup 属性响应性、平台样式和 JSON |
| 3 new-rating-component | 6 | rating-selector.mpx | 8 | 选项式 API、实例本地状态、事件、动态组件 range、普通 CSS 与按压态 |
| 4 new-segmented-control | 7 | segmented-control.mpx | 5 | script setup 宏、props 响应性、ref/watch、computed、整体与单项禁用 |
| 5 new-task-board-page | 8 | task-board.mpx | 8 | 原子 CSS、完整 token、alpha、页面参数解码、筛选与任务状态、页面 JSON |

前三个适配 case 均合并为一个 SFC，不要求分别改造原来的两个文件。依赖只保留在 input 并由 runner 复制到 outputs。保留后三个新建 case，是为了分别验证选项式组件、组合式组件和原子 CSS 页面，避免将不同 API/样式范式当作重复业务删除。

## 去重规则与旧断言去向

`evals.json` 的 `assertions[].checks` 引用 iteration-17 原始检查 ID。同一条断言包含的子检查全部通过才计 1 分；每个子检查最多出现在一条计分断言中。61 条断言复用 86 个不同的底层检查，另移除 24 个重复检查。

| 不再独立执行的旧检查 | 新计分位置 | 原因 |
| --- | --- | --- |
| s3、u12 | case 3 n11；case 2 g8 | 普通 CSS 按压态只计一次；透明点击目标单独保留 |
| s13 | case 0 s0 | 与 s5 是完全相同的相邻兄弟选择器检查 |
| t7、n9、u10 的选择器部分 | case 0 s0 | 选择器适配集中检查 |
| j5、j8、n5、u6、a6 | case 1 t1 | 模板传参与脚本读取属于同一链路，合并 t1+t6 |
| n6、u7 | case 1 t0 | 普通动态类绑定只计一次；原子类完整 token 的 a7 继续单列 |
| n7、u8、a8 的表达式部分 | case 1 t2 | Mustache 不调用普通方法只计一次 |
| g6 | case 0 l5 中的 l7 | 简单选择器规则集中到节点查询 case；relativeTo 素材仍保留 |
| c0 | case 0 s9 中的 s10 | 与跨平台空规则检查重复，错误条件编译素材移入 case 0 |
| c10 | case 5 a2 | decodedQuery 统一由页面初始化场景检查 |
| u9、a8 的文字部分 | case 3 n8 | 显式 text 包裹集中到评分组件 |
| u10 的普通 CSS 部分、u11 | case 3 n10 | 语义化 class、显式横向 Flex 与支持的 CSS 合并检查 |
| n12、u13 | case 5 a14 | 不直接调用宿主 API、不添加无必要平台分支只计一次 |
| a1 | case 4 u0/u3/u4；case 5 a2 | 宏、ref/computed 和 onLoad 已有对应检查 |

三种 margin 断言 l10/l11/l12 分别检查兄弟折叠、父子折叠和 Flex 不折叠，保持独立。Hover 分支 t9 与 CSS 变量分支 g10 保持独立。普通 setup 属性解构 c6 与 defineProps 属性解构 u2 保持独立。原子类与普通 class 的约束也分别计分。

断言减少意味着通用规则不再对每份输出重复计分，原业务需求仍保留。新总分不能直接与历史 110 分口径比较，也不能将旧 outputs 重新计分冒充本轮结果。

## 执行与维护

在本目录执行：

```bash
# 准备调度与依赖，不启动模型
python3 run_evals.py --model gpt-6.1-sol --reasoning-effort high --groups mpx mpx2rn > dispatches.json

# 用户要求开始执行后再运行
python3 run_evals.py --execute --model gpt-6.1-sol --reasoning-effort high --groups mpx mpx2rn --max-workers 3
python3 grade.py
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py' -v
```

可用 `--evals 0 1`、`--groups mpx mpx2rn` 筛选。省略 `--execute` 只生成调度信息并复制依赖，不启动模型。沿用 iteration-17 的独立 Codex 进程与固定工作目录 `.agents/skills/mpx2rn-workspace`，不继承父会话上下文。模型与思考强度按本次用户指定值显式传入（覆盖旧运行器帮助中必须与父会话一致的约定）。两组使用相同输入与 wx/ios 目标，仅允许按需读取各自 Skill，禁止读取另一组 Skill、评分规则与输出；这是提示词隔离，不是文件系统读权限隔离。评分组从本轮配置读取。

运行和评分入口直接复用 `../iteration-17/run_evals.py` 与 `../iteration-17/grade.py`，避免复制一套调度器和 1600 多行检查逻辑。因此需要保留 iteration-17，修改旧检查也应运行两个版本的测试。case 名称、输出文件、断言与子检查映射以本轮 `evals.json` 为准；修改 prompt/断言时同步对应的 `eval_metadata.json`。

本轮要求非空模板和脚本，并检查触底处理器确实绑定在目标端的 scroll-view 上。共享评分器已修正本轮发现的等价写法误判、RN 生命周期可达性和透明度样式覆盖判定；允许暂时隐藏后恢复显示，不因动态分支为 0 就扣分；它仍是静态检查，不是完整 JS/CSS 语义执行器，也不等同于真机功能验证。

## 本地验证

- 评分器修复后：iteration-17 的 61 项评分测试及 iteration-18 的 7 项测试通过；包含 122 项真实输出判定与独立复核结果的对照。
- 5 个输入 SFC 的脚本通过 ESLint（使用 html 插件并声明 `.mpx` 扩展）。
- RN 模板与样式相关 Jest：关闭 Watchman 后，2 个套件、98 项测试通过；现有配置有 `testTimeout` 未识别警告。
- Codex CLI 0.162.0 已安装且已登录；本地 CLI service 2.2.30、webpack-plugin/core/api-proxy 2.11.1 可解析，两组编译校验脚本存在，无需安装依赖。
- 12 个模型任务已完成；原始输出、模型日志、指标和评分均已保存。执行状态见 `execution-results.json`，逐用例评分见 `grading-summary.json`。
- 本轮每用例每组仅运行 1 次；已修复脚本判定逻辑并自动重评分，61 条断言的功能要求与原始输出未修改。构建与 UnoCSS 验证限制详见 [对比报告](benchmark.md)。

评分器回归测试（不启动模型）：

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s ../iteration-17 -p 'test*grade.py'
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py'
```
