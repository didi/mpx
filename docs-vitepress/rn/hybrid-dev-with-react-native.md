# 混合编写 RN 代码

在编写 Mpx 组件时，在特定情况下（处于性能考虑等因素），可能会涉及到混合开发(在 Mpx 项目内编写 RN 组件)

## 使用 RN 组件

在 Mpx 组件内引用 RN 组件，采用如下方式

- **RN 组件注册方式**：需在 components 属性下进行引用注册。
- **RN 组件的属性与事件**：属性与事件参考 RN 原生支持的属性与事件名，对应赋值方式按照 Mpx 语法进行双括号包裹，组件使用的值需要通过 REACTHOOKSEXEC 方法的返回值的方式进行声明。
- **RN 组件的样式定义**: 组件支持样式属性的透传，通过在 RN 组件上定义 styles 即可透传样式
- **其他功能**: 支持在 RN 组件内使用 slot

```javascript
<template>
    <view>
        <!-- 事件的value需要使用双括号包裹 -->
        <ScrollView onScroll="{{scrollAction}}">
          <View styles="{{viewStyle}}">
            <!-- 可混合编写mpx组件 -->
            <view>我是Mpx组件</view>
            <!-- 支持在RN组件内部定义插槽 -->
            <slot name="myslot"></slot>
          <View>
        </ScrollView>
    </view>
</template>
<script>
    import { createComponent, REACTHOOKSEXEC } from '@mpxjs/core'
    import { ScrollView } from 'react-native-gesture-handler'
    createComponent({
        components: {
            ScrollView
        }
        [REACTHOOKSEXEC](){
            return {
              viewStyle: {
                width: 200,
                height: 200
              }
            }
        }
    })
</script>
```

## 使用 React hooks

Mpx 提供了 hooks 的执行机制，通过在 Mpx 组件内注册 REACTHOOKSEXEC 方法，保障 RN 组件的初始化执行。hooks 的返回值支持数据与方法

- 模板上 RN 组件/Mpx 组件的数据渲染
- 模板上的 Props 传递
- 模板上的样式定义
- 模板上的事件的绑定与透传

```javascript
<template>
    <view>
        <ScrollView onScroll="{{onScroll}}">
            <View>
                <Text>{{count}}</Text>
            </View>
        </ScrollView>
    </view>
</template>
<script>
import { createComponent, REACTHOOKSEXEC } from '@mpxjs/core'
import { ScrollView } from 'react-native-gesture-handler'
import { View, Text} from 'react-native'
import { useState } from 'react'
createComponent({
    components: {
        ScrollView,View, Text
    },
    [REACTHOOKSEXEC](prop) {
        // 所有使用hooks的部分在此处进行注册与执行
        const [count, setCount] = useState(0);
        const onScroll = () => {
            setCount(count + 1)
        }
        // 返回值用于可用于模板上
        return {
            count,
            onScroll
        }
    }
})
</script>
```
