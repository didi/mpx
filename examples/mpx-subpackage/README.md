# mpx-subpackage
> a demo about subpackage in mpx framework

本示例演示如何在mpx框架中使用分包加载能力

## Usage

```bash
# 安装依赖
npm i

# 执行构建
npm run build
```

用微信开发者工具打开构建后生成的dist目录即可查看效果

## 代码说明

src下app.mpx为主包入口，src/subpackage为分包。

app.mpx在packages域下指向subpackage中的app.mpx，并跟一个query为root=xxx。

分包的页面在src/subpackage/app.mpx中声明，并不一定要在subpackage文件夹中，但不得和主包页面相同。

跳转到分包页面时，需要拼接一个root值在前面，可以手工拼接，但建议使用resolve的形式，（[例子](https://github.com/sky-admin/mpx-subpackage-demo/blob/master/src/pages/index.mpx#L8)），详情 [请看文档](https://didi.github.io/mpx/single/json-enhance.html#%E5%88%86%E5%8C%85%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)

## 其他备注

subpackage可以放在任何位置，甚至是作为一个npm包单独发包，在主项目中引入。

页面跳转到subpackage里的页面时，因为构建时会加上hash，相对路径不是真实的相对路径，所以在import时候需要在最后加上?resolve可以替换为真实路径（[例子](https://github.com/sky-admin/mpx-subpackage-demo/blob/master/src/pages/index.mpx#L8)）
