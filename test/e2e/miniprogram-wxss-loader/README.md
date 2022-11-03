# mpx-feature-unit-test

> mpx feature unit test

## Dev

```bash
# install dep
npm i

# for dev
npm run watch

# for online
npm run build
```

npm script 规范 [build|watch]:[dev|prod]:[cross|web|none]

build 默认 prod，watch 默认 dev。另单独提供了 build:dev 和 watch:prod，用于单次构建分析看未压缩代码分析问题和持续压缩代码便于大体积项目真机调试。

建议自行调整 cross 的目标。npm-run-all 是为了兼容 windows 下无法同时执行两个 npm script，若不需要转 web 平台，可考虑去掉。

## 样式复用使用说明：

1. 要想通过样式预处理器跳过对 .less、.sass、.styl(us) 文件的处理，可以使用例如 `/*preCompileIgnore @import 'xx.less';*/` 语法跳过文件的预编译处理，会在最终的 wxss-loader 中进行处理。用法如下：

```CSS
<style lang="less">
  /* @mpx-import '../../styless/global.less' */

  .title-wrapper .title {
    color: red;
  }
</style>
```

```JS
// webpack配置以下less解析规则：

{
test: /\.less$/,
use: [
    MpxWebpackPlugin.wxssLoader({
    importLoaders: 1 // The option importLoaders allows you to configure how many loaders before wxss-loader should be applied to @imported resources and CSS modules/ICSS imports.
    }),
    'less-loader'
]
}

// 以上配置表示 global.less 文件在 wxss-loader 处理之前会先经过 less-loader 的处理再被 wxss-loader 处理。

// 例如：
{
test: /\.less$/,
use: [
    MpxWebpackPlugin.wxssLoader({
    importLoaders: 2 // The option importLoaders allows you to configure how many loaders before wxss-loader should be applied to @imported resources and CSS modules/ICSS imports.
    }),
    'postcss-loader',
    'less-loader'
]
}

// 以上配置表示 global.less 文件在 wxss-loader 处理之前会先经过 less-loader 、postcss-loader 的处理再被 wxss-loader 处理。


```


通过以上的配置，最终会将导入的 global.less 文件分离成单独一个文件。