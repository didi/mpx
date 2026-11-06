# 商品卡片

工程使用当前仓库版本，并通过完整 App 构建接入支付宝；框架默认兼容样式已加载，业务未覆盖 text 的 white-space 继承。原父容器单行省略写法不作为支付宝待修复缺陷，保留或调整均以实际效果为准。

新建完整 product-card.mpx，复现并修复以下原始设计。输入 props 为 title:string、imageUrl:string，父组件会更新它们。业务重点是视觉布局，不需要网络加载。

原模板/样式片段：

```html
<view class="card">
  <view class="hero"><image src="{{imageUrl}}" mode="aspectFit" class="photo" /></view>
  <view class="title-wrap"><text>{{title}}</text></view>
  <view class="summary"><text>库存充足</text></view>
  <view class="details"><view class="detail-heading"><text>配送说明</text></view></view>
  <view class="stats"><view class="stat"><text>销量 9</text></view><view class="stat"><text>收藏 5</text></view></view>
  <text class="rich">保障<view class="badge"><text>官方</text></view></text>
</view>
```

```css
.card { width: 600rpx; }
.hero { display: grid; grid-template-columns: 1fr; }
.hero image { width: 240rpx; height: 80rpx; padding: 24rpx; }
.title-wrap { width: 240rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 24rpx; }
.summary { margin-top: 12rpx; }
.details { margin-top: 20rpx; }
.detail-heading { margin-top: 12rpx; }
.stats { display: flex; flex-direction: column; }
.stat { margin-top: 8rpx; margin-bottom: 8rpx; }
.badge { color: #1677ff; }
@media screen and (max-width: 400px) { .card { width: 560rpx; } }
```

原 WebView 实测：title-wrap 和 summary 是普通块级兄弟，中间有效间距 24rpx；details 与首子节点之间无 border/padding/格式化上下文，顶部折叠后 20rpx；stats 的两个 flex item 之间 16rpx。这些数值是验收基线。

图片内容区域保持 240×80rpx，四周留白各 24rpx。标题超过宽度时只显示一行并打点。保障与官方标签可改成横向相邻节点，不能丢失文本。窄屏阈值为窗口宽度 400px，切换窗口宽度时应更新。

demo.mpx 中另有 `.badge { color: red; }`，商品卡内部官方标签应保持蓝色，兄弟卡片和页面不得受组件样式污染。不需要实现事件和动态类名的独立教程。
