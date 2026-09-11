# 当前测试集：v3

5个case，31条Skyline正向适配断言，尚未执行。详情见上级test-design.md。

- evals.json：任务、输入、断言、规则来源、验证方法。
- assertion-migration.json：旧90条断言逐项归并/退出专项计分说明。
- grading-standard.md：评分范围与历史基线边界。
- prompt_templates.json：独立Skill/合并Skill共用模板。
- validate-suite.test.cjs：定义一致性、输入语法和规则来源检查。

input每个case只保留一份；Skill共享读取中央路径，执行记录保存版本/哈希。开始执行时创建配置下outputs/和run-1/，此时不预建空结果。

从Mpx仓库根目录运行验证：

```sh
node node_modules/jest/bin/jest.js --config '{"rootDir":"./.agents/skills/mpx2skyline-workspace/iteration-3","testMatch":["**/validate-suite.test.cjs"],"testEnvironment":"node","transform":{}}' --runInBand --watchman=false
```
