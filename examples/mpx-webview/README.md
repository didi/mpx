# mpx-webview-bridge

@mpxjs/webview-bridge是在mpx框架完成了跨平台小程序输出能力后提供的让H5页面解决平台api差异的bridge

通过本bridge，工作在小程序中的H5页面在调用相关API时将无需再编写平台判断代码

此demo是bridge的基础用法展示

## 使用

```bash
# 安装依赖
npm i
# dev
npm run dev
```

npm run dev将会进行两项任务
1. 进行跨平台构建输出，会产出dist文件夹和wx/ali/swan/tt四个子文件夹，使用相应的开发者工具打开对应的文件夹，即可预览效果
2. 启动一个简单的http-server托管H5文件夹下的html和js资源

用相应平台的开发者工具打开对应项目文件夹后，可以尝试进入webview，webview则提供了一个按钮返回小程序首页

> 某些平台有缓存，如想基于本项目做一些小改动体验更多API使用，记得在webview的src上加个query避免缓存
