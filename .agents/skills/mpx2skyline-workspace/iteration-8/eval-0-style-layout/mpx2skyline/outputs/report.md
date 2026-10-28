# style-card 微信双 renderer 适配报告

完整产物：[style-card.mpx](./style-card.mpx)。范围为输入中的单个 `component:true` 组件；输入目录仅有 `task.md` 与该组件，无其他业务依赖文件或调用方。保留 `title: String` 与默认值“本周精选商品”。只覆盖微信 WebView / Skyline，不改宿主页面、全局配置或输入。宿主提供的 `defaultDisplayBlock/defaultContentBox` 是本组件的布局前提。

本次只使用指定 `iteration-8/skill-snapshots/mpx2skyline` Skill 与相关 reference；真实编译使用允许共享的 mpx 快照编译工具。没有加载其他 Skill、历史产物或评分资料。

| 要求 | 实现 |
| --- | --- |
| 长标题单行省略 | 原 WebView nowrap/hidden/ellipsis 保留；text 增加 `max-lines=1`、`overflow=ellipsis`，插值紧贴标签。 |
| 两列标签、活动红字 | Grid 改横向 Flex，标签各宽50%；属性选择器替换为明确的 `badge-sale` 类，保留红色 `#d00`。 |
| 窗口宽度≤320px时12rpx，否则24rpx | WebView 保留媒体查询，查询仅匹配非 Skyline 专用类；Skyline 根据 `getWindowInfo().windowWidth` 初始化并监听 `onWindowResize`，动态类控制 padding。`detached` 使用同一回调调用 `offWindowResize`。WebView 的窗口变化由原生媒体查询自动处理，无额外监听。 |
| child 几何关系 | outer 使用 `padding-top:20px`；child 无顶部 margin，保持四周10px padding、100px内容宽和显式content-box。因此盒子顶部距 outer 外沿20px，内容顶部30px，外宽120px。overflow:hidden 仅保留裁剪用途。 |
| 两块垂直间距16px | 第一块承担16px margin-bottom，第二块margin-top归零，避免 Skyline 将16与12相加。 |
| 阴影与滤镜 | 单个rgba阴影、独立blur原样保留；rgba函数内部逗号不视为多阴影。双阴影拆为同尺寸父子，外层较后层阴影 `0 4px 8px #333`，内层上层阴影 `0 2px 4px #000`。复合滤镜按从内向外先blur、后brightness拆层，每节点只有单函数。 |
| 提示条负margin占位链 | 只对 overlap-host、tips-wrapper 设置纵向Flex，保留提示条height、padding-bottom、负margin-bottom；补偿内容卡片margin-top为-64rpx，推导见下文。普通单侧-8rpx回拉保持原父布局。 |
| 横向标签区 | 保留scroll-x、enable-flex、type=custom，显式横向布局；直接fit-content宽100%、背景铺满320px视口，两项各50%=160px。不靠内部Flex项或min-width反向撑开直接容器。 |

负 margin 的**静态基线推导**（未进行渲染测量）：提示条含 padding 的高度 `H=92+92=184rpx`。原 WebView 中，末子节点的 `-28rpx` 与后项的 `-92rpx` 经 wrapper 折叠，合并值取 `min(-28,-92)=-92`，内容卡片起点为 `184-92=92rpx`。改成纵向 Flex 后，wrapper 占位 `184-28=156rpx`，内容卡片回拉改为 `-64rpx`，起点仍为 `156-64=92rpx`。提示条与卡片的可视重叠仍为92rpx，卡片末端及宿主占位仍为 `92+120=212rpx`。这些结果以本组件起点为相对原点，未声称已真机确认。

字体核验：源码存在独立 `@font-face { font-family:'City-Semibold' }`，其家族名按已确认设计保留，不因名称带 Semibold 就改成 City。`Trip-Medium` 由宿主提供，未拿到其字体注册或二进制，无法证明其是独立家族还是仅有 PostScript name。两者分别保留600/500，不擅自改为700或bold。部分机型存在500/600字重匹配或合成字重异常风险，宿主接入后须核验字体文件name表（family、subfamily、PostScript name）、加载成功与实际字形，并在iOS/Android目标机型对比两种renderer。

`city.woff2` 未包含在输入中，按任务说明由宿主提供。当前保留 `src:url('./city.woff2')` 的资源契约，接入时须由宿主将真实字体提供在组件相对路径。未创建占位字体、借用其他字体或删除字体声明来制造编译通过结果。

| 验证层级 | 结果与证据 |
| --- | --- |
| 静态完整审计 | 完整矩阵48条已逐条复核，详见 [audit.json](../run-1/audit.json)、[聚合扫描](../run-1/audit-scan.log)。无未解释的error；字体规则按上述设计和资源信息记录例外。页面/全局配置规则对本单组件不适用；无Worklet、页面滚动生命周期、SelectorQuery、富文本或自定义组件子树。 |
| ESLint | **passed**：抽取组件脚本，recommended规则及基础风格规则，0 error、0 warning。见 [eslint.json](../run-1/eslint.json)、[执行脚本](../run-1/check.cjs)。不等同于模板或WXSS引擎检查。 |
| Jest：静态与mock | **passed，14/14**：含319/320/321/375px初始化、跨断点resize、卸载清理同一回调、多实例隔离、WebView不注册监听，以及盒模型/布局约束。见 [测试源文件](../run-1/style-card.test.cjs)、[jest.json](../run-1/jest.json)。首次运行因Watchman沙箱权限失败，关闭Watchman后第2次运行通过；未修改环境配置。mock不执行原生布局或Mpx响应式渲染。 |
| 真实wx编译 | **failed（依赖阻塞）**：执行一次 `npm run compile-validate -- iteration-8/eval-0-style-layout/mpx2skyline/outputs/style-card.mpx --type=component --json`。`Can't resolve './city.woff2'` 引发2条dependency诊断，warnings=0。见 [compile.json](../run-1/compile.json)、[原始日志](../run-1/compile.log)。本次未取得宿主字体，未重试相同依赖错误，未将静态/mock结果记作编译成功。 |
| 开发者工具、真机、字体二进制检查 | **not_run**：没有原生renderer会话、设备或字体二进制。需宿主补齐字体后重跑编译，在双renderer验证长标题截断、断点切换、提示条位置、横向背景铺满及阴影/滤镜像素效果。 |

统一证据入口：[validation.json](../run-1/validation.json)。本次适配文件已完整交付；原生视觉与字体匹配尚未完成验收，真实编译被外部字体资源阻塞。
