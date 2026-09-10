# 适配说明

交付 `user-list.mpx` 与同目录 `row.wxml`，相对引用保持完整。仅处理组件，不添加页面 renderer 配置。

- `label.default` 改为组件属性的 `value`，保留默认“用户”；`payload` 使用 `type: String`、`optionalTypes: [Object]`，保留字符串和对象两种输入与空字符串默认值。
- `items` 初始化为 `[]`；`setRows({items: null})` 归一化为空数组，`visibleItems` 始终返回过滤后的数组。`config.default` 仍为 `keep`。
- 行文件由隐式 include 改为命名模板，使用 import 并显式传入 `item`、`index`；列表去掉一层无必要包装，保留每项直接子 view 和 id key。
- 列表显式启用 `type="list"`、`enhanced`，高度使用类选择器；原有 other 滚动容器保留。
- 将数字开头的列表 id 改为 `users`。顶部按钮使用两端通用 `scroll-top` 绑定，记录真实滚动位置，先同步当前位置，再在下一次更新置零，以支持反复滚动后点击顶部按钮。

# 实际验证

执行 `node validate.cjs` 通过，原始输出见本次运行根目录 `validation.log`。检查了属性声明及默认值、config.default 保留、初始化与数据返回前空数组、null/空数组/可见性过滤、连续多次回顶状态更新，以及相对模板引用、类选择器和组件 JSON。

验证使用 Node VM 捕获组件选项，并模拟 `$nextTick`；当前输入不包含构建工程，未运行 Mpx 编译、eslint、jest 或微信开发者工具，未声称真机验证通过。落地项目需在 WebView、Skyline 两个宿主页分别验证 String/Object 传参、行内容、滚动后重复回顶及列表渲染。
