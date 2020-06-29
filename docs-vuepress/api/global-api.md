# 全局api

## createApp

## createPage

## createComponent

## createStore

## createStoreWithThis

## mixin
**全局注入mixin**

方法接收两个参数：mpx.mixin(mixins, types)

- 第一个参数是要混入的mixins，接收类型 `Array|Object`
- 第二个参数是控制将mixins混入到哪个实例上，接收参数 `String`
>types参数仅支持 String 类型，如果传递的参数为非 String 类型或不传，则走兜底逻辑，值为 ['app', 'page', 'component']

**使用**
```js
import mpx from '@mpxjs/core'
// 指定实例混入
mpx.mixin({
  methods: {
    getData: function(){}
  }
}, 'page')

// 全部实例混入，在 `app|page|component` 都会混入mixins
mpx.mixin([
  {
    methods: {
      getData: function(){}
    }
  }, 
  {
    methods: {
      setData: function(){}
    }
  }
])

// 混入结果同上
mpx.mixin([
  {
    methods: {
      getData: function(){}
    }
  }, 
  {
    methods: {
      setData: function(){}
    }
  }
], ['page'])
```
## injectMixins
该方法仅为 `mixin` 方法的一个别名，`mpx.injectMixins({})` 等同于 `mpx.mixin({})`

## toPureObject

## observable

## watch

## use

## set

## remove

## delete

## setConvertRule

## getMixin
专为ts项目提供的反向推导辅助方法，该函数接收类型为 `Object` ,会将传入的嵌套mixins对象拉平成一个扁平的mixin对象

**使用**
```js
import mpx, { createComponent } from '@mpxjs/core'
// 使用mixins，需要对每一个mixin子项进行getMixin辅助函数包裹，支持嵌套mixin
const mixin = mpx.getMixin({
  mixins: [mpx.getMixin({
    data: {
      value1: 2
    },
    lifetimes: {
      attached () {
        console.log(this.value1, 'attached')
      }
    },
    mixins: [mpx.getMixin({
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
## getComputed

## implement
