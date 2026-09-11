# Mpx2Skyline 测试集

v3：5个case、31条断言，Skill/no_skill各执行一轮。

| 配置 | 通过 | 通过率 |
| --- | ---: | ---: |
| mpx2skyline | 30/31 | 96.77% |
| no_skill | 17/31 | 54.84% |

Skill唯一失败项s0_04存在输入与断言观察点歧义，详见报告。未执行完整应用构建和真机验证；Token/精确耗时不可用。合并Skill尚未执行。

[本轮报告](iteration-3/benchmark.md) · [逐条评分](iteration-3/benchmark.json) · [产物评审](iteration-3/review.html) · [测试设计](test-design.md)

输入修订状态：case 0 输入已明确为子盒顶部距outer外沿20px、内部内容顶部距外沿30px；当前两组case 0结果仍来自修改前输入，待同时重跑。历史评分保持不变。
