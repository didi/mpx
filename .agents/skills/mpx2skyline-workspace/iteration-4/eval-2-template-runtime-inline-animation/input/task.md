# 模板运行时、图文混排与动画

## 模板与运行时

适配 user-list.mpx和row.wxml。setRows接收{items:Array|null}，数据返回前以及null时显示空列表，正常数据展示visible用户与行号。回到顶部按钮操作实际用户列表；两个详情入口均到/pages/detail。范围为组件及外部片段，宿主页已接入Skyline/glass-easel。

## 图文混排与动画

适配 promo-card.mpx并保留logo.svg。图标和标题在同一行展示并共同截断；圆点按原周期闪烁。按钮按下缩放0.96且透明度0.7，松开或取消恢复，过渡150ms。范围为组件，宿主页已接入Skyline/glass-easel。

交付所有输入业务文件的完整适配版本与report.md。多个组件分别保持自身接口与业务语义，无需为合并测试额外构造父子调用关系。评分目标为微信Skyline/glass-easel；WebView保持需求中的体验，其他目标分支可采用各自合法实现。验证证据放配置run-1/。
