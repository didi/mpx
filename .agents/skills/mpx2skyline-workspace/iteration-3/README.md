# 当前测试集：v3

5个case，31条Skyline正向适配断言，已完成Skill/no_skill各一轮。详情见上级test-design.md。

- evals.json：任务、输入、断言、规则来源、验证方法。
- assertion-migration.json：旧90条断言逐项归并/退出专项计分说明。
- grading-standard.md：评分范围与历史基线边界。
- prompt_templates.json：独立Skill/合并Skill共用模板。
- validate-suite.test.cjs：定义一致性、输入语法和规则来源检查。

input每个case只保留一份；Skill共享读取中央路径，执行记录保存版本/哈希。开始执行时创建配置下outputs/和run-1/，本轮实际结果见各配置outputs/和run-1/。

从Mpx仓库根目录运行验证：

```sh
node node_modules/jest/bin/jest.js --config '{"rootDir":"./.agents/skills/mpx2skyline-workspace/iteration-3","testMatch":["**/validate-suite.test.cjs"],"testEnvironment":"node","transform":{}}' --runInBand --watchman=false
```

[本轮结果](benchmark.md) · [产物评审](review.html)。精确Token/耗时不可用，详见run-metadata.json。

输入修订状态：case 0 输入已明确为子盒顶部距outer外沿20px、内部内容顶部距外沿30px；当前两组case 0结果仍来自修改前输入，待同时重跑。历史评分保持不变。
