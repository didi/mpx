# 使用原子类

原子类(utility-first CSS)
是近几年流行起来的一种全新的样式编写方式，在前端开发社区内取得了良好的口碑，越来越多的主流网站也基于原子类进行开发，我们耳熟能详的有[Github](https://github.com/)，[OpenAI](https://openai.com/)，[Netflix](https://top10.netflix.com/)
和[NASA官网](https://www.jpl.nasa.gov/)
等。使用原子类离不开原子类框架的支持，常用的原子类框架有 [Tailwindcss](https://tailwindcss.com/)、[Windicss](https://windicss.org/)
和 [Unocss](https://unocss.dev/) 等，而在 **Mpx2.9** 以后，我们在框架中内置了基于 unocss
的原子类支持，让小程序开发也能使用原子类。对项目进行简单配置开启原子类支持后，用户就可以在 Mpx
页面/组件模板中直接使用一些预定义的基础样式类，诸如flex，pt-4，text-center 和 rotate-90 等，对样式进行组合定义，下面是一个简单示例：

```html

<view class="container">
  <view class="flex">
    <view class="py-8 px-8 inline-flex mx-auto bg-white rounded-xl shadow-md">
      <view class="text-center">
        <view class="text-base text-black font-semibold mb-2">
          Erin Lindford
        </view>
        <view class="text-gray-500 font-medium pb-3">
          Product Engineer
        </view>
        <view
          class="mt-2 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-solid border-purple-200">
          Message
        </view>
      </view>
    </view>
  </view>
</view>
```

通过这种方式，我们在不编写任何自定义样式代码的情况下得到了一张简单的个人卡片，实际渲染效果如下：

![utility-css-demo](https://dpubstatic.udache.com/static/dpubimg/Or3aaN-mmxV8pK-LmEVPm_demo.png)

相较于传统的自定义类编写样式的方式，使用原子类能给你带来以下这些好处：

- **不用再烦恼于为自定义类取类名**，传统样式开发中，我们仅仅是为某个元素定义样式就需要绞尽脑汁发明一些抽象的类名，还得提防类名冲突，使用原子类可以完全将你从这种琐碎无趣的工作中解放；
- **停止css体积的无序增长**，传统样式开发中，css体积会随着你的迭代不断增长，而在原子类中，一切样式都可以复用，你几乎不需要编写新的css；
- **让调整样式变得更加安全**，传统css是全局的，当你修改某个样式时无法保障其不会破坏其他地方的样式，而你在模板中使用的原子类是本地的，你完全不用担心修改它会影响其他地方。

而相较于使用内联样式，原子类也有一些重要的优势：

- **约束下的设计**，使用内联样式时，里面的每一个数值都是魔法数字(magic number)
  ，而通过原子工具类，你可以选择一些符合预定义设计规范的样式，便于构筑具有视觉一致性的UI；
- **响应式设计**，你无法在内联样式中使用媒体查询，然而通过原子类框架中提供的响应式工具，你可以轻而易举地构建出响应式界面；
- **Hover、focus和其他状态**，使用内联样式无法定义特定状态下的样式，如hover和focus，通过原子类框架的状态变量能力，我们可以轻松为这些状态定义样式。

看到这里相信你已经迫不及待地想要在 Mpx 中体验原子类开发了吧，可以根据下面的指南开启你的原子类之旅。

## 原子类环境配置

如果你想在新项目中使用原子类，可以使用最新版本的 `@mpxjs/cli` 创建项目，在 prompt 中选择使用原子类，就可以在新创建的项目模版中直接使用
unocss 的原子类，关于可使用的工具类可参考 [unocss 交互示例](https://unocss.dev/interactive/)
及本指南下方的[工具类支持范围](#工具类支持范围)。

> 与 web 中使用 unocss 不同，在 Mpx 中使用 unocss 不需要显式引入虚拟模块 `import 'uno.css'` 来承载生成的样式内容，这是由于在
> Mpx 中，我们充分考虑到小程序分包架构的特殊性和主包体积的重要性，结合 Mpx
> 强大的分包构建能力，对生成的原子工具类的使用情况进行分析，将其自动注入到合适的主包或者分包中，来达到全局体积分配的最优（在没有内容冗余的情况下尽可能输出到分包）。

对于使用 `@mpxjs/cli@3.0` 新版脚手架创建的项目，可以在项目初始化时选择`需要使用原子类`
选项，或在已有项目下执行`mpx add @mpxjs/vue-cli-plugin-mpx-utility-first-css`以激活原子类相关编译配置。

对于使用旧版脚手架创建的项目，可以通过修改项目编译配置以激活原子类支持：

1. 安装相关依赖：

```json5
{
  //...
  "devDependencies": {
    "@mpxjs/unocss-base": '^2.9.0',
    "@mpxjs/unocss-plugin": '^2.9.0'
  }
}
```

2. 新建uno.config.js，基础配置内容如下：

```js
const { defineConfig } = require('unocss')
const presetMpx = require('@mpxjs/unocss-base')

module.exports = defineConfig({
  presets: [
    presetMpx()
  ]
})
```

3. 注册`MpxUnocssPlugin`，在`build/getPlugins`中添加如下代码：

```js
const MpxUnocssPlugin = require('@mpxjs/unocss-plugin')
// ...
plugins.push(new MpxUnocssPlugin())
```

即可在项目模版中使用基于`unocss`的原子类功能，`unocss`默认的preset兼容`tailwindcss`/`windicss`
，可以通过查阅[tailwindcss文档](https://tailwindcss.com/docs/installation)、[windicss文档](https://windicss.org/utilities/general/colors.html)
或[unocss可交互文档](https://unocss.dev/interactive/)进行探索使用。

关于`uno.config.js`可用配置项及`@mpxjs/unocss-plugin`及`@mpxjs/unocss-base`的配置项请参考[API文档](todo)

## 功能支持范围

我们支持了`unocss`大部分的配置项及功能，并针对小程序技术规范提供了一些额外的功能支持，如分包输出和样式隔离等功能，以下为详细功能支持范围。

| 功能                | 支持度  | 备注                                                        |
|:------------------|:-----|:----------------------------------------------------------|
| Load Config       | 支持   | 支持windi默认的全部配置文件路径，并支持在plugin options中手动传入配置对象或配置文件路径     |
| Rules             | 支持   |                                                           |
| Shortcuts         | 支持   |                                                           |
| Theme             | 支持   |                                                           |
| Variants          | 支持   |                                                           |
| Extractors        | 不支持  |                                                           |
| Transformers      | 部分支持 | 内建支持variant groups、directives和alias，不支持自定义transformers    |
| Preflights        | 支持   | 支持内建和自定义preflight配置                                       |
| Presets           | 支持   |                                                           |
| Safelist          | 支持   | 支持全局配置和模版注释语法局部配置声明safelist                               |
| Value Auto-infer  | 支持   |                                                           |
| Variant Groups    | 支持   |                                                           |
| Directives        | 支持   |                                                           |
| Alias             | 支持   |                                                           |
| Attributify Mode  | 不支持  | 小程序模版不支持不识别的自定义属性                                         |
| Responsive Design | 支持   |                                                           |
| Dark Mode         | 支持   |                                                           |
| Important Prefix  | 支持   |                                                           |
| Layers Ordering   | 支持   |                                                           |
| 分包输出/公共样式抽离       | 支持   | 可通过设置`@mpxjs/unocss-plugin`配置项`minCount`决定公共样式范围          |
| 组件分包异步/组件样式隔离     | 支持   | 可通过全局配置和模版注释语法局部配置`styleIsolation='isolated'`支持相关场景的原子类使用 |
| Rpx样式单位           | 支持   |                                                           |
| 小程序类名特殊字符转义       | 支持   | 静态类名和动态类名均以支持                                             |
| 跨平台输出             | 支持   | 支持输出Mpx已支持的所有小程序平台及Web                                    |

## 工具类可用范围

经过我们的详细测试，大部分`unocss`
提供的工具类都能在小程序环境下正常工作，但是也有部分工具类由于小程序底层环境差异无法正常运行，以下是详细的测试结果，参考[windicss文档](https://windicss.org/utilities/general/colors.html)
进行分类组织。

### General

| 功能         | 支持度  | 备注                                  |
|:-----------|:-----|:------------------------------------|
| Colors     | 支持   |                                     |
| Typography | 部分支持 | 不支持子项：Font Variant Numeric Tab Size |
| SVG        | 不支持  | 小程序不支持svg标签                         |
| Variants   | 部分支持 | 不支持子项：Child Selectors，因为小程序不支持*选择器  |

### Accessibility

| 功能             | 支持度 | 备注 |
|:---------------|:----|:---|
| Screen Readers | 支持  |    |

### Animations

| 功能          | 支持度 | 备注 |
|:------------|:----|:---|
| Animation   | 支持  |    |
| Transforms  | 支持  |    |
| Transitions | 支持  |    |

### Backgrounds

| 功能                    | 支持度 | 备注                      |
|:----------------------|:----|:------------------------|
| Background Attachment | 支持  |                         |
| Background Clip       | 支持  |                         |
| Background Color      | 支持  |                         |
| Background Opacity    | 支持  | 需要和Background Color一起使用 |
| Background Position   | 支持  |                         |
| Background Repeat     | 支持  |                         |
| Background Size       | 支持  |                         |
| Background Origin     | 支持  |                         |
| Gradient Direction    | 支持  |                         |
| Gradient From         | 支持  |                         |
| Gradient Via          | 支持  |                         |
| Gradient To           | 支持  |                         |
| Background Blend Mode | 支持  |                         |

### Behaviors

| 功能                   | 支持度  | 备注                                                   |
|:---------------------|:-----|:-----------------------------------------------------|
| Box Decoration Break | 支持   |                                                      |
| Image Rendering      | 部分支持 | image-render-edge 真机不支持                              |
| Listings             | 支持   |                                                      |
| Overflow             | 支持   |                                                      |
| Overscroll Behavior  | 支持   |                                                      |
| Placeholder          | 不支持  | 微信小程序 input 需要通过 placeholder-style 设置 placeholder 样式 |

### Borders

| 功能                | 支持度 | 备注              |
|:------------------|:----|:----------------|
| Border Radius     | 支持  |                 |
| Border Width      | 支持  |                 |
| Border Color      | 支持  |                 |
| Border Opacity    | 支持  |                 |
| Border Style      | 支持  |                 |
| Divider Width     | 不支持 | 小程序不支持生成的css选择器 |
| Divider Color     | 不支持 | 小程序不支持生成的css选择器 |
| Divider Opacity   | 不支持 | 小程序不支持生成的css选择器 |
| Divider Style     | 不支持 | 小程序不支持生成的css选择器 |
| Outline           | 支持  |                 |
| Outline Solid     | 支持  |                 |
| Outline Dotted    | 支持  |                 |
| Ring Width        | 支持  |                 |
| Ring Color        | 支持  |                 |
| Ring Opacity      | 支持  |                 |
| Ring Offset Width | 支持  |                 |
| Ring Offset Color | 支持  |                 |

### Effects

| 功能             | 支持度 | 备注 |
|:---------------|:----|:---|
| Box Shadow     | 支持  |    |
| Opacity        | 支持  |    |
| Mix Blend Mode | 支持  |    |

### Filters

| 功能              | 支持度 | 备注 |
|:----------------|:----|:---|
| Filter          | 支持  |    |
| Backdrop Filter | 支持  |    |

### Interactivity

| 功能              | 支持度 | 备注          |
|:----------------|:----|:------------|
| Accent Color    | 不支持 | 小程序不支持生成的样式 |
| Appearance      | 不支持 | 小程序不支持生成的样式 |  
| Cursor          | 不支持 | 小程序不支持生成的样式 |  
| Caret           | 不支持 | 小程序不支持生成的样式 |  
| Pointer Events  | 支持  |             |  
| Resize          | 不支持 | 小程序不支持生成的样式 |  
| Scroll Behavior | 不支持 | 小程序不支持生成的样式 |  
| Touch Action    | 支持  |             |  
| User Select     | 不支持 | 小程序不支持生成的样式 |  
| Will Change     | 不支持 | 小程序不支持生成的样式 |  

### Layout

| 功能          | 支持度  | 备注                             |
|:------------|:-----|:-------------------------------|
| Columns     | 支持   |                                |
| Container   | 支持   |                                |
| Display     | 支持   |                                |
| Flex        | 支持   |                                |
| Grid        | 支持   |                                |
| Positioning | 部分支持 | 小程序图片设置object-fit 无效，可使用mode代替 |
| Sizing      | 支持   |                                |
| Spacing     | 部分支持 | Space Between小程序不支持生成的css选择器   |
| Tables      | 部分支持 | 小程序不支持部分table样式                |

## 小程序原子类使用注意点

## 为什么使用unocss













