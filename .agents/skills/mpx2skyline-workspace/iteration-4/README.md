# 当前测试集 v4

4个case／37条断言，已完成独立Skill/no_skill各一轮。原case 4合并到1并统一为orders.mpx页面输入，原case 3合并到2并统一为user-list.mpx组件输入（保留外部row.wxml和logo.svg）；新case 3为仅提供需求的任务看板页面创建。

旧轮次产物与评分已不在当前目录，没有可复用的历史基线。新版外层input只保留一份，不复制Skill，执行产物位于各配置outputs/，评分与证据位于run-1/。定义详见evals.json，迁移关系见assertion-migration.json。

从Mpx仓库根目录执行定义校验：

```sh
node node_modules/jest/bin/jest.js --config '{"rootDir":"./.agents/skills/mpx2skyline-workspace/iteration-4","testMatch":["**/validate-suite.test.cjs"],"testEnvironment":"node","transform":{}}' --runInBand --watchman=false
```

[基线结果](benchmark.md) · [逐项审阅](review.html)
