# 商品卡片双渲染适配

仅调整 `product-card.mpx`，保留 `title` 属性及默认值，不引入依赖或修改页面配置。

- 两列标签从 Grid 改成横向 Flex，两个标签各占 50%。
- 将伪元素圆点改为真实 text 节点，保留圆点及 4px 间距。
- 将活动属性选择器改为 `.badge` 类选择器，保留红色文案及原 data-kind 属性。
- 标题保留 WebView 单行省略样式，并通过 text 的 `max-lines="1"` 限制 Skyline 行数。
- 将媒体查询改为 attached 时读取窗口宽度并切换 padding 类。窗口宽度 ≤ 320px 为 12rpx，其余为 24rpx，两种渲染器共用该逻辑。优先使用 wx.getWindowInfo，旧基础库回退 wx.getSystemInfoSync；按需求不监听横竖屏变化。

## 实际验证

通过 Node VM 检查组件脚本语法，通过 JSON.parse 检查组件 JSON。模拟两种窗口 API，各验证 280、320、321、375、768px，共 10 个场景，窗口分档与 title 默认值检查全部通过。

当前独立输入未提供项目依赖、构建配置或微信开发者工具环境，未执行 Mpx 构建、ESLint、Jest 或 WebView/Skyline 真机渲染。需在接入项目后检查长标题省略、等宽标签及实际圆点排版。组件首次挂载前使用默认 24rpx，attached 后应用窗口分档。
