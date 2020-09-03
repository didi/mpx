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

为了达到

### style src 复用

### @import 复用
