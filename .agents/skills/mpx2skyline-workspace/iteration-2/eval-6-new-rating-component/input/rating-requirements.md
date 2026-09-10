# 评分组件
文件 rating-selector.mpx，createComponent 选项式 API，普通语义 class，不依赖 UnoCSS。
属性 ratingKey:String、value:Number 默认0、max:Number 默认5、readonly:Boolean 默认false、label:String 默认评分。
显示标签、max颗可点击星号、当前分数。点击第n颗保存本地评分，触发 change，detail为{ratingKey,value:n}；readonly时不更新不发事件。父组件更新value后同步本地评分。星号单行等距，标签超长单行省略。按下缩放.96，松开/取消恢复，150ms。没有页面职责或高级手势。
