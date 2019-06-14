# mpx渐进式接入demo

已有的微信小程序可以快速、无伤、渐进式地接入mpx，此处我们以一个UI库的example为例子：

https://github.com/TalkingData/iview-weapp/tree/master/examples

我们来看看如何让这个示例快速接入mpx吧。

本项目是最终完成态，用户可通过 `npm i && npm run build` ，使用开发者工具导入本文件夹即可看到效果。

## 迁移步骤

总的步骤就是，利用脚手架创建项目，复制原始项目的所有东西到src下面，替换app相关的三个文件为app.mpx

以下是细节，用户可跟随步骤尝试一遍，任何问题欢迎issue反馈：

1. 使用@mpxjs/cli生成一个mpx项目：mpx init 项目名
2. 删除项目本来带有的pages和components文件夹
3. 复制app.json \ app.js \ app.wxss 三个文件到app.mpx对应的块里
4. 复制iview-examples里的pages到src下面，就像项目本来的pages文件夹一样
5. 复制iview项目的dist到src下面（这一点其实属于iview-example本身没做好，如果你尝试它会发现也需要进行这一步否则打不开）
6. 执行npm run build 或 npm run prod 完成。

整个过程要不了5分钟，迁移你的项目成为一个mpx项目也是一样的高效！

> 此项目不代表在mpx中使用ui组件库的方式，仅是使用一个现有项目证明迁移mpx很方便，ui库的使用请看[这个示例](../mpx-useuilib)

## 使用mpx

假设本项目要进一步开发，希望用上mpx的特性，比如单文件，可以很轻松地新建一个mpx文件，和之前的原生小程序文件混合在一起，通过mpx的构建得到最终的代码。

比如我们希望修改一下index页面，原本的index页面位于/pages/index/index。  
（为什么是index/index？因为小程序一个页面由四个文件组成，为了不看花眼大家通常会通过文件夹容纳一个页面，而mpx单文件则没有这个文件，可以愉快地去掉一层）

在pages文件夹下创建index.mpx文件，复制原本的四个文件到index.mpx的四个域下。（[原四个文件](./src/pages/index) VS [index.mpx](./src/pages/index.mpx)）

修改标题，修改一下logo，修改一下json里的title配置，本示例到此结束。

PS：真正的application此处就该从@mpxjs/core中引入createPage \ createComponent 等方法，开始体验mpx带来的更爽的开发体验了。
