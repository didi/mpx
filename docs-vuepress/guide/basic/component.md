# 自定义组件

Mpx中的自定义组件完全基于小程序原生的自定义组件支持，与此同时，Mpx提供的数据响应和模板增强等一系列增强能力都能在自定义组件中使用。

原生自定义组件的规范详情查看[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html)

## 动态组件

Mpx中提供了使用方法类似于Vue的动态组件能力，这是一个基于wx:if实现的语法，使用示例如下：

```html
<view>
  <!--current为组件名称字符串，可选范围为局部注册的自定义组件和全局注册的自定义组件-->
  <component is="{{current}}"></component>
</view>
```
