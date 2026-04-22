module.exports = {
  MPX_PROCESSED_FLAG: 'mpx_processed',
  MPX_DISABLE_EXTRACTOR_CACHE: 'mpx_disable_extractor_cache',
  DEFAULT_RESULT_SOURCE: '',
  RESOLVE_IGNORED_ERR: new Error('Resolve ignored!'),
  JSON_JS_EXT: '.json.js',
  MPX_ROOT_VIEW: 'mpx-root-view', // 根节点类名
  MPX_APP_MODULE_ID: 'mpx-app-scope', // app文件moduleId
  PARENT_MODULE_ID: '__pid',
  MPX_TAG_PAGE_SELECTOR: 'mpx-page',
  // web / template is：具名 wx 模版子组件标签前缀（与 compiler 中 AST 替换一致）
  MPX_WX_TEMPLATE_COMPONENT_PREFIX: 'mpx-wx-tpl-'
}
