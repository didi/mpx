# 跨平台支持

Mpx 支持在多个小程序平台中进行增强，目前支持的小程序平台包括微信，支付宝，百度，qq和头条，不过自2.0版本后，Mpx支持了以微信增强语法为 base 的跨平台输出，实现了一套业务源码在多端输出运行的能力，大大提升了多小程序平台业务的开发效率，详情可以查看[跨平台编译](./platform-compile.md)

### template增强特性

不同平台上的模板增强指令按照平台的指令风格进行设计，文档和代码示例为了方便统一采用微信小程序下的书写方式。

模板增强指令对应表：

增强指令|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
双向绑定|wx:model|a:model|s-model|qq:model|tt:model
双向绑定辅助属性|wx:model-prop|a:model-prop|s-model-prop|qq:model-prop|tt:model-prop
双向绑定辅助属性|wx:model-event|a:model-event|s-model-event|qq:model-event|tt:model-event
双向绑定辅助属性|wx:model-value-path|a:model-value-path|s-model-value-path|qq:model-value-path|tt:model-value-path
双向绑定辅助属性|wx:model-filter|a:model-filter|s-model-filter|qq:model-filter|tt:model-filter
动态样式绑定|wx:class|a:class|s-class|qq:class|暂不支持
动态样式绑定|wx:style|a:style|s-style|qq:style|暂不支持
获取节点/组件实例|wx:ref|a:ref|s-ref|qq:ref|tt:ref
显示/隐藏|wx:show|a:show|s-show|qq:show|tt:show

### script增强特性

增强字段|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
computed|支持|支持|支持|支持|部分支持，无法作为props传递(待头条修复生命周期执行顺序可完整支持)
watch|支持|支持|支持|支持|支持
mixins|支持|支持|支持|支持|支持

### style增强特性

无平台差异

### json增强特性

增强字段|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
packages|支持|支持|支持|支持|部分支持，无法分包
