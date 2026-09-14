# 适配结果

完整业务文件：`style-card.mpx`。

- 标题保留单行省略，增加 text 最大行数约束。
- 标签改为横向 flex，每列 50%；活动文案改用显式 sale 类，保留 data-kind。
- attached 中读取当前 windowWidth，≤320px 使用 12rpx，否则 24rpx。两个 renderer 共用逻辑；未增加旋转监听，符合按当前屏宽要求。
- outer 显式 padding-top 20px，child 显式 border-box 外宽 120px；第二块取消上 margin，两块间距为 16px。
- 单个 rgba 阴影与独立 blur 保留；双阴影拆成两个同尺寸绝对定位层，较近黑色阴影在上层。
- 复合滤镜拆为内层 blur 与外层 brightness，保留原有数值，没有替换颜色或添加不透明背景。

## 字体与风险

City-Semibold 为独立字体族，使用 normal 避免再次合成粗体，保留宿主提供的 city.woff2 引用。Trip-Medium 按宿主注册的独立字体族使用 normal。输入中没有字体二进制，无法检查文件内部 family、PostScript 名、weight 元数据与字形覆盖，也没有实际调用字体加载接口；宿主需确保 Skyline 可访问并完成对应字体族注册。CSS @font-face 本身不能作为 Skyline 字体加载成功的证据。

iOS/Android 不同基础库、设备 GPU 对滤镜合成及阴影叠加的表现需要核验。尤其 brightness 在目标 Skyline 版本是否支持尚未确认；拆分滤镜不等于证明每种滤镜受支持。如果宿主版本不支持 brightness，当前复合滤镜效果仍不满足完整视觉要求，应依据已确认设计另行提供等效实现，不能直接删除亮度效果。品牌字体未注册时会回退系统字体，可能影响字宽、标题截断和视觉字重。

## 验证

- Mpx SFC 解析、JSON 组件声明及 319/320/321/375px 的 padding 逻辑：Jest 5/5 通过。
- 提取组件脚本后使用仓库 ESLint 配置：通过。
- 真机 Skyline/glass-easel：not_run。
- WebView 真机回归：not_run。
- 字体实际加载、字体二进制元数据、阴影和滤镜视觉对照：not_run。

静态通过不代表完整 Skyline 视觉验收完成。
