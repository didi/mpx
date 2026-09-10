# 商品卡片双渲染适配

仅交付 `product-card.mpx`，未修改输入、页面配置或引入依赖。

- 保留 title String 属性及默认值；标题保留 WebView 单行省略 CSS，补 Skyline `max-lines` / `overflow`。
- 两列标签改为横向 Flex，子项 `flex: 1; min-width: 0` 保持等宽。
- 活动属性选择器改为类选择器，圆点使用真实 text 节点，保留 4px 间距及红色活动文案。
- WebView 保留 320px 媒体查询；Skyline attached 阶段按 windowWidth 快照计算小屏状态，仅 Skyline 添加动态类。查询后声明 Skyline 默认 padding，避免媒体条件被忽略时大屏误用 12rpx。小屏 12rpx、大屏 24rpx。
- 显式声明组件 block/content-box、Flex row，避免依赖宿主默认布局配置。

验证：独立 Jest 10 项通过，覆盖两种 renderer 在 319/320/321/375px 的状态与 padding 样式规则计算、属性/模板语义以及脚本 ESLint（no-undef、no-unused-vars）和 PostCSS 解析。完整 47 条 Skill 审计矩阵已执行，证据位于 run-1/audit.json 和 aggregate-scan.txt；无未说明 error/warn。保留媒体查询与文本省略 CSS 的候选命中均有对应 Skyline 处理；组件任务不适用页面配置审计。

未验证：没有完整应用构建与微信开发者工具/真机环境，未进行真实 WebView/Skyline 视觉和字体渲染验收。需要宿主已接入 Skyline/glass-easel；组件不负责开启页面渲染后端。按需求不处理 Skyline 横竖屏动态切换。静态样式规则计算不代表真机渲染结果。
