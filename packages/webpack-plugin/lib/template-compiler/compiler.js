const JSON5 = require('json5')
const he = require('he')
const config = require('../config')
const normalize = require('../utils/normalize')
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')
const isEmptyObject = require('../utils/is-empty-object')
const mpxJSON = require('../utils/mpx-json')
const getRulesRunner = require('../platform/index')
const addQuery = require('../utils/add-query')
const transDynamicClassExpr = require('./trans-dynamic-class-expr')
const hash = require('hash-sum')
const dash2hump = require('../utils/hump-dash').dash2hump
const { inBrowser } = require('../utils/env')

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

const no = function () {
  return false
}

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
const isNonPhrasingTag = makeMap(
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
const attribute = /^\s*([^\s"'<>/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')'
const startTagOpen = new RegExp(('^<' + qnameCapture))
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(('^<\\/' + qnameCapture + '[^>]*>'))
const doctype = /^<!DOCTYPE [^>]+>/i
const comment = /^<!--/
const conditionalComment = /^<!\[/

let IS_REGEX_CAPTURING_BROKEN = false
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === ''
})

// Special Elements (can contain anything)
const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}

// #5992
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = function (tag, html) {
  return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'
}

const splitRE = /\r?\n/g
const replaceRE = /./g
const isSpecialTag = makeMap('script,style,template,json', true)

const ieNSBug = /^xmlns:NS\d+/
const ieNSPrefix = /^NS\d+:/

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

function isForbiddenTag (el) {
  return (
    el.tag === 'style' ||
    (el.tag === 'script' && (
      !el.attrsMap.type ||
      el.attrsMap.type === 'text/javascript'
    ))
  )
}

// mpx special comments
// example
/*
{
  'tt,swan': {
    remove: [
      'open-type',
      // src mode attr
      'wx:if'
    ],
    add: {
      type: 'primary',
      // attr name only
      foo: null,
    }
  }
}
*/
let curMpxComment = null

function evalMpxCommentExp (exp) {
  /* eslint-disable no-new-func */
  const f = new Function(`return ${exp};`)
  return f()
}

function isMpxCommentAttrs (content) {
  return /@mpx-attrs/.test(content)
}

function normalizePlatformMpxAttrsOpts (opts) {
  const ret = {}
  // Array to map for removing attributes
  ret.remove = (opts.remove || []).reduce((acc, val) => {
    acc[val] = true
    return acc
  }, {})
  // Default adding map
  ret.add = opts.add || {}
  return ret
}

function produceMpxCommentAttrs (content) {
  const exp = /@mpx-attrs[^(]*?\(([\s\S]*)\)/.exec(content)[1].trim()
  const tmpOpts = evalMpxCommentExp(exp)
  // normalize
  Object.keys(tmpOpts).forEach(k => {
    Object.assign(tmpOpts[k], normalizePlatformMpxAttrsOpts(tmpOpts[k]))

    if (k.indexOf(',') > -1) {
      const modes = k.split(',')
      modes.forEach(mode => {
        tmpOpts[mode] = tmpOpts[k]
      })
      delete tmpOpts[k]
    }
  })
  curMpxComment = tmpOpts
}

function modifyAttrsFromCurMpxAttrOptions (attrs, curModeMpxComment) {
  const removeMap = curModeMpxComment.remove
  const addMap = curModeMpxComment.add

  const newAttrs = []
  attrs.forEach(attr => {
    if (!removeMap[attr.name]) {
      newAttrs.push(attr)
    }
  })

  Object.keys(addMap).forEach(name => {
    newAttrs.push({
      name,
      value: addMap[name]
    })
  })

  return newAttrs
}

function consumeMpxCommentAttrs (attrs, mode) {
  let ret = attrs
  if (curMpxComment) {
    const curModeMpxComment = curMpxComment[mode]
    if (curModeMpxComment) {
      ret = modifyAttrsFromCurMpxAttrOptions(attrs, curModeMpxComment)
    }

    // reset
    curMpxComment = null
  }
  return ret
}

function assertMpxCommentAttrsEnd () {
  if (curMpxComment) {
    error$1('No target for @mpx-attrs!')
  }
}

// Browser environment sniffing
const UA = inBrowser && window.navigator.userAgent.toLowerCase()
const isIE = UA && /msie|trident/.test(UA)
const isEdge = UA && UA.indexOf('edge/') > 0

// configurable state
// 由于template处理为纯同步过程，采用闭包变量存储各种状态方便全局访问
let warn$1
let error$1
let mode
let defs
let i18n
let srcMode
let processingTemplate
let isNative
let rulesRunner
let currentEl
let injectNodes = []
let forScopes = []
let forScopesMap = {}
let hasI18n = false

function updateForScopesMap () {
  forScopes.forEach((scope) => {
    forScopesMap[scope.index] = 'index'
    forScopesMap[scope.item] = 'item'
  })
  return forScopesMap
}

function pushForScopes (scope) {
  forScopes.push(scope)
  updateForScopesMap()
  return scope
}

function popForScopes () {
  let scope = forScopes.pop()
  updateForScopesMap()
  return scope
}

const rulesResultMap = new Map()
const deleteErrorInResultMap = (node) => {
  rulesResultMap.delete(node)
  Array.isArray(node.children) && node.children.forEach(item => deleteErrorInResultMap(item))
}
let platformGetTagNamespace
let basename
let refId

function baseWarn (msg) {
  console.warn(('[template compiler]: ' + msg))
}

function baseError (msg) {
  console.error(('[template compiler]: ' + msg))
}

const decodeMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#39;': '\''
}
const encodedRe = /&(?:lt|gt|quot|amp|#39);/g

function decode (value) {
  if (value != null) {
    return value.replace(encodedRe, function (match) {
      return decodeMap[match]
    })
  }
}

const i18nFuncNames = ['\\$(t)', '\\$(tc)', '\\$(te)', '\\$(d)', '\\$(n)']
const i18nWxsPath = normalize.lib('runtime/i18n.wxs')
const i18nWxsLoaderPath = normalize.lib('wxs/wxs-i18n-loader.js')
// 添加~前缀避免wxs绝对路径在存在projectRoot时被拼接为错误路径
const i18nWxsRequest = '~' + i18nWxsLoaderPath + '!' + i18nWxsPath
const i18nModuleName = '__i18n__'
const stringifyWxsPath = '~' + normalize.lib('runtime/stringify.wxs')
const stringifyModuleName = '__stringify__'

const tagRES = /(\{\{(?:.|\n)+?\}\})(?!})/
const tagRE = /\{\{((?:.|\n)+?)\}\}(?!})/
const tagREG = /\{\{((?:.|\n)+?)\}\}(?!})/g

function decodeInMustache (value) {
  const sArr = value.split(tagRES)
  const ret = sArr.map((s) => {
    if (tagRES.test(s)) {
      return decode(s)
    }
    return s
  })
  return ret.join('')
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
      let value
      for (const index of [3, 4, 5]) {
        if (args[index] != null) {
          value = args[index]
          break
        }
      }
      attrs[i] = {
        name: args[1],
        value: decode(value)
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
  defs = options.defs || {}

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
        tag,
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
          if (tag === 'script') {
            // 支持type写为application\/json5
            if (/^application\/json/.test(currentBlock.type) || currentBlock.name === 'json') {
              tag = 'json'
            }
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
      if (attr.name === 'name') {
        block.name = attr.value
      }
    }
  }

  function end (tag, start, end) {
    if (depth === 1 && currentBlock) {
      currentBlock.end = start
      let text = content.slice(currentBlock.start, currentBlock.end)
      // pad content so that linters and pre-processors can output correct
      // line numbers in errors and warnings
      if (currentBlock.tag !== 'template' && options.pad) {
        text = padContent(currentBlock, options.pad) + text
      }

      // 对于<script name="json">的标签，传参调用函数，其返回结果作为json的内容
      if (currentBlock.tag === 'script' && !/^application\/json/.test(currentBlock.type) && currentBlock.name === 'json') {
        text = mpxJSON.compileMPXJSONText({ source: text, defs, filePath: options.filePath })
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
      let padChar = '\n'
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
  rulesResultMap.clear()
  warn$1 = options.warn || baseWarn
  error$1 = options.error || baseError

  const _warn = content => {
    const currentElementRuleResult = rulesResultMap.get(currentEl) || rulesResultMap.set(currentEl, {
      warnArray: [],
      errorArray: []
    }).get(currentEl)
    currentElementRuleResult.warnArray.push(content)
  }
  const _error = content => {
    const currentElementRuleResult = rulesResultMap.get(currentEl) || rulesResultMap.set(currentEl, {
      warnArray: [],
      errorArray: []
    }).get(currentEl)
    currentElementRuleResult.errorArray.push(content)
  }

  mode = options.mode || 'wx'
  defs = options.defs || {}
  srcMode = options.srcMode || mode
  isNative = options.isNative
  basename = options.basename
  i18n = options.i18n
  refId = 0

  rulesRunner = getRulesRunner({
    mode,
    srcMode,
    type: 'template',
    testKey: 'tag',
    warn: _warn,
    error: _error
  })

  injectNodes = []
  forScopes = []
  forScopesMap = {}
  hasI18n = false

  platformGetTagNamespace = options.getTagNamespace || no

  let stack = []
  let preserveWhitespace = options.preserveWhitespace !== false
  let root
  let meta = {}
  let currentParent
  let multiRootError
  // 用于记录模板用到的组件，匹配引用组件，看是否有冗余
  let tagNames = new Set()

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
    shouldKeepComment: true,
    start: function start (tag, attrs, unary) {
      // check namespace.
      // inherit parent ns if there is one
      let ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag)

      // handle IE svg bug
      /* istanbul ignore if */
      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs)
      }

      if (options.globalMpxAttrsFilter) {
        attrs = modifyAttrsFromCurMpxAttrOptions(attrs, normalizePlatformMpxAttrsOpts(options.globalMpxAttrsFilter({
          tagName: tag,
          attrs,
          __mpx_mode__: mode,
          filePath: options.filePath
        }) || {}))
      }
      attrs = consumeMpxCommentAttrs(attrs, mode)

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

      processElement(element, root, options, meta)
      tagNames.add(element.tag)

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
      if (currentParent.tag !== 'text') {
        text = text.trim()
          ? text.trim()
          // only preserve whitespace if its not right after a starting tag
          : preserveWhitespace && children.length ? ' ' : ''
      }

      if ((!config[mode].wxs || currentParent.tag !== config[mode].wxs.tag) && options.decodeHTMLText) {
        text = he.decode(text)
      }

      if (text) {
        if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          let el = {
            type: 3,
            // 支付宝小程序模板解析中未对Mustache进行特殊处理，无论是否decode都会解析失败，无解，只能支付宝侧进行修复
            text: decodeInMustache(text),
            parent: currentParent
          }
          children.push(el)
          processText(el)
        }
      }
    },
    comment: function comment (text) {
      if (!currentParent) genTempRoot()
      // special comments should not be output
      if (isMpxCommentAttrs(text)) {
        produceMpxCommentAttrs(text)
      } else if (options.hasComment) {
        currentParent.children.push({
          type: 3,
          text: text,
          parent: currentParent,
          isComment: true
        })
      }
    }
  })

  assertMpxCommentAttrsEnd()

  if (multiRootError) {
    error$1('Template fields should has one single root, considering wrapping your template content with <view> or <text> tag!')
  }

  if (hasI18n) {
    injectWxs(meta, i18nModuleName, i18nWxsRequest)
  }

  injectNodes.forEach((node) => {
    addChild(root, node, true)
  })

  rulesResultMap.forEach((val) => {
    Array.isArray(val.warnArray) && val.warnArray.forEach(item => warn$1(item))
    Array.isArray(val.errorArray) && val.errorArray.forEach(item => error$1(item))
  })

  if (!tagNames.has('component')) {
    options.usingComponents.forEach((item) => {
      if (!tagNames.has(item) && !options.globalComponents.includes(item) && options.checkUsingComponents) warn$1(`${item}注册了，但是未被对应的模板引用，建议删除！`)
    })
  }

  return {
    root,
    meta
  }
}

function getTempNode () {
  return createASTElement('temp-node', [])
}

function addChild (parent, newChild, before) {
  parent.children = parent.children || []
  if (before) {
    parent.children.unshift(newChild)
  } else {
    parent.children.push(newChild)
  }
  newChild.parent = parent
}

function getAndRemoveAttr (el, name, removeFromMap = true) {
  let val, has
  let list = el.attrsList
  for (let i = 0, l = list.length; i < l; i++) {
    if (list[i].name === name) {
      val = list[i].value
      has = true
      list.splice(i, 1)
      break
    }
  }
  if (removeFromMap && val === el.attrsMap[name]) {
    delete el.attrsMap[name]
  }
  return {
    has,
    val
  }
}

function addAttrs (el, attrs) {
  const list = el.attrsList
  const map = el.attrsMap
  for (let i = 0, l = attrs.length; i < l; i++) {
    list.push(attrs[i])

    if (map[attrs[i].name] && !isIE && !isEdge) {
      warn$1('duplicate attribute: ' + attrs[i].name)
    }
    map[attrs[i].name] = attrs[i].value
  }
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

// function processLifecycleHack (el, options) {
//   if (isComponentNode(el,options)) {
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
  if (isComponentNode(el, options)) {
    addAttrs(el, [{
      name: 'mpxPageStatus',
      value: '{{mpxPageStatus}}'
    }])
  }
}

const genericRE = /^generic:(.+)$/

function processComponentGenericsForWeb (el, options, meta) {
  if (options.componentGenerics && options.componentGenerics[el.tag]) {
    const generic = dash2hump(el.tag)
    el.tag = 'component'
    addAttrs(el, [{
      name: ':is',
      value: `generic${generic}`
    }])
  }

  let hasGeneric = false

  const genericHash = hash(options.filePath)

  el.attrsList.forEach((attr) => {
    if (genericRE.test(attr.name)) {
      getAndRemoveAttr(el, attr.name)
      addAttrs(el, [{
        name: attr.name.replace(':', ''),
        value: attr.value
      }])
      hasGeneric = true
      addGenericInfo(meta, genericHash, attr.value)
    }
  })

  if (hasGeneric) {
    addAttrs(el, [{
      name: 'generichash',
      value: genericHash
    }])
  }
}

function addGenericInfo (meta, genericHash, genericValue) {
  if (!meta.genericsInfo) {
    meta.genericsInfo = {
      hash: genericHash,
      map: {}
    }
  }
  meta.genericsInfo.map[genericValue] = true
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

  let is = getAndRemoveAttr(el, 'is').val
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
  } else {
    warn$1('<component> tag should have attrs[is].')
  }
}

// function processComponentDepth (el, options) {
//   if (isComponentNode(el,options)) {
//     addAttrs(el, [{
//       name: 'mpxDepth',
//       value: '{{mpxDepth + 1}}'
//     }])
//   }
// }

const eventIdentifier = '__mpx_event__'

function parseFuncStr2 (str) {
  let funcRE = /^([^()]+)(\((.*)\))?/
  let match = funcRE.exec(str)
  if (match) {
    const funcName = parseMustache(match[1]).result
    const hasArgs = !!match[2]
    let args = match[3] ? `,${match[3]}` : ''
    const ret = /(,|^)\s*(\$event)\s*(,|$)/.exec(args)
    if (ret) {
      const subIndex = ret[0].indexOf('$event')
      if (subIndex) {
        const index1 = ret.index + subIndex
        const index2 = index1 + 6
        args = args.substring(0, index1) + JSON.stringify(eventIdentifier) + args.substring(index2)
      }
    }
    return {
      hasArgs,
      expStr: `[${funcName + args}]`
    }
  }
}

function stringifyWithResolveComputed (modelValue) {
  let result = []
  let inString = false
  let computedStack = []
  let fragment = ''

  for (let i = 0; i < modelValue.length; i++) {
    const char = modelValue[i]
    if (inString) {
      if (char === inString) {
        inString = false
      }
    } else if (char === '"' || char === '\'') {
      inString = char
    } else if (char === '[') {
      computedStack.push(char)
      if (computedStack.length === 1) {
        fragment += '.'
        result.push(JSON.stringify(fragment))
        fragment = ''
        continue
      }
    } else if (computedStack.length) {
      if (char === ']') {
        computedStack.pop()
        if (computedStack.length === 0) {
          result.push(fragment)
          fragment = ''
          continue
        }
      }
    }
    fragment += char
  }
  if (fragment !== '') {
    result.push(JSON.stringify(fragment))
  }
  return result.join('+')
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

  let modelExp = getAndRemoveAttr(el, config[mode].directive.model).val
  if (modelExp) {
    let match = tagRE.exec(modelExp)
    if (match) {
      const modelProp = getAndRemoveAttr(el, config[mode].directive.modelProp).val || config[mode].event.defaultModelProp
      const modelEvent = getAndRemoveAttr(el, config[mode].directive.modelEvent).val || config[mode].event.defaultModelEvent
      const modelValuePathRaw = getAndRemoveAttr(el, config[mode].directive.modelValuePath).val
      const modelValuePath = modelValuePathRaw === undefined ? config[mode].event.defaultModelValuePath : modelValuePathRaw
      const modelFilter = getAndRemoveAttr(el, config[mode].directive.modelFilter).val
      let modelValuePathArr
      try {
        modelValuePathArr = JSON5.parse(modelValuePath)
      } catch (e) {
        if (modelValuePath === '') {
          modelValuePathArr = []
        } else {
          modelValuePathArr = modelValuePath.split('.')
        }
      }
      if (!isValidIdentifierStr(modelEvent)) {
        warn$1(`EventName ${modelEvent} which is used in ${config[mode].directive.model} must be a valid identifier!`)
        return
      }
      let modelValue = match[1].trim()
      let stringifiedModelValue = stringifyWithResolveComputed(modelValue)
      // if (forScopes.length) {
      //   stringifiedModelValue = stringifyWithResolveComputed(modelValue)
      // } else {
      //   stringifiedModelValue = stringify(modelValue)
      // }

      if (!eventConfigMap[modelEvent]) {
        eventConfigMap[modelEvent] = {
          configs: []
        }
      }
      eventConfigMap[modelEvent].configs.unshift({
        hasArgs: true,
        expStr: `[${stringify('__model')},${stringifiedModelValue},${stringify(eventIdentifier)},${stringify(modelValuePathArr)},${stringify(modelFilter)}]`
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
        let has
        do {
          has = getAndRemoveAttr(el, rawName).has
        } while (has)
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

// todo 暂时未考虑swan中不用{{}}包裹控制属性的情况
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

      // eval处理的话，和别的判断条件，比如运行时的判断混用情况下得不到一个结果，还是正则替换
      const defKeys = Object.keys(defs)
      defKeys.forEach((defKey) => {
        const defRE = new RegExp(`\\b${defKey}\\b`)
        const defREG = new RegExp(`\\b${defKey}\\b`, 'g')
        if (defRE.test(exp)) {
          exp = exp.replace(defREG, stringify(defs[defKey]))
          replaced = true
        }
      })

      if (i18n) {
        i18nFuncNames.forEach((i18nFuncName) => {
          const funcNameRE = new RegExp(`${i18nFuncName}\\(`)
          const funcNameREG = new RegExp(`${i18nFuncName}\\(`, 'g')
          if (funcNameRE.test(exp)) {
            exp = exp.replace(funcNameREG, `${i18nModuleName}.$1(mpxLocale, `)
            hasI18n = true
            replaced = true
          }
        })
      }

      ret.push(`(${exp.trim()})`)
      lastLastIndex = tagREG.lastIndex
    }
    let post = raw.substring(lastLastIndex)
    if (post) {
      ret.push(stringify(post))
    }
    let result
    if (ret.length === 1) {
      result = ret[0]
    } else {
      result = `(${ret.join('+')})`
    }
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

function addExp (el, exp, isProps) {
  if (exp) {
    if (!el.exps) {
      el.exps = []
    }
    el.exps.push({ exp, isProps })
  }
}

function processIf (el) {
  let val = getAndRemoveAttr(el, config[mode].directive.if).val
  if (val) {
    let parsed = parseMustache(val)
    el.if = {
      raw: parsed.val,
      exp: parsed.result
    }
  } else if (val = getAndRemoveAttr(el, config[mode].directive.elseif).val) {
    let parsed = parseMustache(val)
    el.elseif = {
      raw: parsed.val,
      exp: parsed.result
    }
  } else if (getAndRemoveAttr(el, config[mode].directive.else).has) {
    el.else = true
  }
}

function processIfForWeb (el) {
  let val = getAndRemoveAttr(el, config[mode].directive.if).val
  if (val) {
    el.if = {
      raw: val,
      exp: val
    }
  } else if (val = getAndRemoveAttr(el, config[mode].directive.elseif).val) {
    el.elseif = {
      raw: val,
      exp: val
    }
  } else if (getAndRemoveAttr(el, config[mode].directive.else).has) {
    el.else = true
  }
}

const swanForInRe = /^\s*(\w+)(?:\s*,\s*(\w+))?\s+in\s+(\S+)(?:\s+trackBy\s+(\S+))?\s*$/

function processFor (el) {
  let val = getAndRemoveAttr(el, config[mode].directive.for).val
  if (val) {
    let matched
    if (mode === 'swan' && (matched = swanForInRe.exec(val))) {
      el.for = {
        raw: val,
        exp: matched[3],
        item: matched[1] || 'item',
        index: matched[2] || 'index'
      }
    } else {
      let parsed = parseMustache(val)
      el.for = {
        raw: parsed.val,
        exp: parsed.result
      }
      if (val = getAndRemoveAttr(el, config[mode].directive.forIndex).val) {
        el.for.index = val
      }
      if (val = getAndRemoveAttr(el, config[mode].directive.forItem).val) {
        el.for.item = val
      }
      if (val = getAndRemoveAttr(el, config[mode].directive.key).val) {
        el.for.key = val
      }
    }
    pushForScopes({
      index: el.for.index || 'index',
      item: el.for.item || 'item'
    })
  }
}

function processRef (el, options, meta) {
  let val = getAndRemoveAttr(el, config[mode].directive.ref).val
  let type = isComponentNode(el, options) ? 'component' : 'node'
  if (val) {
    if (!meta.refs) {
      meta.refs = []
    }
    let all = !!forScopes.length
    // swan的page中进行selectComponent匹配时会将类名前面的__去除掉，refClassName用__开头会导致swan在page中的组件refs失效
    let refClassName = `ref_${val}_${++refId}`
    // 支付宝中对于node进行的my.createSelectorQuery是在全局范围内进行的，需添加运行时组件id确保selector唯一
    if (type === 'node' && mode === 'ali') {
      refClassName += '_{{mpxCid}}'
    }
    let className = getAndRemoveAttr(el, 'class').val
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
  if (!meta.wxsContentMap) {
    meta.wxsContentMap = {}
  }
  if (meta.wxsContentMap[module]) return true
  meta.wxsContentMap[module] = content
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
        src = addQuery('./' + basename, {
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
      // wxs hoist
      removeNode(el, true)
      injectNodes.push(el)
    }
  }
}

function processAttrs (el, options) {
  el.attrsList.forEach((attr) => {
    const isTemplateData = el.tag === 'template' && attr.name === 'data'
    const needWrap = isTemplateData && mode !== 'swan'
    let value = needWrap ? `{${attr.value}}` : attr.value
    let parsed = parseMustache(value)
    if (parsed.hasBinding) {
      // 该属性判断用于提供给运行时对于计算属性作为props传递时提出警告
      const isProps = isComponentNode(el, options) && !(attr.name === 'class' || attr.name === 'style')
      addExp(el, parsed.result, isProps)
    }
    if (parsed.replaced) {
      modifyAttr(el, attr.name, needWrap ? parsed.val.slice(1, -1) : parsed.val)
    }
  })
}

function postProcessFor (el) {
  if (el.for) {
    /*
      对百度小程序同时带有if和for的指令外套一层block，并将for放到外层
      这个操作主要是因为百度小程序不支持这两个directive在同级使用
     */
    if (el.if && mode === 'swan') {
      const block = createASTElement('block', [])
      replaceNode(el, block, true)
      block.for = el.for
      delete el.for
      addChild(block, el)
      el = block
    }

    let attrs = [
      {
        name: config[mode].directive.for,
        value: el.for.raw
      }
    ]
    // 对于swan的for in进行特殊处理
    if (mode !== 'swan' || !swanForInRe.test(el.for.raw)) {
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
    }
    addAttrs(el, attrs)
    popForScopes()
  }
}

function evalExp (exp) {
  // eslint-disable-next-line no-new-func
  let result = { success: false }
  try {
    const fn = new Function(`return ${exp};`)
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
        value: undefined
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

function injectWxs (meta, module, src) {
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

function processClass (el, meta) {
  const type = 'class'
  const needEx = el.tag.startsWith('th-')
  const targetType = needEx ? 'ex-' + type : type
  let dynamicClass = getAndRemoveAttr(el, config[mode].directive.dynamicClass).val
  let staticClass = getAndRemoveAttr(el, type).val
  if (dynamicClass) {
    let staticClassExp = parseMustache(staticClass).result
    let dynamicClassExp = transDynamicClassExpr(parseMustache(dynamicClass).result)
    addAttrs(el, [{
      name: targetType,
      // swan中externalClass是通过编译时静态实现，因此需要保留原有的staticClass形式避免externalClass失效
      value: mode === 'swan' && staticClass ? `${staticClass} {{${stringifyModuleName}.stringifyClass('', ${dynamicClassExp})}}` : `{{${stringifyModuleName}.stringifyClass(${staticClassExp}, ${dynamicClassExp})}}`
    }])
    injectWxs(meta, stringifyModuleName, stringifyWxsPath)
  } else if (staticClass) {
    addAttrs(el, [{
      name: targetType,
      value: staticClass
    }])
  }

  if (needEx && staticClass) {
    const refClassRegExp = /ref_(\w+)_(\d+)/
    const match = staticClass.match(refClassRegExp)
    if (match) {
      addAttrs(el, [{
        name: 'class',
        value: match[0]
      }])
    }
  }
}

function processStyle (el, meta) {
  const type = 'style'
  const targetType = el.tag.startsWith('th-') ? 'ex-' + type : type
  let dynamicStyle = getAndRemoveAttr(el, config[mode].directive.dynamicStyle).val
  let staticStyle = getAndRemoveAttr(el, type).val
  if (dynamicStyle) {
    let staticStyleExp = parseMustache(staticStyle).result
    let dynamicStyleExp = parseMustache(dynamicStyle).result
    addAttrs(el, [{
      name: targetType,
      value: `{{${stringifyModuleName}.stringifyStyle(${staticStyleExp}, ${dynamicStyleExp})}}`
    }])
    injectWxs(meta, stringifyModuleName, stringifyWxsPath)
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

function isComponentNode (el, options) {
  return options.usingComponents.indexOf(el.tag) !== -1 || el.tag === 'component'
}

function processAliExternalClassesHack (el, options) {
  let staticClass = getAndRemoveAttr(el, 'class').val
  if (staticClass) {
    options.externalClasses.forEach((className) => {
      const reg = new RegExp('\\b' + className + '\\b', 'g')
      const replacement = dash2hump(className)
      staticClass = staticClass.replace(reg, `{{${replacement}||''}}`)
    })
    addAttrs(el, [{
      name: 'class',
      value: staticClass
    }])
  }

  if (options.scopedId && isComponentNode(el, options)) {
    options.externalClasses.forEach((className) => {
      let externalClass = getAndRemoveAttr(el, className).val
      if (externalClass) {
        addAttrs(el, [{
          name: className,
          value: `${externalClass} ${options.scopedId}`
        }])
      }
    })
  }
}

function processWebExternalClassesHack (el, options) {
  let staticClass = getAndRemoveAttr(el, 'class').val
  let dynamicClass = getAndRemoveAttr(el, ':class').val
  if (staticClass || dynamicClass) {
    const externalClasses = []
    options.externalClasses.forEach((className) => {
      const reg = new RegExp('\\b' + className + '\\b')
      if (reg.test(staticClass) || reg.test(dynamicClass)) {
        externalClasses.push(className)
      }
    })
    const attrs = []
    if (staticClass) {
      attrs.push({
        name: 'class',
        value: staticClass
      })
    }
    if (dynamicClass) {
      attrs.push({
        name: ':class',
        value: dynamicClass
      })
    }
    if (externalClasses.length) {
      attrs.push({
        name: 'v-ex-classes',
        value: JSON.stringify(externalClasses)
      })
    }
    addAttrs(el, attrs)
  }
  // todo 处理scoped的情况
}

function processScoped (el, options) {
  const scopedId = options.scopedId
  if (scopedId && isRealNode(el)) {
    const staticClass = getAndRemoveAttr(el, 'class').val
    addAttrs(el, [{
      name: 'class',
      value: staticClass ? `${staticClass} ${scopedId}` : scopedId
    }])
  }
}

const builtInComponentsPrefix = '@mpxjs/webpack-plugin/lib/runtime/components'

function processBuiltInComponents (el, meta) {
  if (el.isBuiltIn) {
    if (!meta.builtInComponentsMap) {
      meta.builtInComponentsMap = {}
    }
    const tag = el.tag
    if (!meta.builtInComponentsMap[tag]) {
      meta.builtInComponentsMap[tag] = `${builtInComponentsPrefix}/${mode}/${tag}.vue`
    }
  }
}

function processAliStyleClassHack (el, options, root) {
  ['style', 'class'].forEach((type) => {
    let exp = getAndRemoveAttr(el, type).val
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
      if (isComponentNode(el, options)) {
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
  let show = getAndRemoveAttr(el, config[mode].directive.show).val
  if (options.isComponent && el.parent === root && isRealNode(el)) {
    if (show !== undefined) {
      show = `{{${parseMustache(show).result}&&mpxShow}}`
    } else {
      show = '{{mpxShow}}'
    }
  }
  if (show !== undefined) {
    if (isComponentNode(el, options)) {
      if (show === '') {
        show = '{{false}}'
      }
      addAttrs(el, [{
        name: 'mpxShow',
        value: show
      }])
    } else {
      const showExp = parseMustache(show).result
      let oldStyle = getAndRemoveAttr(el, 'style').val
      oldStyle = oldStyle ? oldStyle + ';' : ''
      addAttrs(el, [{
        name: 'style',
        value: `${oldStyle}{{${showExp}||${showExp}===undefined?'':'display:none;'}}`
      }])
    }
  }
}

function processTemplate (el) {
  if (el.tag === 'template' && el.attrsMap.name) {
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

const isValidMode = makeMap('wx,ali,swan,tt,qq,web')

const wrapRE = /^\((.*)\)$/

function processAtMode (el) {
  if (el.parent && el.parent._atModeStatus) {
    el._atModeStatus = el.parent._atModeStatus
  }

  const attrsListClone = cloneAttrsList(el.attrsList)
  attrsListClone.forEach(item => {
    const attrName = item.name || ''
    if (!attrName || attrName.indexOf('@') === -1) return
    const attrArr = attrName.split('@')
    let modeStr = attrArr.pop()
    if (wrapRE.test(modeStr)) modeStr = wrapRE.exec(modeStr)[1]
    const modeArr = modeStr.split('|')
    if (modeArr.every(i => isValidMode(i))) {
      const attrValue = getAndRemoveAttr(el, attrName).val
      const replacedAttrName = attrArr.join('@')

      const processedAttr = { name: replacedAttrName, value: attrValue }
      if (modeArr.includes(mode)) {
        if (!replacedAttrName) {
          el._atModeStatus = 'match'
        } else {
          // 如果命中了指定的mode，则先存在el上，等跑完转换后再挂回去
          el.noTransAttrs ? el.noTransAttrs.push(processedAttr) : el.noTransAttrs = [processedAttr]
        }
      } else if (!replacedAttrName) {
        el._atModeStatus = 'mismatch'
      } else {
        // 如果没命中指定的mode，则该属性删除
      }
    }
  })
}

// 去除重复的attrsList项，这些项可能由平台转换规则造成
function processDuplicateAttrsList (el) {
  const attrsMap = new Map()
  const attrsList = []
  el.attrsList.forEach((attr) => {
    if (!attrsMap.has(attr.name)) {
      attrsMap.set(attr.name, attr.value)
    } else if (attr.value === attrsMap.get(attr.name)) {
      return
    }
    attrsList.push(attr)
  })
  el.attrsList = attrsList
}

function processElement (el, root, options, meta) {
  processAtMode(el)
  // 如果已经标记了这个元素要被清除，直接return跳过后续处理步骤
  if (el._atModeStatus === 'mismatch') {
    return
  }

  if (rulesRunner && el._atModeStatus !== 'match') {
    currentEl = el
    rulesRunner(el)
  }

  // 转换完成，把不需要处理的attr挂回去
  if (el.noTransAttrs) {
    addAttrs(el, el.noTransAttrs)
    delete el.noTransAttrs
  }

  processDuplicateAttrsList(el)

  const transAli = mode === 'ali' && srcMode === 'wx'

  if (mode === 'web') {
    // 收集内建组件
    processBuiltInComponents(el, meta)
    // 预处理代码维度条件编译
    processIfForWeb(el)
    processWebExternalClassesHack(el, options)
    processComponentGenericsForWeb(el, options, meta)
    return
  }

  const pass = isNative || processTemplate(el) || processingTemplate

  processScoped(el, options)

  if (transAli) {
    processAliExternalClassesHack(el, options)
  }

  processIf(el)
  processFor(el)
  processRef(el, options, meta)

  if (!pass) {
    processClass(el, meta)
    processStyle(el, meta)
    processShow(el, options, root)
  }

  // 当mode为ali不管是不是跨平台都需要进行此处理，以保障ali当中的refs相关增强能力正常运行
  if (mode === 'ali') {
    processAliStyleClassHack(el, options, root)
  }

  if (!pass) {
    processBindEvent(el)
    if (mode !== 'ali') {
      processPageStatus(el, options)
    }
    processComponentIs(el, options)
  }

  processAttrs(el, options)
}

function closeElement (el, meta) {
  postProcessAtMode(el)
  if (mode === 'web') {
    // 处理代码维度条件编译移除死分支
    postProcessIf(el)
    return
  }
  const pass = isNative || postProcessTemplate(el) || processingTemplate
  postProcessWxs(el, meta)
  if (!pass) {
    el = postProcessComponentIs(el)
  }
  postProcessFor(el)
  postProcessIf(el)
}

function postProcessAtMode (el) {
  if (el._atModeStatus === 'mismatch') {
    removeNode(el, true)
  }
}

// 目前为了处理动态组件children中后续if无效的问题(#633)，仅进行节点对象本身的浅clone，没有对attrsList/attrsMap/exps/if/elseif/else/for等深层对象进行copy
function cloneNode (el) {
  const clone = Object.assign({}, el)
  if (el.parent) clone.parent = null
  if (el.children) {
    clone.children = []
    el.children.forEach((child) => {
      addChild(clone, cloneNode(child))
    })
  }
  return clone
}

function cloneAttrsList (attrsList) {
  return attrsList.map(({ name, value }) => {
    return {
      name,
      value
    }
  })
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
    el.components.forEach(function (component) {
      let newChild = createASTElement(component, cloneAttrsList(el.attrsList), tempNode)
      newChild.if = {
        raw: `{{${el.is} === ${stringify(component)}}}`,
        exp: `${el.is} === ${stringify(component)}`
      }
      el.children.forEach((child) => {
        addChild(newChild, cloneNode(child))
      })
      newChild.exps = el.exps
      addChild(tempNode, newChild)
      postProcessIf(newChild)
    })

    if (!el.parent) {
      error$1('Dynamic component can not be the template root, considering wrapping it with <view> or <text> tag!')
    } else {
      el = replaceNode(el, tempNode) || el
    }
  }
  return el
}

function stringifyAttr (val) {
  if (typeof val === 'string') {
    const hasSingle = val.indexOf('\'') > -1
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
            if (value != null) {
              result += '=' + stringifyAttr(value)
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

function replaceNode (node, newNode, reserveNode) {
  if (!reserveNode) deleteErrorInResultMap(node)
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

function removeNode (node, reserveNode) {
  if (!reserveNode) deleteErrorInResultMap(node)
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
  if (node.for) {
    error$1(`wx:elif (wx:elif="${node.elseif.raw}") invalidly used on the for-list <"${node.tag}"> which has a wx:for directive, please create a block element to wrap the for-list and move the if-directive to it`)
    return
  }
  let preNode = findPrevNode(node)
  if (preNode && (preNode.if || preNode.elseif)) {
    return `else if(${node.elseif.exp}){\n${genNode(node)}}\n`
  } else {
    error$1(`wx:elif (wx:elif="${node.elseif.raw}") invalidly used on the element <"${node.tag}"> without corresponding wx:if or wx:elif.`)
  }
}

function genElse (node) {
  node.elseProcessed = true
  if (node.for) {
    error$1(`wx:else invalidly used on the for-list <"${node.tag}"> which has a wx:for directive, please create a block element to wrap the for-list and move the if-directive to it`)
    return
  }
  let preNode = findPrevNode(node)
  if (preNode && (preNode.if || preNode.elseif)) {
    return `else{\n${genNode(node)}}\n`
  } else {
    error$1(`wx:else invalidly used on the element <"${node.tag}"> without corresponding wx:if or wx:elif.`)
  }
}

function genExps (node) {
  return `${node.exps.map(({ exp, isProps }) => {
    return isProps ? `this._p(${exp});\n` : `${exp};\n`
  }).join('')}`
}

function genFor (node) {
  node.forProcessed = true
  let index = node.for.index || 'index'
  let item = node.for.item || 'item'
  return `this._i(${node.for.exp}, function(${item},${index}){\n${genNode(node)}});\n`
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
  stringifyAttr,
  parseMustache,
  stringifyWithResolveComputed
}
