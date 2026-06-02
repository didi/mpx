const componentPrefixPath = '@mpxjs/webpack-plugin/lib/runtime/components'
const reactComponentPath = `${componentPrefixPath}/react/dist`

module.exports = {
  MPX_PROCESSED_FLAG: 'mpx_processed',
  MPX_DISABLE_EXTRACTOR_CACHE: 'mpx_disable_extractor_cache',
  DEFAULT_RESULT_SOURCE: '',
  RESOLVE_IGNORED_ERR: new Error('Resolve ignored!'),
  JSON_JS_EXT: '.json.js',
  MPX_ROOT_VIEW: 'mpx-root-view', // 根节点类名
  MPX_APP_MODULE_ID: 'mpx-app-scope', // app文件moduleId
  PARENT_MODULE_ID: '__pid',
  EXTEND_COMPONENT_CONFIG: {
    'section-list': {
      ios: `${reactComponentPath}/mpx-section-list.jsx`,
      android: `${reactComponentPath}/mpx-section-list.jsx`,
      harmony: `${reactComponentPath}/mpx-section-list.jsx`
    },
    'sticky-header': {
      web: `${componentPrefixPath}/web/mpx-sticky-header.vue`,
      ios: `${reactComponentPath}/mpx-sticky-header.jsx`,
      android: `${reactComponentPath}/mpx-sticky-header.jsx`,
      harmony: `${reactComponentPath}/mpx-sticky-header.jsx`
    },
    'sticky-section': {
      web: `${componentPrefixPath}/web/mpx-sticky-section.vue`,
      ios: `${reactComponentPath}/mpx-sticky-section.jsx`,
      android: `${reactComponentPath}/mpx-sticky-section.jsx`,
      harmony: `${reactComponentPath}/mpx-sticky-section.jsx`
    }
  },
  MPX_TAG_PAGE_SELECTOR: 'mpx-page',
  // web / template is：具名 wx 模版子组件标签前缀（与 compiler 中 AST 替换一致）
  MPX_TEMPLATE_COMPONENT_PREFIX: 'mpx-tpl-',
  STYLE_PAD_PLACEHOLDER: 'mpx-style-pad-placeholder'
}
