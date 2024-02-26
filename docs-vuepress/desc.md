# 文档指南

该文档使用vuepress生成

## 该项目指南

已安装依赖vuepress，并已经在package.json中新增写作和部署脚本


``` sh
# 写作时
npm run docs:dev

# 部署时
npm run docs:build
# 将在docs-vuepress/.vuepress/dist下生成静态文件，部署到相应服务器即可，部署参考下方链接
```

## 编写格式指南

* 对于引用的文档或资料使用[链接]()指明出处
* 中英文混排时为了阅读体验使用空格对于英文单词进行包裹，在标点符号边缘或句首时可省略该侧空格，例如：这是一个 word 而不是 world。
* 句首的英文单词首字母大写
* Mpx 正确的写法为 `Mpx`，首字母大写，任何地方都应该这样书写，其余的专业名称参考原始的写法进行书写
* 除英文段落外，所有标点符号使用中文半角
* 能使用示例代码描述的部分都**尽量添加示例代码**进行说明，show me the code
* 对于文档内容拓展说明的部分使用>引用的方式进行编写，like this
> 我们来聊聊人生吧，这个地方你可以不看但没必要

## 参考

- [部署指南](https://www.vuepress.cn/guide/deploy.html)
- [Vuepress文档](https://www.vuepress.cn/)
