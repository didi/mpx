import * as normalize from '@mpxjs/utils/normalize'

export const RESOLVE_IGNORED_ERR = new Error('Resolve ignored!')
export const JSON_JS_EXT = '.json.js'
export const MPX_APP_MODULE_ID = 'mpx-app-scope' // app文件moduleId
export const MPX_CURRENT_CHUNK = 'mpx_current_chunk'

export const OPTION_PROCESSOR_PATH = normalize.runtime('optionProcessor')
export const TAB_BAR_PATH = normalize.runtime('components/web/mpx-tab-bar.vue')
export const CUSTOM_BAR_RELATIVE_PATH = './custom-tab-bar/index?component'
export const TAB_BAR_CONTAINER_PATH = normalize.runtime(
  'components/web/mpx-tab-bar-container.vue'
)
