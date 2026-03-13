# 输出RN支持template

## 需求描述

微信小程序支持template，详情可以查看：
- [模版定义与使用](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/template.html)
- [模版引用](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/import.html)

当前在输出RN时，不支持使用template特性，需要对其进行支持，在模版引用方面，仅需支持拓展性更高的`import`方式，无需支持`include`方式。

## 实现方案

本方案旨在通过扩展现有的 `webpack-plugin` 编译逻辑，支持 `<template>` 标签的定义、使用以及 `<import>` 标签的引入功能。

### 1. 总体设计

*   **编译阶段**：
    *   在 `compiler.js` 中解析 `<template name="...">` 定义，将其从渲染树中移除并提取到 `meta.templates` 中。
    *   解析 `<import src="...">` 引入，提取路径到 `meta.imports` 中。
    *   解析 `<template is="...">` 使用，保留在渲染树中，但在代码生成阶段转换为函数调用。
*   **代码生成**：
    *   在 `gen-node-react.js` 中增加生成模版函数和模版调用的逻辑。
    *   在 `processTemplate.js` 中汇总本地模版和引入的模版，生成最终的 `templates` 对象注入到运行时。
*   **运行时**：
    *   通过本地作用域下的 `getTemplate(name)` 获取模版函数，并直接调用，`data` 作为模版函数的参数或上下文传递。

### 2. 详细实现

#### 2.1 修改 `compiler.js` (AST 处理)

文件路径：`/Users/didi/work/mpx/packages/webpack-plugin/lib/template-compiler/compiler.js`

我们需要在 `processElement` 函数中针对 RN 模式 (`isReact(mode)`) 增加对 `<template>` 和 `<import>` 的处理逻辑。

1.  **处理 `<import>` 标签**：
    *   识别 `tag === 'import'`。
    *   提取 `src` 属性（支持 `.wxml` 文件），记录到 `meta.imports` 数组中。
    *   从 AST 树中移除该节点 (不再参与后续渲染)。

2.  **处理 `<template>` 标签**：
    *   **定义模式** (`name` 属性存在)：
        *   标记 `el.isTemplateDefinition = true`。
        *   正常处理子节点 (递归调用 `processElement` 等)，确保内部 AST 结构正确。
        *   将该节点从父节点的 `children` 中移除，避免在主渲染流程中生成。
        *   将该节点添加到 `meta.templates` 对象中，Key 为 `name`。
    *   **使用模式** (`is` 属性存在)：
        *   保留该节点。
        *   确保 `data` 属性被正确解析为表达式 (现有的 `processAttrs` 已包含此逻辑)。

#### 2.2 修改 `gen-node-react.js` (代码生成)

文件路径：`/Users/didi/work/mpx/packages/webpack-plugin/lib/template-compiler/gen-node-react.js`

1.  **新增 `genTemplate(node)` 函数**：
    *   用于生成模版定义对应的函数代码。
    *   输入：`template` 定义的 AST 节点。
    *   输出：`function(createElement, getComponent) { return ... }` 形式的字符串。
    *   内部调用 `genNode` 生成函数体内容。

2.  **修改 `genNode(node)` 函数**：
    *   增加对 `node.tag === 'template'` 的处理。
    *   **如果是使用模式** (`is` 属性存在)：
        *   获取 `is` 属性的值 (模版名称) 和 `data` 属性的值 (数据上下文)。
        *   生成调用代码：`getTemplate(templateName).call(Object.assign(Object.create(this), data || {}), createElement, getComponent)`。
        *   **注意**：
            *   使用 `Object.create(this)` 创建以当前组件实例为原型的对象作为 `this` 上下文。
            *   **数据优先**：`data` 中的属性会覆盖组件实例上的同名属性。
            *   **事件支持**：模版内部可直接访问组件实例的方法（如事件处理函数）。
            *   **帮助函数**：天然支持 `__iter`、`__getSlot` 等挂载在组件实例上的帮助函数。

#### 2.3 修改 `processTemplate.js` (模版处理与注入)

文件路径：`/Users/didi/work/mpx/packages/webpack-plugin/lib/react/processTemplate.js`

1.  **处理引入的模版 (`meta.imports`)**：
    *   遍历 `meta.imports`。
    *   生成 `require` 语句，引入目标文件。
    *   **关键点**：引入的文件通常是 `.wxml`，需要通过新的 `template-loader` 进行处理，返回模版对象。
    *   示例：`var import_1 = require('./other.wxml');`

2.  **处理本地模版 (`meta.templates`)**：
    *   遍历 `meta.templates`。
    *   调用 `genTemplate` 生成每个模版的函数代码。
    *   对生成的代码使用 `bindThis.transform` 进行处理，确保变量访问正确转换为 `this.variable`。

3.  **注入 `templates` 对象**：
    *   将引入的模版和本地模版合并：`const allTemplates = Object.assign({}, import_1, import_2, localTemplates);`
    *   在渲染函数内部生成 `getTemplate` 帮助函数，用于查找模版。

4.  **内建组件信息处理**：
    *   `processTemplate.js` 不再递归预读 `meta.imports` 指向的模版文件。
    *   `processTemplate.js` 仅输出当前模版编译结果及当前模版的 `meta.builtInComponentsMap`。
    *   imported template 的内建组件解析由 `template-loader` 在运行时代码中处理。

#### 2.4 Loader 支持 (新增 template-loader)

新增一个 `template-loader` 专门用于处理 `.wxml` 文件（在 RN 模式下）。
该 Loader 的作用是将 `.wxml` 文件内容解析为 RN 可用的模版函数对象，并在运行时代码中注入内建组件解析逻辑。
*   调用 `templateCompiler.parse` 解析 WXML。
*   提取 `meta.templates` 与 `meta.builtInComponentsMap`。
*   生成 `builtInComponentsMap` 与 `getBuiltInComponent` 运行时函数。
*   通过 `getBuiltInBaseComponent(require(componentRequest), { __mpxBuiltIn: true })` 生成内建组件。
*   包装本地 template 函数，注入组件查找逻辑：优先使用宿主 `getComponent`，未命中时回退到 `builtInComponentsMap`。
*   最终导出模版对象代码。

### 3. 代码示例

**输入 (Index.mpx)**：
```xml
<import src="./item.wxml" />
<template name="msgItem">
  <view>
    <text> {{index}}: {{msg}} </text>
    <text> Time: {{time}} </text>
  </view>
</template>

<template is="msgItem" data="{{...item}}"/>
<template is="item" data="{{...item}}"/>
```

**输出 (伪代码)**：
```javascript
// 引入外部模版 (由 template-loader 处理返回模版对象)
var import_item = require('./item.wxml');

// imported template 的内建组件在 template-loader 运行时代码中解析
var getBuiltInBaseComponent = require('.../runtime/optionProcessorReact').getComponent;
var builtInComponentsMap = {
  "mpx-movable-view": function () {
    return getBuiltInBaseComponent(require('.../built-in/movable-view'), { __mpxBuiltIn: true });
  }
};
function getBuiltInComponent(name) {
  var getter = builtInComponentsMap[name];
  return getter && getter();
}
function getTemplateComponent(name, getComponent) {
  return getComponent(name) || getBuiltInComponent(name);
}

// 本地模版定义
var localTemplates = {
  msgItem: function(data) {
    // bindThis 处理后，index -> this.index
    return createElement(View, null,
      createElement(Text, null, this.index, ": ", this.msg),
      createElement(Text, null, " Time: ", this.time)
    );
  }
};

Object.keys(localTemplates).forEach(function (name) {
  var templateFn = localTemplates[name];
  localTemplates[name] = function (data) {
    var self = this;
    return templateFn.call(self, createElement, function (componentName) {
      return getTemplateComponent(componentName, getComponent);
    });
  };
});

// 合并模版
var templates = Object.assign({}, import_item, localTemplates);

// 渲染函数
global.currentInject.render = function(createElement, getComponent) {
  // 本地帮助函数，直接在作用域内访问 templates
  function getTemplate(name) {
    return templates[name] || function(){};
  }

  return createElement(View, null,
    // 模版调用，直接调用本地函数
    getTemplate('msgItem').call(Object.assign(Object.create(this), this.item || {}), createElement, getComponent),
    getTemplate('item').call(Object.assign(Object.create(this), this.item || {}), createElement, getComponent)
  );
};
```

### 4. 实现清单

#### 修改文件列表

*   `packages/webpack-plugin/lib/template-compiler/compiler.js`: AST 解析逻辑增强
*   `packages/webpack-plugin/lib/template-compiler/gen-node-react.js`: RN 代码生成逻辑增强
*   `packages/webpack-plugin/lib/react/processTemplate.js`: 模版运行时注入逻辑增强
*   `packages/webpack-plugin/lib/react/template-loader.js`: 处理 .wxml 模版文件的专用 Loader

#### 模块职责

1.  **`compiler.js` (AST 处理)**
    *   在 React 模式下处理 `<import>` 与 `<template>` 标签。
    *   `<import src="...">` 生成带 `!!` 前缀的 `template-loader` request（例如 `!!path/to/template-loader!./item.wxml`）。
    *   `<template name="...">` 提取到 `meta.templates`；`<template is="...">` 保留用于后续代码生成。

2.  **`gen-node-react.js` (代码生成)**
    *   `genTemplate` 复用 `genNode` 生成模版函数，多根节点场景使用 `block` (Fragment) 包裹。
    *   `genNode` 识别 `<template is="...">` 并生成 `getTemplate(name).call(...)` 调用代码。
    *   模版调用上下文使用 `Object.assign(Object.create(this), data || {})`，支持数据覆盖与原型链访问。
    *   Element 节点优先处理 `genIf` 与 `genFor`，再处理 template 引用。

3.  **`processTemplate.js` (模版聚合)**
    *   模版引入直接使用 AST 阶段生成的完整 request 字符串。
    *   **模版聚合**：将引入的外部模版对象和本地定义的模版对象合并为统一的 `templates` 对象，并注入到运行时闭包中，供渲染函数使用。
    *   内建组件信息仅基于当前模版编译结果输出，不递归预读 imported template 文件。

4.  **`template-loader.js` (模版 Loader)**
    *   位置：`packages/webpack-plugin/lib/react/template-loader.js`。
    *   解析 RN 模式下的 `.wxml`，提取 `meta.templates` 与 `meta.builtInComponentsMap`，生成模版导出对象。
    *   **运行时内建组件解析**：注入 `builtInComponentsMap`、`getBuiltInComponent` 与 `getTemplateComponent`，在模版执行时完成 imported template 的内建组件解析。
    *   **模版函数包装**：对本地 template 函数进行包装，统一使用增强后的组件查找函数。
