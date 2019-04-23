# JSON域扩展
## packages

### 背景

小程序原生的app.json中定义了pages域，用于注册app中所有用到的pages，  
这个设计能够cover绝大部分个人开发的场景，但是当我们在开发一个团队协作的大型项目时，某个开发者可能会依赖其他开发者提供的单个或几个页面/组件来进行开发。

为此，我们引入了packages的概念来解决依赖问题。因微信原生增加了 [分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html) 概念，因此我们也在package机制中增加了对原生分包加载的支持。

### 使用方法

#### 普通依赖

我们拓展了app.json的语法，新增了packages域，用来声明依赖的packages，packages可嵌套依赖。

```html
// @file src/app.mpx
<script type="application/json">
  {
    "pages": [
      "./pages/index/index"
    ],
    "packages": [
      "{npm_package}/index"
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

##### 注意事项

- 依赖的开发者在自己的入口app.mpx中注册页面时对于本地页面一定要使用相对路径进行注册，否则在主app中进行编译时会找不到对应的页面

- 不管是用json还是mpx格式定义package入口，编译时永远只会解析json且只会关注json中的pages和packages域，其余所有东西在主app编译时都会被忽略

- 由于我们是将packages中注册的页面按照原始的路径合并到主app当中，有可能会出现路径名冲突。  
这种情况下编译会报出响应错误提示用户解决冲突，为了避免这种情况的发生，依赖的提供者最好将自己内部的页面放置在能够描述依赖特性的子文件夹下。

例如对于login依赖，建议的页面文件目录为：

```
project
│   app.mpx  
└───pages
    └───login
        │   page1.mpx
        │   page2.mpx
        │   ...
```

#### 分包加载

packages域下的路径带root为key的query则被解析认为是使用分包加载。

```html
// @file src/app.mpx
<script type="application/json">
  {
    "pages": [
      "./pages/index/index"
    ],
    "packages": [
      "{npm_package}/index?root=test"
    ],
    "window": {
      "backgroundTextStyle": "light",
      "navigationBarBackgroundColor": "#fff",
      "navigationBarTitleText": "WeChat",
      "navigationBarTextStyle": "black"
    }
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

##### 注意事项

分包加载时，依赖包内的跳转路径需注意，比如other2的访问，test/pages/other/other2，即前面会多root这一层。

为了解决这个问题，有两种方案：

- import的时候在最后加'?resolve', 例如: `import routerPath from '../pages/gulfstream/router?resolve'` , 编译时就会把它处理成正确的完整的绝对路径。

- 使用相对路径跳转。

建议使用第一种。

## 自定义tabbar

什么是自定义tabbar参见微信文档。https://developers.weixin.qq.com/miniprogram/dev/framework/ability/custom-tabbar.html

app.mpx的json部分的tabBar里custom一项为true时，需要在 src 目录下存在 custom-tab-bar 目录且里面有index.mpx，这个index.mpx里就编写自定义tabbar的模板、js、样式和json部分即可。

**注意事项**：使用该feature时候要认真阅读官方例子，在页面的show钩子上要再手工设置一遍tabbar的selected值。
