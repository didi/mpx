# 支付宝任务入口

## 适用范围

仅当实际输出包含 `ali`（支付宝小程序 / Mpx2Ali）时使用本页。本目录面向以微信语法开发、同时输出微信与支付宝的 Mpx 项目，补充相对基准的支持情况、限制与适配实践；Mpx 核心能力与基准用法由 base 维护。支付宝原生方言源码需另行核对，不能直接套用微信语法的转换结论。

先区分输出目标、源码方言与设备系统：`mode: 'ali'` 表示支付宝输出，`srcMode: 'wx'` 表示微信源码语法；支付宝内的 iOS / Android 设备通过运行时系统信息判断。`__mpx_mode__ === 'ios'` 表示 RN iOS 产物，不表示运行在 iPhone 上的支付宝小程序。

## 按需索引

| 涉及任务 | 读取内容 |
| --- | --- |
| 授权按钮、组件支持限制与告警 | [模板支持限制](./ali-template-reference.md#模板支持限制)。 |
| input、enableNative、键盘上推、首次聚焦、焦点切换 | [输入框与键盘](./ali-template-reference.md#输入框与键盘)，绑定与事件用法见 [模板基准](../base/template-reference.md)。 |
| show-scrollbar、disable-scroll、滚动穿透、蒙层与弹层 | [滚动容器与弹层](./ali-template-reference.md#滚动容器与弹层)。 |
| text 省略、white-space、image padding | [文本与图片样式](./ali-style-reference.md#文本与图片样式)，通用单位与样式能力见 [样式基准](../base/style-reference.md)。 |
| 样式隔离、scoped、外部样式类 | [样式差异](./ali-style-reference.md)。 |
| 编译目标、源码方言、autoScopeRules / externalClasses 配置、component2 | [配置参考](./ali-config-reference.md)，条件文件与平台属性见 [条件编译](../base/conditional-compile.md)。 |
| tabBar、navigationStyle、刷新/回弹、组件名称、占位与抽象节点 | [JSON 配置差异](./ali-json-reference.md)，区块语法见 [JSON 基准](../base/json-reference.md)。 |
| 系统信息、窗口尺寸、安全区、节点查询、请求/登录/提示 | [API 实践](./ali-api-reference.md)，调用契约见 [API 基准](../base/api-reference.md)。 |
| UnoCSS / utility class | [原子 CSS 基准](../base/atomic-css.md)；原子类不替代其他自定义样式的隔离。 |

本目录描述支付宝开发实践与适配限制，不提供完整组件、样式属性或 API 支持表。按任务读取命中的参考；未记录不等于支持，也不需要预读 RN、Web 或 Skyline 约束。多端任务再读取实际涉及的平台入口。

## 开发与评审约束

方案设计、开发、适配、排障与评审开始前先读取本节，完成后按受影响维度复查。

- **共用语法沿用基准**：Mustache 表达式调用、动态 class/style 与事件传参按[模板基准](../base/template-reference.md)核对；实例字段命名遵循[保留字段约束](../base/script-reference.md#页面与组件实例属性与方法)。按平台或环境生成配置时，按[动态 JSON](../base/json-reference.md#动态-json)使用 `<script name="json">`，再核对支付宝字段差异。
- **先核对工程接入**：微信源码显式设置 `mode: 'ali'`、`srcMode: 'wx'`，开发者工具启用 component2；外部样式类同步编译配置，页面 JSON 与工程配置分开维护。
- **按目标设备验证**：先核对工程版本与实际表现，仅为复现的问题添加兼容处理，不把个别机型的行为作为所有设备的固定规则。
- **保留微信与支付宝各自的能力边界**：`always-embed`、`enhanced` 等微信属性按目标隔离，`enableNative` 在支付宝内按设备系统选择。键盘事件不假设固定顺序，也不使用统一延迟或固定键盘高度兜底。
- **优先局部适配**：蒙层与可滚动弹层拆成兄弟节点；仅因弹层穿透不改全局页面布局。`allowsBounceVertical: 'NO'` 关闭纵向回弹，不等价于完整锁定页面滚动，也不代表关闭下拉刷新。
- **核对实际使用限制**：`show-scrollbar` 仅严格布尔值 `false` 触发隐藏，`true` 不强制宿主显示。自定义导航栏仍可能显示返回按钮等宿主控件。
- **系统信息统一取值**：布局使用窗口尺寸，核对安全区坐标与单位；API 适配不等同于项目公共封装中的全部尺寸归一、缓存与校验逻辑。
- **不照搬其他端约束**：支付宝任务不默认要求 RN 单类选择器、numberOfLines 或空 wx:ref，也不套用 Skyline 的 renderer 配置与检查矩阵。普通脚本、响应式、生命周期及状态管理按需读取 base。

## 验证

按 [编译校验](../base/compile-validation.md) 显式指定 `--target=ali`，同时输出微信时用 `--target=wx,ali`，执行项目相关 ESLint 与现有测试。文本换行与滚动条显隐需通过完整 App 构建验证；独立分包、插件和单独编译的页面或组件需在对应集成环境中单独验证，不能用单文件编译成功代替集成验证。

涉及宿主渲染行为的改动，至少覆盖微信 / 支付宝与 iOS / Android 的实际目标组合，并记录宿主、基础库、Mpx 版本和机型。

| 场景 | 核心验证目标 |
| --- | --- |
| 文本打点、图片留白 | 长文本确实截断，图片内容尺寸与外部留白符合设计 |
| 输入框与键盘 | 首次聚焦、连续切换、不同键盘类型与收起后布局均正常 |
| 滚动条与弹层 | 滚动条显隐符合预期，背景不穿透，弹层内容仍可滚动 |
| 尺寸与安全区 | 页面使用窗口尺寸，真机数据单位一致，底部内容不被遮挡 |
| 样式隔离 | 父页面与兄弟组件的同名类不会意外改变组件样式 |
| 导航栏与页面滚动 | 编译产物字段正确，导航点击区及页面滚动范围符合设计 |
