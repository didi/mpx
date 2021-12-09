# 内建组件

## component


- **属性**：

  - ` is `  - string | ComponentName

- **用法**：

  动态渲染组件，通过改变` is `的值，来渲染不同的组件

  ```html
    <!-- ComponentName 是在全局或者组件中完成注册的组件名称 -->
    <component is="{{ComponentName}}"></component>
  ```

- **参考**：[动态组件](../guide/basic/component.md#动态组件)

## slot

- **属性**：

  - ` name `  - string，用于命名插槽

- **用法**：

  ` <slot> ` 元素作为组件模板中的内容分发插槽，` <slot> `元素自身将被替换。

  详细用法，可参考下面的链接。

- **参考**：[slot](../guide/basic/component.md#slot)
