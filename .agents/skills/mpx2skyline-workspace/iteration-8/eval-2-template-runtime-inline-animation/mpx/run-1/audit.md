# 完整矩阵复核

范围为当前组件、外部行片段与 SVG；逐项人工核对结构与数据路径，静态结论不代表真机表现。

| 规则 | 结论 | 证据／例外 |
| --- | --- | --- |
| CONFIG_APP_SKYLINE_OPTIONS | not_applicable | 单组件范围；宿主页已接入 Skyline/glass-easel。app.json 未提供、不修改；须由宿主核对推荐项，尤其 keyframeStyleIsolation。 |
| CONFIG_PAGE_SKYLINE | not_applicable | 组件 JSON 保留 component:true；不添加页面 renderer、navigationStyle 或 disableScroll。 |
| CONFIG_WORKLET_BABEL | not_applicable | 仅 CSS 动画，没有 Worklet。 |
| GLASS_TEMPLATE_FRAGMENT | reviewed_pass | include 改 import + user-row 具名 template；显式传入过滤后的 item/index。 |
| GLASS_TEMPLATE_ESCAPE | reviewed_no_occurrence | 逐项读取模板属性，无绑定外冲突引号及多余反斜杠转义。 |
| COMP_UNSUPPORTED | reviewed_no_occurrence | 仅 view/span/image/text/scroll-view/navigator/template/import，无不支持组件。 |
| COMP_PENDING_SUPPORT | reviewed_no_occurrence | 无 match-media、keyboard-accessory。 |
| COMP_WEBVIEW_ONLY_ATTR | reviewed_no_occurrence | image 明确 aspectFit；无 WebView-only 图片裁剪、输入框或 swiper 属性。 |
| COMP_IMAGE_SVG | reviewed_pass | logo.svg 原样交付；24x24/viewBox 与 circle 均为数值，fill 内联，无 style/%/rgba；aspectFit 避免 scaleToFill 差异。 |
| COMP_SCROLL_TYPE | reviewed_pass | other/users 两个容器均显式 type=list，class=list 提供 300px 高度。 |
| COMP_SCROLL_LIST_DIRECT_CHILD | reviewed_pass | users 循环 view 为直接子节点；other 为保留的空对照容器，不承担列表按需渲染。 |
| COMP_SCROLL_NESTED | reviewed_no_occurrence | 两个滚动容器是兄弟，没有嵌套滚动。 |
| COMP_SCROLL_HORIZONTAL | not_applicable | 没有横向滚动；heading 的 Flex 是标题布局。 |
| COMP_SCROLL_HORIZONTAL_CHILD_WIDTH | not_applicable | 无横向 scroll-view。 |
| COMP_SCROLL_REFRESHER_SLOT | not_applicable | 无下拉刷新。 |
| COMP_NAVIGATOR_CHILDREN | reviewed_pass | 文本入口 navigator 只含 text；复杂卡片改 view bindtap=openDetail，navigateTo 同一路径。 |
| COMP_TEXT_CHILDREN | reviewed_pass | 所有 text 均只包含文本/插值，没有图片或 view 嵌套。 |
| COMP_INLINE_MIXED_CONTENT | reviewed_pass | 实际标题 span 同段容纳 image+text；title flex:1,width:0,min-width:0；Skyline 图片映射 logo-inline 的 inline-block。 |
| COMP_STICKY_STRUCTURE | not_applicable | 无 sticky。 |
| COMP_PICKER_VIEW_INDICATOR | not_applicable | 无 picker-view。 |
| COMP_SWIPER_LIMIT | not_applicable | 无 swiper。 |
| STYLE_MEDIA_SCREEN | reviewed_no_occurrence | 无媒体查询。 |
| STYLE_SELECTOR_UNSUPPORTED | reviewed_no_occurrence | 类选择器及 keyframes；无通配、属性选择器或不支持伪元素。 |
| STYLE_TEXT_OVERFLOW | reviewed_pass | span max-lines=1,overflow=ellipsis；Skyline 保留 nowrap，WebView 分支保留 truncate 的 nowrap/hidden/text-overflow。 |
| STYLE_FLEX_TEXT_WRAP | reviewed_pass | heading width:100%；title width:0,flex:1,min-width:0 受约束并可收缩，本业务明确单行省略。 |
| STYLE_OVERFLOW_AXIS | reviewed_pass | 仅 WebView truncate 中 overflow:hidden；没有 auto/scroll、单轴或双值 overflow。 |
| STYLE_LAYOUT_UNSUPPORTED | reviewed_no_occurrence | 无 grid/flow-root/float/contain/resize/outline/cursor/column-* 等。 |
| STYLE_TEXT_UNSUPPORTED | reviewed_no_occurrence | 仅 nowrap 和 vertical-align:middle，没有矩阵所列不支持文本取值。 |
| STYLE_FONT_POSTSCRIPT_NAME | reviewed_no_occurrence | 没有自定义字体族。 |
| STYLE_FONT | reviewed_no_occurrence | 没有特殊字重或 oblique。 |
| STYLE_TEXT_DECORATION | reviewed_no_occurrence | 没有多值文本装饰。 |
| STYLE_BORDER_RADIUS_BORDER | reviewed_pass | 提示圆点 radius=4px，不含边框，不存在四边不一致。 |
| STYLE_BACKGROUND_MASK_LIMIT | reviewed_no_occurrence | 只有单色背景，无背景图片或 mask。 |
| STYLE_FILTER_LIMIT | reviewed_no_occurrence | 无 filter/backdrop-filter。 |
| STYLE_BOX_SHADOW_MULTI | reviewed_no_occurrence | 无 box-shadow。 |
| STYLE_CALC_ANGLE | reviewed_no_occurrence | 无 calc。 |
| STYLE_PSEUDO_ANIMATION | reviewed_pass | 删除 pulse::before；动画直接作用于真实 pulse view。 |
| STYLE_ANIMATION_FILL_MODE | reviewed_pass | backwards 改 both，基础 opacity=.3，与 from 帧一致；保留原一秒正向循环及 ease。 |
| STYLE_ANIMATION_PROPERTY | reviewed_pass | 只对 opacity/transform 做动画和过渡，均在白名单；按钮两种状态 150ms ease。 |
| STYLE_Z_INDEX_CONTEXT | reviewed_pass | opacity/transform 仅反馈状态；无 z-index、fixed、遮挡或层叠上下文依赖。 |
| STYLE_NEGATIVE_MARGIN_OCCUPANCY | reviewed_no_occurrence | 无 margin 或负 margin 占位链。 |
| GLASS_SELECTOR_NUMERIC_ID | reviewed_pass | 1users 改 users；查询同步改 #users；另一个 id=other。 |
| ANIMATION_WEBVIEW_API | reviewed_pass | 移除 wx.createAnimation/animationData 与 animation 属性；共用 CSS 状态切换。 |
| SCROLL_CONTEXT_ENHANCED | reviewed_pass | select(#users).node() 关联 users 标签，目标自身 enhanced=true、scroll-y=true；不以 other.enhanced 代替。 |
| SELECTOR_QUERY_SCOPE | reviewed_pass | 改用 this.createSelectorQuery；由渲染后的按钮点击触发。 |
| PROPS_DEFAULT_FIELD | reviewed_pass | label/payload descriptor 使用 value；config.default 位于 data，是业务字段，应保留。 |
| WX_FOR_DATA_TYPE | reviewed_pass | items 初始 []、initData.visibleItems=[]；computed 对 null 返回 []，数组过滤返回数组，覆盖异步更新。 |
| PROPS_UNION_TYPE | reviewed_pass | label 为 String/value字符串；payload 保留 String+optionalTypes[Object]/value空串；没有 type 数组。未提供调用方，未验证宿主传值。 |
