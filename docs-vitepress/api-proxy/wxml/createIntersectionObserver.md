## [IntersectionObserver](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/IntersectionObserver.html) mpx.createIntersectionObserver(Object component, Object options)

创建并返回一个 IntersectionObserver 对象实例。在自定义组件或包含自定义组件的页面中，应使用 `this.createIntersectionObserver([options])` 来代替。输出 RN 时，底层工厂方法要求第三个参数传入最近的滚动容器上下文；使用组件或页面实例方法时，该参数会由框架内部自动填充。

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createIntersectionObserver.html)

### 参数 {#parameters}

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

### 返回值 {#return-value}
[IntersectionObserver](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/IntersectionObserver.html)

### RN 生命周期 {#rn-lifecycle}

不再需要观察时调用 `observer.disconnect()`。该方法会释放实例持有的组件、节点和回调引用，取消待执行的测量任务，并忽略已发起测量的后续结果。重复调用是安全的；断开后的实例不能恢复观察，需要重新创建。

对已断开的实例调用 `observe()`、`relativeTo()` 或 `relativeToViewport()`，RN 会通过 Mpx 的 `warn` 提示并忽略调用，沿用现有 RN 错误处理方式，不主动抛出异常。这与微信在已观察实例上重新调用 `observe()` 或 `relativeTo()` 时抛出异常的反馈方式不同。

组件卸载时，框架会自动断开该组件创建的所有 observer。页面隐藏不等同于组件卸载；需要在隐藏期间停止观察时，应主动断开，并在页面重新显示后按需创建。

同一组节点应复用 observer，避免在每次滚动时重复创建。使用 Mpx `scroll-view` 时，开启 `enable-trigger-intersection-observer` 可在滚动时触发现有 observer 的测量；目标节点变化后，按需断开旧实例并在节点渲染完成后重新创建。
