# 评分与证据

仅对 evals.json 的 assertions 计分，每条 1 分，全部证据子项满足才通过。不同端不拆分加分，eval_metadata 中的镜像不重复统计。先检查断言对应的功能确实存在：空文件、注释承诺、空处理器、删除功能、缺失平台分支都不能因“不含危险写法”而通过。

比较组为 `mpx` 与 `noskill`，各自按同一套 48 条断言独立评分，每组满分 48 分；不合并成一个 96 分成绩。

## 判定顺序

1. 阅读 input/scenario.md、完整输出及本次真实验证记录。对每条断言按 verify 检查，必要时核对 sources 指向的 Skill 参考；接受满足同一行为契约的等价实现，不限定无关变量名或代码格式。
2. 明确每个目标的有效分支与数据流，追踪模板绑定到处理器、产物到运行时。搜索命中只是线索，注释中出现正确 API 不算实现证据。
3. 使用给定数据和 fail_when 反例复验。不允许仅凭“都兼容”“测试通过”的文字声明给分。静态审查可确认配置、语义及路径；键盘、渲染与真机现象需区分静态设计判断和实际运行结果。
4. 若环境缺失导致断言整体无法判定，记录 pending 并保留原因，不能默认为 passed。报告 passed/failed/pending；覆盖率为 (passed+failed)/总数，通过率暂报 passed/总数及 pending 数，不删除未验证项缩小分母。全部判定完成后才输出无 pending 的最终成绩。
5. 记录额外发现但不另加分。相同根因只在能力归属 case 扣分；另一个 case 因同类错误无法检查其独立契约时，记录 blocked_by，而不凭猜测判通过或重复扣同一规则。必要时修复评测环境后重跑，不偷偷修改被测产物。

## 记录格式

设计阶段不预先创建这些文件。真实执行后，每次运行在 `run-N/` 下保存输出、原始日志、真实 timing 和评分记录。中间审查可使用：

```json
{
  "assertion_id": "scroll.refresh-entry",
  "status": "pending",
  "evidence": [],
  "unverified": ["缺少支付宝真机，尚不能验证实际刷新入口"],
  "blocked_by": []
}
```

证据使用真实文件与行号、构建产物或测试日志位置；必要时逐端记录。完全判定后输出兼容 skill-creator 的 grading.json：expectations 每项有 text、passed、evidence，并额外保留 assertion_id；summary 包含 passed、failed、total、pass_rate。只有 completed 的结果才能进入最终 benchmark；pending 另存 review-status.json，不能偷偷转换为 false/true 后宣称全部运行完成。

## 去重边界

- 所有 ID 与 capability 在整个 evals.json 全局唯一；同一断言的跨端分支只能作为共同证据。
- 常规 SFC 结构、语法、import、动态类/样式、框架入口及 lint/build 不反复计分。若其错误直接破坏被测能力，按该能力的具体行为判定，并写出原因。
- 不把“发现问题”“删除错误写法”“添加正确替代”“保留原端”拆成多条分数；它们共同证明同一兼容契约。例：文本省略只有一条，包含支付宝省略效果、Skyline 属性、RN 行数和 Web CSS。支付宝完整 App 构建已有默认 white-space 继承时，父容器承担截断与直接约束 text 均可，不按样式所在节点强制扣分。
- 不合并独立可失败的契约：首屏状态隔离、等待预取、hydration 缓存分别可单独出错；不能以一个笼统“SSR 正常”吞掉这些证据。
- 相同 capability 改写文字后迁入新 case 仍属重复。新增前比较修复原因和可证伪输入，不仅比较字符串。

## 验证层次

静态设计、完整工程构建和宿主行为分别记录。可给出明确标记的“静态设计评分”，但不能称为运行通过率。Skyline 单 wx 构建不证明两种 renderer 均正确；支付宝单文件编译不证明滚动条/隔离生效；RN 编译不证明原生桥接存在；Web 客户端编译不证明 SSR 并发隔离和 hydration 正确。

自动入口使用 `run-1/assessment.json` 的 `expectations` 数组，每项沿用断言 `id`，填写 `status: passed/failed/pending`、字符串数组 `evidence`，并保留 `unverified` 与 `blocked_by`。调用 `grade.py --prepare` 可在实际运行完成后生成模板；未运行的任务不能准备评分或进入汇总。
