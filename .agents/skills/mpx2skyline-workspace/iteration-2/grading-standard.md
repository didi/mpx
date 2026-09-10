# Mpx2Skyline Benchmark 评测标准

## 对齐依据与范围

参考 `mpx2rn-workspace/iteration-17` 的文件式输入、9项任务分层、带ID断言、分组提示模板及逐轮结果布局。主指标沿用 RN workspace 汇总的加权通过率，而不是单个 eval 通过率的平均值。

以下为原测试集标准；当前目录为跨轮最新结果汇总。9项任务各10条断言，共90条。配置为 `mpx2skyline` 与 `no_skill`，每项每组先运行1次，共18次；如评估稳定性，同配置重复3次，共54次。没有 Skyline 精简版，不虚设第三组。运行模型与思考强度由实际父会话显式传入，不继承 RN 历史模型结论。

主集评估完整文件交付。能力查询、只审不改、范围缺失、字体确认、Worklet回源、触发边界继续使用 `mpx2skyline/evals/` 扩展集，分开汇总，不混入90条主集分母。

## 测试集与评分证据

每项逐条标准以 `evals.json` 的 assertions 为唯一事实源；`eval_metadata.json` 是同内容副本，执行前需校验一致。下面列出评分时必须观察的语义和最小验证动作。

| Eval | 输入/产物 | 评分重点与检查方法 |
| --- | --- | --- |
| 0 style-adaptation | product-card.mpx | 追踪文本属性与截断样式；分别代入renderer两值、屏宽320/321，检查最终padding；确认圆点、活动颜色、等宽两列未丢失 |
| 1 page-scroll-adaptation | orders.mpx + app.json + service.js | 追踪刷新成功/失败、分页追加和scrollTop事件路径；校验页面与app配置层级；确认导航实际存在、列表直接子节点和滚动高度 |
| 2 runtime-template-adaptation | user-list.mpx + row.wxml | 代入初始值、items=null、合法数组；检查String/Object两类payload；将select目标与同一scroll-view的enhanced关联；追踪模板item/index |
| 3 mixed-text-animation | promo-card.mpx + logo.svg | 检查span混排与两端省略；确认圆点是真实动画节点；追踪按下、松开、取消三条路径与动画数值；资源路径仍有效 |
| 4 nested-sticky-layer | category-panel.mpx | 检查外层nested、内层type/关联、横向布局；分别审查两端吸顶结构；分析弹层与按钮实际fixed比较关系，不能只比较数字 |
| 5 style-boundary-layout | data-panel.mpx | 计算20px外沿、120px盒宽、16px间距；解析函数括号外逗号；验证双阴影/滤镜两种效果均保留；字体只报告、不得改视觉 |
| 6 new-rating-component | rating-selector.mpx | 初始value=2/max=5，点第4颗；readonly时点第1颗；父value改3；检查状态与事件detail、max改变后的列表以及取消恢复 |
| 7 new-segmented-control | segmented-control.mpx | 父value变化、整体/单项禁用、候选变化和超长标签；检查computed/ref/watch与模板暴露；确认横向滚动结构和最小宽度 |
| 8 new-task-board-page | pages/task-board.mpx + app.json + utilities.css | 切换三类筛选、完成状态、刷新、连续触底；检查id唯一、空态、导航/全局配置；核对实际使用的原子类均有来源 |

输入中的不兼容代码是测试刺激，不是期望答案。不要先修输入或将RN断言直接移植到Skyline。例如：Skyline静态before/after可以保留；不要求给节点添加RN enable-*；微信两种renderer不能用wx/ios编译分支区分。

字体二进制由宿主提供，是eval-5明确的测试前提，不计为执行器漏交依赖。其他提供的资源和相对脚本依赖需保留。输入 app.json 是配置片段载体，并非完整可构建工程；没有真实首页源码不构成产物缺陷。

## 二元断言评分

每条断言权重相同，满足所有必要条件记1，否则记0。允许语义等价实现，不强求类名、变量名、排版或字符串完全一致。不能只扫描关键词：注释中的正确代码、不执行的分支、其他容器上的属性都不算满足。

每条评分记录必须包含原ID、原文本、布尔结果和可定位证据。失败写出输入反例或缺失条件。即使一个缺陷关联多条断言，也按冻结的定义逐条评分，不在看过结果后调整权重。

```json
{
  "expectations": [
    {
      "id": "e0_00",
      "text": "与evals.json一致的原文",
      "passed": false,
      "evidence": "outputs/product-card.mpx:具体行，缺少title默认值"
    }
  ],
  "summary": {"passed": 0, "failed": 1, "total": 1, "pass_rate": 0}
}
```

上例仅演示字段；实际每个 grading.json 必须含该eval的全部10条。

- 加权通过率：本组通过断言数 / 90；R次重复使用总通过数 / (90×R)。显示整数分子分母及百分比。
- 完整case通过率：10条全通过的case数 / 9，作为辅助指标。
- 两组差值：Skyline组加权通过率减no_skill，通过百分点pp报告。
- 发生产物缺失，所有依赖该产物的断言失败；不能因没有文件就排除case。其他已完成产物仍按事实评分。
- 模型主动停在方案、遗漏文件、错误实现属于任务失败。明确的工具基础设施错误记录 infrastructure_blocked，保留日志并重跑；未补齐前只报部分结果（实际有效分母/缺失数），不能与完整90分结果直接比较。

## 正确性、流程与验证分开

90条断言只评价产物与指定解释，不因读取Skill而加分。以下在 `validation.json` 独立记录，不混入断言分母：

- Skill组是否按需求读取reference、在完成时执行完整scope审计；以轨迹为证。no_skill此项为not_applicable。
- 是否执行编译检查、命令/退出码/产物，状态为passed/failed/not_run；编译失败不能被文字声明覆盖。
- 是否执行开发者工具和真机双渲染验证；注明设备/基础库版本、步骤和结果。未执行为not_run，不推断通过。
- 是否存在未经验证却声称“已真机通过”、擅改字体或明显WebView回归等严重问题，记录证据。

主分数与严重问题并列报告。建议验收条件为90/90、无严重问题；生产可用结论还需相关编译与两端行为验证。若只做静态benchmark，明确说明其限制。

为保证两组公平，调度器不替某组补改产物或偷偷执行额外验证。执行器自行选择的验证记录为成本与流程结果；若另做统一编译评估，对两组使用同一外部检查环境，单独标记为评分器验证。原RN grade.py含平台和case专属逻辑，不能直接作为本集评分器。

## 执行与隔离

1. 固定source-snapshot.json对应Skill版本、测试输入、模型、思考强度、工具权限、超时与最大预算。若哈希变化先生成新轮次，不悄悄替换本轮标准。
2. 每个case每组每次运行使用干净会话。只提供prompt、input及本组允许的Skill文档，不提供assertions、metadata、评分文件、其他组或历史产物。`files` 相对各 `eval-{id}-{name}` 目录。
3. no_skill不继承本仓库AGENTS或父会话的Skill全文。输入统一只读引用 eval-*/input/，不在执行目录复制；提示中的禁止读取不能替代真正的访问隔离。若环境无法保证，标记baseline_contaminated，不据此报告Skill增益。
4. 两组共享相同task.md、输入和交付要求，只有Skill可用性不同。prompt_templates.json是渲染模板，不是可执行调度脚本。
5. 准备每次outputs时保留依赖相对路径，禁止改input。case-8产物保留pages/层级。将实际修改产物和report.md放到本次outputs。
6. 保存agent.jsonl、stderr、run.json、timing.json、metrics.json；结束后评分并生成benchmark报告。评分器不向执行器泄漏断言答案。

建议目录：

```text
eval-0-style-adaptation/
  input/
  eval_metadata.json
  mpx2skyline/
    outputs/
    run-1/
      agent.jsonl
      run.json
      timing.json
      metrics.json
      grading.json
      validation.json
  no_skill/
    outputs/
    run-1/...
```

## 成本与报告口径

- 平均耗时：本组9次执行的wall-clock均值，同时列最短/最长；评分耗时单独统计。
- Total Token：每次执行会话累计非缓存输入+缓存输入+输出，不是峰值Context。若工具input_tokens已包含cached_input_tokens，不重复相加；保存原始usage字段与归一化说明。
- 同时列平均Total Token及9次累计值，缺失写“—”，不得用输出长度或上下文窗口大小估算。
- 每组每项仅1次只能描述本次结果。3次重复时报告每次整体通过率、均值及标准差，区分case间差异与重复采样波动。
- benchmark.md列组间总分、成本、逐eval得分、失败断言ID及证据、验证结果与未覆盖项。跨轮报告必须注明测试集哈希、模型和环境变化。

当前结果与来源见 benchmark.json、run-metadata.json；评分标准保持原定义。

## 归档路径约定

每个 case 只保留外层 input/；产物在配置目录 outputs/，run-1/ 保存评分、执行记录、耗时、Token 及验证证据。Skill 统一读取仓库 .agents/skills/mpx2skyline/，不保存副本；source-snapshot.json 按实际执行版本记录文件哈希。历史日志中的临时路径保留原文，不作为当前可执行路径。
