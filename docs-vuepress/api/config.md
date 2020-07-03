# 全局配置

`Mpx.config` 是一个对象，包含 Mpx 的全局配置。可以在启动应用之前修改下列 property：

## useStrictDiff

- **类型**： `boolean`

- **默认值**：`false`

- **用法**：

``` javascript
import mpx from '@mpxjs/core'
mpx.config.useStrictDiff = true
```

是否使用严格的 diff 算法。

## ignoreRenderError

- **类型**： `boolean`

- **默认值**：`false`

- **用法**：

``` javascript
import mpx from '@mpxjs/core'
mpx.config.ignoreRenderError = true
```
当数据发生变化时，会调用 render 函数更新视图（render 函数由 template 模板转化而来）。
设置`ignoreRenderError`为`true`，会忽略 render 函数执行出错的警告。

## ignoreConflictWhiteList

- **类型**： `Array<string>`

- **默认值**：`['id']`

- **用法**：

``` javascript
import mpx from '@mpxjs/core'
mpx.config.ignoreConflictWhiteList = ['id', 'test']
```

Mpx 实例上的 key（包括data、computed、methods）如果有重名冲突，在`ignoreConflictWhiteList`配置中的属性会被最新的覆盖；而不在`ignoreConflictWhiteList`配置中的属性，不会被覆盖。
> 只要有重名冲突均会有报错提示。
