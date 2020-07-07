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


## ignoreRenderError

- **类型**： `boolean`

- **默认值**：`false`

- **用法**：

当数据发生变化时，会调用 render 函数更新视图（render 函数由 template 模板转化而来）。
设置`ignoreRenderError`为`true`，会忽略 render 函数执行出错的警告。

``` javascript
import mpx from '@mpxjs/core'
mpx.config.ignoreRenderError = true
```

## ignoreConflictWhiteList

- **类型**： `Array<string>`

- **默认值**：`['id']`

- **用法**：

Mpx 实例上的 key（包括data、computed、methods）如果有重名冲突，在`ignoreConflictWhiteList`配置中的属性会被最新的覆盖；而不在`ignoreConflictWhiteList`配置中的属性，不会被覆盖。

> 只要有重名冲突均会有报错提示。

``` javascript
import mpx from '@mpxjs/core'
mpx.config.ignoreConflictWhiteList = ['id', 'test']
```
