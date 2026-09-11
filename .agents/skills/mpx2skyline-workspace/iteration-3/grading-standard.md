# Skyline 专项评分标准 v3

当前测试集包含5个case、31条断言，已完成Skill/no_skill各一轮。evals.json是断言的唯一事实源，各case的eval_metadata.json仅为副本。

## 计分范围

每条断言评价微信Skyline/glass-easel实际生效路径中的适配结果，并明确正向实现、对应规则来源和验证方法。WebView只在断言明确涉及双渲染兼容时参与判断。RN及其他目标平台的条件分支可使用各自合法实现；根据编译目标和renderer分析实际路径，而非对整个文件做禁用关键字扫描。

一个独立适配能力只计一次：普通文本省略归case 0；列表容器和页面事件归case 1；查询和外部模板归case 2；混排内联结构与动画归case 3；嵌套/横向滚动及吸顶层级归case 4。混排行验证span容器内图文共同截断，普通text省略检查不能替代该结构的验证。刷新、分页、事件数据的必要业务状态只作为对应Skyline事件链路的观察点。

每条满足全部必要条件记1，否则记0；允许规则支持的语义等价实现。人工检查实际节点、数据和渲染分支，按verification执行最小验证。缺失产物使依赖它的断言失败，并另外记录交付问题。正向规则的作用是证明目标路径成立，不通过删除其他平台实现获得分数。

## 通用验证与专项分数分离

完整文件、资源可解析、Mpx属性/API语法、defineExpose、父子状态同步、普通change事件、readonly、稳定key与基本业务回归记录于validation.json。它们不独立占据Skyline断言，但如果真实语法或编译错误使某条Skyline实现无法执行，则相应断言仍失败。

分别记录：SFC/脚本/模板/JSON解析、script setup编译、核心行为测试、完整应用构建、Skyline/WebView真机验证。未执行项标为not_run；静态或mock通过不推断真机通过。字体核验按输入给定的宿主资源边界处理。状态为passed的总分需同时披露构建及真机验证范围。

## 输出

每个配置产物位于eval-*/<configuration>/outputs/；grading.json、validation.json、execution.json、timing.json、metrics.json和工具轨迹位于run-1/。每份grading.json包含该case全部断言的id、原text、passed、可定位evidence，以及passed/failed/total/pass_rate汇总。

主指标为通过断言数/31；逐case展示12、7、5、3、4各自分母。报告完整case通过数/5，比较独立Skill与合并Skill每条断言的通过转失败，不用case平均分替代加权总分。模型、思考强度、提示模板、输入、工具权限与验证方式保持一致，仅替换中央Skill路径。首次运行前须指定merged_skill路径。每次执行前后记录输入、规则来源和Skill文件哈希。

## 历史基线

iteration-2的9个case/90条断言保留原样，属于旧测试集。v3输入和评分粒度已改变，旧90/90既不折算成31/31，也不复制到新case。要评价合并效果，先在本集重新运行独立mpx2skyline，再运行合并Skill。本次已执行v3的Skill/no_skill对照，结果见benchmark.md；合并Skill尚未执行。
