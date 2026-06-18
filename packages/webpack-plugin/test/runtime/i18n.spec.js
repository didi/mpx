const fs = require('fs')
const path = require('path')

// i18n.wxs 通过全局变量在编译期注入运行环境，jest 下直接读取源码并以非 wxs 环境求值。
function loadI18n () {
  global.__mpx_wxs__ = false
  global.__mpx_locale__ = 'zh-CN'
  global.__mpx_fallback_locale__ = 'zh-CN'
  global.__mpx_messages__ = {}
  const source = fs.readFileSync(path.resolve(__dirname, '../../lib/runtime/i18n.wxs'), 'utf-8')
  const module_ = { exports: {} }
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'global', source)(module_, module_.exports, global)
  return module_.exports
}

describe('i18n.wxs translate', function () {
  const i18n = loadI18n()
  const messages = {
    en: {
      '1000+ reviews': '1000+ reviews',
      'Pro+ features': 'Pro+ features',
      nav: { home: 'Home' }
    },
    fr: {
      '1000+ reviews': 'plus de 1000 avis',
      'Pro+ features': 'fonctions Pro+',
      nav: { home: 'Accueil' }
    }
  }

  it('resolves a key where + follows pure digits ("1000+ reviews")', function () {
    expect(i18n.t(messages, 'fr', 'en', '1000+ reviews')).toBe('plus de 1000 avis')
  })

  it('keeps resolving a key where + follows non-digits ("Pro+ features")', function () {
    expect(i18n.t(messages, 'fr', 'en', 'Pro+ features')).toBe('fonctions Pro+')
  })

  it('resolves a nested path key ("nav.home")', function () {
    expect(i18n.t(messages, 'fr', 'en', 'nav.home')).toBe('Accueil')
  })

  it('keeps path priority when a flat key collides with a nested path', function () {
    const conflicting = {
      en: { 'nav.home': 'Flat Home', nav: { home: 'Nested Home' } }
    }
    expect(i18n.t(conflicting, 'en', 'en', 'nav.home')).toBe('Nested Home')
  })
})
