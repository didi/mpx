# style增强特性

## css预处理器
 
`mpx`支持所有主流的`css预编译处理`，只需要在`<style>`的`lang`中设置使用的预编译语言`（stylus/less/sass等）`并且安装对应的`webpack-loader`即可正常使用。
 
 示例：
 ```vue
<template>
  <view class="container">
    <text class="item">123</text>
  </view>
</template>

<style lang="stylus">
.container
 padding 10px
 .item
     text-align center
</style>
 ```
 
## 样式引用

两种方式引用：
- style内使用@import语法引入
- 在style标签上通过src引入

前者会被内联打入 组件/页面 对应的wxss文件，后者则是会将src对应的文件收集到wxss文件夹里，再在 组件/页面 对应的wxss文件中通过@import引入。

在一个mpx文件中，两者可以同时使用，例如：

```vue
<!--src/components/test.mpx-->
<!--省略template\script\json部分-->

<!--这个部分的样式会被收集进wxss文件夹再被test.wxss引入-->
<style src="../common/index.css"></style>

<style>
/*这个部分的代码会被内联打入test.wxss*/
.test {
  background-color: red;
}
</style>

<!--也可以使用样式预处理语言比如sass、stylus、less等等-->
<style lang="scss" src="../style/test.scss"></style>
```

**建议对于多个 页面/组件 公用的样式，使用src形式引入，避免一份样式被内联打成多份。**

## rpx转换

为了处理某些ide中不支持`rpx`单位的问题，`mpx`提供了一个将px转换为rpx的功能。

支持通过注释控制行级、块级的是否转换，支持局部使用，支持不同依赖分别使用不用的转换规则等灵活的能力。

通过transRpx参数来进行配置，配置项是这样 **一个对象** ，也可以是 **多个这样的对象组成的数组** 。

```js
const transRpx = {
  mode: 'all', // 可选值有none/only/all 分别是不启用，只对注释内容启用，只不对注释内容启用
  comment: 'use px', // rpx注释，建议使用 'use px' / 'use rpx'，当mode为all时默认值为use px，mode为only时默认值为use rpx
  include: resolve('src'), // 同webpack的include规则
  exclude: resolve('lib'), // 同webpack的exclude规则
  designWidth: 750 // 设计稿宽度，默认值就是750
}
```

配置在 webpack.conf.js 的 MpxWebpackPlugin.loder 的参数中。关于如何配置详情请查看[mpx-loader选项](/compilationEnhance/index.md#mpxwebpackpluginloader)

#### 应用场景及相应配置

接下来我们来看下一些应用场景及如何配置。如果是用脚手架生成的项目，在webpack.conf.js里找到MpxWebpackPlugin.loader，应该已经有预设的transRpx选项，按例修改即可。本处示例中为了代码合规，声明了新变量表示来这个选项，项目中应该直接为option对象的子属性。

三种场景分别是 [普通使用，因设计稿是px的二倍/三倍图](#场景一) ， [只对某些特殊样式转换](#场景二) ， [不同路径分别配置规则](#场景三)

#### 场景一
设计师给的稿是2倍图，分辨率750px。或者更高倍图。

```js
const transRpx = {
  mode: 'all',
  designWidth: 750 // 如果是其他倍，修改此值为设计稿的宽度即可
}
```

#### 场景二

大部分样式都用px下，某些元素期望用rpx。或者反过来。

```js
const transRpx = {
  mode: 'only',
  comment: 'use rpx',
  designWidth: 750 // 设计稿宽度
}
```
mpx的rpx注释能帮助你仅为部分类或者部分样式启用rpx转换，细节请看下面附录。

#### 场景三
使用了第三方组件，它的设计宽度和主项目不一致，期望能设置不同的转换规则

```js
  {
    test: /\.mpx$/,
    use: MpxWebpackPlugin.loader({
      transRpx: [
        {
          mode: 'only',
          designWidth: 750,
          comment: 'use rpx',
          include: resolve('src')
        },
        {
          mode: 'all',
          designWidth: 1280, // 对iview单独使用一个不同的designWidth
          include: resolve('node_modules/iview-weapp')
        }
      ]
    })
  }
```

> 注意事项：转换规则是不可以对一个文件做多次转换的，会出错，所以一旦被一个规则命中后就不会再次命中另一个规则，include和exclude的编写需要注意先后顺序，就比如上面这个配置，如果第一个规则include的是'/'即整个项目，iview-weapp里的样式就无法命中第二条规则了。

#### transRpx附录

designWidth

设计稿宽度，单位为`px`。默认值为`750px`。

`mpx`会基于小程序标准的屏幕宽度`baseWidth 750rpx`，与`option.designWidth`计算出一个转换比例`transRatio`

转换比例的计算方式为`transRatio = (baseWidth / designWidth)`。精度为小数点后2位四舍五入

所有生效的`rpx注释样式`中的px会乘上`transRatio`得出最终的rpx值

例如：

```css
/* 转换前：designWidth = 1280 */
.btn {
  width: 200px;
  height: 100px;
}

/* 转换后: transRatio = 0.59 */
.btn {
  width: 118rpx;
  height: 59rpx;
}
```
---

comment: rpx注释样式

根据`rpx注释`的位置，`mpx`会将`一段css规则`或者`一条css声明`视为`rpx注释样式`

开发者可以声明一段rpx注释样式，提示编译器是否转换这段css中的px

例如：
```html
<style lang="css">
  /* use px */
  .not-translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .not-translate-b {
    /* use px */
    font-size: 100px;
    padding: 10px;
  }
  .translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .translate-b {
    font-size: 100px;
    padding: 10px;
  }
</style>
```
> 第一个注释位于一个`选择器`前，是一个`css规则注释`，整个规则都会被视为`rpx注释样式`

> 第二个注释位于一个`css声明`前，是一个`css声明注释`，只有`font-size: 100px`会被视为`rpx注释样式`

> `transRpx = all`模式下，除了这两条rpx注释样式之外，其他都会转rpx
