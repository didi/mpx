# mpx-runtime-render

## 开发构建

```javascript
// development
npm run watch:mp // 小程序本地开发构建

// production
npm run build:mp // 小程序生产环境构建
```

## 一期完成的功能：

借助微信自定义组件提供的自引用递归渲染的能力来实现模板的动态渲染。

| 指令 | 支持情况 |
| - | - |
| wx:bind | 新增 wx:bind 动态传参指令，具体用法见 `src/pages/attrs/button-group.mpx` |
| wx:if/wx:elif/wx:else | 已完成 |
| wx:show | 已完成 |
| wx:for | 已完成 |
| wx:style | 已完成 |
| wx:class | 已完成 |
| wx:model | 已完成 |
| wx:ref | 已完成 |
| slot | 部分极端场景暂未处理，二期优化 |
| 动态 component 指令 | 未完全实现，二期优化 |

## 二期优化点

1. 组件级别 VNode Diff -> setData 优化

2. base.wxml 按需生成，而非全量注入

3. 运行时编译组件暂不支持通过 import -> src 模板引入，待后期处理

4. 运行时组件 template-compiler 降级方案，走原始的方案

5. 原生的运行时组件(`base.wxml`)的属性传递目前仅支持驼峰，后期可优化为连字符+驼峰

6. 输出到 `base.wxml` 属性的合并优化

7. 运行时组件的 component wx:is 指令待优化，目前支持不完善、ref 深层 slot 支持
