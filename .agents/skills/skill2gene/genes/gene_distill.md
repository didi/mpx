<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_distill -->
<!-- signals_match: 蒸馏, distill, 提取控制信号, 转换skill, 拆分gene, 功能域划分 -->

<strategy-gene>
Domain keywords: 蒸馏, distill, 提取, 拆分, 控制信号, 功能域, Skill→Gene
Summary: 从文档导向的 Procedural Skill 中定位稀疏的有效控制信号，按功能域拆分为原子 Strategy Gene——Skill 中真正影响模型行为的内容通常只集中在 workflow 部分，其余是噪声
Strategy:
1. 读取整个 Skill 包（SKILL.md + references/ + scripts/），识别每一段内容属于哪类：overview / workflow / pitfalls / error_handling / api_notes / examples
2. 仅 workflow 和 pitfalls 中包含高密度控制信号；overview 通常有害（降低整体性能），api_notes 和 examples 附加后也会稀释控制效果
3. 按功能域（而非文档章节）将控制信号分组——每组对应一个原子 Gene，每个 Gene 应能独立提供一个维度的行为控制
4. 判断粒度：一个 Gene 覆盖一个决策域，用 3-7 条策略步骤即可说清楚；如果需要超过 7 条，说明粒度太粗需要继续拆分
5. 为每个 Gene 确定触发关键词（signals_match）——这些关键词决定 Gene 何时被激活
6. AVOID: 按原 Skill 的文档章节结构拆分 Gene——文档结构为人类可读性设计，不等于控制逻辑的功能边界
7. AVOID: 试图在一个 Gene 中覆盖多个不相关的决策域
</strategy-gene>

<references>
- [GEP 协议参考](../references/gep-protocol.md)
</references>
