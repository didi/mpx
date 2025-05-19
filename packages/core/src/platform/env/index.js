import { createI18n } from '../builtInMixins/i18nMixin'

export function init (Mpx) {
  mpxGlobal.__mpx = Mpx
  if (global.i18n) {
    Mpx.i18n = createI18n(global.i18n)
  }
}
