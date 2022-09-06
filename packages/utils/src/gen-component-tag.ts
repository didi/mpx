import { stringifyAttr } from '@mpxjs/compiler/template-compiler/compiler'
import t from './type'

function stringifyAttrs(attrs: { [x: string]: any }) {
  let result = ''
  Object.keys(attrs).forEach(function (name) {
    result += ' ' + name
    let value = attrs[name]
    if (value != null && value !== true) {
      result += '=' + stringifyAttr(value)
    }
  })
  return result
}

export default function genComponentTag(
  part: { content: any; tag: any; attrs: any },
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
