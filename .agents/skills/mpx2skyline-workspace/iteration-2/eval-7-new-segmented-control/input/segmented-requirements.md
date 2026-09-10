# 分段选择器
创建 segmented-control.mpx，使用 Mpx script setup、普通语义class，无 UnoCSS。
props：controlKey:String、options:Array 默认[]（元素{value,label,disabled}）、value:String 默认空、disabled:Boolean 默认false、label:String 默认分类。
维护本地选择，watch父value同步，computed派生展示状态；整体禁用或单项禁用都不能选。选择发 change，detail={controlKey,value}。
横向滚动候选，候选至少100px宽；可用长中文标签但单项单行省略。展示标签、候选与当前选中项名称。两端行为一致。
