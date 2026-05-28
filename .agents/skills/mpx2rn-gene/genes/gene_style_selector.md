<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_style_selector -->
<!-- signals_match: selector, 选择器, 单类, compound, nested, pseudo, ::before, ::after, :first-child, :active -->

<strategy-gene>
Domain keywords: selector, 选择器单类化, compound, nested, pseudo-class, pseudo-element, hover-class
Summary: RN 仅支持单类选择器——所有复合/伪类/伪元素选择器必须改造为等效单类实现，同步更新 template 和 script 引用
Strategy:
1. 展开嵌套选择器：sass/less/stylus 嵌套写法先铺平为传统选择器
2. 后代选择器 .a .b → 语义单类 .a-b，在目标节点上直接绑定
3. 交集选择器 .a.b → 合并为 .a-b 单类
4. 子元素伪类 :first-child/:last-child/:nth-child → wx:class + index 判断动态绑定
5. 伪元素 ::before/::after → 真实节点替代（如 view.title-decorator）
6. 点击态 :active → hover-class + hover-stay-time 组件属性
7. 改造后同步更新 template 中的 class 引用和 script 中的 selector API 参数
8. AVOID: 在 style 中保留任何复合选择器（.a .b / .a>.b / .a+.b / .a.b）
9. AVOID: 在 style 中使用标签选择器、属性选择器、伪类或伪元素
</strategy-gene>

<references>
- [样式开发最佳实践 · 选择器使用建议](../references/rn-style-practice.md#选择器使用建议)
- [样式能力参考 · 选择器支持](../references/rn-style-reference.md#选择器支持)
</references>
