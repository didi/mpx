# 资源路径获取

Mpx在构建时，如果引用的页面不存在于当前 app.mpx 所在的上下文中，例如存在于 npm 包中，为避免和本地声明的其他 page 路径冲突，Mpx 会对页面路径进行 hash 化处理；
处理组件路径时也会添加 hash 防止路径名冲突，hash 化处理后最终的文件名是 name+hash+ext 的格式；对于图片等资源路径输出也会进行 hash 化处理。

开发者经常会面临以下问题：

* 希望获取 hash 化之后的页面/组件/图片路径
* 在页面路径变化时(分包名更改或页面名修改)，需要手动修改散落在代码中各处写死的资源路径

## ?resolve
为了解决以上开发者痛点，Mpx 框架提供了资源路径自动获取能力，只需要在资源引用路径后加上?resolve，
Mpx 在编译时会生成一个资源路径处理模块，该模块暴露出资源对应的真实输出路径，从而可以实现在页面/组件/图片路径变化时正确获取输出路径，并避免写死资源路径。

获取并使用页面路径
```js
// app.json 中注册分包，此处仅列出 packages 语法示例
{
    packages: [
        '@someNpm/app.mpx?root=someNpm'
    ]
}

// import 语法获取并使用页面路径
import subPackageIndexPage from '@someNpm/subpackage/pages/index.mpx?resolve'
mpx.navigateTo({
    url: subPackageIndexPage
})

// require 语法获取并使用页面路径
mpx.navigateTo({
    url: require('@someNpm/subpackage/pages/index.mpx?resolve')
})
```

获取并使用组件资源路径
> 我们在使用小程序 relations 语法时，需要获取组件路径，这时就可使用 ?resolve 语法

```js
import { createComponent } from '@mpxjs/core'
import someComponentItem from './some-component-item?resolve'

createComponent({
    relations: {
        [someComponentItem]: {
            type: 'child'
        }
    }
})
```

获取并使用图像资源路径

```html
<template>
    <view wx:style="{{someStyle}}">test</view>
</template>

<script>
    import mpx, { createPage } from '@mpxjs/core'
    import iconPath from '../assets/icon.png?resolve'
    
    createPage({
        computed: {
            someStyle() {
                return `background-image url(${iconPath})`
            }
        }
    })
</script>
```
