# 完整组件审计

Scope: outputs/category-panel.mpx；根据完整矩阵逐项结构与源码复核，聚合扫描见 audit-scan.txt。

| 规则 | 级别 | 复核结论 |
| --- | --- | --- |
| CONFIG_APP_SKYLINE_OPTIONS | error | 不适用：任务只改组件，宿主 app 配置未提供、未改动。 |
| CONFIG_PAGE_SKYLINE | error | 不适用：component:true，非页面。 |
| CONFIG_WORKLET_BABEL | warn | 不适用：未使用 Worklet。 |
| GLASS_INCLUDE_IN_FOR | error | 循环仅含原生节点，无 include。 |
| GLASS_TEMPLATE_ESCAPE | error | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_UNSUPPORTED | error | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_PENDING_SUPPORT | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_WEBVIEW_ONLY_ATTR | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_IMAGE_SVG | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_SCROLL_TYPE | error | 已复核所有 scroll-view：nested / custom / list 均显式声明。 |
| COMP_SCROLL_LIST_DIRECT_CHILD | warn | 已复核：横向 list 的 tile 是直接子节点，无整列 wrapper。 |
| COMP_SCROLL_NESTED | error | Skyline 外层 nested，纵向 custom 与横向 list 均声明 associative-container。WebView 分支仅保留普通滚动。nested/custom 组合仍需真机确认。 |
| COMP_SCROLL_HORIZONTAL | warn | 两端 strip 均 enable-flex + display:flex + flex-direction:row；tile flex-shrink:0，尺寸 120×80px。 |
| COMP_SCROLL_REFRESHER_SLOT | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_NAVIGATOR_CHILDREN | error | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_TEXT_CHILDREN | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_INLINE_MIXED_CONTENT | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_STICKY_STRUCTURE | warn | Skyline custom 直接子节点 sticky-section；sticky-header 是首子节点，有白色背景。WebView 分支保留按组包裹的 CSS sticky。 |
| COMP_PICKER_VIEW_INDICATOR | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| COMP_SWIPER_LIMIT | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_MEDIA_SCREEN | error | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_SELECTOR_UNSUPPORTED | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_TEXT_OVERFLOW | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_FLEX_MIN_WIDTH_PERCENT | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_FLEX_TEXT_WRAP | warn | tile 有显式 120px 宽度，保留原有 nowrap 文本语义。 |
| STYLE_OVERFLOW_AXIS | error | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_LAYOUT_UNSUPPORTED | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_TEXT_UNSUPPORTED | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_FONT_POSTSCRIPT_NAME | error | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_FONT | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_TEXT_DECORATION | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_BORDER_RADIUS_BORDER | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_BACKGROUND_MASK_LIMIT | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_FILTER_LIMIT | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_BOX_SHADOW_MULTI | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_CALC_ANGLE | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_PSEUDO_ANIMATION | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_ANIMATION_FILL_MODE | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_ANIMATION_PROPERTY | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| STYLE_Z_INDEX_CONTEXT | warn | modal 与 fab 是 root 下 fixed 兄弟节点，z-index 分别 3/2；移除 outer transform/z-index。绘制顺序及触摸真机待验证。 |
| GLASS_SELECTOR_NUMERIC_ID | error | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| ANIMATION_WEBVIEW_API | error | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| SCROLL_CONTEXT_ENHANCED | error | scroll-view 候选已复核：未使用 node()/ScrollViewContext，无需 enhanced。 |
| SELECTOR_QUERY_SCOPE | warn | 未命中对应能力或不兼容语法，已结合完整模板、脚本、样式复核。 |
| PROPS_DEFAULT_FIELD | error | sections 属性使用 value:[]，无 default。 |
| WX_FOR_DATA_TYPE | warn | sections 为 Array、默认 []；item.items 由已确认输入契约保证为 Array。 |
| PROPS_UNION_TYPE | error | 唯一 sections 属性 type:Array 与默认值及输入契约一致。 |

静态 error 无未解释残留；保留的 sticky 仅用于 WebView 分支。warn 的滚动、吸顶、fixed 层级相关运行时效果尚未真机验证。
参考的 nested 与 sticky 约束分别以 nested 协调层、custom 内容滚动层满足；无同类输入文件或自定义组件依赖。
官方补充材料请求因网络超时未取得，未将请求结果作为能力依据。
