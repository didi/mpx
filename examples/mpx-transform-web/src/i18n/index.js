// log MPX i18n 因为是在node环境下引入文件 所以需要使用commonjs规范
import cn from './cn'
import en from './en'

/**
 * 语言类型由端传来，key为lang，可能的值有：zh-CN, en-US, pt-BR, en-BR, zh-HK, zh-TW
 */

export default {
  'zh-CN': cn,
  'en-US': en
}
