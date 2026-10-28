# Mpx2Ali Skill 评测工作区

参考 [mpx2rn-workspace](../mpx2rn-workspace/iteration-18/README.md) 的框架，基于 [mpx2ali](../mpx2ali/SKILL.md) 的支付宝适配知识建立。目录名按本次需求保留为 `mpx2ali-workplace`。

当前状态：**框架与评测输入已准备，尚未运行模型对比**。没有预填通过率、Token 或耗时。第一轮比较 `mpx` 与 `mpx2ali`，使用相同模型、思考强度、输入和 wx / ali 目标；只改变指定 Skill。

本次框架回归与编译冒烟的结果见[交付验证记录](iteration-1/validation.md)。

## 与参考框架的对应

| 层次 | 本工作区 |
| --- | --- |
| 独立宿主 | package.json、mpx.config.js、Babel 与 ESLint 配置；源码方言 wx |
| 迭代配置 | iteration-1/evals.json、prompt_templates.json、每例 eval_metadata.json |
| 用例输入 | eval-N-name/input，2 个存量适配 + 1 个新建页面 |
| 独立执行 | run_evals.py；Codex 独立进程、固定 cwd、显式模型与思考强度 |
| 每组交付 | eval-N-name/{mpx,mpx2ali}/outputs |
| 执行证据 | 每组 run-1/agent.jsonl、stderr.log、dispatch.json、run.json、metrics.json、timing.json、source-snapshot.json |
| 评分与汇总 | assessment.json → grading.json → benchmark.json / benchmark.md / grading-summary.json |
| 人工查看 | 复用 skill-creator 的 generate_review.py 生成 review.html |

RN 的 iteration-18 依赖已从当前工作树删除的 iteration-17 脚本，因此本目录沿用其运行协议，使用 Web 工作区已独立化的运行器实现作为基础；不依赖 RN 历史目录。评分借鉴 Skyline 的证据评审方式，并直接复用 skill-creator 的汇总及查看器。

## 用例覆盖

| ID | 类型 | 主题 | 断言 |
| --- | --- | --- | ---: |
| 0 | 改造 | 文本打点、图片 padding、scoped、布局查询边界 | 4 |
| 1 | 改造 | 输入框属性、首次聚焦、切换、弹层拦截、滚动条 | 5 |
| 2 | 新建页面 | 公共尺寸入口、窗口高度、安全区、更新、导航、固定布局 | 6 |

由 6 个用例、36 条断言合并为 **3 个用例、15 条独立能力断言**；双组共 6 次运行。每个能力只在一个断言中计分，版本核实合入对应能力，不再单独加分。旧断言归属见[合并记录](iteration-1/README.md#合并与去重)。

交付完整、保留业务属性/事件/组件依赖、局部适配和如实记录验证范围，仍是所有任务的共同要求，不再各占一条重复计分断言。参考文档中的 RN 文本裁切案例不纳入支付宝评分。

## 使用

在本目录安装依赖，然后进入 iteration-1。依赖基于 RN 工作区，移除了 React / RN 及其 Babel 插件；本目录不共享或复制其他工作区的 node_modules、锁文件或历史结果。首次安装后保留实际生成的 package-lock.json，后续用 npm ci 复现。

```bash
npm install
npm test
cd iteration-1

# 替换为此次对比实际选择的模型与思考强度，两组保持一致。
# 默认仅准备 dispatch 和辅助依赖，不启动模型，不写结果指标。
python3 run_evals.py --model <model-id> --reasoning-effort <effort> > dispatches.json

# 真正启动 6 个模型任务；--evals 0 1 / --groups mpx 可用于小范围运行。
python3 run_evals.py --execute --model <model-id> --reasoning-effort <effort> --max-workers 3

# 全部运行完成后生成待评审表，每条 passed 初始为 null。
python3 grade.py --prepare
# 评审各组 outputs 和实际产物/日志，填写 run-1/assessment.json 的 passed 与 evidence。
python3 grade.py
python3 ../../skill-creator/eval-viewer/generate_review.py . \
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

先记录实际依赖版本及编译产物，再判断是否具备 navigationStyle、text 默认样式及 show-scrollbar 转换。已安装 npm 包与当前仓库源码可能不同，不能用仓库新代码的测试通过替代安装版本的能力。旧版本允许有证据的局部兼容方案。

键盘事件顺序、设备差异和背景穿透不适合用字符串命中自动判分。评分器只接受显式布尔结论与非空证据；证据应指向输出代码位置、调用链、构建产物或实际日志，接受行为等价写法。未执行、交付缺失、指标缺失、未评审或两组模型不同均阻止正式汇总。主指标为通过断言数 / 15 的加权通过率；各 case 的 4/5/6 条断言数不同，不能与逐 case 平均值混用。单次运行不用于推断统计显著性。

微信/支付宝 × iOS/Android 的交互回归需要真机。没有真机时，`validation.md` 必须列明未验证范围，不将编译通过写成宿主交互通过。
