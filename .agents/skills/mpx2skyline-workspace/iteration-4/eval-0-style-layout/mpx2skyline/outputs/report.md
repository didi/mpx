# style-card 适配报告

完整业务文件为 style-card.mpx，保留 title:String 属性及原默认值。仅覆盖该组件，无自定义子组件；宿主及页面配置不在此次范围，依赖题设已开启 defaultDisplayBlock/defaultContentBox。

- 标题保留 WebView 单行省略 CSS，同时添加 Skyline max-lines/overflow。
- 标签统一使用两项 flex:1 + width:0 等宽分配；活动文案用明确类设置原 #d00。
- outer 的 padding-top 为20px，child 保留四周10px padding、100px内容宽及content-box；因此盒顶20px、内容顶30px、外宽120px。
- 相邻普通块的原16px/12px折叠间距统一为单侧16px。
- 单rgba阴影和独立blur原样保留。双阴影用同尺寸嵌套块承载，内层近阴影绘于外层远阴影之上；复合滤镜先内层blur，再外层brightness，保持原函数顺序。两个方案两端共用。
- WebView保留≤320px媒体查询。Skyline attached通过实例renderer判断，仅读取一次当前screenWidth；动态类和媒体查询后的Skyline默认覆盖分别保证≤320px为12rpx、其余24rpx。符合题设快照要求。

字体核验：输入 @font-face 已将 City-Semibold 定义为独立字体族，格式woff2且引用 ./city.woff2，故不机械改成City/bold。目录未包含字体二进制，无法核验实际内部PostScript name、字形与字重表；交付使用时需由宿主提供同路径字体。Trip-Medium来自宿主，输入中没有其注册信息和二进制，不能确认它是独立family还是仅PostScript name。两者保持原600/500及family以沿用已确认设计；部分Android机型可能字重不生效或Trip字体匹配失败，需用宿主资源在Android/iOS真机核验。没有擅自替换为700/bold或声称字体已验证。

验证：7项Jest通过；提取组件脚本的仓库ESLint通过；完整Skill审计矩阵已执行，记录在同级run-1/audit.md和audit-scan.log。error候选均已处理或说明例外：媒体查询保留有隔离覆盖；字体PostScript候选按独立family/未批准视觉变更说明例外。残余warn为上述字体及待真机视觉核验。

完整Mpx工程编译：not_run（输入为独立组件且字体资源由宿主提供）。开发者工具与双renderer真机视觉：not_run。测试属于脚本行为与源码/CSS结构校验，不证明真实布局、字体或滤镜像素一致。
