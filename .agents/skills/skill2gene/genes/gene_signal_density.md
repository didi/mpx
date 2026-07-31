<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_signal_density -->
<!-- signals_match: 信号密度, signal density, token预算, 精简, 去噪, 去文档化 -->

<strategy-gene>
Domain keywords: 信号密度, signal density, token budget, 精简, 去文档化, 控制效率
Summary: 最大化每 token 的行为控制信号——Gene 的优势不在于短，而在于将经验组织为显式的控制接口，让每个 token 都直接影响模型决策
Strategy:
1. 用祈使句写策略步骤（"检测 X 后执行 Y"），不用解释句（"X 是一个常见问题，通常需要 Y"）
2. 每条策略只编码一个决策点——如果一条策略包含 "并且/同时" 连接的两个独立操作，拆成两条
3. 移除所有可以通过读代码/读文档推断的信息——Gene 只编码模型容易犯错的隐式知识和非显然的约束
4. keywords 选择对行为有区分度的术语，不选通用词（"代码" "开发" 无区分度；"flex 布局" "rpx 转换" 有区分度）
5. summary 用行为意图而非功能描述——回答 "控制模型如何行动" 而非 "这个领域是什么"
6. AVOID: 在 Gene 中重复 API 文档内容——API 细节放 references，Gene 只编码 "何时查、怎么用" 的策略
7. AVOID: 为追求简短而丢失关键决策约束——200 tokens 的优势来自结构化，不来自删减
</strategy-gene>
