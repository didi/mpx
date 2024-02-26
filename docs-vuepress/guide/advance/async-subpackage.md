# 分包异步化

>在小程序中，不同的分包对应不同的下载单元；因此，除了非独立分包可以依赖主包外，分包之间不能互相使用自定义组件或进行 require。
「分包异步化」特性将允许通过一些配置和新的接口，使部分跨分包的内容可以等待下载后异步使用，从而一定程度上解决这个限制。

具体功能介绍和功能目的可 [点击查看](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html), Mpx对于分包异步化功能进行了完整支持。

## 跨分包自定义组件引用
>一个分包使用其他分包的自定义组件时，由于其他分包还未下载或注入，其他分包的组件处于不可用的状态。通过为其他分包的自定义组件设置 占位组件，
我们可以先渲染占位组件作为替代，在分包下载完成后再进行替换。
> 
在 Mpx 中使用跨分包自定义组件引用通过?root声明组件所属异步分包即可使用，示例如下：
```html
<!--/packageA/pages/index.mpx-->
// 这里在分包packageA中即可异步使用分包packageB中的hello组件
<script type="application/json">
  {
    "usingComponents": {
      "hello": "../../packageB/components/hello?root=packageB",
      "simple-hello": "../components/hello"
    },
    "componentPlaceholder": {
      "hello": "simple-hello"
    }
  }
</script>
```
- 注意项：目前该能力仅微信平台下支持，其他平台下框架将会自动降级

## 跨分包 JS 代码引用
>一个分包中的代码引用其它分包的代码时，为了不让下载阻塞代码运行，我们需要异步获取引用的结果

在 Mpx 中跨分包异步引用 JS 代码时，**需要在引用的 JS 路径后拼接 JS 模块所在的分包名**，此外由于 **require** 不能传入多个参数的限制，在Mpx中无法使用回调函数的
风格跨分包 JS 代码引用，只能使用 Promise 风格。

示例如下：
```js
// subPackageA/index.js
// 或者使用 Promise 风格的调用
require.async('../commonPackage/index.js?root=subPackageB').then(pkg => {
  pkg.getPackageName() // 'common'
})
```
- 注意项：目前该能力仅微信平台下支持，其他平台下框架将会自动降级

## 跨分包 Store 引用
在 Mpx 中如果想要跨分包异步引用 Store 代码，分为三个步骤
- 页面或父组件在 `created` 钩子加载异步 Store
- 异步 Store 加载完成后再渲染使用异步 Store 的组件
- 子组件在框架内部生命周期 `BEFORECREATE` 钩子中动态注入 computed 和 methods
```html
<!--pages/index/index.mpx-->
<template>
  <store-list wx:if="{{showStoreList}}"></store-list>
</template>

<script>
  import { createPage } from '@mpxjs/core'
  createPage({
    data: {
      showStoreList: false
    },
    created () {
      require.async('../subpackages/sub2/store?root=sub2').then(store => {
        getApp().asyncStore.sub2 = store.default
        // 当异步 Store 加载完成后再渲染使用异步 Store 的组件
        this.showStoreList = true
      })
    }
  })
</script>

<!-- 子组件:store-list -->
<script>
  import { createComponent, BEFORECREATE } from '@mpxjs/core'
  createComponent({
    // 在 BEFORECREATE 钩子中动态注入 options
    [BEFORECREATE] () {
      // 获取异步 Store实例
      const subStore = getApp().asyncStore.sub2
      // computed 中 mapState、mapGetters 替换为 mapStateToInstance、mapGettersToInstance，最后一个参数必须传当前 component 实例 this
      subStore.mapStateToInstance(['pagename'], this)
      subStore.mapGettersToInstance(['pageDataGetter'], this)
      // methods 中 mapActions、mapMutations 替换为 mapMutationsToInstance、mapActionsToInstance，最后一个参数必须传当前 component 实例 this
      subStore.mapMutationsToInstance(['updatePageData'], this)
      subStore.mapActionsToInstance(['updatePageName'], this)
    }
  })
</script>
```
- 注意项：目前该能力仅微信平台下支持，其他平台下框架将会自动降级

