# 微信 navigationStyle 到支付宝透明导航栏的转换方案

## 背景与目标

目前业务需要通过 `__mpx_mode__` 分支，将微信的 `navigationStyle: 'custom'` 手动替换为支付宝配置：

```js
{
  defaultTitle: '',
  transparentTitle: 'always',
  titlePenetrate: 'YES'
}
```

计划将这组映射内置到 JSON 跨平台转换中。业务统一使用微信配置即可：

```html
<script type="application/json">
{
  "navigationStyle": "custom"
}
</script>
```

本方案已实施，实现限定于 `srcMode: 'wx'`、`mode: 'ali'` 的 JSON 编译规则，检查结果见文末。

支付宝侧采用“空标题 + 始终透明 + 点击穿透”实现截图中的效果。这是静态配置映射，不承诺移除宿主的所有导航控件，也不增加运行时导航栏 API 调用。字段含义参见支付宝官方的[全局配置](https://opendocs.alipay.com/mini/framework/app-json)、[页面配置源码](https://github.com/AlipayDocs/open-docs/blob/main/mini/framework/小程序页面/页面配置.md)；透明模式的枚举也可参见官方[Global Configuration](https://idocs.alipay.com/miniprogram/miniprogram/mpdev/framework_app_global-configuration)。最终视觉与点击行为需要支付宝真机验证。

## 现有流程

- [json-compiler/index.js](../packages/webpack-plugin/lib/json-compiler/index.js) 在解析静态 JSON 或执行 JSON JS 后，根据 `srcMode`、`mode` 和配置类型调用 `getRulesRunner`。
- [platform/json/wx/index.js](../packages/webpack-plugin/lib/platform/json/wx/index.js) 的 `windowRules` 被页面规则 `spec.page` 和全局窗口规则 `spec.window` 共同使用；`app.window` 通过 `getWindowRule()` 进入同一套规则。
- 当前 `navigationBarTitleText` 先转换为 `defaultTitle`；后面的 `navigationBarTextStyle|navigationStyle|backgroundTextStyle` 规则在支付宝下告警并删除这三个字段。
- JSON 规则通过 `waterfall: true` 顺序执行，适合在标题转换之后统一处理自定义导航栏，无需修改 loader、运行时或规则调度器。

## 转换规则

在 `windowRules` 中为 `navigationStyle` 增加独立的 `ali` 处理器，并从原来的不支持字段列表中移除 `navigationStyle`。

| 输入 | 支付宝输出 | 诊断 |
| --- | --- | --- |
| `navigationStyle: 'custom'` | 写入 `defaultTitle: ''`、`transparentTitle: 'always'`、`titlePenetrate: 'YES'`，删除 `navigationStyle` | 不再针对该字段告警 |
| `navigationStyle: 'default'` | 写入 `transparentTitle: 'none'`、`titlePenetrate: 'NO'`，删除 `navigationStyle`，保留正常标题转换结果 | 不再针对该字段告警 |
| 未配置 `navigationStyle` | 不触发新规则 | 保持现状 |
| 其他值，包括显式 `null` | 沿用 `deletePath()` 告警并删除，不生成导航配置 | 保留现有诊断形式 |

`default` 必须显式生成两个复位字段：如果只删除 `navigationStyle`，全局 `custom` 生成的透明和穿透配置仍会被页面继承，无法恢复普通导航栏。

### 执行顺序与配置优先级

新规则放在 `navigationBarTitleText` 转换之后，可直接放在原来的不支持字段规则附近。

采用以下确定性规则，不依赖源 JSON 属性的书写顺序：

1. 同一配置对象显式声明 `navigationStyle` 时，以它表达的导航模式为准，直接覆盖本次映射涉及的支付宝字段。
2. `custom` 强制清空标题，包括此前由 `navigationBarTitleText` 转换出的标题；否则仍会显示原生标题，无法实现截图中的效果。
3. `default` 只复位透明和穿透字段，不清空标题；`navigationBarTitleText -> defaultTitle` 的现有规则保持不变。
4. 不配置 `navigationStyle` 时，原有支付宝字段继续按现有规则处理。需要自行控制透明标题或点击穿透的业务，应省略 `navigationStyle`，直接使用目标平台配置。

例如：

```js
// 输入
{
  navigationBarTitleText: '订单详情',
  navigationStyle: 'custom',
  transparentTitle: 'auto',
  titlePenetrate: 'NO'
}

// 支付宝输出
{
  defaultTitle: '',
  transparentTitle: 'always',
  titlePenetrate: 'YES'
}
```

仅覆盖映射涉及的字段，不扩展处理 `titleImage`、返回按钮、胶囊、状态栏颜色等支付宝原生能力。混合使用这些配置时仍需业务自行协调。

### 全局配置与页面覆盖边界

复用 `windowRules` 后，页面顶层和 `app.window` 都能转换；两者分别编译，仍由支付宝按字段执行页面对全局配置的覆盖。第一版不增加全局配置存储或跨文件合并流程，因此需明确以下边界：

| 全局与页面配置 | 结果与使用约定 |
| --- | --- |
| 全局 `custom`，页面未配置导航相关字段 | 页面继承全局生成的空标题、透明与穿透配置 |
| 全局 `custom`，页面声明 `default` 和页面标题 | 页面复位透明与穿透，并显示页面标题 |
| 全局普通导航，页面声明 `custom` | 页面生成的三项配置覆盖全局配置 |
| 全局 `custom`，页面仅配置 `navigationBarTitleText` | 页面转换后的 `defaultTitle` 会覆盖全局空标题；需要该页继续保持无标题效果时，在页面同时声明 `navigationStyle: 'custom'` |
| 全局同时配置标题和 `custom`，页面仅声明 `default` | 全局标题在转换时已被清空，页面无法自动恢复原始全局标题；该页需显式配置标题 |

这是第一版局部映射与微信完整继承语义之间的已知差异，在本方案中保留说明，不能将其描述为所有导航配置的完全等价转换。如果后续要求消除这两个标题继承差异，需要单独设计“合并源端全局与页面窗口配置后再转换”的流程；本次不引入该跨文件改造。

## 改动范围

| 文件 | 后续实现内容 |
| --- | --- |
| [platform/json/wx/index.js](../packages/webpack-plugin/lib/platform/json/wx/index.js) | 拆分 `navigationStyle` 规则，实现支付宝映射与合法值的静默消费 |
| [page.spec.js](../packages/webpack-plugin/test/platform/wx/json/page.spec.js) | 补充页面转换、标题优先级、复位、诊断及原生字段兼容测试 |
| [app.spec.js](../packages/webpack-plugin/test/platform/wx/json/app.spec.js) | 补充 `app.window` 转换及页面覆盖场景测试 |

复用现有 `print()`、`deletePath()` 和规则匹配机制，直接修改输入对象，不新增通用转换工具或配置开关。其他平台不增加处理器；组件配置继续使用 `componentRules`，不附加页面窗口能力。

按本次要求，不更新 `docs-vitepress/guide/basic/page.md` 和 `docs-vitepress/guide/basic/app.md`，使用方式与边界保留在本方案中。此次能力只涉及微信到支付宝，不涉及 RN 能力变更，无需同步 RN Skill。

## 验证与验收

单元测试复用现有 `compileJson`，覆盖核心行为：

1. 页面 `custom` 精确生成截图中的三项配置，删除源字段；`navigationBarTitleText` 同时存在时仍输出空标题，调换输入属性顺序结果一致。
2. 显式 `default` 生成 `none` / `NO`，保留正常标题；`app.window` 覆盖相同的两类转换。
3. 输入同时含原生目标字段时，结果符合上述优先级；省略 `navigationStyle` 时不额外生成字段。
4. 合法值不产生 `navigationStyle` 告警；非法值沿用原有告警与删除行为；`navigationBarTextStyle`、`backgroundTextStyle` 的既有告警保持不变。
5. 分别转换全局和页面配置，再用 `Object.assign({}, app.window, page)` 模拟字段覆盖，验证透明与穿透的复位，以及表格中的两个标题继承边界。
6. 使用现有非支付宝测试回归平台隔离，并验证 `srcMode: 'ali'` 的原生配置不受影响。

代码完成后执行：

```sh
npx eslint packages/webpack-plugin/lib/platform/json/wx/index.js \
  packages/webpack-plugin/test/platform/wx/json/page.spec.js \
  packages/webpack-plugin/test/platform/wx/json/app.spec.js

npm test -- --runInBand packages/webpack-plugin/test/platform/wx/json/ \
  packages/webpack-plugin/test/platform/common/platform-diagnostic.spec.js
```

按仓库约束，单测失败后最多尝试三次修复，仍失败则报告错误与分析。

支付宝产物检查需确认页面 JSON 与 `app.json.window` 的字段和值正确、没有残留 `navigationStyle`。随后在支付宝 iOS / Android 真机验证标题为空、导航区域透明、页面点击穿透，以及页面 `default` 恢复普通导航栏；同时核对返回按钮和宿主导航控件的实际表现。测试结果应区分编译产物验证与真机验证，不能以单测通过替代宿主行为验收。

## 实施结果

- 已实现上述 JSON 规则和核心测试；按要求撤回页面和全局窗口配置文档的修改。
- 相关三个 JavaScript 文件的 ESLint 检查通过。
- 上述 Jest 范围内的 4 个测试套件、36 个用例全部通过。首次启动因沙箱无法访问 Watchman 状态目录退出，添加 `--watchman=false` 后通过，无需修复代码。
- 单测已验证 JSON 规则输出及全局与页面字段覆盖；未执行完整项目产物构建或支付宝真机验收。
