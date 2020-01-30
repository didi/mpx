# mpx-i18n

> A mpx project for showing i18n usage

> 本示例项目将展示在mpx项目中如何使用多语言(i18n)能力

## Dev

```bash
# install dep
npm i

# for dev
npm run watch
```

## 关于MPX的i18n

i18n能力是要求在模板上执行函数的，因此需要WXS这种可以在渲染层运行的脚本能力，在mpx支持的多小程序平台中，目前微信(WXS),支付宝(sjs),百度(filter),QQ(qs)能支持。

mpx框架通过mpx编译增强能力提供出i18n所需要的wxs函数并注入到需要使用到的组件里。得益于mpx框架的设计（编译增强+运行增强的完美配合），mpx应该是目前唯一一个在框架层面完美支持i18n能力的小程序框架。

用户可参考本项目，在准备好i18n文件后在 build/mpx.plugin.conf.js 文件中引入并配置，或直接内联在 build/mpx.plugin.conf.js 文件中。即可在组件模板中使用i18n能力。

更多内容可参考文档：https://didi.github.io/mpx/i18n.html
