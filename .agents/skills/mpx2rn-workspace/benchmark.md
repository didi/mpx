# Mpx2RN Skill Benchmark 汇总（iteration-13～17）

## 测试口径

- 每轮包含 9 个 eval、每个配置各运行 1 次，共 27 次运行；每组共检查 110 条断言。
- 通过率统一采用“通过断言数 / 110”的加权通过率，避免与各轮报告中的“逐 eval 平均通过率”混用。
- 耗时为每组 9 次运行的平均 wall-clock 时间；Token 为每次运行的平均 Total Token，并附 9 次累计值。Total Token 包含非缓存输入、缓存读取输入和输出，不代表峰值 Context。
- iteration-13 未采集耗时和 Token，表中以“—”标记；详细范围、逐 eval 得分和失败断言见各轮原始报告。

## 核心结果

| 迭代 | 测试模型 | 配置 | 通过率 | 平均耗时 | 平均 Total Token | 9 次累计 Token |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| [13](iteration-13/benchmark.md) | gpt-5.6-sol (high) | mpx2rn | 110/110（100.00%） | — | — | — |
| [13](iteration-13/benchmark.md) | gpt-5.6-sol (high) | mpx2rn-simple | 105/110（95.45%） | — | — | — |
| [13](iteration-13/benchmark.md) | gpt-5.6-sol (high) | no_skill | 64/110（58.18%） | — | — | — |
| [14](iteration-14/benchmark.md) | gpt-5.6-luna (medium) | mpx2rn | 100/110（90.91%） | 198.7s | 799,979 | 7,199,814 |
| [14](iteration-14/benchmark.md) | gpt-5.6-luna (medium) | mpx2rn-simple | 97/110（88.18%） | 219.3s | 1,105,952 | 9,953,567 |
| [14](iteration-14/benchmark.md) | gpt-5.6-luna (medium) | no_skill | 55/110（50.00%） | 122.8s | 229,299 | 2,063,695 |
| [15](iteration-15/benchmark.md) | gpt-5.6-terra (medium) | mpx2rn | 102/110（92.73%） | 159.07s | 608,669 | 5,478,018 |
| [15](iteration-15/benchmark.md) | gpt-5.6-terra (medium) | mpx2rn-simple | 97/110（88.18%） | 167.87s | 775,370 | 6,978,326 |
| [15](iteration-15/benchmark.md) | gpt-5.6-terra (medium) | no_skill | 35/110（31.82%） | 115.73s | 273,903 | 2,465,129 |
| [16](iteration-16/benchmark.md) | gpt-5.6-sol (high) | mpx2rn | 105/110（95.45%） | 268.2s | 1,495,770 | 13,461,926 |
| [16](iteration-16/benchmark.md) | gpt-5.6-sol (high) | mpx2rn-simple | 107/110（97.27%） | 224.5s | 1,106,915 | 9,962,239 |
| [16](iteration-16/benchmark.md) | gpt-5.6-sol (high) | no_skill | 64/110（58.18%） | 190.2s | 816,915 | 7,352,239 |
| [17](iteration-17/benchmark.md) | gpt-5.6-sol (high) | mpx2rn | 108/110（98.18%） | 244.5s | 892,183 | 8,029,643 |
| [17](iteration-17/benchmark.md) | gpt-5.6-sol (high) | mpx2rn-simple | 106/110（96.36%） | 227.5s | 940,551 | 8,464,962 |
| [17](iteration-17/benchmark.md) | gpt-5.6-sol (high) | no_skill | 59/110（53.64%） | 190.1s | 228,529 | 2,056,758 |

## 重点结论

- **Skill 带来的准确率增益稳定且显著。** 5 轮加权通过率均值为：mpx2rn 95.45%、mpx2rn-simple 93.45%、no_skill 50.36%；相对 no_skill，两个 Skill 分别提升 45.09pp 和 43.09pp。
- **完整版准确率整体略优，但优势不绝对。** mpx2rn 在 iteration-13、14、15、17 领先，mpx2rn-simple 在 iteration-16 领先；5 轮平均差距为 2.00pp。iteration-17 中两者分别达到 98.18% 和 96.36%。
- **Skill 会增加执行成本。** 在采集资源指标的 iteration-14～17 中，mpx2rn、mpx2rn-simple、no_skill 的平均耗时分别为 217.6s、209.9s、154.7s，前两者相对 no_skill 分别增加约 40.7% 和 35.7%。
- **Token 增幅大于耗时增幅。** iteration-14～17 的单次平均 Total Token 分别为 949,150、982,197、387,162；两个 Skill 相对 no_skill 分别增加约 145.2% 和 153.7%。完整版平均比精简版多用 7.7s，但少消耗约 33,047 Token。
- **模型与单次运行波动明显。** no_skill 通过率在 31.82%～58.18% 间波动，Skill 组的耗时和 Token 也跨轮变化较大。当前每个 eval 每种配置仅运行 1 次，因此结果适合判断方向，不宜视为稳定的统计显著性结论。
- **同模型结果仍有轮次差异。** gpt-5.6-sol (high) 下，iteration-16 是精简版准确率更高且资源更省，iteration-17 则完整版准确率更高、Token 更少但耗时更长，尚不能据此认定某一版本在效率上稳定占优。

## 分轮摘要

- **iteration-13 / gpt-5.6-sol (high)：** 完整版达到 100%，精简版为 95.45%，均明显高于 no_skill 的 58.18%；本轮没有耗时和 Token 数据。
- **iteration-14 / gpt-5.6-luna (medium)：** 完整版以 90.91% 小幅领先精简版的 88.18%，同时耗时少 20.6s、平均少消耗约 30.6 万 Token。
- **iteration-15 / gpt-5.6-terra (medium)：** 完整版以 92.73% 领先精简版的 88.18%，同时耗时少 8.8s、平均少消耗约 16.7 万 Token；no_skill 仅为 31.82%，是五轮最低值。
- **iteration-16 / gpt-5.6-sol (high)：** 精简版以 97.27% 反超完整版的 95.45%，并平均少用 43.7s、少消耗约 38.9 万 Token，是精简版优势最明确的一轮。
- **iteration-17 / gpt-5.6-sol (high)：** 完整版以 98.18% 领先精简版的 96.36%，平均少消耗约 4.8 万 Token但多用 17.0s；18 次 Skill 运行中有 16 次最终编译验证通过，两次失败均出现在 eval-6。
