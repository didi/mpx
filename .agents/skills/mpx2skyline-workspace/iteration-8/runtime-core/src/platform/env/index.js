import { createI18n } from '../builtInMixins/i18nMixin'

export function init (Mpx) {
  // 为避免多个mpx应用运行时互相覆盖global __mpx对象，导致业务异常，例如插件模式下，插件应用和业务应用互相覆盖global.__mpx，因此创建mpxGlobal局部对象
  mpxGlobal.__mpx = Mpx
  global.__mpx = Mpx
  if (global.i18n) {
    Mpx.i18n = createI18n(global.i18n)
  }
}
