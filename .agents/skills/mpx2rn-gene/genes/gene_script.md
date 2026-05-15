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
6. AVOID: 直接使用 wx.xxx / my.xxx
7. AVOID: onShareTimeline / onTabItemTap / onAddToFavorites / onSaveExitState（RN 不支持）
8. AVOID: selector 中使用复合选择器（后代/子级等），仅 #id / .class
</strategy-gene>

<references>
- [脚本能力参考](../references/rn-script-reference.md)
- [环境 API 参考](../references/rn-api-reference.md)
</references>
