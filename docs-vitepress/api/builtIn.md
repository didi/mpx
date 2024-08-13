# 内建组件

## component

- is `string` : 动态渲染组件，通过改变` is `的值，来渲染不同的组件

- range `string` : 使用 range 来指定可能渲染的组件，不传递时则为 全局注册 + usingComponents 中注册的所有组件，存在多个组件时使用逗号 `,` 分隔

```html
  <!-- ComponentName 是在全局或者组件中完成注册的组件名称 -->
  <component is="{{ComponentName}}"></component>

  <!-- 只会展示 compA 或者 compB 组件 -->
  <component is="{{ComponentName}}" range="compA,compB"></component>
```

**参考**：[动态组件](../guide/basic/component.md#动态组件)

## slot

- name `string` : 用于命名插槽

` <slot> ` 元素作为组件模板中的内容分发插槽，` <slot> `元素自身将被替换。

详细用法，可参考下面的链接。

**参考**：[slot](../guide/basic/component.md#slot)
