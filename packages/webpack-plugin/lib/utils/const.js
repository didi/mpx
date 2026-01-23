const componentPrefixPath = '@mpxjs/webpack-plugin/lib/runtime/components'

module.exports = {
  MPX_PROCESSED_FLAG: 'mpx_processed',
  MPX_DISABLE_EXTRACTOR_CACHE: 'mpx_disable_extractor_cache',
  DEFAULT_RESULT_SOURCE: '',
  RESOLVE_IGNORED_ERR: new Error('Resolve ignored!'),
  JSON_JS_EXT: '.json.js',
  MPX_ROOT_VIEW: 'mpx-root-view', // 根节点类名
  MPX_APP_MODULE_ID: 'mpx-app-scope', // app文件moduleId
  PARENT_MODULE_ID: '__pid',
  // 扩展组件的平台配置：声明哪些组件在哪些平台有专用实现，哪些使用公共组件
  EXTEND_COMPONENT_CONFIG: {
    'section-list': {
      wx: `${componentPrefixPath}/wx/mpx-section-list.mpx`,
      ali: `${componentPrefixPath}/ali/mpx-section-list.mpx`,
      web: `${componentPrefixPath}/web/mpx-section-list.vue`,
      ios: `${componentPrefixPath}/react/dist/mpx-section-list.jsx`,
      android: `${componentPrefixPath}/react/dist/mpx-section-list.jsx`,
      harmony: `${componentPrefixPath}/react/dist/mpx-section-list.jsx`
    },
    'sticky-header': {
      wx: `${componentPrefixPath}/wx/mpx-sticky-header.mpx`,
      ali: `${componentPrefixPath}/ali/mpx-sticky-header.mpx`,
      web: `${componentPrefixPath}/web/mpx-sticky-header.vue`,
      ios: `${componentPrefixPath}/react/dist/mpx-sticky-header.jsx`,
      android: `${componentPrefixPath}/react/dist/mpx-sticky-header.jsx`,
      harmony: `${componentPrefixPath}/react/dist/mpx-sticky-header.jsx`
    },
    'sticky-section': {
      wx: `${componentPrefixPath}/wx/mpx-sticky-section.mpx`,
      ali: `${componentPrefixPath}/ali/mpx-sticky-section.mpx`,
      web: `${componentPrefixPath}/web/mpx-sticky-section.vue`,
      ios: `${componentPrefixPath}/react/dist/mpx-sticky-section.jsx`,
      android: `${componentPrefixPath}/react/dist/mpx-sticky-section.jsx`,
      harmony: `${componentPrefixPath}/react/dist/mpx-sticky-section.jsx`
    }
  },
  MPX_TAG_PAGE_SELECTOR: 'mpx-page'
}
