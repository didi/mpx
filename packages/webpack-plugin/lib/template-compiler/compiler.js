const deindent = require('de-indent')
const he = require('he')
const config = require('../config')
const normalize = require('../utils/normalize')
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')
const isEmptyObject = require('../utils/is-empty-object')
const getRulesRunner = require('../platform/index')

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap (str, expectsLowerCase) {
  var map = Object.create(null)
  var list = str.split(',')
  for (var i = 0; i < list.length; i++) {
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

var no = function (a, b, c) {
  return false
}

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
var isNonPhrasingTag = makeMap(
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
var attribute = /^\s*([^\s"'<>/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
var ncname = '[a-zA-Z_][\\w\\-\\.]*'
var qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')'
var startTagOpen = new RegExp(('^<' + qnameCapture))
var startTagClose = /^\s*(\/?)>/
var endTag = new RegExp(('^<\\/' + qnameCapture + '[^>]*>'))
var doctype = /^<!DOCTYPE [^>]+>/i
var comment = /^<!--/
var conditionalComment = /^<!\[/

var IS_REGEX_CAPTURING_BROKEN = false
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === ''
})

// Special Elements (can contain anything)
var isPlainTextElement = makeMap('script,style,textarea', true)
var reCache = {}

var decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t'
}
var encodedAttr = /&(?:lt|gt|quot|amp);/g
var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g

// #5992
var isIgnoreNewlineTag = makeMap('pre,textarea', true)
var shouldIgnoreFirstNewline = function (tag, html) {
  return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'
}

function decodeAttr (value, shouldDecodeNewlines) {
  var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  return value.replace(re, function (match) {
    return decodingMap[match]
  })
}

var splitRE = /\r?\n/g
var replaceRE = /./g
var isSpecialTag = makeMap('script,style,template', true)

var ieNSBug = /^xmlns:NS\d+/
var ieNSPrefix = /^NS\d+:/

/* istanbul ignore next */
function guardIESVGBug (attrs) {
  var res = []
  for (var i = 0; i < attrs.length; i++) {
    var attr = attrs[i]
    if (!ieNSBug.test(attr.name)) {
      attr.name = attr.name.replace(ieNSPrefix, '')
      res.push(attr)
    }
  }
  return res
}

function makeAttrsMap (attrs) {
  var map = {}
  for (var i = 0, l = attrs.length; i < l; i++) {
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
  var cache = Object.create(null)
  return function cachedFn (str) {
    var hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}

var decodeHTMLCached = cached(he.decode)

// Browser environment sniffing
var inBrowser = typeof window !== 'undefined'
var UA = inBrowser && window.navigator.userAgent.toLowerCase()
var isIE = UA && /msie|trident/.test(UA)
var isEdge = UA && UA.indexOf('edge/') > 0

// configurable state
var warn$1
var error$1
var mode
var srcMode
var rulesRunner
var platformGetTagNamespace

function baseWarn (msg) {
  console.warn(('[template compiler]: ' + msg))
}

function baseError (msg) {
  console.error(('[template compiler]: ' + msg))
}

function parseHTML (html, options) {
  var stack = []
  var expectHTML = options.expectHTML
  var isUnaryTag$$1 = options.isUnaryTag || no
  var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no
  var index = 0
  var last, lastTag
  while (html) {
    last = html
    // Make sure we're not in a plaintext content element like script/style
    if (!lastTag || !isPlainTextElement(lastTag)) {
      var textEnd = html.indexOf('<')
      if (textEnd === 0) {
        // Comment:
        if (comment.test(html)) {
          var commentEnd = html.indexOf('-->')

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
          var conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        var doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag:
        var endTagMatch = html.match(endTag)
        if (endTagMatch) {
          var curIndex = index
          advance(endTagMatch[0].length)
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // Start tag:
        var startTagMatch = parseStartTag()
        if (startTagMatch) {
          handleStartTag(startTagMatch)
          if (shouldIgnoreFirstNewline(lastTag, html)) {
            advance(1)
          }
          continue
        }
      }

      var text = (void 0)
      var rest = (void 0)
      var next = (void 0)
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
      var endTagLength = 0
      var stackedTag = lastTag.toLowerCase()
      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
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
    var start = html.match(startTagOpen)
    if (start) {
      var match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)
      var end, attr
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
    var tagName = match.tagName
    var unarySlash = match.unarySlash

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    var unary = isUnaryTag$$1(tagName) || !!unarySlash

    var l = match.attrs.length
    var attrs = new Array(l)
    for (var i = 0; i < l; i++) {
      var args = match.attrs[i]
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
      var value = args[3] || args[4] || args[5] || ''
      var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
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
    var pos, lowerCasedTagName
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
      for (var i = stack.length - 1; i >= pos; i--) {
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

  var sfc = {
    template: null,
    script: null,
    json: null,
    styles: [],
    customBlocks: []
  }
  var depth = 0
  var currentBlock = null

  function start (tag, attrs, unary, start, end) {
    if (depth === 0) {
      currentBlock = {
        type: tag,
        content: '',
        start: end,
        attrs: attrs.reduce(function (cumulated, ref) {
          var name = ref.name
          var value = ref.value

          cumulated[name] = value || true
          return cumulated
        }, {})
      }
      if (isSpecialTag(tag)) {
        checkAttrs(currentBlock, attrs)
        // 优先取带有正确mode的fields
        if (tag === 'style') {
          if (sfc.styles[0]) {
            if (currentBlock.mode && currentBlock.mode === mode) {
              if (sfc.styles[0].mode !== mode) {
                sfc.styles = []
              }
              sfc.styles.push(currentBlock)
            } else {
              if (!sfc.styles[0].mode) {
                sfc.styles.push(currentBlock)
              }
            }
          } else {
            sfc.styles.push(currentBlock)
          }
        } else {
          if (tag === 'script' && currentBlock.type === 'application/json') {
            tag = 'json'
          }
          if (sfc[tag]) {
            if (currentBlock.mode && currentBlock.mode === mode) {
              sfc[tag] = currentBlock
            } else {
              if (!sfc[tag].mode) {
                sfc[tag] = currentBlock
              }
            }
          } else {
            sfc[tag] = currentBlock
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
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i]
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
      var text = deindent(content.slice(currentBlock.start, currentBlock.end))
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
      var offset = content.slice(0, block.start).split(splitRE).length
      var padChar = block.type === 'script' && !block.lang
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
  srcMode = options.srcMode || 'wx'

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
  let currentParent
  let multiRootError

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

      // gen root
      if (!root) {
        root = element
      } else {
        // mount element
        if (currentParent) {
          currentParent.children.push(element)
          element.parent = currentParent
        } else {
          multiRootError = true
          return
        }
      }
      processElement(element, options, meta, root)
      if (!unary) {
        currentParent = element
        stack.push(element)
      } else {
        element.unary = true
        root = closeElement(element, root)
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
        root = closeElement(element, root)
      }
    },

    chars: function chars (text) {
      if (!currentParent) {
        multiRootError = true
        return
      }
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
      if (!currentParent) {
        multiRootError = true
        return
      }
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

// function modifyAttr (el, name, val) {
//   el.attrsMap[name] = val
//   let list = el.attrsList
//   for (let i = 0, l = list.length; i < l; i++) {
//     if (list[i].name === name) {
//       list[i].value = val
//       break
//     }
//   }
// }

function stringify (str) {
  return config[mode].stringify(str)
}

let tagRE = /\{\{((?:.|\n)+?)\}\}(?!})/
let tagREG = /\{\{((?:.|\n)+?)\}\}(?!})/g

function processLifecycleHack (el, options) {
  if (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') {
    if (el.if) {
      el.if = {
        raw: `{{${el.if.exp} && mpxLifecycleHack}}`,
        exp: `${el.if.exp} && mpxLifecycleHack`
      }
    } else if (el.elseif) {
      el.elseif = {
        raw: `{{${el.elseif.exp} && mpxLifecycleHack}}`,
        exp: `${el.elseif.exp} && mpxLifecycleHack`
      }
    } else if (el.else) {
      el.elseif = {
        raw: '{{mpxLifecycleHack}}',
        exp: 'mpxLifecycleHack'
      }
      delete el.else
    } else {
      el.if = {
        raw: '{{mpxLifecycleHack}}',
        exp: 'mpxLifecycleHack'
      }
    }
  }
}

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

function processComponentDepth (el, options) {
  if (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') {
    addAttrs(el, [{
      name: 'mpxDepth',
      value: '{{mpxDepth + 1}}'
    }])
  }
}

function parseFuncStr2 (str) {
  let funcRE = /^([^()]+)(\((.*)\))?/
  let match = funcRE.exec(str)
  if (match) {
    let funcName = stringify(match[1])
    let args = match[3] ? `,${match[3]}` : ''
    args = args.replace(/(\$event([^,\s])*)/, (match, p1) => stringify(p1))
    return {
      args,
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
        args: `,${stringify(modelValue)},${stringify('$event')}`,
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
      needBind = !!configs[0].args
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

function parseMustache (raw) {
  raw = (raw || '').trim()
  if (tagRE.test(raw)) {
    let ret = []
    let lastLastIndex = 0
    let match
    while (match = tagREG.exec(raw)) {
      let pre = raw.substring(lastLastIndex, match.index)
      if (pre) ret.push(stringify(pre))
      ret.push(`(${match[1].trim()})`)
      lastLastIndex = tagREG.lastIndex
    }
    let post = raw.substring(lastLastIndex)
    if (post) ret.push(stringify(post))
    return {
      result: ret.join('+'),
      hasBinding: true
    }
  }
  return {
    result: stringify(raw),
    hasBinding: false
  }
}

function addExp (el, exp) {
  if (exp) {
    if (!el.exps) {
      el.exps = []
    }
    el.exps.push(exp)
  }
}

function processIf (el) {
  let val = getAndRemoveAttr(el, config[mode].directive.if)
  if (val) {
    el.if = {
      raw: val,
      exp: parseMustache(val).result
    }
  } else if (val = getAndRemoveAttr(el, config[mode].directive.elseif)) {
    el.elseif = {
      raw: val,
      exp: parseMustache(val).result
    }
  } else if (getAndRemoveAttr(el, config[mode].directive.else) != null) {
    el.else = true
  }
}

function processFor (el) {
  let val = getAndRemoveAttr(el, config[mode].directive.for)
  if (val) {
    el.for = {
      raw: val,
      exp: parseMustache(val).result
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
  if (val) {
    if (!meta.refs) {
      meta.refs = []
      meta.refId = 0
    }
    let type = options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component' ? 'component' : 'node'
    let all = !!el.for
    let refClassName = `__ref_${val}_${++meta.refId}`
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

    if (type === 'component' && mode === 'ali') {
      addAttrs(el, [
        {
          name: 'onUpdateRef',
          value: `__handleUpdateRef({key:${stringify(val)}, all:${stringify(all)}}, $event)`
        }
      ])
    }
  }
}

function addWxsModule (meta, module) {
  if (!meta.wxsModuleMap) {
    meta.wxsModuleMap = {}
  }
  if (meta.wxsModuleMap[module]) return true
  meta.wxsModuleMap[module] = true
}

function processAttrs (el, meta) {
  el.attrsList.forEach((attr) => {
    if (el.tag === config[mode].wxs.tag && attr.name === config[mode].wxs.module) {
      return addWxsModule(meta, attr.value)
    }
    let parsed = parseMustache(attr.value)
    if (parsed.hasBinding) {
      addExp(el, parsed.result)
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

function postProcessIf (el) {
  let attrs
  if (el.if) {
    attrs = [{
      name: config[mode].directive.if,
      value: el.if.raw
    }]
  } else if (el.elseif) {
    attrs = [{
      name: config[mode].directive.elseif,
      value: el.elseif.raw
    }]
  } else if (el.else) {
    attrs = [{
      name: config[mode].directive.else,
      value: ''
    }]
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

function injectWxs (meta, module, src, root) {
  if (addWxsModule(meta, module)) {
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
  root.children.unshift(wxsNode)
}

const injectHelperWxsPath = normalize.lib('runtime/injectHelper.wxs')

function processClass (el, meta, root) {
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
    injectWxs(meta, '__injectHelper', injectHelperWxsPath, root)
  } else if (staticClass) {
    addAttrs(el, [{
      name: targetType,
      value: staticClass
    }])
  }
}

function processStyle (el, meta, root) {
  const type = 'style'
  const targetType = el.tag.startsWith('th-') ? 'ex-' + type : type
  let dynamicStyle = getAndRemoveAttr(el, config[mode].directive.dynamicStyle)
  let staticStyle = getAndRemoveAttr(el, type)
  if (dynamicStyle || el.show) {
    let showExp = el.show ? parseMustache(el.show).result : 'true'
    let staticStyleExp = parseMustache(staticStyle).result
    let dynamicStyleExp = parseMustache(dynamicStyle).result
    addAttrs(el, [{
      name: targetType,
      value: `{{__injectHelper.transformStyle(${staticStyleExp}, ${dynamicStyleExp}, ${showExp})}}`
    }])
    injectWxs(meta, '__injectHelper', injectHelperWxsPath, root)
  } else if (staticStyle) {
    addAttrs(el, [{
      name: targetType,
      value: staticStyle
    }])
  }
}

function processShow (el, options, root) {
  if (options.isComponent && el === root) {
    addAttrs(el, [{
      name: config[mode].directive.show,
      value: '{{mpxShow}}'
    }])
  }
  let show = getAndRemoveAttr(el, config[mode].directive.show)
  if (show) {
    if (options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component') {
      addAttrs(el, [{
        name: 'mpxShow',
        value: show
      }])
    } else {
      el.show = show
    }
  }
}

function processElement (el, options, meta, root) {
  if (rulesRunner) {
    rulesRunner(el)
  }
  processIf(el)
  processFor(el)
  processShow(el, options, root)
  processClass(el, meta, root)
  processStyle(el, meta, root)
  processRef(el, options, meta)
  processBindEvent(el)
  processComponentDepth(el, options)
  if (mode === 'ali') {
    processLifecycleHack(el, options)
  } else {
    processPageStatus(el, options)
  }
  processComponentIs(el, options)
  processAttrs(el, meta)
}

function closeElement (el, root) {
  el = postProcessComponentIs(el)
  postProcessFor(el)
  postProcessIf(el)
  return root
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
      tempNode.parent = el.parent
      el.parent.children.pop()
      el.parent.children.push(tempNode)
    }
    el = tempNode
  }
  return el
}

function serialize (root) {
  function walk (node) {
    let result = ''
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

function genIf (node) {
  node.ifProcessed = true
  return `if(this.__checkIgnore(${node.if.exp})){\n${genNode(node)}}\n`
}

function genElseif (node) {
  node.elseifProcessed = true
  let preNode = findPrevNode(node)
  if (preNode && (preNode.if || preNode.elseif)) {
    return `else if(this.__checkIgnore(${node.elseif.exp})){\n${genNode(node)}}\n`
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
  return `${node.exps.map((exp) => {
    return `this.__travel(${exp}, __seen);\n`
  }).join('')}`
}

function genFor (node) {
  node.forProcessed = true
  let index = node.for.index || 'index'
  let item = node.for.item || 'item'
  return `this.__iterate(this.__checkIgnore(${node.for.exp}), function(${item},${index}){\n${genNode(node)}}.bind(this));\n`
}

function genNode (node) {
  let exp = ''
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
  return exp
}

module.exports = {
  parseComponent,
  parse,
  serialize,
  genNode,
  makeAttrsMap
}
