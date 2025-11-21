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
    'recycle-view': {
      wx: 'runtime/components/wx/mpx-recycle-view.mpx',
      ali: 'runtime/components/ali/mpx-recycle-view.mpx',
      web: 'runtime/components/web/mpx-recycle-view.vue',
      ios: 'runtime/components/react/dist/mpx-recycle-view.jsx',
      android: 'runtime/components/react/dist/mpx-recycle-view.jsx',
      harmony: 'runtime/components/react/dist/mpx-recycle-view.jsx'
    }
  }
}
