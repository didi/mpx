## [IntersectionObserver](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/IntersectionObserver.html) mpx.createIntersectionObserver(Object component, Object options)

创建并返回一个 IntersectionObserver 对象实例。在自定义组件或包含自定义组件的页面中，应使用 this.createIntersectionObserver([options]) 来代替。

支持情况： 微信、支付宝、web、RN、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createIntersectionObserver.html)

### 参数

**Object component**

自定义组件实例

**Object options**

选项

| 属性         | 类型    | 默认值 | 必填 | 说明                                                                                                   | 最低版本 |
| ------------ | ------- | ------ | ---- | ------------------------------------------------------------------------------------------------------ | -------- |
| thresholds   | Array.&lt;number&gt;   | [0]    | 否   | 一个数值数组，包含所有阈值。                                                                           |          |
| initialRatio | number  | 0      | 否   | 初始的相交比例，如果调用时检测到的相交比例与这个值不相等且达到阈值，则会触发一次监听器的回调函数。     |          |
| observeAll   | boolean | false  | 否   | 是否同时观测多个目标节点（而非一个），如果设为 true ，observe 的 targetSelector 将选中多个节点（注意：同时选中过多节点将影响渲染性能） | 2.0.0    |
| nativeMode   | boolean | false  | 否   | 是否使用原生观察器模式。                                                                              | 3.5.7    |

### 返回值
[IntersectionObserver](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/IntersectionObserver.html)