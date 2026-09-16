# 页面滚动、吸顶与层级配置

## 页面滚动与配置

适配 orders.mpx、app.json，保留service.js。页面标题为订单，提供初次加载、下拉刷新、分页追加及滚动位置展示，刷新失败也能结束刷新态。范围已确认，没有自定义子组件；原首页、窗口配置和WebView配置继续使用。

## 嵌套滚动、吸顶与层级

适配 category-panel.mpx。sections为[{id,title,items:[{id,name}]}]；外层纵向滚动，每组标题吸顶，组内横向滚动且项目宽120px，两种renderer具有对应体验。打开弹层时覆盖悬浮按钮，点击关闭。范围为组件，宿主页已接入Skyline/glass-easel。

交付所有输入业务文件的完整适配版本与report.md。多个组件分别保持自身接口与业务语义，无需为合并测试额外构造父子调用关系。评分目标为微信Skyline/glass-easel；WebView保持需求中的体验，其他目标分支可采用各自合法实现。验证证据放配置run-1/。
