
# 全局配置

`Mpx.config` 是一个对象，包含 Mpx 的全局配置。可以在启动应用之前修改下列 property：

## useStrictDiff

`boolean = false`

每次有数据变更时，是否使用严格的 diff 算法。如果项目中有大数据集的渲染建议使用，可以提升效率。

``` javascript
import mpx from '@mpxjs/core'
mpx.config.useStrictDiff = true
```

> 注意：由于微信小程序的bug，同时使用`useStrictDiff`和增强指令`wx:style`时，要注意更改数据的方式。如下所示：

``` javascript
// 入口文件
import mpx, { createApp } from '@mpxjs/core'
mpx.config.useStrictDiff = true

// 页面page文件
<template>
  <view>
    <view wx:style="{{style}}">test</view>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'
  createPage({
    data: {
      style: {
        color: 'red',
        fontSize: '18px'
      }
    },
    onLoad () {
      setTimeout(() => {
        this.setData({ // 当useStrictDiff设置true时，需要用setData的方式设置整个style对象
          style: {
            color: 'blue',
            fontSize: '18px'
          }
        })
        // this.style.color = 'blue' // 当useStrictDiff设置true时，不能使用这种方式，style不会生效
      }, 1000)
    }
  })
</script>
```

## ignoreWarning

`boolean = false`

是否忽略运行时的 warning 信息，默认不忽略。

```js
import mpx from '@mpxjs/core'
mpx.config.ignoreWarning = true
```

## ignoreProxyWhiteList

`Array<string> = ['id']`

Mpx 实例上的 key（包括data、computed、methods）如果有重名冲突，在`ignoreProxyWhiteList`配置中的属性会被最新的覆盖；而不在`ignoreProxyWhiteList`配置中的属性，不会被覆盖。

> 只要有重名冲突均会有报错提示。

``` javascript
import mpx from '@mpxjs/core'
mpx.config.ignoreConflictWhiteList = ['id', 'test']
```

## observeClassInstance

`boolean = false`

当需要对 class 对象的数据进行响应性转化，需要开启该选项。

## proxyEventHandler

`Function`

需要代理的事件的钩子方法，该钩子方法仅对内联传参事件或 [forceProxyEventRules](/api/compile.html#forceproxyeventrules) 规则匹配的事件生效。

```js
import mpx from '@mpxjs/core'

mpx.config.proxyEventHandler = function (event) {
    // 入参为 event 事件对象
}
```

## setDataHandler

```ts
function setDataHandler(data: object, target: ComponentIns<{}, {}, {}, {}, []>): any
```

页面/组件状态更新时，使用该方法可以对 setData 调用进行监听，可以用来统计 setData 调用次数和数据量的统计，方法的入参是 setData 传输的 data 和当前组件实例。

```js
import mpx from '@mpxjs/core'

mpx.config.setDataHandler = function(data, comp) {
    console.log('setData trigger', data, comp)
}
```

## forceFlushSync

`boolean = false`

Mpx 中更改响应性状态时，最终页面的更新并不是同步立即生效的，而是由 Mpx 将它们缓存在一个队列中， 异步等到下一个 tick 一起执行，如果想将所有队列的执行改为同步执行，我们可以通过该配置来实现。

```js
import mpx from '@mpxjs/core'

mpx.config.forceFlushSync = true
```

## webRouteConfig
Mpx 通过 config 暴露出 webRouteConfig 配置项，在 web 环境可以对路由进行配置

- **用法**:
```js
mpx.config.webRouteConfig = {
  mode: 'history'
}
```

## errorHandler

`Function`

```js
mpx.config.errorHandler = function (errmsg, location, error) {
  // errmsg: 框架内部运行报错的报错归类信息，例如当执行一个watch方法报错时，会是 "Unhandled error occurs during execution of watch callback!"
  // location: 具体报错的代码路径，可选项，不一定存在
  // error: 具体的错误堆栈，可选项，不一定存在
  // handle error
}
```

Mpx 框架运行时报错捕获感知处理函数。

* Mpx 框架生命周期执行错误；
* Mpx 中的 computed、watch 等内置方法执行报错；
* Mpx 框架的运行时的检测报错，例如存在目标平台不支持的属性，入参出参类型错误等；

同时被捕获的错误会通过 console.error 输出。
