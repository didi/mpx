# 支付宝任务入口

## 适用范围

仅用于实际输出包含 `ali` 的 Mpx 项目，面向微信语法输出微信 / 支付宝；核心用法由 base 维护，支付宝原生方言另核对宿主契约。

区分三者：`mode: 'ali'` 是输出目标，`srcMode: 'wx'` 是源码方言，iOS / Android 是运行时设备系统。`__mpx_mode__ === 'ios'` 指 RN iOS 产物，不指 iPhone 上的支付宝小程序。

## 按需索引

按任务读取命中的参考；本目录不是完整支持表，未记录不等于支持。多端任务只补读实际涉及的端入口。

| 任务 | 参考 |
| --- | --- |
| 授权、组件限制与告警 | [模板支持限制](./ali-template-reference.md#模板支持限制) |
| input、enableNative、键盘、聚焦 | [输入框与键盘](./ali-template-reference.md#输入框与键盘)、[模板基准](../base/template-reference.md) |
| show-scrollbar、disable-scroll、弹层穿透 | [滚动容器与弹层](./ali-template-reference.md#滚动容器与弹层) |
| text 省略、white-space、image padding | [文本与图片样式](./ali-style-reference.md#文本与图片样式)、[样式基准](../base/style-reference.md) |
| scoped、外部类 | [样式差异](./ali-style-reference.md) |
| mode/srcMode、autoScopeRules、externalClasses、component2 | [配置参考](./ali-config-reference.md)、[条件编译](../base/conditional-compile.md) |
| tabBar、导航、刷新 / 回弹、组件命名 / 占位 / 抽象节点 | [JSON 差异](./ali-json-reference.md)、[JSON 基准](../base/json-reference.md) |
| 系统信息、尺寸、安全区、查询、请求 / 登录 / 提示 | [API 实践](./ali-api-reference.md)、[API 基准](../base/api-reference.md) |
| UnoCSS / utility class | [原子 CSS 基准](../base/atomic-css.md)；自定义样式仍须隔离 |

## 开发与评审约束

开发、适配、排障或评审前核对以下规则，完成后按受影响维度复查：

- **共用语法走基准**：表达式、动态 class/style、事件传参见[模板基准](../base/template-reference.md)，实例命名见[保留字段](../base/script-reference.md#页面与组件实例属性与方法)，平台 / 环境配置用[动态 JSON](../base/json-reference.md#动态-json)的 `<script name="json">`。普通脚本、响应式、生命周期与状态管理按需读 base。
- **接入与配置分层**：微信源码明确 `mode: 'ali'` / `srcMode: 'wx'`，启用 component2，外部类同步插件配置；页面 JSON 与工程配置分开。
- **适配真实差异**：核对工程版本、宿主与设备，仅为复现问题加兼容处理；按平台隔离专有能力，按运行时系统处理设备差异，不把个别机型经验推广到全部设备。
- **优先局部处理**：遵循各参考中的键盘时序、蒙层结构、滚动条、导航及回弹边界；局部弹层问题不改全局页面布局，尺寸从公共入口统一获取。
- **不套用其他端限制**：支付宝不默认要求 RN 单类选择器、`numberOfLines`、空 `wx:ref`，也不套用 Skyline 的 renderer 与检查矩阵。

## 验证

按[编译校验](../base/compile-validation.md)指定 `--target=ali`，同时输出微信则用 `--target=wx,ali`，执行相关 ESLint 与现有测试。文本换行、滚动条须完整 App 构建验证；独立分包、插件、单独编译的页面 / 组件须在对应集成环境验证，单文件编译通过不能替代。

宿主渲染改动覆盖实际目标中的微信 / 支付宝 × iOS / Android 组合，记录宿主、基础库、Mpx 版本及机型。

| 场景 | 核心检查 |
| --- | --- |
| 文本 / 图片 | 长文本截断，图片尺寸与留白正确 |
| 输入 / 键盘 | 首次聚焦、连续切换、不同键盘及收起后布局正常 |
| 滚动条 / 弹层 | 显隐符合预期，背景不穿透，内容可滚动 |
| 尺寸 / 安全区 | 使用窗口尺寸，单位一致，底部不被遮挡 |
| 样式隔离 | 父页面与兄弟组件同名类不意外影响样式 |
| 导航 / 页面滚动 | 产物字段、导航点击区及滚动范围正确 |
