const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/ // useless escape
const ncname = `[a-zA-Z_][\\w\\-\\.]*`
const qname = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qname}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qname}[^>]*>`)
const comment = /^<!\--/ // useless escape
const invalidAttributeRE = /[\s"'<>\/=]/ // useless escape
let currentParent

function makeMap (str, expectsLowerCase) {
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}

const isRichTextTag = makeMap(
  'a,abbr,address,article,aside,b,bdi,bdo,big,blockquote,br,caption,' +
  'center,cite,code,col,colgroup,dd,del,div,dl,dt,em,fieldset,' +
  'font,footer,h1,h2,h3,h4,h5,h6,header,hr,i,img,ins,label,legend,' +
  'li,mark,nav,ol,p,pre,q,rt,ruby,s,section,small,span,strong,sub,sup,' +
  'table,tbody,td,tfoot,th,thead,tr,tt,u,ul'
)
const isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
)
const isSpace = makeMap('ensp,emsp,nbsp')

const isContWidth = makeMap('col,colgroup,img,table,td,th,tr')

const isContHeight = makeMap('img,td,th,tr')

const isContConRow = makeMap('td,th,tr')

function makeAttrsMap (attrs) {
  const map = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

function createASTElement (
  tag,
  attrs
) {
  return {
    name: tag,
    attrs: makeAttrsMap(attrs),
    children: []
  }
}

function parseHTML (html, options) {
  const stack = []
  let index = 0
  // let last
  while (html) {
    // last = html
    // Make sure we're not in a plaintext content element like script/style
    // if (!lastTag) {
    let textEnd = html.indexOf('<')
    if (textEnd === 0) {
      if (comment.test(html)) {
        const commentEnd = html.indexOf('-->')

        if (commentEnd >= 0) {
          options.comment(html.substring(4, commentEnd))
          advance(commentEnd + 3)
          continue
        }
      }

      const endTagMatch = html.match(endTag)
      if (endTagMatch) {
        const curIndex = index
        advance(endTagMatch[0].length)
        parseEndTag(endTagMatch[1], curIndex, index)
        continue
      }

      const start = html.match(startTagOpen)
      if (start) {
        const match = {
          tagName: start[1],
          attrs: [],
          start: index
        }
        advance(start[0].length)
        let end, attr
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          attr.start = index
          advance(attr[0].length)
          attr.end = index
          match.attrs.push(attr)
        }
        if (end) {
          match.unarySlash = end[1]
          advance(end[0].length)
          match.end = index
          handleStartTag(match)
        }
      }
    }
    let text, rest, next
    if (textEnd >= 0) {
      rest = html.slice(textEnd)
      while (
        !endTag.test(rest) &&
        !startTagOpen.test(rest) &&
        !comment.test(rest)
      ) {
        // < in plain text, be forgiving and treat it as text
        next = rest.indexOf('<', 1)
        if (next < 0) break
        textEnd += next
        rest = html.slice(textEnd)
      }
      text = html.substring(0, textEnd)
    }

    if (textEnd < 0) {
      text = html
    }

    if (text) {
      advance(text.length)
    }
    if (options.chars && text) {
      options.chars(text)
    }
    // }
  }
  parseEndTag()
  function advance (n) {
    index += n
    html = html.substring(n)
  }

  function parseEndTag (tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index
    // Find the closest opened tag of the same type
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }
    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        if (i > pos || !tagName) {
          console.warn(`tag <${stack[i].tag}> has no matching end tag.`,
            { start: stack[i].start, end: stack[i].end })
        }
        if (options.end) {
          options.end()
        }
      }

      // Remove the open elements from the stack
      stack.length = pos
    }
  }

  function handleStartTag (match) {
    const tagName = match.tagName.toLowerCase()
    const unarySlash = match.unarySlash

    const unary = isUnaryTag(tagName) || !!unarySlash

    const l = match.attrs.length
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      const value = args[3] || args[4] || args[5] || ''
      attrs[i] = {
        name: args[1],
        value: value
      }
    }

    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end })
      // lastTag = tagName
    }

    if (options.start) {
      options.start(tagName, attrs, unary)
    }
  }
}

export function parse (template) {
  let nodes = []
  const stack = []
  let root
  function pushChild (currentParent, child) {
    if (currentParent) {
      currentParent.children.push(child)
    } else {
      nodes.push(child)
    }
  }
  parseHTML(template, {
    start (tag, attrs, unary) {
      let element = createASTElement(tag, attrs, currentParent)
      if (!unary && !stack.length) {
        root = element
      }
      if (!unary) {
        currentParent = element
        stack.push(element)
      } else if (isUnaryTag(tag)) {
        pushChild(currentParent, element)
      }
      attrs.forEach(attr => {
        if (invalidAttributeRE.test(attr.name)) {
          console.warn(`Invalid dynamic argument expression: attribute names cannot contain ` +
            `spaces, quotes, <, >, / or =.`, {
            start: attr.start + attr.name.indexOf(`[`),
            end: attr.start + attr.name.length
          })
        }
      })
    },
    end () {
      const element = stack[stack.length - 1]
      // pop stack
      stack.length -= 1
      currentParent = stack[stack.length - 1]
      currentParent && currentParent.children.push(element)
      if (!stack.length) {
        nodes.push(root)
      }
    },
    chars (text) {
      const child = {
        type: 'text',
        text
      }
      pushChild(currentParent, child)
    },
    comment (text) {
      const child = {
        type: 'comment',
        text
      }
      pushChild(currentParent, child)
    }
  })
  if (stack.length) {
    let last
    for (let i = stack.length - 1; i >= 0; i--) {
      if (last) {
        stack[i].children.push(last)
      }
      last = stack[i]
    }
    nodes.push(last)
  }
  return nodes
}

function spaceTran (str, space) {
  const sReg = /( |&emsp;|&ensp;|&nbsp;){1}/g
  const setSpace = `&${space};`
  return str.replace(sReg, setSpace)
}

export function htmlTranStr (template, space) {
  let html = ''
  template.forEach(item => {
    const name = item.name
    if (item.type === 'text') {
      html += isSpace(space) ? spaceTran(item.text, space) : item.text
    }
    if (item.type === 'comment') {
      console.warn(`the rich-text nonsupport ${item.type} tag`)
    }
    if (name && isRichTextTag(name)) {
      html += `<${name}`
      if (item.attrs) {
        const attrs = item.attrs
        let isEffAttr
        for (const key in attrs) {
          switch (key) {
            case 'style':
            case 'class':
              isEffAttr = true
              break
            case 'width':
              isEffAttr = isContWidth(name)
              break
            case 'height':
              isEffAttr = isContHeight(name)
              break
            case 'alt':
            case 'src':
              isEffAttr = name === 'img'
              break
            case 'colspan':
            case 'rowspan':
              isEffAttr = isContConRow(name)
              break
            case 'start':
            case 'type':
              isEffAttr = name === 'ol'
              break
            case 'span':
              isEffAttr = name === 'col' || name === 'colgroup'
              break
            case 'dir':
              isEffAttr = name === 'bdo'
              break
          }
          html += isEffAttr ? ` ${key}="${attrs[key]}"` : console.warn(`This ${key} attribute is not supported for ${name} tags contained in rich-text`)
        }
      }
      html += `${isUnaryTag(name) ? '' : '>'}${item.children.length ? htmlTranStr(item.children, space) : ''}${isUnaryTag(name) ? ' />' : '</' + name + '>'}`
    } else if (name) {
      console.warn(`the rich-text is not support ${name} tag`)
    }
  })
  return html
}
