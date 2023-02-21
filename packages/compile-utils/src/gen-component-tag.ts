import { type as t } from './type'

function stringifyAttr(val: string) {
  if (typeof val === 'string') {
    const hasSingle = val.indexOf("'") > -1
    const hasDouble = val.indexOf('"') > -1
    // 移除属性中换行
    val = val.replace(/\n/g, '')

    if (hasSingle && hasDouble) {
      val = val.replace(/'/g, '"')
    }
    if (hasDouble) {
      return `'${val}'`
    } else {
      return `"${val}"`
    }
  }
}

function stringifyAttrs(attrs: { [x: string]: any }) {
  let result = ''
  Object.keys(attrs).forEach(function (name) {
    result += ' ' + name
    const value = attrs[name]
    if (value != null && value !== true) {
      result += '=' + stringifyAttr(value)
    }
  })
  return result
}

export function genComponentTag(
  part: { content: string; tag: string; attrs: any },
  processor: any = {}
) {
  // normalize
  if (t(processor) === 'Function') {
    processor = {
      content: processor
    }
  }
  if (part.content) {
    // unpad
    // part.content = '\n' + part.content.replace(/^\n*/m, '')
  }

  const tag = processor.tag ? processor.tag(part) : part.tag
  const attrs = processor.attrs ? processor.attrs(part) : part.attrs
  const content = processor.content ? processor.content(part) : part.content
  let result = ''
  if (tag) {
    result += `<${tag}`
    if (attrs) {
      result += stringifyAttrs(attrs)
    }
    if (content) {
      result += `>${content}</${tag}>`
    } else {
      result += '/>'
    }
  }
  return result
}
