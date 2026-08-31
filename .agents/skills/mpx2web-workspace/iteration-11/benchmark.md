# Mpx2Web iteration-11 reliability benchmark

- 生成模型：gpt-5.6-sol (high)
- 独立评分模型：gpt-5.5 (high)
- 重复采样：每个配置 3 次
- 每次覆盖：13 个 eval、100 条断言、全部声明产物构建检查

## 结论

| 配置 | 平均分 | 标准差 | 最低–最高 | 完成运行 | 构建覆盖 | 构建通过 | 波动断言 | 测量可靠 | 全能力可靠通过 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Mpx2Web 1.9 | 87.7% | 4.5% | 83.0%–92.0% | 39/39 | 39/39 | 39/39 | 18 | 是 | 否 |
| Mpx2Web 1.8 | 89.3% | 0.6% | 89.0%–90.0% | 39/39 | 39/39 | 39/39 | 12 | 是 | 否 |
| No Skill | 62.7% | 0.6% | 62.0%–63.0% | 39/39 | 39/39 | 39/39 | 22 | 是 | 否 |

Mpx2Web 1.9 相对 1.8 的平均分差：-1.7 个百分点；相对 No Skill：+25.0 个百分点。

## 效率

| 配置 | Tokens/eval | Seconds/eval | Output lines/eval |
| --- | ---: | ---: | ---: |
| Mpx2Web 1.9 | 598910 | 428.7 | 299 |
| Mpx2Web 1.8 | 1014956 | 479.1 | 309 |
| No Skill | 233976 | 341.1 | 344 |

- 1.9 vs 1.8：token 0.59×，耗时 0.89×，输出行数 0.97×，效率回退=否。
- 1.9 vs No Skill：token 2.56×，耗时 1.26×，输出行数 0.87×，效率回退=否。

“测量可靠”要求检查器回归测试通过、生成与评分模型独立、至少三次完整采样且全部构建已执行；“全能力可靠通过”还要求每条断言每次均通过且没有候选代码编译失败。

## 不稳定与稳定失败

- Mpx2Web 1.9：稳定通过 78；稳定失败 4；波动 18。
- Mpx2Web 1.8：稳定通过 82；稳定失败 6；波动 12。
- No Skill：稳定通过 51；稳定失败 27；波动 22。

## 统计口径

顶层平均分与标准差按三次完整样本计算；每次样本先汇总 13 个 eval、100 条断言。各 eval 的难度差异只在逐 run 明细中展示，不再混入重复采样波动。

## 分析备注

- Across all three samples, 46 assertions always pass with both Mpx2Web 1.9 and No Skill, so they validate shared task capability but do not differentiate Skill value.
- 15 assertions always pass with Mpx2Web 1.9 and never pass with No Skill; these are the clearest stable Skill gains.
- 35 assertions have variable or mixed outcomes across the two configurations; aggregate score alone should not be treated as per-capability stability.
- Mpx2Web 1.9 has 18 unstable assertions and 4 stable failures (eval-7:n0, eval-7:n3, eval-11:c0, eval-12:t4).
- No assertion always passes with No Skill while never passing with Mpx2Web 1.9 (0 observed).
