# 单文件开发

小程序规范中每个页面和组件都是由四个文件描述组成的，wxml/js/wxss/json，分别描述了组件/页面的视图模板，执行逻辑，样式和配置，由于这四个部分彼此之间存在相关性，比如模板中的组件需要在json中注册，数据需要在js中定义，这种离散的文件结构在实际开发的时候体验并不理想；受Vue单文件开发的启发，Mpx也提供了类似的单文件开发模式，拓展名为.mpx。

从下面的简单例子可以看出，.mpx中的四个区块分别对应了原生规范中的四个文件，Mpx在执行编译构建时会通过内置的`mpx-loader`收集依赖，并将.mpx的文件转换输出为原生规范中的四个文件。

```html
<!--对应wxml文件-->
<template>
  <list></list>
</template>
<!--对应js文件-->
<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    onLoad () {
    },
    onReady () {
    }
  })
</script>
<!--对应wxss文件-->
<style lang="stylus">
</style>
<!--对应json文件-->
<script type="application/json">
  {
    "usingComponents": {
      "list": "../components/list"
    }
  }
</script>
```


