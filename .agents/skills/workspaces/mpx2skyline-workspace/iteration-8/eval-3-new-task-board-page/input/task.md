# 从零创建任务看板页面与两个可复用组件

没有现成页面或组件代码。请根据以下产品需求从零创建 pages/task-board.mpx，并交付更新后的 app.json。页面面向微信 Skyline/glass-easel，同时保持微信 WebView 的对应体验。范围已确认，宿主首页继续保留。

## 数据与交互

- 初始任务为[{taskKey:'t1',title:'整理本周跨团队协作事项与上线验收清单',category:'工作',completed:false},{taskKey:'t2',title:'购买周末出行用品',category:'生活',completed:false},{taskKey:'t3',title:'完成每日阅读',category:'生活',completed:true}]。
- 顶部显示“任务看板”和当前筛选结果数量，通过独立的segmented-control组件提供“全部／工作／生活”分类，当前分类有选中态。通过页面category参数选择初始分类，非法值回到全部。
- 点击任务切换完成状态；无匹配任务时显示“暂无任务”。标题无论多长都显示一行，超出部分省略。
- 页面主体数据增多时可纵向滚动，顶部标题和筛选区域保持可见；窄屏仍有明确的滚动区域。
- 下拉刷新恢复初始任务。模拟异步请求，并提供可注入失败的测试入口；请求结束后刷新反馈结束，失败时原列表仍可继续使用。
- 滚动到底部追加2条当前分类的未完成任务，使用唯一taskKey；全部分类时追加工作任务。每次触底后列表继续显示已存在任务。
- 分类按钮与评分星级按下时缩放到0.96、透明度0.7，松开或取消恢复1；过渡150ms。

## 两个独立组件

页面顶部固定区域实际使用下列两个组件，并通过页面JSON注册相对路径；组件各有独立.mpx文件、component=true配置和语义class样式。

### rating-selector：选项式组件

- 使用createComponent选项式API，文件components/rating-selector.mpx。
- 接收ratingKey:String默认空字符串、value:Number默认0、max:Number默认5、readonly:Boolean默认false、label:String默认“请评分”。
- 显示标题、max个星级和“当前分 / 总分”，区分已选与未选。标题可能很长，在剩余宽度内单行省略，星级与分数保持可见。
- 点击第N颗星立即显示N分，发出change，detail为{ratingKey,value:N}；父组件更新value时同步显示。readonly时保持评分和事件状态。
- 页面绑定ratingKey="board"，初始评分0、max=5、readonly=false，页面接收change更新并展示评分。下拉刷新成功将评分重置为0，失败保留当前评分。

### segmented-control：组合式组件

- 使用script setup组合式API，文件components/segmented-control.mpx。
- 接收controlKey:String默认空字符串、options:Array默认空数组、value:String默认空字符串、disabled:Boolean默认false、label:String默认“请选择”。候选项格式{label,value,disabled?}。
- 显示标题与候选项，候选项水平等分，长候选文案在各自宽度内单行省略；选中和禁用状态可区分。
- 点击可用项立即更新选中值并发出change，detail为{controlKey,value}；父组件更新value时同步显示。整体或单项禁用时保持选择和事件状态。
- options在初始化、异步返回前、父级传入null时显示空候选列表，更新为数组后正常显示。
- 页面绑定controlKey="category"及全部/工作/生活三个候选项，收到change后更新页面分类和任务列表；页面category参数决定传入的初始value。

两个组件的可点击项均按下缩放0.96、透明度0.7，松开/取消恢复1，过渡150ms。各实例独立管理按压状态。组件可单独挂载验证，其数据和事件均通过公开接口连接页面。

## 实现与交付

页面使用Mpx组合式API及script setup，两个组件分别使用上述指定API，样式使用组件内语义class。宿主未提供原子CSS工具链。通过所给app.json接入页面，保留首页和现有window/WebView设置；页面配置与导航由你完成，确保可用于Skyline和WebView。

交付pages/task-board.mpx、components/rating-selector.mpx、components/segmented-control.mpx、app.json及report.md。记录真实验证及未执行项；测试与证据放配置run-1/。验证内容包括参数初始化、筛选、完成状态、空列表、刷新成功/失败、连续分页及触摸取消。当前专项评分只评价Skyline适配要求，通用Mpx语法与业务行为单独验证。本次仅覆盖微信 WebView / Skyline。

组件验证覆盖默认属性、父级value连续更新、readonly/整体禁用/单项禁用、options为空/null/数组、change事件detail、两个实例状态隔离，以及页面真实注册、传参和事件回写。先用真实Mpx编译流程检查三个SFC及setup模板绑定，再从实际模板绑定调用处理器；编译与通用功能单独记录，mock成功与真机结果分别报告。
