# 从零生成资料页

input 中没有现成源码。请从零创建以下完整文件：

- `mpx.config.js`
- `src/app.mpx`
- `src/components/profile-card.mpx`
- `src/pages/profile/index.mpx`

## 业务要求

1. 同一套 Mpx 源码需要同时输出微信小程序和 Web；不要创建两套页面或修改框架源码。
2. 应用注册 `/pages/profile/index`。Web 部署在 `/profile-demo/` 下，使用 history 路由，静态资源路径和路由 base 都必须匹配该前缀。
3. 页面显示两张资料卡，每张卡接收自己的标题和摘要。两张卡初始都折叠，用户点击某张卡时只展开或收起该卡的摘要。
4. 页面分别向两张卡传入 `warm-title`、`cool-title` 两个 `accent-class` 外部样式类。组件用该外部类修饰标题；两个调用方类提供不同文字颜色，并都提供 `12px` 内边距。Web 构建需要让该外部样式链实际生效，同时保留框架已有的默认外部类配置。
5. 微信端保留页面分享入口，分享标题为“个人资料”，路径为 `/pages/profile/index`。题目没有提供 Web 分享服务或业务协议；Web 页面需要如实显示分享服务尚未接入或留下紧邻入口的具体 TODO，不能伪造分享成功或复制成功。
6. 使用普通 Mpx 应用、页面、组件与 JSON 配置结构；不要用静态 HTML、Vue 单文件组件或伪造 API 代替。
