# 使用 DllPlugin

### 相关插件简述
#### DllPlugin

> DllPlugin 和 DllReferencePlugin 用某种方法实现了拆分 bundles，同时还大大提升了构建的速度，这个插件是在一个额外的独立的 webpack 设置中创建一个只有 dll 的 bundle(dll-only-bundle)。并且会生成一个名为 manifest.json的文件，这个文件是用来让 DLLReferencePlugin 映射到相关的依赖上去的。

DllPlugin 用来将我们某些长时间不变更的资源，独立拆分出去，之后项目的每次构建这部分资源都不需要重新编译，而是直接通过 DLLReferencePlugin 引入 dll bundle, 大大的节省了构建时间。

构建生成对应的 dll bundle 和 manifest.json 文件，manifest 文件中是模块 id 与请求路径的关系映射。

#### DllReferencePlugin

>这个插件是在 webpack 主配置文件中设置的， 这个插件把只有 dll 的 bundle(们)(dll-only-bundle(s)) 引用到需要的预编译的依赖

通过引用 dll 的 manifest 文件来把依赖的名称映射到模块的 id 上，之后再在需要的时候通过内置的 __webpack_require__ 函数来 require 他们。

### Mpx中 DllPlugin 的使用

**1.通过 @mpxjs/cli init 生成项目**

初始化选项中选择使用dll功能。

**2.在项目中 build/dll.config.js 进行 dll 文件配置**

```js
const path = require('path')

// 这里是一个用法示例
function resolve (file) {
  return path.resolve(__dirname, '..', file || '')
}
module.exports = [
  {
    cacheGroups: [
      {
        entries: [resolve('node_modules/@someNpmGroup/someNpmPkgName/dist/wx/static/js/common.js')],
        name: 'test',
        root: 'testSomeDllFile'
      },
    ],
    modes: ['wx'],
    entryOnly: true,
    format: true,
    webpackCfg: {
      mode: 'none', // 不使用任何默认优化选项
    }
  },
  {
    cacheGroups: [
      {
        entries: [resolve('node_modules/@someNpmGroup/someNpmPkgName/dist/ali/static/js/common.js')],
        name: 'test',
        root: 'testSomeDllFile'
      },
    ],
    modes: ['ali'],
    entryOnly: true,
    format: true,
    webpackCfg: {
      mode: 'none', // 不使用任何默认优化选项
    }
  }

]
```

DllPlugin 的配置项详见[文档](https://webpack.docschina.org/plugins/dll-plugin/)，Mpx 中相关配置项依据小程序环境做了相关调整。
- **cacheGroups**
    - 类型: `Array<object>`
        - entries
            - 类型: `Array`dll 
            
              构建入 dll 的文件入口
        - name
            - 类型: `String`
                
              生成的 dll 文件名
        - root
            - 类型: `String`
               
              生成的 dll 文件夹名
- **modes**
    - 类型: `Array`
        
      构建 dll 产物对应的平台
      ```js
      // 配置多平台输出，例如：
      [
        'wx', // 微信平台
        'ali' // 支付宝平台
      ]
      ```
- **entryOnly**
    - 类型: `Boolean`
     
      如果为true，则仅暴露入口
      
      这里建立使用entryOnly: true 配置
      > 如果为 false 时，dllPlugin 中的 tree shakeing 功能就不再起作用 
      
      另外如果为false，如果是将分包资源打入dll bundle，会存在将全局方法打入分包 dll 中的可能性，这样主包在使用该方法被映射到 dll bundle 中时，会因为分包未加载而报错
- **webpackCfg**
    - 类型: `Object`
    
      构建 dll 时可添加其他的 webpack 配置
      
      
- **format**
    - 类型: `Boolean`
    
      生成的 manifest json 文件 是否进行格式化


### Mpx 中对 DllPlugin 配置所做的相关处理

正常使用 DllPlugin 是单独创建一个 webpack 配置文件，配置文件中加入 DllPlugin，然后运行 webpack 编译构建生成 dll 文件。

考虑到 Mpx 在编译时需要跨平台输出，所以 Mpx 的配置项是 `Array<object>` 类型，同时增加了 modes 配置项，可以自主控制输出不同平台版本 dll 文件。

构建生成 dll bundle 的主要逻辑在 buildDll.js 中，通过对 dll.config 中数组的循环处理，生成 webpackCfgs 数组。

```js
dllConfigs.forEach((dllConfig) => {
  const entries = getDllEntries(dllConfig.cacheGroups, dllConfig.modes)
  // 根据配置的 mode 以及 cacheGroups 生成 entry，结果例如：
  /**
  *{
        'somePkgRoot/wx.somePkgName': [
            '/Users/didi/didiProject/mp-apphome/node_modules/@someNpmGroup/somNpmName/dist/wx/static/js/common.js'
        ]
    }
  **/
  if (Object.keys(entries).length) {
    webpackCfgs.push(merge({
      entry: entries,
      output: {
        path: config.dllPath,
        filename: path.join('lib', dllName),
        libraryTarget: 'commonjs2'
      },
      mode: 'production',
      plugins: [
        new webpack.DllPlugin({
          path: path.join(config.dllPath, manifestName),
          format: dllConfig.format,
          entryOnly: dllConfig.entryOnly,
          name: dllName,
          type: 'commonjs2',
          context: config.context
        })
      ]
    }, dllConfig.webpackCfg))
  }
})
```
生成的 webpackCfgs 数组配置项，传入 webpack 执行，最终在 dll 文件夹下生成 dll bundle 和 manifest.json 文件

之后在 build.js 中使用 DllReferencePlugin 将编译中的依赖项与 dll bundle 的模块 id 关联起来，这里我们通过多个 DllReferencePlugin 实例来将可能存在的多个 manifest 文件关联引入，具体在项目 build.js 文件中：

```js
plugins.push(new webpack.DllReferencePlugin({
    context: config.context, //（绝对路径） manifest (或者是内容属性)中请求的上下文
    manifest: manifest.content // 请求到模块 id 的映射（默认值为 manifest.content）
}))
```
DllReferencePlugin 的其他配置项详见[文档](https://webpack.docschina.org/plugins/dll-plugin/)


### 总结
综上所述，在 Mpx 中使用 dllPlugin 时，只需要进行 build/dll.config.js 文件的配置，然后通过 build:dll 命令生成 dll bundle，之后就可以正常的进行代码的 build 了。不过每次 build 需要检查下项目中使用的 npm 包版本与 dll bundle 中的 npm 包版本是否一致，避免因为包版本的滞后更新导致线上 bug，这里我们后续也会提供相应的包版本比对插件。
