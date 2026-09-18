# 适配结果

交付 user-list.mpx、row.wxml、logo.svg。范围仅组件与两个直接资源，宿主页已接入 Skyline/glass-easel，不变更全局或页面配置。

- 标题在微信使用 span 同段容纳图标与 label；max-lines/overflow 共同截断，Skyline 图片 inline-block，WebView 保留 nowrap/hidden/ellipsis。限定可用宽度且为提示圆点预留 8px。
- 圆点改真实节点，8px、#f50、圆形，保留每秒 .3 → 1 循环；填充模式 both。局部唯一关键帧名减少冲突。
- 保留 label/payload、config.default；initData 与空数组保障首帧；setRows 将 null 归一化为空数组，再过滤 visible 用户。外部命名模板接收过滤后 index/item。
- 实际用户列表 id 为 users，显式 enhanced/type/list/scroll-y，通过实例查询 #users 获取 context 并 scrollTo({top:0})；other 保留作对照。
- 同一个按钮通过 pressed 类驱动 .96/.7，松开或取消恢复 1，过渡 150ms。简单详情保留 navigator/text，卡片改 view 点击 navigateTo。

完整矩阵逐条复核见 ../run-1/audit.json；无未解释 error。配置规则按组件范围排除。宿主 keyframeStyleIsolation 未提供，动画作用域仍需集成检查。

验证：6 个 Jest 静态/mock 用例通过，提取脚本 ESLint 检查通过。一次测试正则误将花括号解释为量词，修正断言后通过，业务实现未因此修改。Mpx 完整编译、真机渲染/实际滚动均 not_run；静态结构和 mock 调用不代表真机体验已通过。长 label、动画周期、两入口导航及滚动位置需在 WebView/Skyline 两端验收。
