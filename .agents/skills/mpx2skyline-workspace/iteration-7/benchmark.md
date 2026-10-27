# Skill Benchmark: mpx / mpx2skyline

**Model**: gpt-6.1-sol
**Date**: 2026-10-27T11:49:17Z
**Evals**: 0, 1, 2, 3 (1 runs each per configuration)

## Summary

| Metric | Mpx | Mpx2Skyline | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 92% ± 6% | 93% ± 8% | -0.02 |
| Time | 399.1s ± 160.2s | 531.1s ± 225.8s | -131.9s |
| Tokens | 1630346 ± 614520 | 2359368 ± 1644208 | -729022 |

## Notes

- 每 case 每组运行一次；Pass Rate 是 case 均值，专项总分见适配/创建分项。
- 40 条能力断言由实际产物与 verification 语义核验；通用契约另存 validation.json。
- Delta 为 mpx 减 mpx2skyline；编译和静态证据不等于真机验证。

## 专项分数

| 组 | 适配 | 创建 |
| --- | --- | --- |
| mpx | 31/33 | 6/7 |
| mpx2skyline | 32/33 | 6/7 |


## 逐用例结果

| Case | mpx | mpx2skyline |
| --- | ---: | ---: |
| 0 style-layout | 13/14 | 14/14 |
| 1 page-scroll-sticky-layer-config | 11/11 | 11/11 |
| 2 template-runtime-inline-animation | 7/8 | 7/8 |
| 3 new-task-board-page | 6/7 | 6/7 |
| 合计 | 37/40 | 38/40 |

## 执行资源

累计任务耗时可重叠，不是整个评测的墙钟时间；Token包含缓存输入。

| 组 | 累计任务耗时 | 总Token | 其中缓存输入Token |
| --- | ---: | ---: | ---: |
| mpx | 26.61 min | 6,521,384 | 6,036,096 |
| mpx2skyline | 35.40 min | 9,437,474 | 8,996,608 |

## 评分解释与边界

- 8/8 个正式任务通过同一 RN 执行器的独立 codex exec 完成，gpt-6.1-sol / high，最多并发3；命令、依赖和版本一致性见 execution-protocol-audit.json。
- 按原40条断言：mpx 37/40，mpx2skyline 38/40。评分为Agent语义核验，grade.py只校验和汇总，不能称为纯脚本自动评分。
- case0 s0_12：mpx 双层Flex后卡片顶为64rpx，原WebView block折叠基线为92rpx，多回拉28rpx；mpx2skyline增加28rpx补偿。此项是可由原始及产物盒模型推导的业务差异。
- case2 两组 s2_05 均未满足固定断言的图片inline-block条件，也未提供默认等价证据；两组实际编译span及事件链通过。Skill对基础span/image组合并不要求机械套用复杂混排样式，因此该扣分不能直接解读为已证实的视觉故障。
- case3 两组 n3_06：源码initData.safeOptions虽编译保留，但真实bundle的原生Component注册初始data缺失，WXML循环也无fallback；setup后的mock通过不能证明首帧。VM没有复现真实宿主时序或真机错误，按既定首帧安全要求证据不足判失败。
- case0两组真实wx编译均因fixture约定由宿主提供的city.woff2缺失而失败，静态能力评分与宿主依赖缺失分别列示；case1/2/3的真实wx局部编译通过。均无开发者工具/真机实测，不等同于完整宿主发布验收。
- 每case每组仅1次；报告Pass Rate为case通过率均值，40分总分为按断言汇总，两者分母不同。
- Token采用与RN相同的Codex原始usage口径，包含缓存输入；评分Agent的消耗不计入。不能将总Token直接当作实际付费成本。

[逐项证据与评分复核](score-audit.md) · [执行协议审计](execution-protocol-audit.json) · [查看产物](review.html)
