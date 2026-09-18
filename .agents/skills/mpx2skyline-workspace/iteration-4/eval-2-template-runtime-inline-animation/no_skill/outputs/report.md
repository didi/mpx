# 用户列表适配报告

交付 `user-list.mpx`、`row.wxml` 和原始 `logo.svg`。

- 使用合法 `users` ID，查询限定组件实例及真实列表，启用 enhanced 后调用节点 `scrollTo({ top: 0 })`；保留 other 容器以区分查询目标。
- items 初始为空数组，setRows 将 null 规范为空数组；computed 过滤 visible，外部命名模板显式接收过滤后的 item/index。
- 保留 label/payload 属性与 config.default。详情文本、详情卡片分别使用原生 text/view 点击事件调用 navigateTo。
- Skyline 使用 span 包含图标和完整 label，并限制单行；WebView 使用共同截断的行内容器。以组件 renderer 判定分支，提示点作为标题旁独立的固定尺寸节点。
- 按压通过同一个按钮的 pressed 状态改变 scale/opacity，150ms 过渡，touchend/touchcancel 恢复。
- 圆点使用 8px、#f50 实体 view；16ms 定时采样一秒周期的 0.3→1 渐变，不依赖伪元素或 createAnimation。卸载、页面隐藏清理定时器，显示时重新启动。定时更新会产生 JS 到渲染层的通信开销，后台计时与实际帧率由宿主控制。

## 验证

Node mock/static 与 Jest 均为 7/7 通过；组件 script 使用独立 eslint:recommended 配置检查通过。原始日志、可运行测试、配置及分层状态见 `../run-1/`。ESLint 第一次命令因本地版本不支持 --extends 参数失败，改为配置文件后通过；未修改业务代码来规避错误。

微信编译、Skyline/glass-easel 真机、WebView 真机均为 **not_run**。测试证明模板静态结构及 JS 逻辑，不证明 span 的实际截断、renderer 字段在目标基础库的取值、CSS 过渡渲染或 native scrollTo 的实际滚动效果。验收需在两种 renderer 下设置超长 label，检查图标与文本共同单行省略、圆点周期与位置，列表滚动后按压/取消/点击回顶及两个详情入口。
