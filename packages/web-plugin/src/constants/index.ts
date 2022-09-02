import { resolveMpxRuntime } from "../utils/resolveMpxRuntime"

export const MPX_PROCESSED_FLAG = 'mpx_processed'
export const MPX_DISABLE_EXTRACTOR_CACHE = 'mpx_disable_extractor_cache'
export const DEFAULT_RESULT_SOURCE = ''
export const RESOLVE_IGNORED_ERR = new Error('Resolve ignored!')
export const JSON_JS_EXT = '.json.js'
export const MPX_ROOT_VIEW = 'mpx-root-view' // 根节点类名
export const MPX_APP_MODULE_ID = 'mpx-app-scope' // app文件moduleId
export const MPX_CURRENT_CHUNK = 'mpx_current_chunk'

export const OPTION_PROCESSOR_PATH = resolveMpxRuntime('optionProcessor')
export const TAB_BAR_PATH = resolveMpxRuntime('components/web/mpx-tab-bar.vue')
export const CUSTOM_BAR_RELATIVE_PATH = './custom-tab-bar/index?component'
export const TAB_BAR_CONTAINER_PATH = resolveMpxRuntime(
  'components/web/mpx-tab-bar-container.vue'
)