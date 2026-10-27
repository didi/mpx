# case2 / mpx2skyline 独立评分审计

本组能力分数为7 / 8；失败ID为s2_05。原8条断言及顺序保持不变，按verification逐节点核对。失败依据是断言明确要求的图片inline-block缺乏实现或可信默认等价证据，不是因为没有真机而扣分，也不代表已经观察到真实图文混排故障。

## 范围与证据保全

从本case输入、评分定义和本组记录独立评分；不读取另一组或历史输出。参考限于指定mpx2skyline/SKILL.md及其references。读取outputs的user-list.mpx、row.wxml、logo.svg、report.md全部内容，run-1/agent.jsonl全部56条记录，全部19条完成命令及返回状态、4条文件变更记录，以及测试源码、审计源码/扫描、验证JSON、编译/ESLint/Jest日志和执行metrics。

agent.jsonl共19个command_execution、4个file_change完成事件，合计23个工具动作与metrics一致。唯一非零命令为首次Jest启动（Watchman权限错误），后续禁用watchman后退出0。未发现命令读取其他组输出、历史评分或非指定Skill；编译引用的../mpx/scripts/compile-validate.js是获准的基础工具，不是读取mpx Skill内容。

source-snapshot.json前后相同；重新计算4份当前input及指定Skill的SKILL.md和6份references哈希，均匹配实际运行快照。logo.svg与原输入逐字相同。评分仅新增run-1/grader-*、assessment.json和本audit；原outputs、定义、agent.jsonl、metrics及validation均未修改。

## 通用契约（与8分分开）

| check | 结论 | 证据 |
| --- | --- | --- |
| mpx-bindings | passed | user-list.mpx:12动态类使用wx:class；所有普通class为静态，无普通动态style。实际wx编译生成class={{_s_.c("button", {pressed:pressed})}}，状态表达式没有丢失。 |
| renderer-exposure | passed / 通用实现 | 组件使用选项式createComponent；data/computed/methods覆盖模板状态与事件，无setup局部绑定暴露遗漏。没有isSkyline。span与CSS动画作为共用实现，不因未写renderer分支单独扣分；图片display缺口仅按s2_05记录。 |
| component-config | passed | user-list.mpx:54-55保留component:true，外部资源import与路径经真实编译解析。无自定义组件依赖；单组件范围无需额外页面/app配置，宿主接入条件由任务确认。 |
| delivery-scope | passed | outputs仅4份要求文件，报告没有重复粘贴完整组件；资源齐全，原input哈希一致，未新增页面/app配置。 |
| evidence | passed，存在能力覆盖缺口 | 原报告/validation明确区分静态、mock、真实wx编译、工具与真机not_run；没有声称长label实测通过。原15项测试未覆盖图片inline-block要求，其静态pass与审计无残留不能证明s2_05全部成立；本评分修正该证据缺口，不改原记录。 |

## 实际链路与独立验证

- 循环：initData.visibleItems=[]保护computed之前首帧，items=[]，唯一setRows写入口把undefined/null归一为[]，computed在可达路径中总返回filter数组。独立grader-check.cjs:40-50补测了原测试未显式调用的undefined更新，同时覆盖null、[]、正常数组；外部具名模板代入两个不同visible用户得0:甲、1:乙。没有把任意直接篡改内部items为undefined当作要求中的公开数据路径。
- 回顶：编译模板中实际按钮bindtap=scrollTop→实例方法this.createSelectorQuery→select('#users')→node().exec→目标context.scrollTo({top:0})。users在模板与编译产物均是scroll-y且enhanced=true，旁边other不能用来代替验证。独立mock从编译按钮绑定取方法名，检查查询this为当前实例、selector关联到实际users节点且other未调用。使用this.createSelectorQuery也满足性能推荐。
- 外部模板：真实编译将import的./row.wxml解析到/template/row366d1826.wxml，仍调用user-row、传入index/item；外部产物定义同名模板和姓名/行号插值。循环filter后重新编号，不泄漏被过滤用户。
- 导航：简单navigator真实子节点仅text；复杂卡片是view的openDetail点击事件，mock navigateTo与navigator同为/pages/detail。允许等价外层事件，未要求将复杂view塞回navigator。
- 动画：真实pulse节点配1s infinite、both、8px、#f50和.3→1；按压按钮状态false→true→false分别来自press、release及cancel绑定。实际编译CSS将150ms归一为.15s、scale(.96)未改变语义；动态类表达式生成正确。播放及响应式调度仍不在Node VM证明范围内。

独立真实编译使用本组原工具compileValidate(target=wx,type=component,cleanup=false)，成功且0错误0警告，耗时3144ms，见grader-compile.cjs/json。产物单独保存在grader-compiled/（原编译日志没有保留模板产物）。__validate_0.wxml:1实际标签为span，含max-lines={{1}}、overflow=ellipsis与共同image/text；__validate_0.wxss:1有宽度及弹性约束、关键帧与状态过渡，.logo仍没有display声明。独立grader-check.cjs直接解析这些真实编译文件及原业务脚本，首次执行通过；grader-evidence.json状态passed只指该脚本中的静态/mock检查，不覆盖其中显式false的inlineBlockEvidence。

## s2_05失败、Skill适用口径与评测局限

既定断言同时要求“图片采用inline-block”以及图标/标题共同单行省略。源码及实际编译证明span、共同承载、省略属性、flex:1、width:0、min-width:0和WebView省略CSS均存在。源码.logo与编译.logo只有尺寸及vertical-align，没有显式inline-block、动态display或其他可证实的等价机制；宿主默认样式没有提供或检查，默认image呈现和窄容器长label效果也未测，故不能证明图片inline-block条件成立，按证据不足计false。

但指定Skill references/skyline-style-practice.md:226-243给出基础span+image+text组合，示例没有要求image显式display；:261明确说明图标+业务rich-text场景的inline-block/inline-flex处理不能直接套用基础span组合。本输入使用基础text，没有rich-text。因此，当前Skill允许的基础组合比固定s2_05的图片display条件更宽；评分严格保留当前8条定义，但不能据此宣称该组件实际上必然混排失败或违反Skill的所有基础组合规则。

s2_05的renderer路径为同一通用span及同段WebView省略CSS；不存在额外布尔变量或错误的编译端条件。未单因缺少分支计失败。若未来修订评测，应明确此固定inline-block条件是否是业务额外约束，或在能证明默认呈现等价时允许基础组合；不能在本轮暗改断言或给历史组追溯换分。原user-list.test.cjs:129-137检查共同节点、属性、宽度与mode，但没有检查图片display，名称中的long labels不等于真实长label排版测量。

## 原验证可信度、异常与not_run

原ESLint命令agent.jsonl:29-31退出0且eslint.log为空；原真实wx编译:30-32,39成功，compile.log为0错误0警告。Jest:36-37首次因Watchman状态目录fchmod EPERM失败，:42-43增加watchman:false后通过15项（10个逻辑mock、5个静态）；:47及jest-results.json相符。修复运行参数1次，没有业务断言失败修订，未超过3次限制。

audit.json/audit-scan.log覆盖48个ID，但audit.cjs:9-33预写结论、:43对其余规则默认pass、:48-54固定输出无残留；它是审计记录而非对所有语义的自动证明。父子关系、组件查询、真实编译标签及图片样式由评分另行复核。stderr.log的技能扫描遍历上限和Codex配置警告没有阻止指定Skill被显式读取或本组构建/测试完成。

开发者工具、真机双renderer渲染、长label最终省略位置、SVG视觉对齐、圆点实际播放、150ms动画效果、响应式原生调度、真实回顶与真实导航均not_run。Node两renderer值运行同一选项逻辑，不能声称双模式呈现已通过；原始报告已明确这些边界。没有因为这些not_run而否定静态/编译证据充分的其他7条能力。

原执行metrics：292029ms（292.029秒），input_tokens=964591、output_tokens=12549、total_tokens=977140；agent.jsonl usage含cached_input_tokens=896768，输入含缓存计数，不能解释为纯未缓存成本。
