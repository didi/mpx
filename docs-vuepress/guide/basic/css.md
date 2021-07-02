# CSS 处理

## CSS 预编译

Mpx 支持 CSS 预编译处理，你可以通过在 style 标签上设置 `lang` 属性，来指定使用的 CSS 预处理器。Mpx 会根据指定的 CSS 预处理器类型，将其编译为浏览器可识别的 CSS 标准代码。

```html
<!-- 使用 stylus -->
<style lang="stylus">
  .nav
    width 100px
    height 80px
    color #f90
    &:hover
      background-color #f40
      color #fff
</style>
```
```html
<!-- 使用 sass  -->
<style lang="scss">
  .nav {
    width: 100px;
    height: 80px;
    color: #f90
    &:hover {
      background-color: #f40;
      color: #fff
    }
  }
</style>
```
```html
<!-- 使用 less -->
<style lang="less">
  .size {
    width: 100px;
    height: 80px
  }
  .nav {
    .size();
    color: #f90;
    &:hover {
      background-color: #f40;
      color: #fff
    }
  }
</style>

```

## 公共样式复用

为了达到最大限度的样式复用，Mpx 提供了以下两种方式实现公共样式抽离，但是最终打包的效果有所区别。

``` styl
// styles/mixin.styl
.header-styl
  width 100%
  height 100px
  background-color #f00
```

### style src 复用

通过给 style 标签添加 src 属性引入外部样式，最终公共样式代码只会打包一份。

``` template
<!-- index.mpx -->
<style lang="stylus" src="../styles/common.styl"></style>
```

``` template
<!-- list.mpx -->
<style lang="stylus" src="../styles/common.styl"></style>
```

Mpx 将 common.styl 中的代码经过 loader 编译后生成一份单独的 wxss 文件，这样既实现了样式抽离，又能节省打包后的代码体积。

### @import 复用

如果指定 style 标签的 lang 属性并且使用 @import 导入样式，那么这个文件经过对应的 loader 处理之后的内容会重复打包到引用它的文件目录下，并不会抽离成单独的文件，这样无形中增加了代码体积。

``` template
<!-- index.mpx -->
<style lang="stylus">
  @import "../styles/mixin.styl"
</style>
```

``` template
<!-- list.mpx -->
<style lang="less">
  @import "../styles/mixin.less";
</style>
```

如果导入的是一份 css 文件，则最终打包后的效果与 style src 一致。

``` styl
// styles/mixin.css
.header-css {
  width: 100%;
  height: 100px;
  background-color: #f00;
}
```

``` template
<!-- index.mpx -->
<style>
  @import "../styles/mixin.css";
</style>
```

``` template
<!-- list.mpx -->
<style>
  @import "../styles/mixin.css";
</style>
```

对于多个页面或组件公用的样式，建议使用 style src 形式引入，避免一份样式被内联打成多份，同时还能使用 less、scss 等提升编码效率。
