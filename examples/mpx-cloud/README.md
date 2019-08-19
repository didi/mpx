# 示例项目 mpx-cloud

> 演示如何在mpx框架中使用微信小程序的云开发能力

## 使用

本示例完全按照 [tcb官方示例](https://github.com/TencentCloudBase/tcb-demo-blog) 实现，关于云开发相关的环境配置，数据库配置可查看原仓库：https://github.com/TencentCloudBase/tcb-demo-blog。

使用云开发能力必须要有appid！！

务必在运行本示例前修改project.config.json填写你的appid。其次是云环境的准备，主要看官方文档及上面提到的仓库。

```bash
# install dep
npm i

# for dev
npm run watch

# for online
npm run product
```

## 关于

在MPX中使用小程序云开发能力和原生并无区别，只需要组织好项目结构即可，本示例及模板预备的方案是预设云函数存放在functions文件夹，每次构建生成小程序dist代码的时候，同步复制functions进dist里，小程序路径从dist里再加一层变为dist/miniprogram，project.config.json声明小程序路径和云函数路径。

这种做法并不一定是最好的，比如修改云函数时候，一定要去修改项目根目录functions文件夹里的，不可以直接在小程序开发者工具中修改dist里的functions文件夹里的代码。

只要清楚云开发路径的原理，其实并不一定非要用模板或者本项目形式的目录结构，可以直接在project.config.json里把小程序目录指向dist，云函数目录指向根目录的任意文件夹即可。
