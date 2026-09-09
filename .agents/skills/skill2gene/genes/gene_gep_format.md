<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_gep_format -->
<!-- signals_match: GEP, strategy-gene, 格式, schema, 字段, 模板, gene对象 -->

<strategy-gene>
Domain keywords: GEP, Gene Evolution Protocol, strategy-gene, format, schema, fields, template
Summary: Gene 必须遵循 GEP 协议的规范格式——HTML 注释头部 + strategy-gene 标签体 + references 尾部，每个字段有明确的控制语义
Strategy:
1. 文件头部用 HTML 注释声明 GEP 元数据：type, schema_version, id, signals_match
2. 主体用 `<strategy-gene>` 标签包裹，内含五个有序字段：Domain keywords / Summary / Strategy / (AVOID 项内嵌于 Strategy 末尾) / Constraints（可选）
3. Domain keywords：与 signals_match 对应的领域触发词，用逗号分隔
4. Summary：一句话说明行为意图（不是功能描述），回答"这个 Gene 控制模型做什么"
5. Strategy：3-7 条有序策略步骤，每条是一个可执行的决策指令而非解释性文本；AVOID 项以编号嵌入策略列表末尾
6. 文件尾部用 `<references>` 标签列出详细参考文档链接，仅在 Gene 策略不足以解决问题时查阅
7. 整个 Gene 控制在 200-300 tokens——这是经验证的最优控制预算，超出反而降低效果
8. AVOID: 在 Gene 中写解释性段落、背景介绍、或示例代码块——这些属于 reference 层
9. AVOID: 将 AVOID 项单独成节——它们是策略的一部分，用编号嵌入 Strategy 列表
</strategy-gene>

<references>
- [GEP 协议参考](../references/gep-protocol.md)
</references>
