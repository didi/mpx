# 单元测试

Mpx会生成源码与最终产物包的映射关系，结合微信小程序提供的 [miniprogram-simulate](https://github.com/wechat-miniprogram/miniprogram-simulate) 来进行单元测试的工作。

> 因为目前仅微信提供了仿真工具，暂时只支持微信小程序平台的单元测试。如果需要E2E测试，则和框架无关了，可参考微信的[小程序自动化](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/)。

## 简单的断言

组件必须是被项目真实使用的，且经过一次构建才可被测试。

```html
<template>
  <view>{{ message }}</view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    data: {
      message: 'hello!'
    },
    ready () {
      this.message = 'bye!'
    }
  })
</script>
```

