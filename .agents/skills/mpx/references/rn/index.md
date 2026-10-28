# RN 任务入口

仅当实际输出包含 `ios` / `android` / `harmony`（Mpx2RN / Mpx2DRN）时使用本页。Mpx 核心能力及基准用法由 base 维护；本页说明这些能力在 RN 的支持情况、限制和专属扩展，不能把 base 中的能力直接视为 RN 全部支持。

业务源码仍使用 `.mpx`；CLI 工程通常包含 `ReactNativeProject` 原生工程，产物在 `dist/react-native`，不直接编辑生成产物。

## 按需索引

| 涉及任务 | 读取内容 |
| --- | --- |
| 基础组件、属性、事件、无障碍、i18n | [RN 模板与组件支持表](./rn-template-reference.md) |
| 构造选项、生命周期、selector、实例方法、宿主钩子 | [RN 脚本差异](./rn-script-reference.md) |
| 样式改造/开发 | 优先 [样式实践](./rn-style-practice.md) 命中的场景；未命中再查能力表。 |
| 明确查询某个选择器/单位/样式属性是否支持 | 直接查 [样式能力](./rn-style-reference.md)。 |
| UnoCSS / utility class | [原子 CSS 基准](../base/atomic-css.md)与 [RN 差异](./rn-atomic-css.md)，仅在接入或使用时加载。 |
| 应用/页面/组件 JSON、分包宿主实现 | [RN JSON](./rn-json-reference.md)，语法按需补充 [分包基准](../base/subpackage-reference.md)。 |
| 编译 rnConfig、运行时 rnConfig、导航/布局配置 | [RN 配置](./rn-config-reference.md)。 |
| 网络/存储/媒体/位置/设备/查询 API | [API 基准](../base/api-reference.md) 查用途、参数与调用契约；[RN API 差异](./rn-api-reference.md) 查不支持的 API、参数、返回字段与对象方法，以及类型和默认值差异。 |
| React Native 原生组件、React Hooks | [混合开发](./rn-hybrid-dev.md)。 |

## 开发与评审约束

方案设计、开发、适配、排障与评审开始前先读取本节，完成后按受影响维度复查。

- **以 Mpx2RN 支持表为准**：不要按 React Native 原生能力推断支持性。已抹平的简写、CSS 变量、calc、媒体查询、rpx、颜色与文本继承无需额外替换。用户的基础组件/环境 API 扩展按工程实现核实。
- **模板**：使用支持表内的基础组件、属性和事件；文字优先显式用 `text` 包裹。仅基础 `tap/longpress/touchstart/touchmove/touchend/touchcancel` 支持冒泡和捕获。Mustache 表达式调用、动态 class/style、内联事件参数与 i18n 原名规则按[模板基准](../base/template-reference.md)核对。
- **selector**：`selectComponent/selectAllComponents/createSelectorQuery/createIntersectionObserver` 中 selector 支持 `#id` / `.class` 及 `.a.b` 这样的连续类选择器，不支持后代、子代、兄弟或逗号分组选择器；对应节点须声明 `wx:ref`，空值或具名均可，具名形式还可通过 refs 访问。virtualHost 无实体 host，不能按组件节点测量；相交观察的 selector 仅匹配内建节点。
- **页面滚动**：RN 页面默认不可滚动；页面滚动/触底/下拉刷新钩子没有自动驱动。跨 RN 的页面 JSON 设 `disableScroll: true`、样式设 `page { height: 100%; }`，用开启 `scroll-y` 的 `scroll-view` 承载内容并接入事件，见[页面滚动替代示例](./rn-script-reference.md#页面滚动替代示例)。这是含 RN 目标的方案，不向 Web 单端推广。
- **脚本**：按 RN 构造选项、生命周期与实例方法表实现；实例字段命名遵循[基准保留字段约束](../base/script-reference.md#页面与组件实例属性与方法)。不支持声明需要实际宿主适配及 `implement` 登记，或明确移除。`onShareAppMessage` 有独立的 `openTypeHandler` 桥接流程，见 RN 脚本/配置。Promise 化调用使用 await/then，环境 API 不直连 wx/my。
- **选择器与布局**：展开预处理嵌套，采用单类选择器；逗号分隔的并列单类可用。替换复合/伪类/伪元素时同步模板与脚本引用，grid/float 等按样式实践选择等效布局。RN 专属 `numberOfLines` / `hairlineWidth` 等通过条件编译保留原端样式，不能只保留 RN 写法。
- **按需样式能力**：首次渲染后可能引入 CSS 变量、文本透传、背景或动画时，按需预声明 `enable-var/enable-text-pass-through/enable-background/enable-animation`。`hover-class` 的有效启用状态和动画类型在实例生命周期内稳定；`disabled/readonly` 切换也不能让同一节点在有效 `hover-class` 与 `none` / 空值之间切换。仅值变化无需冗余声明。条件分支/列表可能复用且能力不同，优先稳定独立 key，无法保证时声明能力并集，避免切换时出现渲染错误。
- **点击响应**：iOS 中目标或祖先的 `opacity: 0` 会使目标无法响应点击，恢复为 `1` 后可正常响应；极低的非零 opacity 也可能影响点击，仅背景透明不影响点击响应。
- **垂直 margin**：RN 不发生 margin 折叠。原端需区分相邻兄弟、父子与空块关系，并核对简写覆盖及实际布局边界；确认折叠后将有效间距归到单侧，不折叠或无法确认时保留原样。具体条件与示例见[垂直 margin 折叠](./rn-style-practice.md#处理垂直-margin-折叠)。
- **原子类**：仅使用 RN 支持的工具类/variants；接入与动态类提取沿用基准。颜色透明度用 `bg-red-500/50`，不用独立 `*-opacity-*` 组合。
- **JSON 与分包**：仅使用 RN 支持字段，`tabBar` 等不支持能力隔离。需要按平台或环境生成配置时，按[动态 JSON](../base/json-reference.md#动态-json)使用 `<script name="json">`。分包构建与运行时下载执行分开配置，预下载需宿主钩子；不支持仅靠声明即完成加载。页面 loading/fallback 与组件占位分别配置。

样式条件编译保留单位注释、预处理缩进，避免裁剪后空规则。适配时保留原平台功能；不能抹平的差异用最小条件分支并说明原因。

## 条件文件与原生依赖

文件选择顺序与回退规则见 [条件编译基准](../base/conditional-compile.md#rn-条件文件回退)。

平台依赖差异大时用条件文件隔离 `react-native` 和 Hooks；少量属性/节点用 `@ios|android|harmony`。完整原生模板区块需按工程声明组件与对应 `src-mode`，见 [条件编译](../base/conditional-compile.md)。

## 验证

SFC 新建/适配后按 [编译校验](../base/compile-validation.md) 显式传实际目标（例如 `--target=wx,ios`），检查原平台与 RN 构建，再执行项目 ESLint 和相关现有测试。默认单文件校验排除子组件，不能代替子组件集成验证；实际滚动、节点复用、原生桥接与分包下载需在容器验证。
