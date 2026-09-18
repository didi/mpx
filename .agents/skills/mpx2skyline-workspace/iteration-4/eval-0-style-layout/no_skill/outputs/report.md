# 适配报告

交付 `style-card.mpx` 完整组件，保留 title 属性、默认标题、标签和活动文案。目标为微信 Skyline/glass-easel 与微信 WebView；依赖宿主既有 defaultDisplayBlock/defaultContentBox 配置。

- 标题保留 nowrap/overflow/text-overflow，同时补 max-lines: 1；标签改为水平 Flex，两项各 flex: 1。活动文字使用显式类。
- attached 时读取当前 screenWidth，≤320px 使用 12rpx，否则 24rpx；两种 renderer 共用该逻辑，不订阅后续屏幕变化。
- outer 的 padding-top 为 20px；child 无顶部 margin，保留四周 10px padding 和 content-box 的 100px 内容宽度，因此顶部为 20px、内容顶部为 30px、总宽为 120px。相邻两块只保留第一块底部 16px margin。
- 单个 rgba 阴影和独立 blur 原值保留。双阴影拆为同尺寸嵌套节点；前层仍是黑色 0 2px 4px，后层仍是 #333 0 4px 8px。复合滤镜拆为内 blur(2px)、外 brightness(.8)，沿用原值，没有换色或删除视觉效果。

## 字体核验

City-Semibold 按任务提供的独立字体族使用 normal 字重，避免额外合成 600；Trip-Medium 同样使用字体族本身的字形，不额外叠加 500。City 的既有 @font-face 声明供支持该机制的宿主使用；Skyline 需宿主以实际支持的字体注册方式提供该字体。Trip-Medium 由宿主提供。输入未包含 city.woff2 或 Trip 字体二进制，未核验字体内部 family/fullName/PostScript 名称、中文覆盖、文件格式兼容性及实际加载成功状态，不声称已通过字体显示验收。

## 验证与机型风险

静态语法和关键布局断言见 ../run-1/。实际 Mpx 编译：not_run；微信开发者工具：not_run；iOS/Android 真机视觉比对：not_run。

需宿主真机核验长中文及英文标题、320px 边界与常规屏宽、20/30/120px 几何尺寸、16px 间距、两层阴影合成、blur 裁剪范围、brightness 在目标 Skyline 基础库的实际支持程度。嵌套滤镜只有在单项滤镜均获支持时才等价；没有运行证据确认目标基础库支持 brightness，因此复合滤镜仍有兼容性风险，不能宣称已完成视觉验收。iOS 与 Android 字体注册、字体 fallback、阴影采样与模糊边缘可能不同，应按既有设计逐项对照；本次不自行替换为近似色值、删减效果或替换字体。
