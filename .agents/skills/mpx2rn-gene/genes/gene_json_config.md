<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_json_config -->
<!-- signals_match: json, JSON配置, usingComponents, navigationBar, disableScroll, subPackages, tabBar -->

<strategy-gene>
Domain keywords: json, usingComponents, navigationBar, disableScroll, tabBar, componentPlaceholder, 分包
Summary: JSON 配置仅使用 RN 支持的字段，disableScroll 设 true 配合 scroll-view，不支持字段用条件编译隔离
Strategy:
1. 页面 JSON 中 disableScroll 应设为 true，在 template 中用 scroll-view 包裹滚动内容
2. 仅使用 RN 支持的页面配置字段：navigationStyle/navigationBarTitleText/navigationBarTextStyle/navigationBarBackgroundColor/backgroundColorContent/usingComponents/componentPlaceholder/disableScroll
3. 不支持的字段（如 tabBar）须通过条件编译隔离
4. 需要分平台配置时使用 <script name="json"> 动态生成，借助 __mpx_mode__ / __mpx_env__
5. AVOID: 在 RN 输出中使用 tabBar 配置（暂不支持）
6. AVOID: 使用 enablePullDownRefresh / onReachBottomDistance（RN 无效，用 scroll-view 替代）
</strategy-gene>

<references>
- [JSON 配置参考](../references/rn-json-reference.md)
</references>
