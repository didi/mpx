# 包体积分析

目前业内主流小程序平台都对小程序的代码包设置了严格的体积限制，微信是单包 2MB，总包 16MB，支付宝是单包 2MB，总包 8MB；包体积作为有限的资源，在小程序业务开发中异常重要，特别对于像滴滴出行这样的大型复杂业务。

Mpx 在包体积控制上做了很多工作，主要包括：
* [完善的分包支持](./subpackage.md#分包)
* [基于依赖声明的按需构建](./npm.md)
* [图像资源处理](./image-process.md)
* [公共样式复用](../basic/css.md#公共样式复用)

此外由于 Mpx 的编译构建完全基于 webpack，也能够直接复用webpack生态自带的代码压缩，模块复用，tree shaking，side effects 等能力对代码体积进行优化。

但是系统能做的工作终究有限，在一些人为不规范操作的影响下，最终输出的项目依然可能存在大量优化空间，比如在业务中不会被调用但无法被 tree shaking / side effects 移除的代码，因为 npm 依赖版本不统一造成的重复依赖，未经压缩的图像静态资源等，在大型项目中，这些问题想要被发现会非常困难，因此我们非常需要一个体积分析工具来管控项目体积和发现隐藏的体积问题。

## 与 webpack-bundle-analyzer 的区别

`webpack-bundle-analyzer` 提供了非常完善的体积分析和可视化展示能力，但是在 Mpx 构建输出小程序场景下，其所提供的能力还是有所缺失：
* 只能对 js 资源进行模块体积分析，而小程序的输出中包含了大量的非 js 静态资源，如 wxss / wxml / json 等，这些资源的体积都不会被统计分析；
* 没有针对某个分包进行体积分析的能力，由于小程序中存在对单一分包的体积限制，我们的体积往往会集中在主包和主要业务分包中，以分包维度进行体积分析的能力非常必要；
* 无法以特定的输入范围为维度进行体积的统计分析，这个能力诉求更多地出现在跨团队合作的复杂小程序当中，如滴滴出行。在这种场景下，接入合作的各方会更加关注己方引入的体积，并进行针对性地优化。

由于上述原因，我们在 Mpx@2.6.x 版本中提供了包体积分析能力，弥补了 `webpack-bundle-analyzer` 的能力缺失，为业务提供了便捷准确的包体积管控优化抓手。

## 使用方法

在 `@mpxjs/webpack-plugin` 配置中添加 `reportSize` 配置项即可使用，简单示例如下：

```js
new MpxWebpackPlugin({
  // ...
  reportSize: {
    // 体积报告生成后输出的文件地址名，路径相对为 dist/wx 或者 dist/ali
    filename: '../report.json',
    // 配置阈值，此处代表总包体积阈值为 16MB，分包体积阈值为 2MB，超出将会触发编译报错提醒，该报错不阻断构建
    threshold: {
      size: '16MB',
      packages: '2MB'
    },
    // 配置体积计算分组，以输入分组为维度对体积进行分析，当没有该配置时结果中将不会包含分组体积信息
    groups: [
      {
        // 分组名称
        name: 'vant',
        // 配置分组 entry 匹配规则，小程序中所有的页面和组件都可被视为 entry，如下所示的分组配置将计算项目中引入的 vant 组件带来的体积占用
        entryRules: {
          include: '@vant/weapp'
        }
      },
      {
        name: 'pageGroup',
        // 每个分组中可分别配置阈值，如果不配置则表示
        threshold: '500KB',
        entryRules: {
          include: ['src/pages/index', 'src/pages/user']
        }
      },
      {
        name: 'someSdk',
        entryRules: {
          include: ['@somegroup/someSdk/index', '@somegroup/someSdk2/index']
        },
        // 有的时候你可能希望计算纯 js 入口引入的体积（不包含组件和页面），这种情况下需要使用 noEntryModules
        noEntryModules: {
          include: 'src/lib/sdk.js'
        }
      }
    ]
  }
})
```
参考上述示例进行配置后，构建代码后，dist 目录下会产出 report.json 文件，里边是项目的具体体积信息，关于输入 json 的简单示例如下：

```js
{
    // 项目体积概要，大部分情况下，我们只需要看这部分就足够了
    "sizeSummary": {
        // 分组体积概要，与上述配置文件中的 groups 对应
        "groups": [
            {
                "name": "vant",
                // 只有该分组包含的模块体积
                "selfSize": "164.75KiB",
                "selfSizeInfo": {
                  // 该分组所占 shansong
                  "shansong": "164.75KiB"
                },
                "sharedSize": "885.68KiB",
                "sharedSizeInfo": {
                  "main": "885.68KiB"
                }
            },
        ],
        // 项目各个分包以及主包体积概要
        "sizeInfo": {
            "main": "1000KiB",
            "fenbao1": "200kiB"
        },
        // 项目总体积
        "totalSize": "13468.85KiB",
        // 项目静态资源总体积
        "staticSize": "4880.58KiB",
        // 项目chunk 文件总体积
        "chunkSize": "8587.70KiB",
        // 非依赖项体积大小
        "copySize": "1KiB"
    },
    // 分组资源详细体积
    "groupsSizeInfo": [
        {
            "name": "groupOne",
            // group 自身包含的 module 详情列表
            "selfEntryModules": [],
            // group 与其他group 共有的 module 详情列表
            "sharedEntryModules": [],
            // 自身包含 module 体积
            "selfSize": "",
            // 自身包含 module 体积详情
            "selfSizeInfo": {
                "main": {},
                "homepage": {}
            },
            // 与其他 group 共有 module 体积
            "sharedSize": "",
            // 与其他 group 共有 module 体积详情
            "sharedSizeInfo": {
                "main": {},
                "homepage": {}
            },

        }
    ],
    // 项目资源详细体积报告
    "assetsSizeInfo": {
        "assets": [{
            // 资源类型
            "type": "chunk",
            "name": "test",
            // 分包名
            "packageName": "main",
            "size": "",
            "modules": []
        }]
    }
}
```
## 业务实践
目前 sizeReport 工具在滴滴出行小程序, 花小猪, 特惠出行小程序以及一部分外部小程序中使用。

在滴滴出行小程序中，配置使用 sizeReport 工具后使包体积管控和优化更加工程化：

* 在 sizeReport 检测结果文件中，通过对 groupsSizeInfo 和 assetsSizeInfo 中assets 与 module 体积分析，我们发现了部分体积较大图片文件和css资源，通过将图片存 CDN 和删除冗余文件；

* 基于各小程序平台对小程序总包，主包，分包有大小限制的原则，给各接入方配置了主包和首页分包体积大小占比阈值，在构建时检测到包体积超过阈值时，抛出 error 阻断构建，开发者可通过 size-report.json 中详细的包体积分析准确的找到体积变动点。

## 总结
Mpx sizeReport 工具对小程序体积计算有更细微(模块级别)的体积展示。 更加适合小程序开发场景的包体积分析。
