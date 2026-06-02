<!-- GEP Event Object -->
<!-- type: Event -->
<!-- schema_version: 1.0.0 -->
<!-- id: evt_001 -->
<!-- created: 2026-05-19 -->

## 事件类型
repair + extension

## 触发信号
iteration-8 eval 执行结果：mpx2rn_gene 得分 52/63（82.54%），11 条断言失败，集中在事件传参/dataset 清理、内联样式简写、非触摸 catch 事件、RN 不支持样式属性等方面。

## 变更目标
- gene_template（repair: 强化 dataset 清理与内联传参；extension: 内联样式多值简写限制、border 简写限制、enable-var）
- gene_script（repair: 禁用 dataset 取参；extension: catch 前缀限制、条件编译隔离 API）
- gene_style_property（extension: radial-gradient、border-style 统一、background-repeat、text-decoration-style/color）

## 变更意图
覆盖 iteration-8 中 mpx2rn_gene 相比 mpx2rn_original 的 8 分差距中可归因于 gene 策略缺失的 11 条失败项，使 gene 版在下次执行时能正确处理这些场景。

## 变更 Diff

### gene_template.md
- Strategy 4: "事件传参优先使用" → "事件传参**必须**使用内联传参语法，同时移除 data-xxx 属性；脚本中禁止 e.target.dataset"
- 新增 Strategy 7: enable-var 声明
- 新增 Strategy 8: 内联 style/wx:style 禁止多值 margin/padding 简写，须拆分单方向
- 新增 AVOID 11: 内联 style 中 border 简写
- 新增 AVOID 12: 保留 data-xxx 属性传递事件参数

### gene_script.md
- 新增 Strategy 6: 禁止 e.target.dataset / e.currentTarget.dataset
- 新增 Strategy 7: 非触摸类事件不使用 catch 前缀
- 新增 Strategy 8: RN 不支持的 API 须条件编译隔离（setTabBarBadge/removeTabBarBadge/getUserProfile）
- 新增 AVOID 12: e.target.dataset / e.currentTarget.dataset

### gene_style_property.md
- 新增 Strategy 7: radial-gradient 须条件编译或替换
- 新增 Strategy 8: border-style 统一设置，不支持单边 border-xxx-style
- 新增 Strategy 9: background-repeat 仅支持 no-repeat
- 新增 Strategy 10: text-decoration-style/color 须条件编译隔离
- 新增 AVOID 14: radial-gradient
- 新增 AVOID 15: 单边 border-xxx-style

## 验证结果
待 iteration-9 执行验证。预期覆盖 t1/t6/t8/j5/j8/l4/l8/l9/c2/c7/c9 共 11 条断言。
