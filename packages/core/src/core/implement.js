import { noop } from '@mpxjs/utils'

export const implemented = {}

export function implement (name, { modes = [], processor = noop, remove = false } = {}) {
  if (!name) return
  if (modes.indexOf(__mpx_mode__) > -1) {
    processor()
    implemented[name] = {
      remove
    }
  }
}
