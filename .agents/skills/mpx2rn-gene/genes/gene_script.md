<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_script -->
<!-- signals_match: script, 脚本, lifecycle, 生命周期, api-proxy, mpx.xxx, wx.xxx, selector, createSelectorQuery -->

<strategy-gene>
Domain keywords: script, lifecycle, api-proxy, mpx.xxx, selector, createSelectorQuery, createIntersectionObserver
Summary: 脚本层统一用 mpx.xxx API、仅使用 RN 支持的生命周期，selector API 限定 #id/.class 并配合 wx:ref
Strategy:
1. 平台 API 统一：wx.xxx / my.xxx 全部替换为 mpx.xxx（通过 @mpxjs/api-proxy 抹平）
2. 仅使用 RN 支持的生命周期和构造选项（查阅 rn-script-reference）
3. selector API（selectComponent/selectAllComponents/createSelectorQuery/createIntersectionObserver）仅支持 #id/.class，对应模板节点须声明空 wx:ref
4. 新建组件优先 <script setup> + 组合式 API，状态管理优先 @mpxjs/pinia
5. 页面滚动相关生命周期（onPullDownRefresh/onReachBottom/onPageScroll）RN 无效，用 scroll-view 事件替代
6. 事件处理函数中禁止使用 e.target.dataset / e.currentTarget.dataset 取参，配合模板侧内联传参语法改造
7. 非触摸类事件（如 scroll/input/change/submit）不使用 catch 前缀（catchtap 仅限触摸事件阻止冒泡）
8. RN 不支持的生命周期/API 须用条件编译隔离：setTabBarBadge/removeTabBarBadge/getUserProfile 等（不能直接删除，原平台需保留）
9. AVOID: 直接使用 wx.xxx / my.xxx
10. AVOID: onShareTimeline / onTabItemTap / onAddToFavorites / onSaveExitState（RN 不支持，须条件编译隔离或移除）
11. AVOID: selector 中使用复合选择器（后代/子级等），仅 #id / .class
12. AVOID: e.target.dataset / e.currentTarget.dataset（RN 不支持 dataset 传参）
</strategy-gene>

<references>
- [脚本能力参考](../references/rn-script-reference.md)
- [环境 API 参考](../references/rn-api-reference.md)
</references>
