# 扩展mpx

## 开发插件

mpx支持使用mpx.use使用插件来进行扩展。插件本身需要提供一个install方法或本身是一个function，该函数接收一个proxyMPX。插件将采用直接在proxyMPX挂载新api属性或在prototype上挂属性。需要注意的是，一定要在app创建之前进行mpx.use。

简单示例如下：

```js
export default function install(proxyMPX) {
  proxyMPX.newApi = () => console.log('is new api')
  proxyMPX
    .mixin({
      onLaunch() {
        console.log('app onLaunch')
      }
    }, 'app')
    .mixin({
      onShow() {
        console.log('page onShow')
      }
    }, 'page') // proxyMPX.injectMixins === proxyMPX.mixin

    //  注意：proxyMPX.prototype上挂载的属性都将挂载到组件实例（page实例、app实例上，可以直接通过this访问）, 可以看mixin中的case
    proxyMPX.prototype.testHello = function() {
      console.log('hello')
    }
}
```

## 目前已有插件

- 网络请求库fetch: @mpxjs/fetch [详细介绍](#fetch) [源码地址](https://github.com/didi/mpx/tree/master/packages/fetch)

- 小程序API转换及promisify：@mpxjs/api-proxy [详细介绍](#api-proxy) [源码地址](https://github.com/didi/mpx/tree/master/packages/api-proxy)

- mock数据：@mpxjs/mock [详细介绍](#mock) [源码地址](https://github.com/didi/mpx/tree/master/packages/mock)
