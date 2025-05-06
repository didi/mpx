import { createI18n } from '../builtInMixins/i18nMixin'

export function init (Mpx) {
  mpxGlobal.__mpx = Mpx
  if (mpxGlobal.i18n) {
    Mpx.i18n = createI18n(mpxGlobal.i18n)
  }
}
