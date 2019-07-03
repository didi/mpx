const deindent = require('de-indent')
const he = require('he')
const config = require('../config')
const normalize = require('../utils/normalize')
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')
const isEmptyObject = require('../utils/is-empty-object')
const getRulesRunner = require('../platform/index')
const addQuery = require('../utils/add-query')

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap (str, expectsLowerCase) {
  let map = Object.create(null)
  let list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? function (val) {
      return map[val.toLowerCase()]
    }
    : function (val) {
      return map[val]
    }
}

let no = function (a, b, c) {
  return false
}

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
let isNonPhrasingTag = makeMap(
  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
  'title,tr,track'
)

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

// Regular Expressions for parsing tags and attributes
let attribute = /^\s*([^\s"'<>/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
let ncname = '[a-zA-Z_][\\w\\-\\.]*'
let qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')'
let startTagOpen = new RegExp(('^<' + qnameCapture))
let startTagClose = /^\s*(\/?)>/
let endTag = new RegExp(('^<\\/' + qnameCapture + '[^>]*>'))
let doctype = /^<!DOCTYPE [^>]+>/i
let comment = /^<!--/
let conditionalComment = /^<!\[/

let IS_REGEX_CAPTURING_BROKEN = false
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === ''
})

// Special Elements (can contain anything)
let isPlainTextElement = makeMap('script,style,textarea', true)
let reCache = {}

let decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t'
}
let encodedAttr = /&(?:lt|gt|quot|amp);/g
let encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g

// #5992
let isIgnoreNewlineTag = makeMap('pre,textarea', true)
let shouldIgnoreFirstNewline = function (tag, html) {
  return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'
}

function decodeAttr (value, shouldDecodeNewlines) {
  let re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  return value.replace(re, function (match) {
    return decodingMap[match]
  })
}

let splitRE = /\r?\n/g
let replaceRE = /./g
let isSpecialTag = makeMap('script,style,template', true)

let ieNSBug = /^xmlns:NS\d+/
let ieNSPrefix = /^NS\d+:/

/* istanbul ignore next */
function guardIESVGBug (attrs) {
  let res = []
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i]
    if (!ieNSBug.test(attr.name)) {
      attr.name = attr.name.replace(ieNSPrefix, '')
      res.push(attr)
    }
  }
  return res
}

function makeAttrsMap (attrs) {
  let map = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    if (map[attrs[i].name] && !isIE && !isEdge) {
      warn$1('duplicate attribute: ' + attrs[i].name)
    }
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

function createASTElement (tag, attrs, parent) {
  return {
    type: 1,
    tag: tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    parent: parent,
    children: []
  }
}

function isTextTag (el) {
  return el.tag === 'script' || el.tag === 'style'
}

function isForbiddenTag (el) {
  return (
    el.tag === 'style' ||
    (el.tag === 'script' && (
      !el.attrsMap.type ||
      el.attrsMap.type === 'text/javascript'
    ))
  )
}

function cached (fn) {
  let cache = Object.create(null)
  return function cachedFn (str) {
    let hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}

let decodeHTMLCached = cached(he.decode)

// Browser environment sniffing
let inBrowser = typeof window !== 'undefined'
let UA = inBrowser && window.navigator.userAgent.toLowerCase()
let isIE = UA && /msie|trident/.test(UA)
let isEdge = UA && UA.indexOf('edge/') > 0

// configurable state
let warn$1
let error$1
let mode
let srcMode
let processingTemplate
let isNative
let rulesRunner
let platformGetTagNamespace
let resource
let refId = 0

function baseWarn (msg) {
  console.warn(('[template compiler]: ' + msg))
}

function baseError (msg) {
  console.error(('[template compiler]: ' + msg))
}

function parseHTML (html, options) {
  let stack = []
  let expectHTML = options.expectHTML
  let isUnaryTag$$1 = options.isUnaryTag || no
  let canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no
  let index = 0
  let last, lastTag
  while (html) {
    last = html
    // Make sure we're not in a plaintext content element like script/style
    if (!lastTag || !isPlainTextElement(lastTag)) {
      let textEnd = html.indexOf('<')
      if (textEnd === 0) {
        // Comment:
        if (comment.test(html)) {
          let commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) {
              options.comment(html.substring(4, commentEnd))
            }
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
          let conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        let doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag:
        let endTagMatch = html.match(endTag)
        if (endTagMatch) {
          let curIndex = index
          advance(endTagMatch[0].length)
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // Start tag:
        let startTagMatch = parseStartTag()
        if (startTagMatch) {
          handleStartTag(startTagMatch)
          if (shouldIgnoreFirstNewline(lastTag, html)) {
            advance(1)
          }
          continue
        }
      }

      let text = (void 0)
      let rest = (void 0)
      let next = (void 0)
      if (textEnd >= 0) {
        rest = html.slice(textEnd)
        while (!endTag.test(rest) && !startTagOpen.test(rest) && !comment.test(rest) && !conditionalComment.test(rest)) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1)
          if (next < 0) {
            break
          }
          textEnd += next
          rest = html.slice(textEnd)
        }
        text = html.substring(0, textEnd)
        advance(textEnd)
      }

      if (textEnd < 0) {
        text = html
        html = ''
      }

      if (options.chars && text) {
        options.chars(text)
      }
    } else {
      let endTagLength = 0
      let stackedTag = lastTag.toLowerCase()
      let reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      let rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!--([\s\S]*?)-->/g, '$1')
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1)
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest$1.length
      html = rest$1
      parseEndTag(stackedTag, index - endTagLength, index)
    }

    if (html === last) {
      options.chars && options.chars(html)
      if (!stack.length && options.warn) {
        options.warn(('Mal-formatted tag at end of template: "' + html + '"'))
      }
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag()

  function advance (n) {
    index += n
    html = html.substring(n)
  }

  function parseStartTag () {
    let start = html.match(startTagOpen)
    if (start) {
      let match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)
      let end, attr
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push(attr)
      }
      if (end) {
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  function handleStartTag (match) {
    let tagName = match.tagName
    let unarySlash = match.unarySlash

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    let unary = isUnaryTag$$1(tagName) || !!unarySlash

    let l = match.attrs.length
    let attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      let args = match.attrs[i]
      // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
        if (args[3] === '') {
          delete args[3]
        }
        if (args[4] === '') {
          delete args[4]
        }
        if (args[5] === '') {
          delete args[5]
        }
      }
      let value = args[3] || args[4] || args[5] || ''
      let shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines)
      }
    }

    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs })
      lastTag = tagName
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }

  function parseEndTag (tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) {
      start = index
    }
    if (end == null) {
      end = index
    }

    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
    }

    // Find the closest opened tag of the same type
    if (tagName) {
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
        if ((i > pos || !tagName) && options.warn) {
          options.warn(
            ('tag <' + (stack[i].tag) + '> has no matching end tag.')
          )
        }
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}

function parseComponent (content, options) {
  mode = options.mode || 'wx'

  let sfc = {
    template: null,
    script: null,
    json: null,
    styles: [],
    customBlocks: []
  }
  let depth = 0
  let currentBlock = null

  function start (tag, attrs, unary, start, end) {
    if (depth === 0) {
      currentBlock = {
        type: tag,
        content: '',
        start: end,
        attrs: attrs.reduce(function (cumulated, ref) {
          let name = ref.name
          let value = ref.value

          cumulated[name] = value || true
          return cumulated
        }, {})
      }
      if (isSpecialTag(tag)) {
        checkAttrs(currentBlock, attrs)
        // 带mode的fields只有匹配当前编译mode才会编译
        if (tag === 'style') {
          if (currentBlock.mode) {
            if (currentBlock.mode === mode) {
              sfc.styles.push(currentBlock)
            }
          } else {
            sfc.styles.push(currentBlock)
          }
        } else {
          if (tag === 'script' && currentBlock.type === 'application/json') {
            tag = 'json'
          }
          if (currentBlock.mode) {
            if (currentBlock.mode === mode) {
              sfc[tag] = currentBlock
            }
          } else {
            if (!(sfc[tag] && sfc[tag].mode)) {
              sfc[tag] = currentBlock
            }
          }
        }
      } else { // custom blocks
        sfc.customBlocks.push(currentBlock)
      }
    }
    if (!unary) {
      depth++
    }
  }

  function checkAttrs (block, attrs) {
    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i]
      if (attr.name === 'lang') {
        block.lang = attr.value
      }
      if (attr.name === 'type') {
        block.type = attr.value
      }
      if (attr.name === 'scoped') {
        block.scoped = true
      }
      if (attr.name === 'module') {
        block.module = attr.value || true
      }
      if (attr.name === 'src') {
        block.src = attr.value
      }
      if (attr.name === 'mode') {
        block.mode = attr.value
      }
    }
  }

  function end (tag, start, end) {
    if (depth === 1 && currentBlock) {
      currentBlock.end = start
      let text = deindent(content.slice(currentBlock.start, currentBlock.end))
      // pad content so that linters and pre-processors can output correct
      // line numbers in errors and warnings
      if (currentBlock.type !== 'template' && options.pad) {
        text = padContent(currentBlock, options.pad) + text
      }
      currentBlock.content = text
      currentBlock = null
    }
    depth--
  }

  function padContent (block, pad) {
    if (pad === 'space') {
      return content.slice(0, block.start).replace(replaceRE, ' ')
    } else {
      let offset = content.slice(0, block.start).split(splitRE).length
      let padChar = block.type === 'script' && !block.lang
        ? '//\n'
        : '\n'
      return Array(offset).join(padChar)
    }
  }

  parseHTML(content, {
    start: start,
    end: end
  })

  return sfc
}

function parse (template, options) {
  warn$1 = options.warn || baseWarn
  error$1 = options.error || baseError

  mode = options.mode || 'wx'
  srcMode = options.srcMode || mode
  isNative = options.isNative
  resource = options.resource

  rulesRunner = getRulesRunner({
    mode,
    srcMode,
    type: 'template',
    testKey: 'tag',
    warn: warn$1,
    error: error$1
  })

  platformGetTagNamespace = options.getTagNamespace || no

  let stack = []
  let preserveWhitespace = options.preserveWhitespace !== false
  let root
  let meta = {}
  let injectNodes = []
  let currentParent
  let multiRootError

  function genTempRoot () {
    // 使用临时节点作为root，处理multi root的情况
    root = currentParent = getTempNode()
    stack.push(root)
  }

  parseHTML(template, {
    warn: warn$1,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.hasComment,
    start: function start (tag, attrs, unary) {
      // check namespace.
      // inherit parent ns if there is one
      let ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag)

      // handle IE svg bug
      /* istanbul ignore if */
      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs)
      }

      let element = createASTElement(tag, attrs, currentParent)
      if (ns) {
        element.ns = ns
      }

      if (isForbiddenTag(element)) {
        element.forbidden = true
        warn$1(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          '<' + tag + '>' + ', as they will not be parsed.'
        )
      }

      // single root
      // // gen root
      // if (!root) {
      //   root = element
      // } else {
      //   // mount element
      //   if (currentParent) {
      //     currentParent.children.push(element)
      //     element.parent = currentParent
      //   } else {
      //     multiRootError = true
      //     return
      //   }
      // }

      // multi root
      if (!currentParent) genTempRoot()

      currentParent.children.push(element)
      element.parent = currentParent

      processElement(element, root, options, meta, injectNodes)
      if (!unary) {
        currentParent = element
        stack.push(element)
      } else {
        element.unary = true
        closeElement(element, meta)
      }
    },

    end: function end () {
      // remove trailing whitespace
      let element = stack[stack.length - 1]
      if (element) {
        let lastNode = element.children[element.children.length - 1]
        if (lastNode && lastNode.type === 3 && lastNode.text === ' ') {
          element.children.pop()
        }
        // pop stack
        stack.pop()
        currentParent = stack[stack.length - 1]
        closeElement(element, meta)
      }
    },

    chars: function chars (text) {
      if (!currentParent) genTempRoot()
      // IE textarea placeholder bug
      /* istanbul ignore if */
      if (isIE &&
        currentParent.tag === 'textarea' &&
        currentParent.attrsMap.placeholder === text
      ) {
        return
      }
      let children = currentParent.children
      text = text.trim()
        ? isTextTag(currentParent) ? text : decodeHTMLCached(text)
        // only preserve whitespace if its not right after a starting tag
        : preserveWhitespace && children.length ? ' ' : ''
      if (text) {
        if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          let el = {
            type: 3,
            text
          }
          processText(el)
          children.push(el)
        }
      }
    },
    comment: function comment (text) {
      if (!currentParent) genTempRoot()
      currentParent.children.push({
        type: 3,
        text: text,
        isComment: true
      })
    }
  })

  if (multiRootError) {
    error$1('Template fields should has one single root, considering wrapping your template content with <view> or <text> tag!')
  }

  if (injectNodes.length) {
    root.children = injectNodes.concat(root.children)
  }

  return {
    root,
    meta
  }
}

function getTempNode () {
  return createASTElement('temp-node', [])
}

function getAndRemoveAttr (el, name, removeFromMap = true) {
  let val
  let list = el.attrsList
  for (let i = 0, l = list.length; i < l; i++) {
    if (list[i].name === name) {
      val = list[i].value
      list.splice(i, 1)
      break
    }
  }
  if (removeFromMap && val === el.attrsMap[name]) {
    delete el.attrsMap[name]
  }
  return val
}

function addAttrs (el, attrs) {
  el.attrsList = el.attrsList.concat(attrs)
  el.attrsMap = makeAttrsMap(el.attrsList)
}

function modifyAttr (el, name, val) {
  el.attrsMap[name] = val
  let list = el.attrsList
  for (let i = 0, l = list.length; i < l; i++) {
    if (list[i].name === name) {
      list[i].value = val
      break
    }
  }
}

function stringify (str) {
  return JSON.stringify(str)
}

let tagRE = /\{\{((?:.|\n)+?)\}\}(?!})/
let tagREG = /\{\{((?:.|\n)+?)\}\}(?!})/g

// function processLifecycleHack (el, options) {
//   if (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') {
//     if (el.if) {
//       el.if = {
//         raw: `{{${el.if.exp} && mpxLifecycleHack}}`,
//         exp: `${el.if.exp} && mpxLifecycleHack`
//       }
//     } else if (el.elseif) {
//       el.elseif = {
//         raw: `{{${el.elseif.exp} && mpxLifecycleHack}}`,
//         exp: `${el.elseif.exp} && mpxLifecycleHack`
//       }
//     } else if (el.else) {
//       el.elseif = {
//         raw: '{{mpxLifecycleHack}}',
//         exp: 'mpxLifecycleHack'
//       }
//       delete el.else
//     } else {
//       el.if = {
//         raw: '{{mpxLifecycleHack}}',
//         exp: 'mpxLifecycleHack'
//       }
//     }
//   }
// }

function processPageStatus (el, options) {
  if (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') {
    addAttrs(el, [{
      name: 'mpxPageStatus',
      value: '{{mpxPageStatus}}'
    }])
  }
}

function processComponentIs (el, options) {
  if (el.tag !== 'component') {
    return
  }

  options = options || {}
  el.components = options.usingComponents
  if (!el.components) {
    warn$1('Component in which <component> tag is used must have a nonblank usingComponents field')
  }

  let is = getAndRemoveAttr(el, 'is')
  if (!is) {
    warn$1('<component> tag should have attrs[is].')
  }
  if (is) {
    let match = tagRE.exec(is)
    if (match) {
      if (match[0] !== is) {
        warn$1('only first mustache expression is valid in <component> attrs[is].')
      }
      el.is = match[1].trim()
    } else {
      el.is = stringify(is)
    }
  }
}

// function processComponentDepth (el, options) {
//   if (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') {
//     addAttrs(el, [{
//       name: 'mpxDepth',
//       value: '{{mpxDepth + 1}}'
//     }])
//   }
// }

function parseFuncStr2 (str) {
  let funcRE = /^([^()]+)(\((.*)\))?/
  let match = funcRE.exec(str)
  if (match) {
    let funcName = stringify(match[1])
    let args = match[3] ? `,${match[3]}` : ''
    let hasArgs = !!match[2]
    args = args.replace(/(\$event([^,\s])*)/, (match, p1) => stringify(p1))
    return {
      hasArgs,
      expStr: `[${funcName + args}]`
    }
  }
}

function processBindEvent (el) {
  const eventConfigMap = {}
  el.attrsList.forEach(function (attr) {
    let parsedEvent = config[mode].event.parseEvent(attr.name)

    if (parsedEvent) {
      let type = parsedEvent.eventName
      let modifiers = (parsedEvent.modifier || '').split('.')
      let parsedFunc = parseFuncStr2(attr.value)
      if (parsedFunc) {
        if (!eventConfigMap[type]) {
          eventConfigMap[type] = {
            rawName: attr.name,
            configs: []
          }
        }
        eventConfigMap[type].configs.push(parsedFunc)
        if (modifiers.indexOf('proxy') > -1) {
          eventConfigMap[type].proxy = true
        }
      }
    }
  })

  let modelExp = getAndRemoveAttr(el, config[mode].directive.model)
  if (modelExp) {
    let match = tagRE.exec(modelExp)
    if (match) {
      let modelProp = getAndRemoveAttr(el, config[mode].directive.modelProp) || config[mode].event.defaultModelProp
      let modelEvent = getAndRemoveAttr(el, config[mode].directive.modelEvent) || config[mode].event.defaultModelEvent
      const modelValuePath = getAndRemoveAttr(el, config[mode].directive.modelValuePath) || config[mode].event.defaultModelValuePath
      let modelValuePathArr
      try {
        modelValuePathArr = JSON.parse(modelValuePath)
      } catch (e) {
        modelValuePathArr = modelValuePath.split('.')
      }
      if (!isValidIdentifierStr(modelEvent)) {
        warn$1(`EventName ${modelEvent} which is used in ${config[mode].directive.model} must be a valid identifier!`)
        return
      }
      let modelValue = match[1].trim()
      if (!eventConfigMap[modelEvent]) {
        eventConfigMap[modelEvent] = {
          configs: []
        }
      }
      eventConfigMap[modelEvent].configs.unshift({
        hasArgs: true,
        expStr: `[${stringify('__model')},${stringify(modelValue)},${stringify('$event')},${stringify(modelValuePathArr)}]`
      })
      addAttrs(el, [
        {
          name: modelProp,
          value: modelExp
        }
      ])
    }
  }

  for (let type in eventConfigMap) {
    let needBind = false
    let { configs, rawName, proxy } = eventConfigMap[type]
    if (proxy) {
      needBind = true
    } else if (configs.length > 1) {
      needBind = true
    } else if (configs.length === 1) {
      needBind = !!configs[0].hasArgs
    }
    // 排除特殊情况
    if (needBind && !isValidIdentifierStr(type)) {
      warn$1(`EventName ${type} which need be framework proxy processed must be a valid identifier!`)
      needBind = false
    }
    if (needBind) {
      if (rawName) {
        // 清空原始事件绑定
        let val
        do {
          val = getAndRemoveAttr(el, rawName)
        } while (val)
        // 清除修饰符
        rawName = rawName.replace(/\..*/, '')
      }

      addAttrs(el, [
        {
          name: rawName || config[mode].event.getEvent(type),
          value: '__invoke'
        }
      ])
      eventConfigMap[type] = configs.map((item) => {
        return item.expStr
      })
    } else {
      delete eventConfigMap[type]
    }
  }

  if (!isEmptyObject(eventConfigMap)) {
    addAttrs(el, [{
      name: 'data-eventconfigs',
      value: `{{${config[mode].event.shallowStringify(eventConfigMap)}}}`
    }])
  }
}

function parseMustache (raw = '') {
  let replaced = false
  if (tagRE.test(raw)) {
    let ret = []
    let lastLastIndex = 0
    let match
    while (match = tagREG.exec(raw)) {
      let pre = raw.substring(lastLastIndex, match.index)
      if (pre) {
        ret.push(stringify(pre))
      }
      let exp = match[1]
      if (/\b__mpx_mode__\b/.test(exp)) {
        exp = exp.replace(/\b__mpx_mode__\b/g, stringify(mode))
        replaced = true
      }
      ret.push(`(${exp})`)
      lastLastIndex = tagREG.lastIndex
    }
    let post = raw.substring(lastLastIndex)
    if (post) {
      ret.push(stringify(post))
    }
    let result = ret.join('+')
    return {
      result,
      hasBinding: true,
      val: replaced ? `{{${result}}}` : raw,
      replaced
    }
  }
  return {
    result: stringify(raw),
    hasBinding: false,
    val: raw,
    replaced
  }
}

function addExp (el, exp, needTravel) {
  if (exp) {
    if (!el.exps) {
      el.exps = []
    }
    el.exps.push({ exp, needTravel })
  }
}

function processIf (el) {
  let val = getAndRemoveAttr(el, config[mode].directive.if)
  if (val) {
    let parsed = parseMustache(val)
    el.if = {
      raw: parsed.val,
      exp: parsed.result
    }
  } else if (val = getAndRemoveAttr(el, config[mode].directive.elseif)) {
    let parsed = parseMustache(val)
    el.elseif = {
      raw: parsed.val,
      exp: parsed.result
    }
  } else if (getAndRemoveAttr(el, config[mode].directive.else) != null) {
    el.else = true
  }
}

function processFor (el) {
  let val = getAndRemoveAttr(el, config[mode].directive.for)
  if (val) {
    let parsed = parseMustache(val)
    el.for = {
      raw: parsed.val,
      exp: parsed.result
    }
    if (val = getAndRemoveAttr(el, config[mode].directive.forIndex)) {
      el.for.index = val
    }
    if (val = getAndRemoveAttr(el, config[mode].directive.forItem)) {
      el.for.item = val
    }
    if (val = getAndRemoveAttr(el, config[mode].directive.key)) {
      el.for.key = val
    }
  }
}

function processRef (el, options, meta) {
  let val = getAndRemoveAttr(el, config[mode].directive.ref)
  let type = options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component' ? 'component' : 'node'
  if (val) {
    if (!meta.refs) {
      meta.refs = []
    }
    let all = !!el.for
    let refClassName = `__ref_${val}_${++refId}_{{mpxCid}}`
    let className = getAndRemoveAttr(el, 'class')
    className = className ? className + ' ' + refClassName : refClassName
    addAttrs(el, [{
      name: 'class',
      value: className
    }])
    meta.refs.push({
      key: val,
      selector: `.${refClassName}`,
      type,
      all
    })
  }

  if (type === 'component' && mode === 'ali') {
    addAttrs(el, [{
      name: 'onUpdateRef',
      value: '__handleUpdateRef'
    }])
  }
}

function addWxsModule (meta, module, src) {
  if (!meta.wxsModuleMap) {
    meta.wxsModuleMap = {}
  }
  if (meta.wxsModuleMap[module]) return true
  meta.wxsModuleMap[module] = src
}

function addWxsContent (meta, module, content) {
  if (!meta.wxsConentMap) {
    meta.wxsConentMap = {}
  }
  if (meta.wxsConentMap[module]) return true
  meta.wxsConentMap[module] = content
}

function postProcessWxs (el, meta) {
  if (el.tag === config[mode].wxs.tag) {
    let module = el.attrsMap[config[mode].wxs.module]
    if (module) {
      let src, content
      if (el.attrsMap[config[mode].wxs.src]) {
        src = el.attrsMap[config[mode].wxs.src]
      } else {
        content = el.children.filter((child) => {
          return child.type === 3 && !child.isComment
        }).map(child => child.text).join('\n')
        src = addQuery(resource, {
          wxsModule: module
        })
        addAttrs(el, [{
          name: config[mode].wxs.src,
          value: src
        }])
        el.children = []
      }
      src && addWxsModule(meta, module, src)
      content && addWxsContent(meta, module, content)
    }
  }
}

function processAttrs (el, options) {
  el.attrsList.forEach((attr) => {
    const isTemplateData = el.tag === 'template' && attr.name === 'data'
    let value = isTemplateData ? `{${attr.value}}` : attr.value
    let parsed = parseMustache(value)
    if (parsed.hasBinding) {
      let needTravel = (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') && !(attr.name === 'class' || attr.name === 'style')
      addExp(el, parsed.result, needTravel)
    }
    if (parsed.replaced) {
      modifyAttr(el, attr.name, isTemplateData ? attr.value.replace(/\b__mpx_mode__\b/g, stringify(mode)) : parsed.val)
    }
  })
}

function postProcessFor (el) {
  if (el.for) {
    let attrs = [
      {
        name: config[mode].directive.for,
        value: el.for.raw
      }
    ]
    if (el.for.index) {
      attrs.push({
        name: config[mode].directive.forIndex,
        value: el.for.index
      })
    }
    if (el.for.item) {
      attrs.push({
        name: config[mode].directive.forItem,
        value: el.for.item
      })
    }
    if (el.for.key) {
      attrs.push({
        name: config[mode].directive.key,
        value: el.for.key
      })
    }
    addAttrs(el, attrs)
  }
}

function evalExp (exp) {
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return ${exp};`)
  let result = { success: false }
  try {
    result = {
      success: true,
      result: fn()
    }
  } catch (e) {
  }
  return result
}

function postProcessIf (el) {
  let attrs, result, prevNode
  if (el.if) {
    result = evalExp(el.if.exp)
    if (result.success) {
      if (result.result) {
        delete el.if
        el._if = true
      } else {
        replaceNode(el, getTempNode())._if = false
      }
    } else {
      attrs = [{
        name: config[mode].directive.if,
        value: el.if.raw
      }]
    }
  } else if (el.elseif) {
    prevNode = findPrevNode(el)
    if (prevNode._if === true) {
      removeNode(el)
    } else if (prevNode._if === false) {
      // 当做if处理
      el.if = el.elseif
      delete el.elseif
      postProcessIf(el)
    } else {
      result = evalExp(el.elseif.exp)
      if (result.success) {
        if (result.result) {
          // 当做else处理
          delete el.elseif
          el._if = el.else = true
          postProcessIf(el)
        } else {
          removeNode(el)
        }
      } else {
        attrs = [{
          name: config[mode].directive.elseif,
          value: el.elseif.raw
        }]
      }
    }
  } else if (el.else) {
    prevNode = findPrevNode(el)
    if (prevNode._if === true) {
      removeNode(el)
    } else if (prevNode._if === false) {
      delete el.else
    } else {
      attrs = [{
        name: config[mode].directive.else,
        value: ''
      }]
    }
  }
  if (attrs) {
    addAttrs(el, attrs)
  }
}

function processText (el) {
  if (el.type !== 3 || el.isComment) {
    return
  }
  let parsed = parseMustache(el.text)
  if (parsed.hasBinding) {
    addExp(el, parsed.result)
  }
  el.text = parsed.val
}

// function injectComputed (el, meta, type, body) {
//   if (!meta.computed) {
//     meta.computed = []
//     meta.computedId = 0
//   }
//   let injectName = `__injected_${type}_${++meta.computedId}`
//   meta.computed.push(`${injectName}: function(){\n${body}}`)
//   addAttrs(el, [{
//     name: type,
//     value: `{{${injectName}}}`
//   }])
// }

function injectWxs (meta, module, src, injectNodes) {
  if (addWxsModule(meta, module, src)) {
    return
  }
  let wxsNode = createASTElement(config[mode].wxs.tag, [
    {
      name: config[mode].wxs.module,
      value: module
    },
    {
      name: config[mode].wxs.src,
      value: src
    }
  ])
  injectNodes.push(wxsNode)
}

const injectHelperWxsPath = normalize.lib('runtime/injectHelper.wxs')

function processClass (el, meta, injectNodes) {
  const type = 'class'
  const targetType = el.tag.startsWith('th-') ? 'ex-' + type : type
  let dynamicClass = getAndRemoveAttr(el, config[mode].directive.dynamicClass)
  let staticClass = getAndRemoveAttr(el, type)
  if (dynamicClass) {
    let staticClassExp = parseMustache(staticClass).result
    let dynamicClassExp = parseMustache(dynamicClass).result
    addAttrs(el, [{
      name: targetType,
      value: `{{__injectHelper.transformClass(${staticClassExp}, ${dynamicClassExp})}}`
    }])
    injectWxs(meta, '__injectHelper', injectHelperWxsPath, injectNodes)
  } else if (staticClass) {
    addAttrs(el, [{
      name: targetType,
      value: staticClass
    }])
  }
}

function processStyle (el, meta, injectNodes) {
  const type = 'style'
  const targetType = el.tag.startsWith('th-') ? 'ex-' + type : type
  let dynamicStyle = getAndRemoveAttr(el, config[mode].directive.dynamicStyle)
  let staticStyle = getAndRemoveAttr(el, type)
  if (dynamicStyle) {
    let staticStyleExp = parseMustache(staticStyle).result
    let dynamicStyleExp = parseMustache(dynamicStyle).result
    addAttrs(el, [{
      name: targetType,
      value: `{{__injectHelper.transformStyle(${staticStyleExp}, ${dynamicStyleExp})}}`
    }])
    injectWxs(meta, '__injectHelper', injectHelperWxsPath, injectNodes)
  } else if (staticStyle) {
    addAttrs(el, [{
      name: targetType,
      value: staticStyle
    }])
  }
}

function isRealNode (el) {
  const virtualNodeTagMap = ['block', 'template', 'import', config[mode].wxs.tag].reduce((map, item) => {
    map[item] = true
    return map
  }, {})
  return !virtualNodeTagMap[el.tag]
}

function processAliExternalClassesHack (el, options) {
  let staticClass = getAndRemoveAttr(el, 'class')
  if (staticClass) {
    options.externalClasses.forEach(({ className, replacement }) => {
      const reg = new RegExp('\\b' + className + '\\b', 'g')
      staticClass = staticClass.replace(reg, `{{${replacement}||''}}`)
    })
    addAttrs(el, [{
      name: 'class',
      value: staticClass
    }])
  }
}

function processAliStyleClassHack (el, options, root) {
  ['style', 'class'].forEach((type) => {
    let exp = getAndRemoveAttr(el, type)
    let sep = type === 'style' ? ';' : ' '

    let typeName = 'mpx' + type.replace(/^./, (matched) => {
      return matched.toUpperCase()
    })

    if (options.isComponent && el.parent === root && isRealNode(el)) {
      if (exp !== undefined) {
        exp = `{{${typeName}||''}}` + sep + exp
      } else {
        exp = `{{${typeName}||''}}`
      }
    }
    if (exp !== undefined) {
      if (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') {
        addAttrs(el, [{
          name: typeName,
          value: exp
        }])
      } else {
        addAttrs(el, [{
          name: type,
          value: exp
        }])
      }
    }
  })
}

function processShow (el, options, root) {
  let show = getAndRemoveAttr(el, config[mode].directive.show)
  if (options.isComponent && el.parent === root && isRealNode(el)) {
    if (show !== undefined) {
      show = `{{${parseMustache(show).result}&&mpxShow}}`
    } else {
      show = '{{mpxShow}}'
    }
  }
  if (show !== undefined) {
    if (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') {
      if (show === '') {
        show = '{{false}}'
      }
      addAttrs(el, [{
        name: 'mpxShow',
        value: show
      }])
    } else {
      const showExp = parseMustache(show).result
      let oldStyle = getAndRemoveAttr(el, 'style')
      oldStyle = oldStyle ? oldStyle + ';' : ''
      addAttrs(el, [{
        name: 'style',
        value: `${oldStyle}{{${showExp}||${showExp}===undefined?'':'display:none;'}}`
      }])
    }
  }
}

function processTemplate (el) {
  if (el.tag === 'template' && el.attrsMap['name']) {
    el.isTemplate = true
    processingTemplate = true
    return true
  }
}

function postProcessTemplate (el) {
  if (el.isTemplate) {
    processingTemplate = false
    return true
  }
}

function processElement (el, root, options, meta, injectNodes) {
  if (rulesRunner) {
    rulesRunner(el)
  }

  processRef(el, options, meta)

  if (mode === 'ali' && srcMode === 'wx') {
    processAliExternalClassesHack(el, options)
    processAliStyleClassHack(el, options, root)
  }

  let pass = isNative || processTemplate(el) || processingTemplate
  if (!pass) {
    processIf(el)
    processFor(el)
    if (mode !== 'qq' && mode !== 'tt') {
      processClass(el, meta, injectNodes)
      processStyle(el, meta, injectNodes)
    }
    processShow(el, options, root)
    processBindEvent(el)
    if (mode !== 'ali') {
      processPageStatus(el, options)
    }
    processComponentIs(el, options)
    processAttrs(el, options)
  }
}

function closeElement (el, meta) {
  if (postProcessTemplate(el) || processingTemplate) return
  postProcessWxs(el, meta)
  el = postProcessComponentIs(el)
  postProcessFor(el)
  postProcessIf(el)
}

function postProcessComponentIs (el) {
  if (el.is && el.components) {
    let tempNode
    if (el.for || el.if || el.elseif || el.else) {
      tempNode = createASTElement('block', [])
      tempNode.for = el.for
      tempNode.if = el.if
      tempNode.elseif = el.elseif
      tempNode.else = el.else
    } else {
      tempNode = getTempNode()
    }
    tempNode.children = el.components.map(function (component) {
      let newChild = createASTElement(component, el.attrsList, tempNode)
      newChild.if = {
        raw: `{{${el.is} === ${stringify(component)}}}`,
        exp: `${el.is} === ${stringify(component)}`
      }
      newChild.children = el.children
      newChild.exps = el.exps
      newChild.parent = tempNode
      postProcessIf(newChild)
      return newChild
    })
    if (!el.parent) {
      error$1('Dynamic component can not be the template root, considering wrapping it with <view> or <text> tag!')
    } else {
      el = replaceNode(el, tempNode) || el
    }
  }
  return el
}

function serialize (root) {
  function walk (node) {
    let result = ''
    if (node) {
      if (node.type === 3) {
        if (node.isComment) {
          result += '<!--' + node.text + '-->'
        } else {
          result += node.text
        }
      }
      if (node.type === 1) {
        if (node.tag !== 'temp-node') {
          result += '<' + node.tag
          node.attrsList.forEach(function (attr) {
            result += ' ' + attr.name
            let value = attr.value
            if (mode === 'ali') {
              value = value.replace(/["']/g, '\'')
            }
            if (value != null && value !== '') {
              result += '=' + stringify(value)
            }
          })
          if (node.unary) {
            result += '/>'
          } else {
            result += '>'
            node.children.forEach(function (child) {
              result += walk(child)
            })
            result += '</' + node.tag + '>'
          }
        } else {
          node.children.forEach(function (child) {
            result += walk(child)
          })
        }
      }
    }
    return result
  }

  return walk(root)
}

function findPrevNode (node) {
  let parent = node.parent
  if (parent) {
    let index = parent.children.indexOf(node)
    while (index--) {
      let preNode = parent.children[index]
      if (preNode.type === 1) {
        return preNode
      }
    }
  }
}

function replaceNode (node, newNode) {
  let parent = node.parent
  if (parent) {
    let index = parent.children.indexOf(node)
    if (index !== -1) {
      parent.children.splice(index, 1, newNode)
      newNode.parent = parent
      return newNode
    }
  }
}

function removeNode (node) {
  let parent = node.parent
  if (parent) {
    let index = parent.children.indexOf(node)
    if (index !== -1) {
      parent.children.splice(index, 1)
      return true
    }
  }
}

function genIf (node) {
  node.ifProcessed = true
  return `if(${node.if.exp}){\n${genNode(node)}}\n`
}

function genElseif (node) {
  node.elseifProcessed = true
  let preNode = findPrevNode(node)
  if (preNode && (preNode.if || preNode.elseif)) {
    return `else if(${node.elseif.exp}){\n${genNode(node)}}\n`
  } else {
    warn$1(`wx:elif (wx:elif="${node.elseif.raw}") used on element <"${node.tag}"> without corresponding wx:if or wx:elif.`)
  }
}

function genElse (node) {
  node.elseProcessed = true
  let preNode = findPrevNode(node)
  if (preNode && (preNode.if || preNode.elseif)) {
    return `else{\n${genNode(node)}}\n`
  } else {
    warn$1(`wx:else used on element <"${node.tag}"> without corresponding wx:if or wx:elif.`)
  }
}

function genExps (node) {
  return `${node.exps.map(({ exp, needTravel }) => {
    return needTravel ? `this.__travel(${exp}, __seen);\n` : `${exp};\n`
  }).join('')}`
}

function genFor (node) {
  node.forProcessed = true
  let index = node.for.index || 'index'
  let item = node.for.item || 'item'
  return `this.__iterate(${node.for.exp}, function(${item},${index}){\n${genNode(node)}}.bind(this));\n`
}

function genNode (node) {
  let exp = ''
  if (node) {
    if (node.type === 3) {
      if (node.exps && !node.isComment) {
        exp += genExps(node)
      }
    }
    if (node.type === 1) {
      if (node.tag !== 'temp-node') {
        if (node.for && !node.forProcessed) {
          exp += genFor(node)
        } else if (node.if && !node.ifProcessed) {
          exp += genIf(node)
        } else if (node.elseif && !node.elseifProcessed) {
          exp += genElseif(node)
        } else if (node.else && !node.elseProcessed) {
          exp += genElse(node)
        } else {
          if (node.exps) {
            exp += genExps(node)
          }
          if (!node.unary) {
            node.children.forEach(function (child) {
              exp += genNode(child)
            })
          }
        }
      } else {
        node.children.forEach(function (child) {
          exp += genNode(child)
        })
      }
    }
  }
  return exp
}

module.exports = {
  parseComponent,
  parse,
  serialize,
  genNode,
  makeAttrsMap,
  parseMustache
}
