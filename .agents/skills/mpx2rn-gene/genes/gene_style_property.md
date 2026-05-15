<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_style_property -->
<!-- signals_match: style, 样式属性, flex, layout, rpx, font-weight, display-none, grid, float, rem, em, 布局 -->

<strategy-gene>
Domain keywords: style-property, flex, layout, rpx, px, font-weight, display-none, grid, float, rem, vertical-center
Summary: 样式属性使用 RN 兼容方案——Flex 布局、rpx/px 单位、关键字 font-weight、尺寸归零隐藏
Strategy:
1. 布局统一使用 Flex（display:flex + flex-direction），禁止 grid 和 float
2. 单位优先 rpx（响应式）和 px（固定），rem/em 按项目换算比例转为 rpx
3. font-weight 使用 normal/bold 关键字，避免数值（400/500/700 跨端不一致）
4. 隐藏元素不用 display:none（RN 可能异常），用 width:0;height:0;overflow:hidden 或 wx:if
5. 文本垂直居中不用 line-height=height hack，用 display:flex;align-items:center
6. 不依赖 BFC 和 margin 合并——容器间距用 padding，兄弟间距单侧 margin
7. 保留 /*use rpx*/ 和 /*use px*/ 单位注释
8. transition（如 transition: height 0.3s ease）RN 支持，保留不要条件编译隔离；@keyframes / animation 动画 RN 不支持，必须条件编译隔离到非 RN 平台
9. AVOID: display:grid / float / display:none / rem / em
10. AVOID: line-height 等高垂直居中方案
11. AVOID: 渐变中使用 transparent（用 rgba(r,g,b,0) 替代）
12. AVOID: 将 transition 和 @keyframes 混为一谈——transition 是 RN 支持的，不应隔离
</strategy-gene>

<references>
- [样式能力参考](../references/rn-style-reference.md)
- [样式开发最佳实践](../references/rn-style-practice.md)
</references>
