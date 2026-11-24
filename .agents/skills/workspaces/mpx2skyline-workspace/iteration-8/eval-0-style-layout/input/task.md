# 样式与布局

适配 style-card.mpx。保持长标题单行省略、两列等宽标签和红色活动文案。两种renderer在窗口宽度≤320px时卡片padding为12rpx，否则24rpx，窗口变化时同步更新，组件卸载时清理运行时监听。child盒子的顶部距outer上外沿20px，这段距离由outer的padding-top实现；child保持四周10px padding，因此其内容顶部距outer上外沿30px。child内容宽100px、含padding外宽120px，两块垂直间距16px；呈现原有单个rgba阴影、双阴影、独立blur滤镜、复合滤镜及品牌字体效果。宿主已配置defaultDisplayBlock/defaultContentBox。字体二进制由宿主提供，City-Semibold有当前独立字体族，Trip-Medium来自宿主；字体核验信息和机型风险写入report.md，视觉调整需沿用已确认设计。

保留提示条与内容卡片原有的上下重叠：提示条子节点使用高度、底部内边距和负 `margin-bottom` 影响后续占位，内容卡片再以负 `margin-top` 回拉；两种 renderer 的相对位置应一致。旁边的普通单侧负 `margin-top` 仅形成 8rpx 回拉，不需要为了它改造父布局。横向标签区的两个短项应在 320px 滚动视口内等分，内容容器背景铺满视口；保留可横向滚动结构，不依赖内部子项反向撑开直接内容容器。

交付所有输入业务文件的完整适配版本与report.md。多个组件分别保持自身接口与业务语义，无需为合并测试额外构造父子调用关系。评分目标为微信Skyline/glass-easel；WebView保持需求中的体验，本次仅覆盖微信 WebView / Skyline。验证证据放配置run-1/。
