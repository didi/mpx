# 订单列表

使用 createPage 实现 feed.mpx；本地模拟每页 20 条、总共 60 条，记录 `{ id: 'order-1', title: '订单 1' }`，首次加载第一页。接口 `loadPage(page): Promise<Array>` 可通过本地模块提供，允许注入一次失败。

旧版依赖页面的 onPullDownRefresh 调用 reload、onReachBottom 调用 next、onPageScroll 直接读取 e.scrollTop。旧 JSON 为 enablePullDownRefresh:true。顶部有分类导航；滚动后显示实际 scrollTop，分页不能一次触底重复加入同一页，刷新失败后必须还能再次刷新。

内容按分组展示，组标题采用 position:sticky;top:0;background:#fff。希望所有目标保留吸顶，Skyline 与 WebView 都保留业务。分类横条第一个区域需要恰好占满视口，第二个区域需要宽 1200rpx 可继续横向滚动；原方案只有内部 flex 和 min-width。

一个“定位订单 21”按钮负责滚动到已加载的节点（未加载时先加载所需页）。旧节点 id 为 21；旧查询为：

```js
const query = mpx.createSelectorQuery()
query.in(this)
query.select('.orders .order').boundingClientRect().exec((rects) => {})
```

每个滚动区域要隐藏滚动条，原配置 `show-scrollbar="false"`。不要用全局 scrollbar CSS。模板有纵向容器和横向容器，列出对应 type 与直接子节点结构的选择。

为聚焦滚动，此案例应用层配置已正确：wx 的 Skyline/glass-easel、rendererOptions、lazyCodeLoading 与自定义导航齐全；RN 页面默认不滚动；Web 若使用内部滚动可禁用外层页面滚动。不需重建 app。
