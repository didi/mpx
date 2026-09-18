# 完整矩阵复核

范围：outputs/style-card.mpx 全文件；无自定义子组件。

- CONFIG_APP_SKYLINE_OPTIONS: N/A: 单组件；宿主已配置默认 block/content-box
- CONFIG_PAGE_SKYLINE: N/A: 单组件，无页面配置
- CONFIG_WORKLET_BABEL: 无命中/不适用，已复核完整模板、样式、脚本。
- GLASS_INCLUDE_IN_FOR: 无命中/不适用，已复核完整模板、样式、脚本。
- GLASS_TEMPLATE_ESCAPE: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_UNSUPPORTED: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_PENDING_SUPPORT: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_WEBVIEW_ONLY_ATTR: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_IMAGE_SVG: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_SCROLL_TYPE: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_SCROLL_LIST_DIRECT_CHILD: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_SCROLL_NESTED: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_SCROLL_HORIZONTAL: 不适用：row 属于普通标签 flex，无滚动
- COMP_SCROLL_REFRESHER_SLOT: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_NAVIGATOR_CHILDREN: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_TEXT_CHILDREN: 通过：所有 text 仅含纯文本/插值
- COMP_INLINE_MIXED_CONTENT: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_STICKY_STRUCTURE: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_PICKER_VIEW_INDICATOR: 无命中/不适用，已复核完整模板、样式、脚本。
- COMP_SWIPER_LIMIT: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_MEDIA_SCREEN: 已处理：原媒体查询 + renderer 动态类 + 查询后的默认覆盖
- STYLE_SELECTOR_UNSUPPORTED: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_TEXT_OVERFLOW: 已处理：text 同时保留 CSS 与 max-lines/overflow
- STYLE_FLEX_MIN_WIDTH_PERCENT: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_FLEX_TEXT_WRAP: 已处理：label 显式 width:0 + flex:1
- STYLE_OVERFLOW_AXIS: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_LAYOUT_UNSUPPORTED: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_TEXT_UNSUPPORTED: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_FONT_POSTSCRIPT_NAME: 例外：City-Semibold 独立 @font-face；Trip-Medium 宿主提供，缺少二进制，未授权字重变化，保留并报告风险
- STYLE_FONT: 警告保留：600/500 部分 Android 不生效；不改变已确认设计
- STYLE_TEXT_DECORATION: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_BORDER_RADIUS_BORDER: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_BACKGROUND_MASK_LIMIT: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_FILTER_LIMIT: 已处理：全部单函数；内层 blur 外层 brightness，保持顺序
- STYLE_BOX_SHADOW_MULTI: 已处理：双阴影嵌套同尺寸盒子；rgba 内逗号是颜色参数
- STYLE_CALC_ANGLE: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_PSEUDO_ANIMATION: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_ANIMATION_FILL_MODE: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_ANIMATION_PROPERTY: 无命中/不适用，已复核完整模板、样式、脚本。
- STYLE_Z_INDEX_CONTEXT: 无命中/不适用，已复核完整模板、样式、脚本。
- GLASS_SELECTOR_NUMERIC_ID: 无命中/不适用，已复核完整模板、样式、脚本。
- ANIMATION_WEBVIEW_API: 无命中/不适用，已复核完整模板、样式、脚本。
- SCROLL_CONTEXT_ENHANCED: 无命中/不适用，已复核完整模板、样式、脚本。
- SELECTOR_QUERY_SCOPE: 无命中/不适用，已复核完整模板、样式、脚本。
- PROPS_DEFAULT_FIELD: 通过：title 使用 value
- WX_FOR_DATA_TYPE: 无命中/不适用，已复核完整模板、样式、脚本。
- PROPS_UNION_TYPE: 通过：title 类型 String，与默认值一致

额外间距复核：outer padding-top=20px，child padding=10px、content-box、width=100px；兄弟间距单侧16px。
