# 完整适配矩阵复核

范围：orders.mpx 全部区块、app.json、service.js；无自定义组件。聚合扫描结果见 audit-scan.log。逐项人工核对整个文件后记录；未命中不等同真机兼容证明。

|规则|级别|结论|
|---|---|---|
|CONFIG_APP_SKYLINE_OPTIONS|error|pass: 顶层 lazyCodeLoading 与 skyline 五项齐全；原配置保留。|
|CONFIG_PAGE_SKYLINE|error|pass: 四项配置齐全，自定义导航为真实 view/text。|
|CONFIG_WORKLET_BABEL|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|GLASS_INCLUDE_IN_FOR|error|pass: 循环直接生成 view，无 include。|
|GLASS_TEMPLATE_ESCAPE|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_UNSUPPORTED|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_PENDING_SUPPORT|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_WEBVIEW_ONLY_ATTR|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_IMAGE_SVG|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_SCROLL_TYPE|error|pass: type=list。|
|COMP_SCROLL_LIST_DIRECT_CHILD|warn|pass: 循环订单项为 scroll-view 直接子节点。|
|COMP_SCROLL_NESTED|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_SCROLL_HORIZONTAL|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_SCROLL_REFRESHER_SLOT|warn|exception: 使用默认 refresher，无自定义节点。|
|COMP_NAVIGATOR_CHILDREN|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_TEXT_CHILDREN|warn|pass: text 仅包含纯文本/插值。|
|COMP_INLINE_MIXED_CONTENT|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_STICKY_STRUCTURE|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_PICKER_VIEW_INDICATOR|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|COMP_SWIPER_LIMIT|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_MEDIA_SCREEN|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_SELECTOR_UNSUPPORTED|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_TEXT_OVERFLOW|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_FLEX_MIN_WIDTH_PERCENT|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_FLEX_TEXT_WRAP|warn|exception: 导航固定两字标题，无多行文本需求。|
|STYLE_OVERFLOW_AXIS|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_LAYOUT_UNSUPPORTED|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_TEXT_UNSUPPORTED|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_FONT_POSTSCRIPT_NAME|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_FONT|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_TEXT_DECORATION|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_BORDER_RADIUS_BORDER|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_BACKGROUND_MASK_LIMIT|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_FILTER_LIMIT|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_BOX_SHADOW_MULTI|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_CALC_ANGLE|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_PSEUDO_ANIMATION|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_ANIMATION_FILL_MODE|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_ANIMATION_PROPERTY|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|STYLE_Z_INDEX_CONTEXT|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|GLASS_SELECTOR_NUMERIC_ID|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|ANIMATION_WEBVIEW_API|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|SCROLL_CONTEXT_ENHANCED|error|pass: 没有 node() 查询；scroll-view 已开启 enhanced。|
|SELECTOR_QUERY_SCOPE|warn|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|PROPS_DEFAULT_FIELD|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|
|WX_FOR_DATA_TYPE|warn|pass: orders 初始数组，fetchOrders 固定返回数组，刷新/追加路径保持数组。|
|PROPS_UNION_TYPE|error|not_applicable: 本范围无对应 API、配置需求、组件或样式模式。|

error 残留：0。warn 候选：默认 refresher 与固定短标题已说明例外，其余适用项通过源码复核。页面三个滚动生命周期已统一迁移到 scroll-view。无 Skyline-only 运行时 API；仅微信目标，WebView 使用同一事件链。iOS/Android Skyline、WebView 真机及开发者工具：not_run。
