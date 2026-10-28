# Skill Benchmark: mpx / mpx2skyline

**Model**: gpt-6.1-sol
**Date**: 2026-10-27T17:06:50Z
**Evals**: 0, 1, 2, 3 (1 runs each per configuration)

## Summary

| Metric | Mpx | Mpx2Skyline | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 97% ± 6% | 97% ± 6% | +0.00 |
| Time | 489.3s ± 154.7s | 514.9s ± 238.6s | -25.6s |
| Tokens | 1449696 ± 830864 | 1376027 ± 492708 | +73670 |

## Notes

- 每 case 每组运行一次；Pass Rate 是 case 均值，专项总分见适配/创建分项。
- 40 条能力断言由实际产物与 verification 语义核验；通用契约另存 validation.json。
- Delta 为 mpx 减 mpx2skyline；编译和静态证据不等于真机验证。

## 专项分数

| 组 | 适配 | 创建 |
| --- | --- | --- |
| mpx | 32/33 | 7/7 |
| mpx2skyline | 32/33 | 7/7 |


## 逐用例结果

| Case | mpx | mpx2skyline |
| --- | ---: | ---: |
| 0 style-layout | 14/14 | 14/14 |
| 1 page-scroll-sticky-layer-config | 11/11 | 11/11 |
| 2 template-runtime-inline-animation | 7/8 | 7/8 |
| 3 new-task-board-page | 7/7 | 7/7 |
| 合计 | 39/40 | 39/40 |

## 与上一轮比较

| 组 | iteration-7 | iteration-8 | 分差 |
| --- | ---: | ---: | ---: |
| mpx | 37/40 | 39/40 | +2 |
| mpx2skyline | 38/40 | 39/40 | +1 |

## 执行资源

| 组 | 累计任务耗时 | 总Token | 其中缓存输入 |
| --- | ---: | ---: | ---: |
| mpx | 32.62 min | 5,798,786 | 5,439,232 |
| mpx2skyline | 34.33 min | 5,504,107 | 5,179,264 |

## 说明

- 本轮8/8正式任务完成，gpt-6.1-sol high，执行器与RN共用，最多并发3；mpx 39/40，mpx2skyline 39/40。
- 两组均使用执行前冻结的最新Skill快照；所有输入/Skill执行前后哈希一致，隔离core文件亦未改变。
- 本轮修复了共同编译依赖中的initData过滤缺陷。预检真实wx编译并捕获原生Component注册，safeOptions=[]已在attached前存在，initData原字段未透传。该环境修复与Skill更新同时发生，历史分差不能全归因于Skill优化。
- 本轮两组s0_12均通过，均以原WebView折叠基线计算Flex改造后的间距；mpx上一轮的28rpx位置偏差本轮已消除。
- 本轮两组图片inline-block与真实编译span均已正确；case2仍未通过s2_05，原因改为.heading缺少明确横向Flex、width:0标题依赖未确认的宿主defaultDisplayBlock。需要区分本轮新宽度链缺口与上一轮缺失图片样式，未声称真机已观测故障。
- 本轮两组case3实际编译原生Component注册均已包含safeOptions:[]，n3_06通过；该项改善有共同运行时修复的直接贡献。
- 每case每组只有1次。评分是Agent依据实际产物/编译/mock证据的语义判断，grade.py并非RN的自动静态检查器；每条证据见grading.json和grading-audit.md。
- case0仍使用原fixture约定的宿主字体资源；未提供字体二进制引起的编译依赖问题应与静态能力分数分列。开发者工具/真机未执行，静态与mock不能代替宿主视觉、手势或设备验证。
- 原始Token包含缓存输入，未包含评分Agent消耗；累计任务耗时存在并发重叠，不是整轮墙钟时间，也不能以总Token直接推断费用。

[逐项审计](score-audit.md) · [执行审计](execution-protocol-audit.json) · [查看产物](review.html)
