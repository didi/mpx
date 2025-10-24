# 跨端输出配置

Mpx以微信增强DSL为基础，支持跨端输出至多端小程序、web和客户端，包括支付宝、百度、抖音、京东、QQ等多端小程序平台，基于Vue的web平台，和基于react-native的ios、android及鸿蒙平台。

## 跨端输出配置

配置mpx进行跨端输出十分简单，找到项目构建的webpack配置，在@mpxjs/webpack-plugin的配置参数中设置mode和srcMode参数即可。

```javascript
new MpxwebpackPlugin({
  // mode为mpx编译的目标平台，可选值有(wx|ali|swan|qq|tt|jd|web|ios|android|harmony)
  mode: 'ali',
  // srcMode为mpx编译的源码平台，目前仅支持wx   
  srcMode: 'wx'
})
```

对于使用 @mpxjs/cli 创建的项目，可以通过在 `npm script` 当中定义 `targets` 来设置编译的目标平台，多个平台标识以`,`分隔。

```javascript
// 项目 package.json
{
  "script": {
    "build:cross": "mpx-cli-service build --targets=wx,ali,ios,android"
  }
}
```

## 支持的平台

### 小程序平台
- 微信小程序 (wx)
- 支付宝小程序 (ali)
- 百度小程序 (swan)
- QQ小程序 (qq)
- 抖音小程序 (tt)
- 京东小程序 (jd)

### Web平台
- 基于Vue的Web应用 (web)

### 客户端平台
- iOS应用 (ios)
- Android应用 (android)
- 鸿蒙应用 (harmony)

## 构建命令

### 单平台构建
```bash
# 构建微信小程序
npm run build:wx

# 构建支付宝小程序
npm run build:ali

# 构建Web应用
npm run build:web

# 构建iOS应用
npm run build:ios
```

### 多平台构建
```bash
# 构建所有支持的平台
npm run build:cross

# 构建指定的多个平台
mpx-cli-service build --targets=wx,ali,web
```

## 项目结构

跨端项目的典型目录结构：

```
src/
├── components/          # 公共组件
├── pages/              # 页面文件
├── utils/              # 工具函数
├── styles/             # 样式文件
├── app.mpx             # 应用入口
└── app.json            # 应用配置
```

## 下一步

- [条件编译机制](./conditional.md) - 了解如何处理平台差异
- [平台差异处理](./differences.md) - 掌握差异抹平技巧