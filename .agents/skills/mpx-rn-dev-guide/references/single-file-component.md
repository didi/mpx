# 单文件开发 {#single-file-development}

小程序规范中每个页面和组件都是由四个文件描述组成的，wxml/js/wxss/json，分别描述了组件/页面的视图模板，执行逻辑，样式和配置，由于这四个部分彼此之间存在相关性，比如模板中的组件需要在 json 中注册，数据需要在 js 中定义，这种离散的文件结构在实际开发的时候体验并不理想；受 Vue 单文件开发的启发，Mpx 也提供了类似的单文件开发模式，拓展名为.mpx。

Mpx 单文件组件（SFC）格式 `.mpx` 是一种将组件的视图模板、组件逻辑、组件样式和组件配置封装在一个文件中的开发模式。每个 `.mpx` 文件都包含了以下几个部分：

- template 区块：定义组件的视图结构，基于微信小程序的基础模板语法，结合 Mpx 拓展支持的类 Vue 模版指令，如 `wx:style`、`wx:class`、`wx:model`、`wx:ref` 等，对应微信小程序的 `.wxml` 部分
- script 区块：定义组件的逻辑，基于微信小程序的基础组件语法，结合 Mpx 拓展支持的类 Vue 组件语法，如 数据响应、组合式 API 等，对应微信小程序的 `.js` 部分
- style 区块：定义组件的样式，支持 CSS 预处理（如 Stylus、Sass、Less 等），跨端输出 RN 时存在较强约束限制，对应微信小程序的 `.wxss` 部分
- json 区块：定义组件的配置，支持微信小程序的组件配置选项，对应微信小程序的 `.json` 部分

示例如下：

```html
<template>
  <!--动态样式-->
  <view class="container" wx:style="{{dynamicStyle}}">
    <!--数据绑定-->
    <view class="title">{{title}}</view>
    <!--计算属性数据绑定-->
    <view class="title">{{reversedTitle}}</view>
    <view class="list">
      <!--循环渲染，动态类名，事件处理内联传参-->
      <view wx:for="{{list}}" wx:key="id" class="list-item" wx:class="{{ {active:item.active} }}"
            bindtap="toggleActive(index)">
        <view>{{item.content}}</view>
      </view>
    </view>
    <!-- wx:ref 标记 ref 名；布局完成后在 setup 中用 context.refs.ci、选项式中用 this.$refs.ci 取自定义组件实例 -->
    <custom-input wx:ref="ci" wx:model="{{customInfo}}" wx:model-prop="info" wx:model-event="change"/>
    <!--动态组件，is传入组件名字符串，可使用的组件需要在json中注册，全局注册也生效-->
    <component is="{{current}}"></component>
    <!--显示/隐藏dom-->
    <view class="bottom" wx:show="{{showBottom}}">
      <!-- 模板节点条件编译，非目标平台的节点不会进入产物 -->
      <view @wx>wx mode</view>
      <view @ali>ali mode</view>
    </view>
  </view>
</template>

<script>
  import { createPage, ref, computed, watch, onMounted } from '@mpxjs/core'

  createPage({
    setup (props, context) {
      const dynamicStyle = ref({
        fontSize: '16px',
        color: 'red'
      })
      const title = ref('hello world')
      const list = ref([
        {
          content: '全军出击',
          id: 0,
          active: false
        },
        {
          content: '猥琐发育，别浪',
          id: 1,
          active: false
        }
      ])
      const customInfo = ref({
        title: 'test',
        content: 'test content'
      })
      const current = ref('com-a')
      const showBottom = ref(false)

      const reversedTitle = computed(() => title.value.split('').reverse().join(''))

      watch(title, (val, oldVal) => {
        console.log(val, oldVal)
      }, { immediate: true })

      function toggleActive (index) {
        list.value[index].active = !list.value[index].active
      }

      // 页面下 onMounted 对应小程序页面的 onReady（组件对应 ready）；此时可安全读取 wx:ref
      onMounted(() => {
        const ciIns = context.refs.ci
        if (ciIns) {
          // 拿到 custom-input 组件实例，可调用其对外暴露的 methods 等（以子组件实际导出为准）
          // 例如：ciIns.focus()
          console.log('custom-input instance', ciIns)
        }
        setTimeout(() => {
          title.value = '你好，世界'
          current.value = 'com-b'
        }, 1000)
      })

      return {
        dynamicStyle,
        title,
        list,
        customInfo,
        current,
        showBottom,
        reversedTitle,
        toggleActive
      }
    }
  })
</script>

<script type="application/json">
  {
    "usingComponents": {
      "custom-input": "../components/custom-input",
      "com-a": "../components/com-a",
      "com-b": "../components/com-b"
    }
  }
</script>

<style lang="stylus">
  .container
    flex 1
</style>
```
