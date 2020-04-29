# JSON增强特性

## 动态与注释

作为配置文件，json最大的缺陷是不支持注释，然后是不够灵活。此处感谢社区同学贡献的解决方案：支持js。

json块我们除了可以写`<script type="application/json"> …… </script>`，还可以这样：

```html
<script name="json">
const pages = __mpx_mode__ === 'wx' ? [
  'main/xxx',
  'sub/xxx'
] : [
  'test/xxx'
] // 可以为不同环境动态书写配置
module.exports = {
  usingComponents: {
    aComponents: '../xxxxx' // 可以打注释 xxx组件
  }
}
</script>
```

## packages

### 背景

小程序原生的app.json中定义了pages域，用于注册app中所有用到的pages，  
这个设计能够cover绝大部分个人开发的场景，但是当我们在开发一个团队协作的大型项目时，某个开发者可能会依赖其他开发者提供的单个或几个页面/组件来进行开发。

为此，我们引入了packages的概念来解决依赖问题。

后来微信原生增加了 [分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html) 能力，因此我们也在package机制中增加了对原生分包加载的支持。

我们提供的包能力本质是对业务的拆分合并，即开发时候可以各自开发，打包时候合为一个，和微信的分包不相同，推荐在此基础上进一步使用平台原生分包能力，可以更好地控制小程序体积。

### 使用方法

我们拓展了app.json的语法，新增了packages域，用来声明依赖的packages，packages可嵌套依赖。

```html
// @file src/app.mpx
<script type="application/json">
  {
    "pages": [
      "./pages/index/index"
    ],
    "packages": [
      "{npmPackage || relativePathToPackage}/index"
    ]
  }
</script>

// @file src/packages/index.mpx
<script type="application/json">
  {
    "pages": [
      "./pages/other/other",
      "./pages/other/other2"
    ]
  }
</script>
```

打包结果：dist/app.json
```json
{
  "pages": [
    "pages/index/index",
    "pages/other/other",
    "pages/other/other2"
  ]
}
```

由上可见，经过我们的编译过程，packages中注册的页面按照原始的路径形状被合并到主app中，
这样依赖的开发者可以不用考虑自己在被依赖时页面路径是怎么样的，也可以直接将调试用的app.mpx作为依赖入口直接暴露出去，
对于主app的开发者来说也不需要了解依赖内部的细节，只需要在packages中声明自己所需的依赖即可

#### 注意事项

- 依赖的开发者在自己的入口app.mpx中注册页面时对于本地页面一定要使用相对路径进行注册，否则在主app中进行编译时会找不到对应的页面
- 不管是用json还是mpx格式定义package入口，编译时永远只会解析json且只会关注json中的pages和packages域，其余所有东西在主app编译时都会被忽略
- 由于我们是将packages中注册的页面按照原始的路径合并到主app当中，有可能会出现路径名冲突。  
这种情况下编译会报出响应错误提示用户解决冲突，为了避免这种情况的发生，依赖的提供者最好将自己内部的页面放置在能够描述依赖特性的子文件夹下。

例如一个包叫login，建议包内页面文件目录为：

```
project
│   app.mpx  
└───pages
    └───login
        │   page1.mpx
        │   page2.mpx
        │   ...
```

## 分包

作为一个对performance极度重视的框架，分包作为提升小程序体验的重要能力，是必须支持的。

微信文档中有以下三种分包，mpx对这些能力都做了较好的支持。

> 分包是小程序平台提供的原生能力，mpx是对该能力做了部分加强，目前微信的分包机制是最全面的，百度其次，支付宝暂时无此能力，请根据平台决定如何使用。

- [普通分包](#普通分包)
- [分包预下载](#分包预下载)

#### 普通分包

mpx中会将 app.mpx（入口文件，也不一定非要叫app.mpx） 中packages域下的路径带root为key的query则被解析认为是使用分包加载。

> 使用分包一定要记得阅读下面的[分包注意事项](#分包注意事项)

```html
// @file src/app.mpx
<script type="application/json">
  {
    "pages": [
      "./pages/index/index"
    ],
    "packages": [
      "{npmPackage || relativePathToPackage}/index?root=test"
    ]
  }
</script>

// @file src/packages/index.mpx (子包的入口文件)
<script type="application/json">
  {
    "pages": [
      "./pages/other/other",
      "./pages/other/other2"
    ]
  }
</script>
```

打包结果：dist/app.json
```json
{
  "pages": [
    "pages/index/index"
  ],
  "subPackages": [
    {
      "root": "test",
      "pages": [
        "pages/other/other",
        "pages/other/other2"
      ]
    }
  ]
}
```

分包加载的好处详见微信的文档。路径冲突的概率也大大降低，只需要保证root不同即可。

#### 分包预下载

> 仅微信小程序提供该部分能力

分包预下载是在json中新增一个 preloadRule 字段，mpx打包时候会原封不动把这个部分放到app.json中，所以只需要按照 [微信小程序官方文档 - 分包预下载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html) 配置即可。

前面的普通分包中提到了subpackages是根据用户在package中通过增加query，key为root来指定分包名。我们进一步扩展了这个能力，允许用户传递更多的query。

比如：

```html
// @file src/app.mpx
<script type="application/json">
  {
    "pages": [
      "./pages/index/index"
    ],
    "packages": [
      "{npmPackage || relativePathToPackage}/index?root=xxx&name=subpack1"
    ]
  }
</script>

// @file src/packages/index.mpx (子包的入口文件)
<script type="application/json">
  {
    "pages": [
      "./pages/other/other",
      "./pages/other/other2"
    ]
  }
</script>
```

打包结果：dist/app.json
```json
{
  "pages": [
    "pages/index/index"
  ],
  "subPackages": [
    {
      "name": "subpack1",
      "root": "xxx",
      "pages": [
        "pages/other/other",
        "pages/other/other2"
      ]
    }
  ]
}
```

#### 分包注意事项

当我们使用分包加载时，依赖包内的跳转路径需注意，比如要跳转到other2页面  
不用分包时会是：wx.jump/pages/other/other2  
使用分包后应为：/test/pages/other/other2  
即前面会多?root={rootKey}的rootKey这一层

为了解决这个问题，有三种方案：

- import的时候在最后加'?resolve', 例如: `import testPagePath from '../pages/testPage.mpx?resolve'` , 编译时就会把它处理成正确的完整的绝对路径。

- 使用相对路径跳转。

- 定死使用的分包路径名，直接写/{rootKey}/pages/xxx （极度不推荐，尤其在分包可能被多方引用的情况时）

建议使用第一种。

## 自定义tabbar

什么是自定义tabbar参见微信文档。https://developers.weixin.qq.com/miniprogram/dev/framework/ability/custom-tabbar.html

app.mpx的json部分的tabBar里custom一项为true时，需要在 src 目录下存在 custom-tab-bar 目录且里面有index.mpx，这个index.mpx里就编写自定义tabbar的模板、js、样式和json部分即可。

**注意事项**：使用该feature时候要认真阅读官方例子，在页面的show钩子上要再手工设置一遍tabbar的selected值。

## 体积优化指南

由于微信小程序限制主包体积为2M，较复杂的应用可能需要尽可能进行体积优化。

分包是微信小程序中优化包体积的核心手段(类似于异步按需加载)，Mpx对其进行了完善的支持，可以精确地标记出分包only的资源。此外还可以从按需构建及分析构建结果等方面下手。

1. 尽量让纯分包用的代码和主包用的代码分离（即让资源成为分包only的）

    - 比如分包页面中需要使用一个叫 utilA 的体积很大的方法，主包页面中需要使用一个叫 utilB 的方法，如果你将这两个方法写在同一个 util.js 文件中，util模块最终会被打包到主bundle中，造成没必要的主包体积增大。[更多参考](understanding/understanding.md#分包处理细节)

2. 在json里做最小声明，mpx本身提供了按需打包的能力，但按需是指按用户的声明，无法做到根据一个page是否被使用来打包

    - 比如分包单独开发再以npm包形式发布这种开发模式中，可能会出现npm包开发者方为了调试组件编写了多份page引用对应组件仅为调试方便，最终集成时就会让这些调试页面占用空间。可以另提供一份json文件和app.mpx同级，比如叫index.json，开发包时候以app.mpx为入口，集成时候以index.json为入口。

3. 使用analysis工具分析体积大的原因

    - 构建时加上 `--report` 参数，会生成构建图，即可查看整个项目的体积构成来源了，进而分析是哪些模块占据了体积。webpack生态，webpack-bundle-analyzer插件提供的。
