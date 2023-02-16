# driver-aggregate-activities

## 开发构建

```javascript
// development
npm run watch:mp // 小程序本地开发构建

npm run watch:cross // 小程序跨平台

npm run watch:web // 小程序跨web

// production
npm run build:mp // 小程序生产环境构建

npm run build:cross // 小程序跨平台

npm run build:web // 小程序跨web
```

## 项目配置

统一在 `vue.config.js` 文件当中管理。

```javascript
module.exports = {
  pluginOptions: {
    mpx: {
      srcMode: 'wx',
      // 传入 @mpxjs/webpack-plugin 当中的配置信息
      // 具体可参考文档：https://www.mpxjs.cn/api/compile.html#mpxwebpackplugin-options
      plugin: {},
      // 传入 @mpxjs/webpack-plugin loader 当中的配置信息
      // 具体可参考文档：https://www.mpxjs.cn/api/compile.html#mpxwebpackplugin-loader
      loader: {}
    }
  },
  // 修改 webpack 相关的配置
  // 具体可参阅 @vue/cli 文档：https://cli.vuejs.org/config/#chainwebpack
  chainWebpack: config => {
    if (process.env.MPX_CLI_MODE === 'mp') {
      // do something
    }

    if (process.env.MPX_CLI_MODE === 'web' && process.env.NODE_ENV === 'development') {
      // do something
    }
  }
}
```


## 所有人员

RD：主会场（刘蓦），跑跑预约礼（许炫耀）
FE：单春涛、嵇智
数仓：黄丹
PM：陈艺
QA：吴雪榕

## 技术文档
[主会场 festival/center 接口文档](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=437291542)

## 需求文档

[跑跑预约礼埋点](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=679733683)
[主会场埋点](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=679732477)

[跑跑预约礼PRD](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=627456803)
[主会场PRD](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=666523690&spaceEditingRestriction=true)

## 跑跑预约二期需求文档

[跑跑预约礼埋点](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=654686267)

[跑跑预约礼二期PRD](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=734371082)
[排期](https://cooper.didichuxing.com/docs/sheet/2199364773425)

## 主会场春节服务费

[春节服务费埋点](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=654686267)

[春节服务费PRD](http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=785635463)