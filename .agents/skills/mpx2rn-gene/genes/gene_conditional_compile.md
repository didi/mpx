<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_conditional_compile -->
<!-- signals_match: 条件编译, conditional-compile, @mpx-if, @mode, __mpx_mode__, 分平台 -->

<strategy-gene>
Domain keywords: 条件编译, @mpx-if, @mode, @_mode, __mpx_mode__, 分平台处理
Summary: 条件编译是跨端不兼容的最后手段——各区块使用对应语法，最小包裹，禁止产生空选择器
Strategy:
1. 条件编译是最后手段：先确认是否存在无需条件编译的跨端兼容写法
2. 样式区块：使用 /* @mpx-if (__mpx_mode__ === ...) */ 注释语法
3. 模板区块：使用 wx:if="{{__mpx_mode__ === ...}}" 或 @mode/@_mode 属性后缀
4. 脚本和 JSON 区块：使用 if (__mpx_mode__ === ...) 条件语句
5. 平台条件——原平台：__mpx_mode__ === 'wx' || 'ali' || 'web'；RN：__mpx_mode__ === 'ios' || 'android' || 'harmony'
6. 仅最小包裹不兼容片段，不要大面积条件编译分叉
7. 样式条件编译必须包裹整条规则（含选择器+花括号内容），不能只包裹声明块内部
8. AVOID: 在 style 以外的区块使用 /* @mpx-if */ 注释语法（不会生效）
9. AVOID: 样式条件编译后产物中出现空选择器
10. AVOID: 整段代码都用条件编译分叉（仅包裹真正不兼容的最小片段）
</strategy-gene>

<references>
- [条件编译](../references/conditional-compile.md)
</references>
