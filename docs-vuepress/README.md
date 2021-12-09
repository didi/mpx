---
home: true
layout: homepageLayout
heroImage: /logo.png
heroText: 增强型跨端小程序框架
tagline: 良好的开发体验，极致的应用性能，完整的原生兼容，一份源码跨端输出所有小程序平台及Web。
actionText: 快速进入

actionLink: /guide/basic/start.html
githubText: Github
githubLink: https://github.com/didi/mpx
features:
- title: 高性能
  details: 以增强的方式将Vue中大量优良特性引入到小程序开发中，配合灵活强大的编译构建，大大提升了小程序开发体验和效率，同时提供了媲美原生开发的稳定性。
  icon: https://dpubstatic.udache.com/static/dpubimg/N7sc6TZnja/texing_icon_gao.png
  micon: https://dpubstatic.udache.com/static/dpubimg/0S3n12uc1k/y_icon_gao.png
- title: 优体验
  details: 框架自带深度的运行时性能优化及包体积优化，让开发者在大多数场景下只需专注于业务开发，就能生产出媲美原生的高性能小程序应用。
  icon: https://dpubstatic.udache.com/static/dpubimg/PsrcQ_igBl/texing_icon_you.png
  micon: https://dpubstatic.udache.com/static/dpubimg/BBQBgCRCOl/y_icon_you.png
- title: 跨平台
  details: 一份源码，多端运行，Mpx专注解决小程序跨端问题，以静态编译为主要手段，将业务源码输出到微信/支付宝/百度/头条/QQ小程序平台和web环境下运行。
  icon: https://dpubstatic.udache.com/static/dpubimg/bJMx84lznm/texing_icon_kua.png
  micon: https://dpubstatic.udache.com/static/dpubimg/KPG_IXLuwU/y_icon_kua.png
sixSection:
  title: 渐进迁移
  mtitle: 开发生态
  bg: https://dpubstatic.udache.com/static/dpubimg/sPhfwW2Git/kaifa_bg.png
  details:
  - title: '@mpxjs/core'
    details: 运行时核心
    icon: https://dpubstatic.udache.com/static/dpubimg/K4XYVLjBLH/kaifa_icon_1.png
    actionLink: /guide/basic/start.html
  - title: '@mpxjs/webpack-plugin'
    details: 编译核心
    icon: https://dpubstatic.udache.com/static/dpubimg/2k0jC-ZkFX/kaifa_icon_2.png
    actionLink: /guide/basic/start.html
  - title: '@mpxjs/cli'
    details: 脚手架工具
    icon: https://dpubstatic.udache.com/static/dpubimg/ug3MOMmXaz/kaifa_icon_3.png
    actionLink: /guide/basic/start.html
  - title: '@mpxjs/fetch'
    details: 网络请求库
    icon: https://dpubstatic.udache.com/static/dpubimg/L6kO_akb2G/kaifa_icon_4.png
    actionLink: /api/extend.html#mpx-fetch
  - title: '@mpxjs/api-proxy api'
    details: 增强调用
    icon: https://dpubstatic.udache.com/static/dpubimg/oZGOmLr5f3/kaifa_icon_5.png
    actionLink: /api/extend.html#api-proxy
  - title: '@mpxjs/webview-bridge web'
    details: 页面桥接
    icon: https://dpubstatic.udache.com/static/dpubimg/trdVxyR_5_/kaifa_icon_6.png
    actionLink: /api/extend.html#webview-bridge
  - title: '@mpxjs/vscode-plugin ide'
    details: 插件
    icon: https://dpubstatic.udache.com/static/dpubimg/PczNH3wywM/kaifa_icon_7.png
    actionLink: https://marketplace.visualstudio.com/items?itemName=pagnkelly.mpx
  - title: '@mpxjs/es-check'
    details: 高级语法检查
    icon: https://dpubstatic.udache.com/static/dpubimg/qXb0ZEY4xN/kaifa_icon_8.png
    actionLink: https://github.com/mpx-ecology/mpx-es-check
  - title: '@mpxjs/size-report'
    details: 包体积分析工具
    icon: https://dpubstatic.udache.com/static/dpubimg/2pa_xoKoeL/kaifa_icon_9.png
    actionLink: /guide/advance/size-report.html
fourSection:
  title: 极致性能
  details: 在方便使用框架提供的便捷特性的同时，也能享受到媲美原生开发的确定性和稳定性，完全没有框架太多坑，不如用原生的顾虑；不管是增强输出还是跨平台输出，最终的dist代码可读性极强，便于调试排查；
  img: https://dpubstatic.udache.com/static/dpubimg/jvACYsEQfm/jizhi_pic.png
  mimg: https://dpubstatic.udache.com/static/dpubimg/G4RXehQ40n/y_pic_jizhi.png
  bg: https://dpubstatic.udache.com/static/dpubimg/arO1Eb5ill/jizhi_bg.png
  actionText: 点击进入
  actionLink: /guide/basic/start.html
fiveSection:
  title: 渐进迁移
  details: 极致的性能：得益于增强的设计思路，Mpx框架在运行时不需要做太多封装抹平转换的工作，框架的运行时部分极为轻量简洁，压缩+gzip后仅占用14KB；配合编译构建进行的包体积优化和基于模板渲染函数进行的数据依赖跟踪，Mpx框架在性能方面做到了业内最优(小程序框架运行时性能评测报告(opens new window))；
  img: https://dpubstatic.udache.com/static/dpubimg/k5Ft6oWF6F/jianjin_pic.png
  mimg: https://dpubstatic.udache.com/static/dpubimg/Z0W_MvwJ8C/y_pic_jianjin.png
  bg: https://dpubstatic.udache.com/static/dpubimg/y4UyRKCYk2/jianjin_bg.png
  actionText: 点击进入
  actionLink: https://github.com/hiyuki/mp-framework-benchmark/blob/master/README.md
threeSection:
  title: TodoMVC
  details: TodoMVC是一个示例项目，它使用目前流行的不同JavaScript框架的来实现同一个Demo，来帮助你熟悉和选择最合适的前端框架。官网地址：http://todomvc.com，学习框架最直接有效的方式就是上手练习，接下来我们将用Mpx.js来完成TodoMVC的示例。
  mdetails: TodoMVC是一个示例项目，它使用目前流行的不同JavaScript框架的来实现同一个Demo，来帮助你熟悉和选择最合适的前端框架。
  actionText: 查看详情
  actionLink: https://dpubstatic.udache.com/static/dpubimg/c3b0d3bc-1bb0-4bee-b6da-4205a2744e21.html#/pages/index
  img: https://dpubstatic.udache.com/static/dpubimg/nYbrJSPSz7/anli_pic_phone.png
  bg: https://dpubstatic.udache.com/static/dpubimg/BoL0N8E-JA/todomvc_bg.png
  list:
    - title: 微信
      icon1: https://gift-static.hongyibo.com.cn/static/kfpub/3547/todomvc_icon_wechat_normal.png
      icon2: https://gift-static.hongyibo.com.cn/static/kfpub/3547/todomvc_icon_wechat_active.png
      code: https://gift-static.hongyibo.com.cn/static/kfpub/3547/wx-qrcode.jpg
    - title: 支付宝
      icon1: https://gift-static.hongyibo.com.cn/static/kfpub/3547/todomvc_icon_alipay_normal.png
      icon2: https://gift-static.hongyibo.com.cn/static/kfpub/3547/todomvc_icon_alipay_active.png
      code: https://gift-static.hongyibo.com.cn/static/kfpub/3547/ali-qrcode.jpg
  mlist:
    - title: 微信
      icon: https://dpubstatic.udache.com/static/dpubimg/ho5eKaVX5L/y_icon_wechat.png
    - title: QQ
      icon: https://dpubstatic.udache.com/static/dpubimg/IoQuifVymo/y_icon_qq.png
    - title: 支付宝
      icon: https://dpubstatic.udache.com/static/dpubimg/rMS51-MYUE/y_icon_zhifubao.png
    - title: 百度
      icon: https://dpubstatic.udache.com/static/dpubimg/nth1TOFUVA/y_icon_baidu.png
    - title: 字节跳动
      icon: https://dpubstatic.udache.com/static/dpubimg/JQBu676x6W/y_icon_zijie.png
    - title: Web
      icon: https://dpubstatic.udache.com/static/dpubimg/d4pVP4BUGU/y_icon_web.png
sevenSection:
  title: 成功案例
  bg: https://dpubstatic.udache.com/static/dpubimg/2OIisHD1qa/anli_bg.png
  details:
  - title: 滴滴出行
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/bcca3d10-01b7-4c08-951a-22418b2443d6.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/didi2.jpeg'
  - title: 出行广场
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/708d5579-81f0-480e-96b3-5f49e8022273.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/guangchuang.jpeg'
  - title: 滴滴公交
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/69a08787-d3a1-4c51-b182-0fcb96960b56.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/didi2.jpeg'
  - title: 滴滴金融
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/8c25bec8-938e-452d-96f9-5e524092a8ee.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/jinlong.jpeg'
  - title: 滴滴外卖
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/8fdd04ed-a74b-4b87-be6e-652550fb843f.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/didi2.jpeg'
  - title: 司机招募
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/d3b62a33-7dbd-45ea-a4aa-f30ad61965f2.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/siji.jpeg'
  - title: 小桔加油
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/988099b3-9930-4c54-abd7-75e70134d649.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/jiayou.jpeg'
  - title: 番薯借阅
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/79573ef6-2a66-462e-8cc7-63eb983168f8.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/jieshu.jpeg'
  - title: 疫查查应用
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/8932c3c2-b6da-4da2-8661-5554fe2bd4a3.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/yiqin.jpeg'
  - title: 小桔养车
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/b6507fca-1e1f-4922-9240-d0f172bea6de.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/yangche.jpeg'
  - title: 学而思直播课
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/40fd646b-10d0-4383-a576-e1d425a8c05d.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/zhibo.jpeg'
  - title: 小猴启蒙课
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/6833dbdb-1dc8-4929-bd41-6d71069b0714.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/ai.jpeg'
  - title: 科创书店
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/8627f48d-cf64-4511-8b2f-ede8e54186a7.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/shudian.jpeg'
  - title: 在武院
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/421bf49b-a9cb-4d54-90d7-e21b80ab21b3.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/wuyuan.jpeg'
  - title: 三股绳Lite
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/46ee136b-0791-4069-98b0-35566d5ef394.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/daka.jpeg'
  - title: 学而思优选课
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/eab48487-5ca2-4368-9080-a6b843097e67.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/xueersi.jpeg'
  - title: 食享会
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/lY7eYSppkW/68747470733a2f2f73686978682e636f6d2f73686571752f696d672f7172636f64655f322e37343664373562342e706e67.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/canshi.jpeg'
  - title: 青铜安全医生
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/58cdbcc5-1f00-4da9-89c6-e638b2f77b19.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/qintong.jpeg'
  - title: 青铜安全培训
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/a9d60600-40c0-4b66-934e-3bb176d3f07a.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/peixun.jpeg'
  - title: 视穹云机械
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/0a816842-dda4-4e30-8c14-e951fb1a8131.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/jixie.jpeg'
  - title: 店有生意通
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/7f1b5f22-d765-4142-862a-999c1ed9d10f.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/shenyi.jpeg'
  - title: 花小猪打车
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/JzHnEyu8VT/aaa.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/dache.jpeg'
  - title: 橙心优选
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/37222642-c508-4a67-8cbc-036a66985bfc.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/chenxin.jpeg'
  - title: 小二押镖
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/nB6-p3WzIQ/xiaoeryabiao.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/xiaoer.jpeg'
  - title: 顺鑫官方微商城
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/nY2bg3A1L_/shunxin.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/shangchen.jpeg'
  - title: 嘀嗒出行
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/DO3m0Iflq1/didachuxing.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/dida.jpeg'
  - title: 汉行通Pro
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/86cd89be-de29-48ad-8cb0-72c432446e7b.jpg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/hantong.jpeg'
  - title: 滴滴出行(支付宝)
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/47fe83e5-c41a-4245-b910-60ed6493d87e.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/didi2.jpeg'
  - title: 小桔充电(支付宝)
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/fa1a524b-da97-4df3-9412-8c988f50b6ae.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/chongdian.jpeg'
  - title: 唯品会QQ
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/2a150b0a-e23d-4e91-98fe-e862410be911.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/weiping.jpeg'
  - title: 唯品会(百度)
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/56273723-ba98-4ceb-9672-075a5ab9f2da.png
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/weiping.jpeg'
  - title: 唯品会(字节)
    details: 写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
    img: https://dpubstatic.udache.com/static/dpubimg/88f898a0-2f3b-44c5-b7ce-c1a8aec25299.jpeg
    demo: 'https://gift-static.hongyibo.com.cn/static/kfpub/3547/weiping.jpeg'
resourcesList:
  title: 资源
  details:
  - title: 案例收集
    actionLink: https://github.com/didi/mpx/issues/385
communityList:
  title: 社区
  details:
  - title: 微信群
    actionLink: https://github.com/didi/mpx
    img: https://dpubstatic.udache.com/static/dpubimg/82e2e776-71e8-4ca5-8878-33b0d5020b6d.jpg
  - title: QQ群
    actionLink: https://github.com/didi/mpx
    img: https://dpubstatic.udache.com/static/dpubimg/etX-gKWeUb/temp_qrcode_share_374632411.png
helpList:
  title: 帮助
  details:
  - title: 反馈问题
    actionLink: https://github.com/didi/mpx/issues
moreList:
  title: 更多
  details:
  - title: 滴滴前端技术
    actionLink: https://juejin.cn/user/4195392101298510

---

## 安装使用

```bash
# 安装mpx命令行工具
npm i -g @mpxjs/cli

# 初始化项目
mpx init <project-name>

# 进入项目目录
cd <project-name>

# 安装依赖
npm i

# development
npm run watch

# production
npm run build
```

使用小程序开发者工具打开项目文件夹下dist中对应平台的文件夹即可预览效果。
