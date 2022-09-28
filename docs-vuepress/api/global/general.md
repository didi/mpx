# 辅助 API

## toPureObject

- **参数**：
    - `{Object} options`

- **用法**:

业务拿到的数据可能是响应式数据实例（包含了些其他属性），使用`toPureObject`方法可以将响应式的数据转化成纯 js 对象。

```js
import {toPureObject} from '@mpxjs/core'
const pureObject = toPureObject(object)
```

## getMixin
专为ts项目提供的反向推导辅助方法，该函数接收类型为 `Object` ,会将传入的嵌套mixins对象拉平成一个扁平的mixin对象

**使用**
```js
import { createComponent, getMixin} from '@mpxjs/core'
// 使用mixins，需要对每一个mixin子项进行getMixin辅助函数包裹，支持嵌套mixin
const mixin = getMixin({
  mixins: [getMixin({
    data: {
      value1: 2
    },
    lifetimes: {
      attached () {
        console.log(this.value1, 'attached')
      }
    },
    mixins: [getMixin({
      data: {
        value2: 6
      },
      created () {
        console.log(this.value1 + this.value2 + this.outsideVal)
      }
    })]
  })]
})
/*
mixin值
{
  data: {value2: 6, value1: 2},
  created: ƒ created(),
  attached: ƒ attached()
}
*/
createComponent({
  data: {
    outsideVal: 20
  },
  mixins: [mixin]
})

/*
以上执行输出：
28
2 "attached"
*/
```


## implement

- **参数**：
  - `{String} name`
  - `{Object} options`
    - `{Array} modes`：需要取消的平台
    - `{Boolean} remove`：是否将此能力直接移除
    - `{Function} processor`：设置成功的回调函数


- **用法**:

以微信为 base 将代码转换输出到其他平台时（如支付宝、web 平台等），会存在一些无法进行模拟的跨平台差异，会在运行时进行检测并报错指出，例如微信转支付宝时使用 moved 生命周期等。使用`implement`方法可以取消这种报错。您可以使用 mixin 自行实现跨平台差异，然后使用 implement 取消报错。

```js
import {implement} from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  const processor = () => {
  }
  implement('onShareAppMessage', {
    modes: ['web'], // 需要取消的平台，可配置多个
    remove: true, // 是否将此能力直接移除
    processor // 设置成功的回调函数
  })
}
```
