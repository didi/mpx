<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_cross_platform -->
<!-- signals_match: 跨平台兼容, cross-platform, dual-track, 条件编译保留, 原平台 -->

<strategy-gene>
Domain keywords: 跨平台兼容, cross-platform, dual-track, conditional-compile, 原平台保留
Summary: 确保 RN 适配不破坏原平台行为——所有 RN 专有写法必须通过条件编译隔离，原平台原有写法必须完整保留
Strategy:
1. 引入「RN 支持但原平台不支持」的写法（如 numberOfLines@ios|android|harmony、hairlineWidth）时，用条件编译将其限定在 RN 平台输出
2. 同步用条件编译保留原平台已有写法，禁止因 RN 适配而替换或删除原平台代码
3. 该原则贯穿 template / script / style / JSON 四个维度，每个维度的条件编译语法不同（参见 gene_conditional_compile）
4. AVOID: 只保留 RN 一侧实现而删除原平台写法
5. AVOID: 不加条件编译直接用 RN 专有属性替换跨端通用写法
</strategy-gene>

<references>
- [条件编译](../references/conditional-compile.md)
- [样式开发最佳实践 · 双轨保留](../references/rn-style-practice.md#1-像素边框极细线)
</references>
