module.exports = {
  MPX_PROCESSED_FLAG: 'mpx_processed',
  MPX_DISABLE_EXTRACTOR_CACHE: 'mpx_disable_extractor_cache',
  DEFAULT_RESULT_SOURCE: '',
  RESOLVE_IGNORED_ERR: new Error('Resolve ignored!'),
  JSON_JS_EXT: '.json.js',
  MPX_ROOT_VIEW: 'mpx-root-view', // 根节点类名
  MPX_APP_MODULE_ID: 'mpx-app-scope', // app文件moduleId
  PARENT_MODULE_ID: '__pid',
  EXTEND_COMPONENTS_LIST: {
    wx: ['recycle-view'],
    web: ['recycle-view'],
    ios: ['recycle-view'],
    android: ['recycle-view'],
    harmony: ['recycle-view']
  } // 扩展组件列表
}
