完整检查矩阵：仅组件、外部行片段及 SVG；所有状态均为静态复核。

| 规则 | 级别 | 状态 | 依据 |
| --- | --- | --- | --- |
| CONFIG_APP_SKYLINE_OPTIONS | error | not_applicable | 仅组件范围；未提供 app.json，宿主配置未核验。keyframes 与使用节点在同一个组件样式内，名称 userListPulse。 |
| CONFIG_PAGE_SKYLINE | error | not_applicable | 仅组件范围；宿主页 Skyline/glass-easel 已由任务确认，不在组件 JSON 添加页面配置。 |
| CONFIG_WORKLET_BABEL | warn | not_applicable | 仅 CSS animation/transition，不使用 Worklet。 |
| GLASS_TEMPLATE_FRAGMENT | error | passed | import row.wxml + user-row 具名模板，显式传 index/item。 |
| GLASS_TEMPLATE_ESCAPE | error | passed | 完整模板属性无反斜杠引号；绑定内外定界无冲突。 |
| COMP_UNSUPPORTED | error | not_applicable | 无不支持的基础组件。 |
| COMP_PENDING_SUPPORT | warn | not_applicable | 无 match-media/keyboard-accessory。 |
| COMP_WEBVIEW_ONLY_ATTR | warn | passed | 无依赖 WebView-only 属性/裁剪模式。 |
| COMP_IMAGE_SVG | warn | passed | SVG 24x24 数值尺寸与 circle 内联填色保留；image 显式 aspectFit。 |
| COMP_SCROLL_TYPE | error | passed | other 与 users 均显式 type=list。 |
| COMP_SCROLL_LIST_DIRECT_CHILD | warn | passed | users 循环 view 为直接列表项；other 保留原空辅助容器，不依赖列表虚拟化。 |
| COMP_SCROLL_NESTED | error | not_applicable | 两个 scroll-view 为兄弟，无嵌套滚动。 |
| COMP_SCROLL_HORIZONTAL | warn | not_applicable | 未开启横向滚动。 |
| COMP_SCROLL_HORIZONTAL_CHILD_WIDTH | warn | not_applicable | 无横向 scroll-view 直接子节点。 |
| COMP_SCROLL_REFRESHER_SLOT | warn | not_applicable | 无下拉刷新节点或刷新需求。 |
| COMP_NAVIGATOR_CHILDREN | error | passed | 简单入口仅 text；复杂卡片由外层 view 点击 navigateTo。 |
| COMP_TEXT_CHILDREN | warn | passed | 所有 text 仅包含文字或插值。 |
| COMP_INLINE_MIXED_CONTENT | warn | passed | 图标/label 同处 span，整段 max-lines=1/overflow=ellipsis；视觉待微信验证。 |
| COMP_STICKY_STRUCTURE | warn | not_applicable | 无吸顶。 |
| COMP_PICKER_VIEW_INDICATOR | warn | not_applicable | 无 picker-view。 |
| COMP_SWIPER_LIMIT | warn | not_applicable | 无 swiper。 |
| STYLE_MEDIA_SCREEN | error | not_applicable | 无媒体查询。 |
| STYLE_SELECTOR_UNSUPPORTED | warn | passed | 使用类选择器，未用通配/属性/伪元素选择器。 |
| STYLE_TEXT_OVERFLOW | warn | passed | span 对整段设置单行省略；保留 WebView nowrap/hidden/text-overflow；插值紧贴 text。 |
| STYLE_FLEX_TEXT_WRAP | warn | passed | 标题需求为单行；span flex:1,width:0,min-width:0 在 heading 分配剩余宽度。 |
| STYLE_OVERFLOW_AXIS | error | passed | 仅 overflow:hidden，无 auto/scroll/单轴或双值 overflow。 |
| STYLE_LAYOUT_UNSUPPORTED | warn | not_applicable | 无 grid/flow-root/float 等受限布局。 |
| STYLE_TEXT_UNSUPPORTED | warn | passed | white-space:nowrap、vertical-align:middle，无已列不支持文本值。 |
| STYLE_FONT_POSTSCRIPT_NAME | error | not_applicable | 无字体资源或字体族变更。 |
| STYLE_FONT | warn | not_applicable | 无 500/600/bolder/lighter/oblique。 |
| STYLE_TEXT_DECORATION | warn | not_applicable | 无文本装饰。 |
| STYLE_BORDER_RADIUS_BORDER | warn | passed | 圆点 border-radius:4px，无四边边框差异。 |
| STYLE_BACKGROUND_MASK_LIMIT | warn | not_applicable | 只有单色背景，无背景图/遮罩。 |
| STYLE_FILTER_LIMIT | warn | not_applicable | 无滤镜。 |
| STYLE_BOX_SHADOW_MULTI | warn | not_applicable | 无阴影。 |
| STYLE_CALC_ANGLE | warn | not_applicable | 无 calc。 |
| STYLE_PSEUDO_ANIMATION | warn | passed | pulse 为真实 view，原伪元素移除。 |
| STYLE_ANIMATION_FILL_MODE | warn | passed | both + 显式初始 opacity:.3，不再使用 backwards。 |
| STYLE_ANIMATION_PROPERTY | warn | passed | 圆点只动画 opacity；按钮只 transition transform/opacity，150ms。 |
| STYLE_Z_INDEX_CONTEXT | warn | passed | transform/opacity 仅作反馈，无 z-index、fixed 或遮挡层级依赖。 |
| STYLE_NEGATIVE_MARGIN_OCCUPANCY | warn | not_applicable | 无负 margin 或折叠占位链。 |
| GLASS_SELECTOR_NUMERIC_ID | error | passed | id 与 selector 同步改为 users，other 未混淆。 |
| ANIMATION_WEBVIEW_API | error | passed | 移除 wx.createAnimation/animationData，双 renderer 共用 CSS。 |
| SCROLL_CONTEXT_ENHANCED | error | passed | select('#users').node() 精确关联已开启 enhanced 的 users。 |
| SELECTOR_QUERY_SCOPE | warn | passed | 使用 this.createSelectorQuery() 限定组件作用域。 |
| PROPS_DEFAULT_FIELD | error | passed | properties 均使用 value；config.default 是业务数据，保留 keep。 |
| WX_FOR_DATA_TYPE | warn | passed | initData.visibleItems=[]；items 默认[]，computed 对 null/undefined 回退[]后过滤；setRows 更新均有 mock 覆盖。 |
| PROPS_UNION_TYPE | error | passed | label String；payload String + optionalTypes:[Object]，默认空串；未放宽类型。调用侧未提供。 |
