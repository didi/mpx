// eslint-disable-next-line
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/ // useless escape
const ncname = `[a-zA-Z_][\\w\\-\\.]*`
const qname = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qname}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qname}[^>]*>`)
// eslint-disable-next-line
const comment = /^<!\--/
// eslint-disable-next-line
const invalidAttributeRE = /[\s"'<>\/=]/
// 当前节点的parent
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

const isTenonTag = makeMap('h1,h2,h3,h4,h5,h6,i,small,span,strong,image,a')

const isTenonTextTag = makeMap('h1,h2,h3,h4,h5,h6,i,small,span,strong')

const isTextAttrs = makeMap('color,backgroundColor,fontFamily,fontSize,fontWeight,fontStyle,textDecoration')

const isImageAttrs = makeMap('image,imageWidth,imageHeight,imageAlign')

const isAAttrs = makeMap('href,hrefColor')

const isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
)
// const isSpace = makeMap('ensp,emsp,nbsp')

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
      // 如果是注释节点
      if (comment.test(html)) {
        const commentEnd = html.indexOf('-->')

        if (commentEnd >= 0) {
          options.comment(html.substring(4, commentEnd))
          advance(commentEnd + 3)
          continue
        }
      }
      // 如果是结束标签
      const endTagMatch = html.match(endTag)
      if (endTagMatch) {
        const curIndex = index
        advance(endTagMatch[0].length)
        parseEndTag(endTagMatch[1], curIndex, index)
        continue
      }
      // 如果是开始的开标签
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
      // 获取剩下的部分
      rest = html.slice(textEnd)
      // 当不是结束标签 开始的开标签 注释标签时
      while (
        !endTag.test(rest) &&
        !startTagOpen.test(rest) &&
        !comment.test(rest)
      ) {
        // < in plain text, be forgiving and treat it as text
        // 找下一个对应的<
        next = rest.indexOf('<', 1)
        if (next < 0) break
        textEnd += next
        rest = html.slice(textEnd)
      }
      // 将text截取出来 可能是没找到的
      text = html.substring(0, textEnd)
    }
    // 没有找到<
    if (textEnd < 0) {
      text = html
    }

    if (text) {
      advance(text.length)
    }
    if (options.chars && text) {
      // 处理字符串
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

// function spaceTran (str, space) {
//   const sReg = /( |&emsp;|&ensp;|&nbsp;){1}/g
//   const setSpace = `&${space};`
//   return str.replace(sReg, setSpace)
// }
function TenonTagCreater (tagName) {
  if (this instanceof TenonTagCreater) {
    return new this[tagName]()
  }
  return new TenonTagCreater(tagName)
}

TenonTagCreater.prototype = {
  h1: function () {
    return {
      fontWeight: 'bold',
      fontSize: 28
    }
  },
  h2: function () {
    return {
      fontWeight: 'bold',
      fontSize: 21
    }
  },
  h3: function () {
    return {
      fontWeight: 'bold',
      fontSize: 16.38
    }
  },
  h4: function () {
    return {
      fontWeight: 'bold'
    }
  },
  h5: function () {
    return {
      fontWeight: 'bold',
      fontSize: 11.62
    }
  },
  h6: function () {
    return {
      fontWeight: 'bold',
      fontSize: 10.5
    }
  },
  i: function () {
    return {
      fontStyle: 'italic'
    }
  },
  small: function () {
    return {
      fontSize: 11.62
    }
  },
  span: function () {
    return {

    }
  },
  strong: function () {
    return {
      fontWeight: 'bold'
    }
  },
  image: function () {
    return {

    }
  },
  a: function () {
    return {

    }
  }
}

export function htmlTranStr (template, space, parentNode) {
  // 只能解析最外层的
  let richTextArray = []
  template.forEach(item => {
    const name = item.name

    if (item.type === 'text') {
      // hummer不支持 暂时注释
      // parentNode.text = isSpace(space) ? spaceTran(item.text, space) : item.text
      parentNode.text = item.text
    }
    if (item.type === 'comment') {
      console.warn(`the rich-text nonsupport ${item.type} tag`)
    }
    // 改造判断tenon支持的标签 根据默认样式 然后组合设置的样式
    if (name && isTenonTag(name)) {
      let node = new TenonTagCreater(name)

      if (item.attrs) {
        const attrs = item.attrs
        for (const key in attrs) {
          const isUnEffAttr = (isTenonTextTag(name) && !isTextAttrs(key)) || (name === 'image' && !isImageAttrs(key)) || (name === 'a' && !isAAttrs(key))
          if (isUnEffAttr) {
            console.warn(`This ${key} attribute is not supported for ${name} tags contained in rich-text`)
          } else {
            node[key] = attrs[key]
          }
        }
      }
      item.children.length && htmlTranStr(item.children, space, node)
      richTextArray.push(node)
    } else {
      console.warn(`the rich-text is not support ${name} tag`)
    }
  })
  return richTextArray
}
