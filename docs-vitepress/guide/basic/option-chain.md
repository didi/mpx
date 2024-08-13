# 模版内可选链表达式

Mpx提供了在模版中使用可选链`?.`访问变量属性的能力，用法/能力和JS的可选链基本一致，可以在任意被`{{}}`所包裹的模版语法内使用。
> 实现原理是在编译时将使用`?.`的部分转化为`wxs`函数调用，运行时通过`wxs`访问变量属性，模拟出可选链的效果。

使用示例：
```html
  <template>
    <view wx:if="{{ a?.b }}">{{ a?.c + a?.d }}</view>
    <view wx:for="{{ a?.d || [] }}"></view>
    <view>{{ a?.d ? 'a' : 'b' }}</view>
    <view>{{ a?.g[e?.d] }}</view>
  </template>

  <script>
    import { createComponent } from '@mpxjs/core'

    createComponent({
      data: {
        a: {
            b: true,
            c: 123,
            g: {
                d: 321
            }
        },
        e: {
            d: 'd'
        }
      }
    })
  </script>
```
