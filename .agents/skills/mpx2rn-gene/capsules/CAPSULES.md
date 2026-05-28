# Capsule Registry

> 已验证的成功执行路径。每个 Capsule 记录一次完整的 RN 适配任务执行，供同类任务参考。

## Capsule 文件模板

```markdown
<!-- GEP Capsule Object -->
<!-- type: Capsule -->
<!-- schema_version: 1.0.0 -->
<!-- id: capsule_xxx -->
<!-- created: YYYY-MM-DD -->

## 任务签名
<!-- 简要描述任务类型和上下文 -->

## 使用的 Gene 集合
<!-- 列出本次激活的 gene_id -->

## 执行轨迹
<!-- 关键决策点和操作路径 -->

## 验证结果
<!-- 编译校验 / ESLint / 运行时验证结果 -->

## 谱系
<!-- 关联的 Event ID（如因某次 repair 而产生） -->
```

## 已注册 Capsule

| capsule_id | 任务类型 | 使用的 Gene | 创建日期 | 文件 |
|------------|---------|------------|---------|------|
<!-- 待积累 -->
