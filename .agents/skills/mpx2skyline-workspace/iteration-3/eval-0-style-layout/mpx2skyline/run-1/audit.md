# 完整矩阵复核

scope：outputs/style-card.mpx；逐条结合完整 SFC 人工复核。

| 规则 | 结果 |
| --- | --- |
| CONFIG_APP_SKYLINE_OPTIONS | not_applicable：单组件；宿主已配置 defaultDisplayBlock/defaultContentBox，宿主配置文件不在输入中。 |
| CONFIG_PAGE_SKYLINE | not_applicable：component:true，不是页面。 |
| CONFIG_WORKLET_BABEL | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| GLASS_INCLUDE_IN_FOR | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| GLASS_TEMPLATE_ESCAPE | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_UNSUPPORTED | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_PENDING_SUPPORT | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_WEBVIEW_ONLY_ATTR | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_IMAGE_SVG | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_SCROLL_TYPE | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_SCROLL_LIST_DIRECT_CHILD | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_SCROLL_NESTED | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_SCROLL_HORIZONTAL | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_SCROLL_REFRESHER_SLOT | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_NAVIGATOR_CHILDREN | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_TEXT_CHILDREN | reviewed：全部 text 仅有纯文本或插值，无非法子节点。 |
| COMP_INLINE_MIXED_CONTENT | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_STICKY_STRUCTURE | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_PICKER_VIEW_INDICATOR | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| COMP_SWIPER_LIMIT | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_MEDIA_SCREEN | handled：WebView 保留 media；Skyline 默认类和小屏类置于 media 后，attached 读取当前 screenWidth。 |
| STYLE_SELECTOR_UNSUPPORTED | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_TEXT_OVERFLOW | handled：唯一 title 省略节点同时保留 WebView CSS 和 max-lines/overflow；插值无首尾空白。 |
| STYLE_FLEX_MIN_WIDTH_PERCENT | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_FLEX_TEXT_WRAP | reviewed：两列短标签由 flex:1 和 min-width:0 等分，无多行长文本需求。 |
| STYLE_OVERFLOW_AXIS | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_LAYOUT_UNSUPPORTED | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_TEXT_UNSUPPORTED | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_FONT_POSTSCRIPT_NAME | exception：City-Semibold 独立 @font-face；Trip-Medium 宿主来源，二进制与映射未提供，保留设计，未擅改字体族/字重。 |
| STYLE_FONT | warn_retained：500/600 按设计保留，部分机型风险及字体核验 not_run。 |
| STYLE_TEXT_DECORATION | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_BORDER_RADIUS_BORDER | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_BACKGROUND_MASK_LIMIT | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_FILTER_LIMIT | handled：独立 blur 保留；组合按内 blur、外 brightness 拆节点，应用顺序不变；视觉 not_run。 |
| STYLE_BOX_SHADOW_MULTI | handled：rgba 内部逗号不算多层；双阴影拆同尺寸嵌套节点，无 padding/border/margin，前景 #000 在内，后景 #333 在外。视觉 not_run。 |
| STYLE_CALC_ANGLE | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_PSEUDO_ANIMATION | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_ANIMATION_FILL_MODE | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_ANIMATION_PROPERTY | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| STYLE_Z_INDEX_CONTEXT | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| GLASS_SELECTOR_NUMERIC_ID | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| ANIMATION_WEBVIEW_API | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| SCROLL_CONTEXT_ENHANCED | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| SELECTOR_QUERY_SCOPE | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| PROPS_DEFAULT_FIELD | reviewed：title 使用 value，类型 String 与默认字符串一致；外部调用方未提供。 |
| WX_FOR_DATA_TYPE | no_hit / not_applicable：完整源码未使用该规则涉及能力。 |
| PROPS_UNION_TYPE | reviewed：无联合 type，title 为 String。 |

布局额外复核：outer padding-top 10px + child padding-top 10px = 内容顶部 20px；child content-box 宽 100px + 左右 padding 20px = 外宽 120px；两块仅 first margin-bottom 16px。
无未解释 error；字体 warn 保留；真机视觉与字体实际加载 not_run。
