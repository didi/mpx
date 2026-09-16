# 当前测试集 v4

4个case／37条断言，未执行。原case 4合并到1，原case 3合并到2；新case 3为仅提供需求的任务看板页面创建。

原始产物与评分保留在iteration-3。新版外层input只保留一份，不复制Skill，不预建执行目录。定义详见evals.json，迁移关系见assertion-migration.json。

从Mpx仓库根目录执行定义校验：

```sh
node node_modules/jest/bin/jest.js --config '{"rootDir":"./.agents/skills/mpx2skyline-workspace/iteration-4","testMatch":["**/validate-suite.test.cjs"],"testEnvironment":"node","transform":{}}' --runInBand --watchman=false
```
