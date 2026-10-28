# 固定窗口订单页

使用 createPage 新建完整页面，仅输出 wx / ali，源码方言 wx。自定义顶部导航显示“订单”和当前可用高度，中央 scroll-view 显示 40 个订单行，底部“完成”按钮更新页面完成状态。保留提供的 info-badge 组件注册和渲染。

根容器使用逻辑 px 的窗口可用高度，顶部含状态栏、底部含安全区，均包含在根高度内部，中央列表占据剩余空间。页面显示时及 onResize 时重新调用 utils/window-info.js 的 getWindowInfo 并更新布局。公共入口保证尺寸同为逻辑 px 和相同坐标口径，生产工程的能力检测、归一、校验和缓存统一在此处理；页面不重复调用原生系统信息。示例提供 setWindowInfo 以注入验收数据。

| 数据 | 根高度 | 内部底部安全间距 |
| --- | --- | --- |
| windowHeight=640、screenHeight=800、safeArea.bottom=776 | 640px | 24px |
| 同上但 safeArea 缺失 | 640px | 0 |
| 同上但 safeArea.bottom=810 | 640px | 0 |
| 窗口变化为 windowHeight=480、screenHeight=800、safeArea.bottom=780 | 480px | 20px |

各组数据 statusBarHeight=24。状态栏区域同样计入根高度内，不得遮挡导航。

微信使用自定义导航与禁止页面滚动配置；支付宝需透明标题、点击穿透、关闭纵向回弹及固定根容器，列表自身滚动。无需下拉刷新；不能将关闭回弹等同锁定页面滚动或关闭刷新。

根据实际安装编译器及产物决定是否复用 navigationStyle 转换；尚未支持时局部动态 JSON 补齐。validation.md 附上旧版本替代配置片段，保留 usingComponents，其他平台不得落入支付宝兜底分支；不承诺自动移除宿主返回按钮。记录实际检查与未验证范围。
