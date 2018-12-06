# 更新记录

### 当前版本
- mpx@1.2.12
- mpx-ant@1.0.1
- mpx-cli@0.1.9
- mpx-webpack-plugin@2.0.10

### 升级详情

- 2018.11.7 `mpx` version: 1.2.12 修复mergeData的bug以及deep watch

- 2018.11.1 `mpx-webpack-plugin` version: 2.0.9 修复样式写scoped导致的问题

- 2018.8.21 `mpx-webpack-plugin` version: 2.0.6 修复windows兼容问题

- 2018.8.14 `mpx-webpack-plugin` version: 2.0.5 支持微信小程序plugin中的page域

- 2018.7.30
  - `mpx-webpack-plugin` version: 2.0.4 编译支持支付宝小程序及webpack4
  - `mpx-template`升级，使用`mpx-cli`生成项目基于webpack4进行编译，init时mode选择ali生成支付宝小程序项目模板

- 2018.7.27
	- `mpx` version: 1.2.10, 优化目录结构
	- `mpx-ant` version: 1.0.1 支付宝版的mpx，除了原生小程序本身的差异之外，其他都一致

- 2018.7.23 `mpx` version: 1.2.9, bugfix 组件删除后立马创建会出现detached的执行在created回调之后

- 2018.7.21 `mpx` version: 1.2.8, 优化watcher，使用watcher队列进行处理，提升渲染性能。导出globalApi [watch](api.md), 移除globalApi【reaction】

- 2018.7.16
	- `mpx` version: 1.2.6, 设定$forceUpdate修改的数据优先级高于【forceDiffKeys】
	- `mpx-webpack-plugin` version: 1.0.0, 支持小程序分包加载, 废弃page的npm引入, [了解更多](jsonEnhance/index.md#packages)

- 2018.7.12 `mpx` version: 1.2.4, 创建组件或页面时可以指定一个[forceDiffKeys]\(已废弃)，来强制进行diff某些属性，主要用于处理`小程序原生组件（比如map）`在setData同样的值时会导致某些副作用（自定义组件一般不需要关心）

- 2018.7.9 `mpx` version: 1.2.3, 优化store action的执行时机（之前版本是延迟执行）

- 2018.7.9 `mpx` version: 1.2.2, 优化代码结构 & bugfix 某些情况下组件（创建后立马销毁）attached执行时机晚于detached的bug

- 2018.7.3 `mpx` version: 1.2.1, 处理自定义事件名为begin&end的case

- 2018.7.3 `mpx` version: 1.2.0, bugfix, 原生小程序的Page创建时会进行一次深拷贝，但是对`实例对象`(new创建的对象)的拷贝存在一定的问题，会导致实例对象的引用属性被修改（比较严重，建议升级）

- 2018.6.26 `mpx` version: 1.1.10, 移除use插件时的拦截操作，导出api: [reaction, extendObservable](api.md)

- 2018.6.21 `mpx` version: 1.1.9, mpx导出创建响应式数据的api [observable](api.md)

- 2018.6.15
	- `mpx` version: 1.1.8, 优化在一个tick内，value变化: 1 - 2 - 1 仍会触发watch的问题
	- `mpx-webpack-plugin` version 0.1.30, 处理对同一组件的引入名字不同会导致component not found的bug


- 2018.6.14 `mpx` version: 1.1.7, bugfix 修复某些情况下子组件无法获取properties的bug

- 2018.6.11 `mpx` version: 1.1.5, bugfix 修复分享onShareAppMessage放在外层不生效的bug

- 2018.6.6 `mpx` version: 1.1.4, [支持input使用wx:model](templateEnhance/wxmodel.md), (依赖@didi/mpx-webpack-plugin@0.1.27)

- 2018.6.5 `mpx` version: 1.1.3, bugfix 清理watcher错误，feature: store中action将一直返回promise

- 2018.5.31 `mpx` version: 1.1.2, bugfix，处理父子组件之间通过properties传递计算属性的bug，兼容使用createComponent来创建页面（可以挂载page支持的所有事件，自定义方法必须写在methods里面）

- 2018.5.27 `mpx` version: 1.1.1, bugfix，处理插件挂载的非可枚举属性

- 2018.5.26 `mpx` version: 1.1.0, 新增实例属性的挂载新方式，详情请看[扩展相关文档](extend/index.md)
- 2018.5.26 `@didi/mpx-fetch` version: 2.0.0, [详情请看](extend/fetch.md)

- 2018.5.9 `mpx` version: 1.0.15, 优化代码逻辑，处理$updated(callback)可能存在的问题

- 2018.5.8 `mpx` version: 1.0.14, 性能优化实例方法$forceUpdate

- 2018.5.7 `mpx` version: 1.0.13, 扩展实例方法$forceUpdate，支持传递参数
	- this.$forceUpdate(params)
	- this.$forceUpdate(callback)
	- this.$forceUpdate(params, callback)


- 2018.4.24 `mpx` version: 1.0.12, page & component 添加实例方法$forceUpdate，用于强制同步进行setData

- 2018.4.20 `mpx` version: 1.0.11, createApp将自动转换methods属性，将methods内定义的方法挂载到app实例上（类似createPage）；fix pageShow & pageHide 钩子存在mixin时会被覆盖的bug

- 2018.4.17

  `mpx-webpack-plugin` version 0.1.22 支持app.json中的拓展语法packages域，用于声明内含多页面的依赖，如登录sdk等，使用详细请查看[packages文档](jsonEnhance/packages.md)

- 2018.4.8 `mpx` version: 1.0.10 bugfix，fix mapGetters时无法导出子store的getters

- 2018.4.4 `mpx` version: 1.0.9 全局暴露mixin api，[mpx.mixin(options)](api.md)

- 2018.4.4

	`mpx-webpack-plugin` version: 0.1.19 支持mpx新的事件绑定方式（需要在loader调用设置`compileBindEvent`: true）；处理json内部的资源引入问题；
	`enhanced-url-loader` 新增loader，只对css内部的图片引用转成base64，其他引入都是转换成本地路径

	`mpx` version: 1.0.8 处理生命周期钩子拿不到参数的bug；预支持事件绑定的新用法(***依赖于 mpx-webpack-plugin@0.1.19***)

	```html
		<view bindtap="handle($event, test, 1)"></view>
		<view wx:for="items" bindtap="handle(item, index)"></view>
	```

- 2018.3.29
    `mpx` version: 1.0.7  fix bug，如果使用wx:if，其值属于data却非data的***自身属性***，若内部包含自定义组件将会出现渲染性错误

    `mpx-webpack-plugin` version: 0.1.15 支持cover-image:src的编译；支持component中定义pageShow和pageHide钩子；mpxloader支持传递transRpx:true参数来将样式中px全部转换为rpx；支持使用/* use px*/注释对某些样式项忽略该转换

- 2018.3.28  `mpx` version: 1.0.6  支持使用[mpx.use](extend/index.md)添加外部扩展，且注入mixins；新增[createApp](app.md)；组件新增[pageShow & pageHide](scriptEnhance/lifeCycle.md) 两个钩子；createPage支持使用[methods](page.md)

- 2018.3.26  `mpx` version: 1.0.5  移除combineStore; createStore增强，[支持deps来注入外部store](store/multiins.md)

- 2018.3.23  `mpx` version: 1.0.4  新增feature：增加[createPage](page.md)功能

- 2018.3.22  `mpx` version: 1.0.3  新增feature：增加[mixins](scriptEnhance/mixins.md)功能

- 2018.3.19  `mpx` version: 1.0.2  修复bug：不传watch导致undefined的bug
