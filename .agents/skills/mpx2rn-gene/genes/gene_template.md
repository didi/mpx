<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_template -->
<!-- signals_match: template, 模板, 基础组件, wx:class, wx:style, wx:ref, event, 事件, 组件属性 -->

<strategy-gene>
Domain keywords: template, 基础组件, wx:class, wx:style, wx:ref, event, slot, i18n, 数据绑定
Summary: 模板层仅使用 RN 支持的基础组件/属性/事件，动态绑定走 wx:class/wx:style，selector 节点声明 wx:ref
Strategy:
1. 使用基础组件时逐一核对 RN 支持情况（查阅 rn-template-reference）；RN 页面默认不可滚动，需要滚动时用 scroll-view 包裹
2. 动态 class/style 统一使用 wx:class / wx:style 指令，禁止在 class/style 属性值内用 {{}} 拼接字符串
3. 脚本中 selectComponent / createSelectorQuery / createIntersectionObserver 引用的模板节点必须声明空 wx:ref
4. 事件传参必须使用内联传参语法（如 bindtap="handler(item.id)"），同时移除模板中对应的 data-xxx 属性；脚本中禁止使用 e.target.dataset / e.currentTarget.dataset 取参
5. 仅基础通用事件（tap/longpress/touchstart/touchmove/touchend/touchcancel）支持冒泡和捕获
6. 模板 Mustache 中不支持普通方法调用，用 computed 或 wxs 替代（i18n 翻译函数 $t/t 除外）
7. RN 样式增强属性按需声明：使用 transition/animation 的 view 须声明 enable-animation；使用 background-image 的 view 须声明 enable-background；使用 CSS 变量的元素须声明 enable-var；仅首次渲染时检测
8. 内联 style / wx:style 中禁止使用多值 margin/padding 简写（如 margin: 10px 20px），必须拆分为单方向属性（marginTop/marginRight/marginBottom/marginLeft）
9. AVOID: class="item {{isActive ? 'active' : ''}}" 插值拼接
10. AVOID: 模板插值对象字面量中用引号包裹 key 或使用 kebab-case key（如 {{'background-image': '...'}}）——必须使用 camelCase 无引号 key（如 {{backgroundImage: '...'}}）
11. AVOID: 内联 style 中使用 border 简写（如 border: 1px solid #eee），须拆分为 borderWidth/borderStyle/borderColor
12. AVOID: 保留 data-xxx 属性传递事件参数——RN 不支持 dataset，必须清理并改为内联传参
</strategy-gene>

<references>
- [模板能力参考](../references/rn-template-reference.md)
- [单文件组件](../references/single-file-component.md)
</references>
