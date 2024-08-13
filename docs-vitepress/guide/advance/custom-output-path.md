# 自定义路径

Mpx在构建时，如果引用的页面不存在于当前 app.mpx 所在的上下文中，例如存在于 npm 包中，为避免和本地声明的其他 page 路径冲突，Mpx 会对页面路径进行 hash 化处理，
同时处理组件路径时也会添加 hash 防止路径名冲突，hash 化处理后最终的文件名是 name+hash+ext 的格式

与此同时，部分开发者希望能够对最终输出的页面路径和组件路径能够自定义，Mpx 对此也提供了相应的配置和Api来支持用户自定义路径

## 自定义页面路径

针对 Mpx 对 json 中非当前上下文的页面路径 hash 化的特性，如果为提升可读性需要避免路径 hash 化，可以使用该特性，具体为在
json 中配置 pages 时，数组中支持放入 Object，对象中传入两个字段，src 字段表示页面地址，path 字段表示自定义页面路径

- **示例**:

object风格的页面声明
```json5
{
  // 主包中的声明
  "pages": [
    {
      "src": "@someGroup/someNpmPackage/pages/view/index.mpx",
      "path": "pages/somNpmPackage/index" // 注意保持 path 的唯一性
    }
  ],
  // 分包中的声明
  "subPackages": [
    {
      "root": "test",
      "pages": [
         {
           "src": "@someGroup/someNpmPackage/pages/view/test.mpx",
           "path": "pages/somNpmPackage/test" // 注意保持 path 的唯一性
         }
      ]
    }
  ]
}
```

使用声明中配置的页面路径进行跳转
```js
mpx.navigateTo({
  url: '/pages/somNpmPackage/index'
})

mpx.navigateTo({
  url: '/test/pages/somNpmPackage/test'
})
```


## customOutputPath

Mpx 框架 webpack-plugin 也提供了 customOutputPath 方法可以让用户进行页面和组件路径的自定义，
可使用该方法对**非原生组件和非当前文件context的页面**输出路径进行自定义

需要注意的是，该方法需要具有**稳定性和唯一性**，即同样的输入不管什么时候执行都要有同样的返回以及不同的的输入一定会得到不同的输出。  

- **示例**：
```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
         customOutputPath: (type, name, hash, ext) => {
          // type: 资源类型(page | component | static)
          // name: 资源原有文件名
          // hash: 8位长度的hash串
          // ext: 文件后缀(.js｜ .wxml | .json 等)

          // 输出示例： pages/testax34dde3/index.js
          return path.join(type + 's', name + hash, 'index' + ext)
        }
      }
    }
  }
})
```
基于上方示例，你可以根据需要进行路径定制化，例如缩短hash、使用012代替文件名等各种自定义路径
