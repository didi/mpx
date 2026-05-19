# Event Registry

> 不可变的 Gene 演化日志。每个 Event 记录一次 Gene 变更，保持可审计和可追溯。

## Event 文件模板

```markdown
<!-- GEP Event Object -->
<!-- type: Event -->
<!-- schema_version: 1.0.0 -->
<!-- id: evt_xxx -->
<!-- created: YYYY-MM-DD -->

## 事件类型
<!-- repair / innovation / validation_pass / validation_fail / solidify -->

## 触发信号
<!-- 什么失败/反馈触发了本次演化 -->

## 变更目标
<!-- 源 gene_id → 修改后的 gene_id -->

## 变更意图
<!-- 为什么要做这个修改 -->

## 变更 Diff
<!-- 具体修改了哪些 Strategy / AVOID 项 -->

## 验证结果
<!-- 修改后的编译校验 / 测试结果 -->
```

## 已注册 Event

| event_id | 类型 | 目标 Gene | 触发信号 | 日期 | 文件 |
|----------|------|----------|---------|------|------|
<!-- 待记录 -->
