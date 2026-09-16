# Skyline 专项评分标准 v4

4个case，共37条正向断言，分母依次为12、11、8、6。evals.json是唯一评分定义，各eval_metadata.json保持一致。

仅评价实际微信Skyline/glass-easel路径；WebView按明确的兼容要求检查，RN分支可采用自身合法实现。每条满足全部条件得1分，证据不足得0分。允许规则支持的语义等价实现；按verification追踪真实节点与执行链路。

原31条适配断言保留ID及覆盖目标；case 1的6条滚动断言按统一页面修订，case 2的4条验证方法明确指向统一组件中的实际节点，迁移表保留前版内容。新增6条创建断言用于验证“需求到方案”的独立入口，与迁移case共享能力规则但不同任务触发；related_adaptation_assertions显式标记对应能力，不能宣称37条是37种互不重叠的能力。每个case内部按不同适配结果计分。case 1的主订单区域使用custom承载吸顶，外层nested负责嵌套，横向list/custom负责组内订单；刷新、分页和位置监听都验证主区域的真实绑定。另列迁移31条和创建6条分数，避免综合分掩盖任一入口劣化。

交付完整性、props/API/script setup/defineExpose语法、页面注册、参数筛选、普通状态与事件、稳定key及资源完整性记录于validation.json，不单独占Skyline分数。真实编译错误使目标实现不可执行时，对应断言仍失败。

新建case实际执行参数初始化、空分类、完成切换、刷新成功/失败、两次分页与触摸取消的业务验证；事件与Skyline容器/动画的衔接按专项断言评分。静态或mock通过不等于真机通过。应用构建、微信模板编译、真机渲染分别记录，未执行为not_run。

产物位于eval-*/<configuration>/outputs/；评分、验证、执行、耗时和Token证据位于run-1/。输入统一读取eval-*/input/，Skill读取中央路径，记录执行前后输入和Skill版本/哈希，缺失Token/精确耗时用unavailable。

独立Skill、no_skill及未来合并Skill采用相同输入、模型参数和验证方式，只有Skill读取权限不同。比较逐条通过转失败及分入口分数；本版尚未执行，不复用iteration-3分数。

case 2的外部row.wxml与logo.svg继续保留，以验证外部模板作用域与真实图文混排；回顶按钮的查询结果和CSS反馈分别计分，所有证据应来自同一个user-list组件。
