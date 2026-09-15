# 输出 web 支持 watch 选项多个值

## 需求描述

在使用 mpx 输出 web 端代码时，watch 选项直接透传到 Vue，只能配置一个值，无法配置用逗号分隔的多个值，但是在输出小程序时支持了该能力，示例如下

```js
watch: {
  'a.b,c': {
    handler(newVal, oldVal) {
      // newVal和oldVal为[a.b, c]的数组
      console.log('a.b or c changed')
    }
  }
}
```

期望输出web时对该能力进行拉齐，即watch选项支持用逗号分隔的多个值。

## 实现方案

小程序内的实现在`packages/core/src/core/proxy.js`中，对watch选项进行了处理，当watch选项为字符串时，会根据逗号分隔符将其转换为数组，然后对数组中的每个元素进行监听

输出web时我们可以代理`Vue.prototype.$watch`函数，该函数第一个参数expOrFn支持传入单值表达式如`a.b`或一个追踪函数，我们代理该函数当传入的expOrFn中带有逗号分隔符时，将其转换为一个函数，该函数返回符合预期的数组，来进行抹平实现，代理的逻辑可以放在`/Users/didi/work/mpx/packages/core/src/platform/env/vuePlugin.js`中

