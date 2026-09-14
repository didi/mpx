# 完整矩阵复核

scope: outputs/user-list.mpx、outputs/row.wxml。聚合扫描同时纳入 wxml，完整阅读两个业务文件并逐条复核。以下为人工复核记录，不是评分。

- CONFIG_APP_SKYLINE_OPTIONS：不适用：范围仅组件/外部片段，宿主页已接入；未读取或验证宿主配置。
- CONFIG_PAGE_SKYLINE：不适用：组件 JSON 保留 component:true；无页面交付。
- CONFIG_WORKLET_BABEL：不适用：无 Worklet。
- GLASS_INCLUDE_IN_FOR：已修：循环子树改 import + template，显式传 item,index；片段具名 user-row。
- GLASS_TEMPLATE_ESCAPE：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_UNSUPPORTED：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_PENDING_SUPPORT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_WEBVIEW_ONLY_ATTR：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_IMAGE_SVG：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_SCROLL_TYPE：已复核：两个 scroll-view 均 type=list。
- COMP_SCROLL_LIST_DIRECT_CHILD：已复核：users 的循环 view 为直接子节点；other 为原有空容器，无列表按需渲染需求，保留。
- COMP_SCROLL_NESTED：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_SCROLL_HORIZONTAL：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_SCROLL_REFRESHER_SLOT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_NAVIGATOR_CHILDREN：已修：两个 navigator 仅包含 text，均保留 /pages/detail。
- COMP_TEXT_CHILDREN：已复核：全部 text 仅含文本或插值。
- COMP_INLINE_MIXED_CONTENT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_STICKY_STRUCTURE：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_PICKER_VIEW_INDICATOR：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- COMP_SWIPER_LIMIT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_MEDIA_SCREEN：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_SELECTOR_UNSUPPORTED：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_TEXT_OVERFLOW：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_FLEX_MIN_WIDTH_PERCENT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_FLEX_TEXT_WRAP：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_OVERFLOW_AXIS：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_LAYOUT_UNSUPPORTED：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_TEXT_UNSUPPORTED：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_FONT_POSTSCRIPT_NAME：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_FONT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_TEXT_DECORATION：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_BORDER_RADIUS_BORDER：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_BACKGROUND_MASK_LIMIT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_FILTER_LIMIT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_BOX_SHADOW_MULTI：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_CALC_ANGLE：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_PSEUDO_ANIMATION：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_ANIMATION_FILL_MODE：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_ANIMATION_PROPERTY：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- STYLE_Z_INDEX_CONTEXT：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- GLASS_SELECTOR_NUMERIC_ID：已修：id 与 selector 同步为 users。
- ANIMATION_WEBVIEW_API：不命中：已检查完整模板、脚本和样式，无该能力或不兼容写法。
- SCROLL_CONTEXT_ENHANCED：已修：select(#users).node() 对应 users 容器显式 enhanced=true；不是依赖 other 的 enhanced。
- SELECTOR_QUERY_SCOPE：已修：组件 this.createSelectorQuery()。
- PROPS_DEFAULT_FIELD：候选例外：config.default 是 data 内业务字段，非 properties descriptor，保留 keep；label/payload 使用 value。
- WX_FOR_DATA_TYPE：已修：initData.visibleItems=[] 保护 computed 初始化；items=[]；setRows 将 null 归一为空数组，computed filter 始终返回数组。
- PROPS_UNION_TYPE：已复核：payload String + optionalTypes:[Object] 合法且保留；label String 默认用户，payload 默认空字符串均匹配。外部调用方不在范围。

无未说明 error/warn 残留。真机行为 not_run；宿主默认布局配置按任务已接入前提处理，未独立验证。
