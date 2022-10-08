
# 全局配置

`Mpx.config` 是一个对象，包含 Mpx 的全局配置。可以在启动应用之前修改下列 property：

## useStrictDiff

- **类型**： `boolean`

- **默认值**：`false`

- **用法**：

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

- **类型**： `boolean`

- **默认值**：`false`

- **用法**：

是否忽略运行时的 warning 信息，默认不忽略。

```js
import mpx from '@mpxjs/core'
mpx.config.ignoreWarning = true
```

## ignoreProxyWhiteList

- **类型**： `Array<string>`

- **默认值**：`['id']`

- **用法**：

Mpx 实例上的 key（包括data、computed、methods）如果有重名冲突，在`ignoreProxyWhiteList`配置中的属性会被最新的覆盖；而不在`ignoreProxyWhiteList`配置中的属性，不会被覆盖。

> 只要有重名冲突均会有报错提示。

``` javascript
import mpx from '@mpxjs/core'
mpx.config.ignoreConflictWhiteList = ['id', 'test']
```

## observeClassInstance

- **类型**： `boolean`

- **默认值**：`false`

- **用法**：

当需要对 class 对象的数据进行响应性转化，需要开启该选项。

## proxyEventHandler
todo

## setDataHandler

- **类型**：`(data: object, target: ComponentIns<{}, {}, {}, {}, []>) => any | null`

- **默认值**：`null`

- **用法**：

页面/组件状态更新时，使用该方法可以对 setData 调用进行监听，可以用来统计 setData 调用次数和数据量的统计，方法的入参是 setData 传输的 data 和当前组件实例。

```js
import mpx from '@mpxjs/core'

mpx.config.setDataHandler = function(data, comp) {
    console.log('setData trigger', data, comp)
}
```

## forceFlushSync
todo

## webRouteConfig
Mpx 通过 config 暴露出 webRouteConfig 配置项，在 web 环境可以对路由进行配置

- **用法**:
```js
mpx.config.webRouteConfig = {
  mode: 'history'
}
```
