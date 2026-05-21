<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_text_overflow -->
<!-- signals_match: text-overflow, numberOfLines, ellipsis, white-space, hairlineWidth, 1rpx, 极细线, 文本溢出, 双轨 -->

<strategy-gene>
Domain keywords: text-overflow, numberOfLines, ellipsis, hairlineWidth, 1rpx, 双轨保留
Summary: 文本溢出和极细线使用双轨模式——原平台用样式条件编译保留，RN 侧用等效属性/值实现
Strategy:
1. 文本溢出双轨：原平台用 /* @mpx-if */ 包裹 white-space:nowrap + text-overflow:ellipsis + overflow:hidden 整条规则；RN 侧在模板上添加 numberOfLines@ios|android|harmony="{{1}}"
2. 1rpx 极细线双轨：原平台用 /* @mpx-if */ 包裹 border-width:1rpx；RN 侧用 /* @mpx-if */ 包裹 border-width:hairlineWidth
3. 双轨模式必须两侧都保留，禁止只保留 RN 一侧
4. numberOfLines 也可用于 view 组件
5. AVOID: 只保留 RN 侧实现而删除原平台的 white-space/text-overflow 样式
6. AVOID: 只保留 RN 侧 hairlineWidth 而删除原平台的 1rpx 写法
</strategy-gene>

<references>
- [样式开发最佳实践 · 文本溢出处理](../references/rn-style-practice.md#文本溢出处理)
- [样式开发最佳实践 · 1像素边框](../references/rn-style-practice.md#1-像素边框极细线)
</references>
