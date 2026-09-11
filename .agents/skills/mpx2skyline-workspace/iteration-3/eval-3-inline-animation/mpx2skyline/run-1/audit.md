# 完整矩阵复核

scope：outputs/promo-card.mpx 和引用的 logo.svg。聚合候选见 audit-scan.log；全部规则逐项人工对照完整源码，未将候选直接判为错误。

| 规则 | 等级 | 结论 |
| --- | --- | --- |
| CONFIG_APP_SKYLINE_OPTIONS | error | scope 例外：仅组件；宿主已接入，未提供 app.json；keyframeStyleIsolation 由宿主验收。 |
| CONFIG_PAGE_SKYLINE | error | 不适用：组件，无页面配置修改。 |
| CONFIG_WORKLET_BABEL | warn | 不适用：未引入 Worklet。 |
| GLASS_INCLUDE_IN_FOR | error | 完整源码与模板结构复核：无适用命中。 |
| GLASS_TEMPLATE_ESCAPE | error | 完整源码与模板结构复核：无适用命中。 |
| COMP_UNSUPPORTED | error | 完整源码与模板结构复核：无适用命中。 |
| COMP_PENDING_SUPPORT | warn | 完整源码与模板结构复核：无适用命中。 |
| COMP_WEBVIEW_ONLY_ATTR | warn | 完整源码与模板结构复核：无适用命中。 |
| COMP_IMAGE_SVG | warn | 已复核：SVG 具体尺寸、内联 fill，无 style/rgba/百分比；image 显式 aspectFit，SVG 字节一致。 |
| COMP_SCROLL_TYPE | error | 完整源码与模板结构复核：无适用命中。 |
| COMP_SCROLL_LIST_DIRECT_CHILD | warn | 完整源码与模板结构复核：无适用命中。 |
| COMP_SCROLL_NESTED | error | 完整源码与模板结构复核：无适用命中。 |
| COMP_SCROLL_HORIZONTAL | warn | 完整源码与模板结构复核：无适用命中。 |
| COMP_SCROLL_REFRESHER_SLOT | warn | 完整源码与模板结构复核：无适用命中。 |
| COMP_NAVIGATOR_CHILDREN | error | 完整源码与模板结构复核：无适用命中。 |
| COMP_TEXT_CHILDREN | warn | 已复核：两个 text 均只有纯文本或插值，image 是 span 的直接子节点。 |
| COMP_INLINE_MIXED_CONTENT | warn | 已处理：微信 span 共用 max-lines/overflow；Skyline nowrap 和图片 inline-block；原 WebView truncate 保留。 |
| COMP_STICKY_STRUCTURE | warn | 完整源码与模板结构复核：无适用命中。 |
| COMP_PICKER_VIEW_INDICATOR | warn | 完整源码与模板结构复核：无适用命中。 |
| COMP_SWIPER_LIMIT | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_MEDIA_SCREEN | error | 完整源码与模板结构复核：无适用命中。 |
| STYLE_SELECTOR_UNSUPPORTED | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_TEXT_OVERFLOW | warn | 已处理：唯一 title-line 容器共同行内省略，插值紧贴 text 标签。 |
| STYLE_FLEX_MIN_WIDTH_PERCENT | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_FLEX_TEXT_WRAP | warn | 已复核：title-line width:0 + flex:1 + min-width:0，单行截断。 |
| STYLE_OVERFLOW_AXIS | error | 完整源码与模板结构复核：无适用命中。 |
| STYLE_LAYOUT_UNSUPPORTED | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_TEXT_UNSUPPORTED | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_FONT_POSTSCRIPT_NAME | error | 完整源码与模板结构复核：无适用命中。 |
| STYLE_FONT | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_TEXT_DECORATION | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_BORDER_RADIUS_BORDER | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_BACKGROUND_MASK_LIMIT | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_FILTER_LIMIT | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_BOX_SHADOW_MULTI | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_CALC_ANGLE | warn | 完整源码与模板结构复核：无适用命中。 |
| STYLE_PSEUDO_ANIMATION | warn | 已处理：伪元素改 pulse-dot 真实节点。 |
| STYLE_ANIMATION_FILL_MODE | warn | 已处理：backwards 改 both，原 1s infinite 与 from/to 保留。 |
| STYLE_ANIMATION_PROPERTY | warn | 已复核：仅 opacity/transform 白名单；按钮 150ms，圆点 1s。 |
| STYLE_Z_INDEX_CONTEXT | warn | 已复核：opacity/transform 仅反馈，无层级依赖。 |
| GLASS_SELECTOR_NUMERIC_ID | error | 完整源码与模板结构复核：无适用命中。 |
| ANIMATION_WEBVIEW_API | error | 已处理：移除 createAnimation/animation 绑定，双端统一 transition。 |
| SCROLL_CONTEXT_ENHANCED | error | 完整源码与模板结构复核：无适用命中。 |
| SELECTOR_QUERY_SCOPE | warn | 完整源码与模板结构复核：无适用命中。 |
| PROPS_DEFAULT_FIELD | error | 已复核：title 使用 value。 |
| WX_FOR_DATA_TYPE | warn | 完整源码与模板结构复核：无适用命中。 |
| PROPS_UNION_TYPE | error | 已复核：title 为 String，默认值为字符串；调用方未提供，外部传值未验证。 |

未处理 error：0。warn 保留项：宿主 keyframes 隔离和真机视觉需集成验收，SVG 已复核无已知差异点。无其他组件子树。
