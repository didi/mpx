# 当前测试集 v7

4个case、38条断言：适配31、创建7，分别计分。状态：定义已同步，模型用例尚未执行。

[定义](evals.json) · [评分](grading-standard.md) · [通用契约](common-validation.json) · [创建契约](creation-validation.json) · [断言迁移](assertion-migration.json)

保留v5四个综合场景及业务输入代码，修正旧引用、媒体查询隔离、动态绑定和Mpx内联容器判定。输入代码中的不兼容写法为待修复fixture，不能按最终产物规范提前清理。

执行模板仅用于适配与创建任务。各配置共享只读输入，仅写自己的输出目录。merged_skill路径须执行前指定。


定义校验：从仓库根目录运行 `node_modules/.bin/jest --config .agents/skills/mpx2skyline-workspace/iteration-7/jest.config.json --runInBand`。这仅验证定义一致性，不执行模型评测。
