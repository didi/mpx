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
const dash2hump = require('../utils/hump-dash').dash2hump
const { inBrowser } = require('../utils/env')
const hash = require('hash-sum')
const {
  setTemplateNodes,
  genSlots,
  transformSlotsToString,
  getAliasTag,
  collectInjectedPath
} = require('../runtime-utils')

let hashIndex = 0
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
    // if (map[attrs[i].name] && !isIE && !isEdge) {
    //   warn$1('duplicate attribute: ' + attrs[i].name)
    // }
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
// const isEdge = UA && UA.indexOf('edge/') > 0

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
let i18nInjectableComputed = []
let env

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
  env = options.env

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
          if (currentBlock.mode && currentBlock.env) {
            if (currentBlock.mode === mode && currentBlock.env === env) {
              sfc.styles.push(currentBlock)
            }
          } else if (currentBlock.mode) {
            if (currentBlock.mode === mode) {
              sfc.styles.push(currentBlock)
            }
          } else if (currentBlock.env) {
            if (currentBlock.env === env) {
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
          if (currentBlock.mode && currentBlock.env) {
            if (currentBlock.mode === mode && currentBlock.env === env) {
              currentBlock.priority = 4
            }
          } else if (currentBlock.mode) {
            if (currentBlock.mode === mode) {
              currentBlock.priority = 3
            }
          } else if (currentBlock.env) {
            if (currentBlock.env === env) {
              currentBlock.priority = 2
            }
          } else {
            currentBlock.priority = 1
          }
          if (currentBlock.priority) {
            if (!sfc[tag] || sfc[tag].priority <= currentBlock.priority) {
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
      if (attr.name === 'env') {
        block.env = attr.value
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

function hasRuntimeCompileWrapper (el) {
  let parent = el.parent
  while (parent) {
    if (parent.isRuntimeComponent) {
      return true
    }
    parent = parent.parent
  }
  return false
}

function parse (template, options) {
  rulesResultMap.clear()
  warn$1 = options.warn || baseWarn
  error$1 = options.error || baseError
  i18nInjectableComputed = []

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
  env = options.env
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
      // 注入 mpx-render-base.wxml 里面的节点需要根据是否是自定义节点来决定使用的标签名
      element.isCustomComponent = options.usingComponents.includes(tag)
      element.isRuntimeComponent = isRuntimeComponentNode(element, options)
      if (options.componentsAbsolutePath && options.componentsAbsolutePath[tag]) {
        const path = options.componentsAbsolutePath[tag]
        const aliasTags = getAliasTag()
        if (!meta.aliasTags) {
          meta.aliasTags = {}
        }
        meta.aliasTags[tag] = aliasTags[path]['aliasTag']
        element.filePath = path
      }
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
        closeElement(element, options, meta, currentParent)
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
        closeElement(element, options, meta, currentParent)
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
          // 作为运行时组件的文本节点需要设置 slotTarget 用以数据渲染
          if (hasRuntimeCompileWrapper(el)) {
            el.slotTarget = stringify('default')
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
    if (i18n.useComputed) {
      if (!meta.computed) {
        meta.computed = []
      }
      meta.computed = meta.computed.concat(i18nInjectableComputed)
    } else {
      injectWxs(meta, i18nModuleName, i18nWxsRequest)
    }
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
  const list = el.attrsList
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
    // if (map[attrs[i].name] && !isIE && !isEdge) {
    //   warn$1('duplicate attribute: ' + attrs[i].name)
    // }
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
    el.mpxPageStatus = true
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

  const genericHash = options.moduleId

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
    el.is = parseMustache(is).result
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
      funcName,
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

// function processDataset (el) {
//   if (!el.dataset) {
//     el.dataset = {}
//   }
//   let datasetRe = /data-(.*)/
//   el.attrsList.forEach(function (attr) {
//     let match = attr.name.match(datasetRe)
//     if (match) {
//       el.dataset = {
//         [match[1]]: attr.value
//       }
//     }

//     getAndRemoveAttr(el, attr.name, true)
//   })
// }

function processBindEvent (el, options) {
  const eventConfigMap = {}
  if (!el.events) {
    el.events = {}
  }
  let usingHashTag = false
  el.attrsList.forEach(function (attr) {
    let parsedEvent = config[mode].event.parseEvent(attr.name)

    if (parsedEvent) {
      let prefix = parsedEvent.prefix
      // 在运行时组件内部使用了特殊的事件模型的节点需要对节点名进行 hash
      // TODO: 有些边界 case 需要优化，例如在非运行时组件里面的运行时组件的 slot 使用了这些。
      if (options.runtimeCompile && !usingHashTag && ['catch', 'capture-bind', 'capture-catch'].includes(prefix)) {
        usingHashTag = true
      }

      let type = parsedEvent.eventName
      let modifiers = (parsedEvent.modifier || '').split('.')
      let parsedFunc = parseFuncStr2(attr.value)
      if (parsedFunc) {
        el.events[attr.name] = {
          ...parsedEvent,
          funcName: parsedFunc.funcName
        }
        if (!eventConfigMap[type]) {
          eventConfigMap[type] = {
            rawName: attr.name,
            configs: []
          }
        }
        eventConfigMap[type].configs.push(parsedFunc)
        if (modifiers.indexOf('proxy') > -1 || options.forceProxyEvent) {
          eventConfigMap[type].proxy = true
        }
      }
    }
  })
  if (usingHashTag && !el.aliasTag) {
    el.aliasTag = 'd' + hash(`${el.tag}${++hashIndex}`)
  }
  let modelExp = getAndRemoveAttr(el, config[mode].directive.model).val
  if (modelExp) {
    let match = tagRE.exec(modelExp)
    if (match) {
      el.model = {
        // eventName: '',
        prop: []
        // filter: ''
      }

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

      // 用以生成 vnode 的事件配置
      el.events[`bind${modelEvent}`] = {
        prefix: 'bind',
        eventName: modelEvent,
        expStr: '[__model]',
        funcName: '"__model"'
      }

      el.model.prop = [modelProp, parseMustache(modelExp).result]

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

    el.eventconfigs = config[mode].event.shallowStringify(eventConfigMap)
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
            if (i18n.useComputed) {
              const i18nInjectComputedKey = `_i${i18nInjectableComputed.length + 1}`
              i18nInjectableComputed.push(`${i18nInjectComputedKey}: function(){\nreturn ${exp.trim()}}`)
              exp = i18nInjectComputedKey
            } else {
              exp = exp.replace(funcNameREG, `${i18nModuleName}.$1(mpxLocale, `)
            }
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
    addIfCondition(el, {
      exp: parsed.result,
      block: el
    })
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
        raw: parsed.val, // template 上写的 {{ xxx }} 原始值
        exp: parsed.result // 处理过后的 xxx 表达式的值
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
    el.refs = `{ key: '${val}', selector: '.${refClassName}', type: '${type}', all: ${all} }`
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

function postProcessIf (el, options, currentParent) {
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
    /**
     * 针对运行时组件或者是在非运行时组件内有运行时组件包裹的 slot，都需要走运行时编译
     */
    if (options.runtimeCompile || el.inRuntimeCompileWrapper) {
      return processIfConditions(el, currentParent)
    }
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
    if (options.runtimeCompile || el.inRuntimeCompileWrapper) {
      return processIfConditions(el, currentParent)
    }
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

function processIfConditions (el, parent) {
  removeNode(el)
  const prev = findPrevElement(parent.children)
  if (prev && (prev.if || prev._if)) {
    addIfCondition(prev, {
      exp: el.elseif ? el.elseif.exp : '',
      block: el
    })
  }
}

function findPrevElement (children) {
  let i = children.length
  while (i--) {
    if (children[i].type === 1) {
      return children[i]
    } else {
      children.pop()
    }
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

function processClass (el, options, meta) {
  const type = 'class'
  const needEx = el.tag.startsWith('th-')
  const targetType = needEx ? 'ex-' + type : type
  let dynamicClass = getAndRemoveAttr(el, config[mode].directive.dynamicClass).val
  let staticClass = getAndRemoveAttr(el, type).val
  if (dynamicClass) {
    let staticClassExp = parseMustache(staticClass).result
    let dynamicClassExp = transDynamicClassExpr(parseMustache(dynamicClass).result)
    el.class = dynamicClassExp
    el.staticClass = staticClassExp
    addAttrs(el, [{
      name: targetType,
      // swan中externalClass是通过编译时静态实现，因此需要保留原有的staticClass形式避免externalClass失效
      value: mode === 'swan' && staticClass ? `${staticClass} {{${stringifyModuleName}.stringifyClass('', ${dynamicClassExp})}}` : `{{${stringifyModuleName}.stringifyClass(${staticClassExp}, ${dynamicClassExp})}}`
    }])
    // 运行时编译的组件不需要注入 stringifyWxs 模块
    if (!options.runtimeCompile) {
      injectWxs(meta, stringifyModuleName, stringifyWxsPath)
    }
  } else if (staticClass) {
    el.staticClass = parseMustache(staticClass).result
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

function processStyle (el, options, meta) {
  const type = 'style'
  const targetType = el.tag.startsWith('th-') ? 'ex-' + type : type
  let dynamicStyle = getAndRemoveAttr(el, config[mode].directive.dynamicStyle).val
  let staticStyle = getAndRemoveAttr(el, type).val
  if (dynamicStyle) {
    let staticStyleExp = parseMustache(staticStyle).result
    let dynamicStyleExp = parseMustache(dynamicStyle).result
    el.staticStyle = staticStyleExp
    el.style = dynamicStyleExp
    addAttrs(el, [{
      name: targetType,
      value: `{{${stringifyModuleName}.stringifyStyle(${staticStyleExp}, ${dynamicStyleExp})}}`
    }])
    // 运行时编译的组件不需要注入 stringifyWxs 模块
    if (!options.runtimeCompile) {
      injectWxs(meta, stringifyModuleName, stringifyWxsPath)
    }
  } else if (staticStyle) {
    el.staticStyle = parseMustache(staticStyle).result
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

function isRuntimeComponentNode (el, options) {
  return options.runtimeComponents && options.runtimeComponents.includes(el.tag)
}

function processAliExternalClassesHack (el, options) {
  const isComponent = isComponentNode(el, options)
  // 处理组件externalClass多层传递
  const classLikeAttrNames = isComponent ? ['class'].concat(options.externalClasses) : ['class']
  classLikeAttrNames.forEach((classLikeAttrName) => {
    let classLikeAttrValue = getAndRemoveAttr(el, classLikeAttrName).val
    if (classLikeAttrValue) {
      options.externalClasses.forEach((className) => {
        const reg = new RegExp('\\b' + className + '\\b', 'g')
        const replacement = dash2hump(className)
        classLikeAttrValue = classLikeAttrValue.replace(reg, `{{${replacement}||''}}`)
      })
      addAttrs(el, [{
        name: classLikeAttrName,
        value: classLikeAttrValue
      }])
    }
  })

  if (options.hasScoped && isComponent) {
    options.externalClasses.forEach((className) => {
      let externalClass = getAndRemoveAttr(el, className).val
      if (externalClass) {
        addAttrs(el, [{
          name: className,
          value: `${externalClass} ${options.moduleId}`
        }])
      }
    })
  }
}

function processWebExternalClassesHack (el, options) {
  // todo 处理scoped的情况, 处理组件多层传递externalClass的情况，通过externalClass属性传递实际类名及scopeId信息，可以使用特殊的类名形式代表scopeId，如#idstring
  let staticClass = el.attrsMap['class']
  let dynamicClass = el.attrsMap[':class']
  if (staticClass || dynamicClass) {
    const externalClasses = []
    options.externalClasses.forEach((className) => {
      const reg = new RegExp('\\b' + className + '\\b')
      if (reg.test(staticClass) || reg.test(dynamicClass)) {
        externalClasses.push(className)
      }
    })
    if (externalClasses.length) {
      addAttrs(el, [{
        name: 'v-ex-classes',
        value: JSON.stringify(externalClasses)
      }])
    }
  }
}

function processScoped (el, options) {
  if (options.hasScoped && isRealNode(el)) {
    const moduleId = options.moduleId
    const staticClass = getAndRemoveAttr(el, 'class').val
    addAttrs(el, [{
      name: 'class',
      value: staticClass ? `${staticClass} ${moduleId}` : moduleId
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

function processHidden (el) {
  if (!el.inRuntimeCompileWrapper) {
    return
  }
  let { has, val } = getAndRemoveAttr(el, 'hidden')
  if (has) {
    if (val === undefined) {
      el.hidden = 'true'
    } else {
      el.hidden = parseMustache(val).result
    }
  }
}

// 暂时不考虑动态绑定数据的情况
// function getBindingAttr(el, name, getStatic) {
//   // const dynamicValue =
//   //   getAndRemoveAttr(el, ':' + name) ||
//   //   getAndRemoveAttr(el, 'v-bind:' + name)
//   // if (dynamicValue != null) {
//   //   return parseFilters(dynamicValue)
//   // } else if (getStatic !== false) {
//   //   const staticValue = getAndRemoveAttr(el, name)
//   //   if (staticValue != null) {
//   //     return JSON.stringify(staticValue)
//   //   }
//   // }
//   const staticValue = getAndRemoveAttr(el, name)
//   if (staticValue != null) {
//     return JSON.stringify(staticValue)
//   }
// }

function processSlotOutlet (el) {
  if (el.tag === 'slot') {
    const { has, val } = getAndRemoveAttr(el, 'name', true) // 先不考虑动态绑定的数据类型
    const slotName = has ? val : 'default'
    el.slotName = JSON.stringify(slotName)

    if (has) {
      addAttrs(el, [{
        name: 'name',
        value: val
      }])
    }
  }
}

function processSlotContent (el) {
  const { has, val } = getAndRemoveAttr(el, 'slot')
  if (has) {
    const slotTarget = val === undefined ? 'default' : val
    el.slotTarget = stringify(slotTarget)
  } else {
    if (el.inRuntimeCompileWrapper || el.innerRuntimeComponent) {
      el.slotTarget = stringify('default')
    }
  }
}

function processShow (el, options, root) {
  let show = getAndRemoveAttr(el, config[mode].directive.show).val
  let showExp
  // 如果是根节点，那么需要添加 mpxShow 变量
  if (options.isComponent && el.parent === root && isRealNode(el)) {
    if (show !== undefined) {
      show = `{{${parseMustache(show).result}&&mpxShow}}`
      showExp = `${parseMustache(show).result}&&mpxShow`
    } else {
      show = '{{mpxShow}}'
      showExp = 'mpxShow'
    }
  }

  if (show !== undefined) {
    // 自定义组件节点将 show 作为属性传递下去
    if (isComponentNode(el, options)) {
      if (show === '') {
        show = '{{false}}'
        showExp = 'false'
      }
      // 运行时编译不需要这个属性
      addAttrs(el, [{
        name: 'mpxShow',
        value: show
      }])
      el.show = showExp || parseMustache(show).result
    } else {
      // 普通元素节点
      const showExp = parseMustache(show).result
      let oldStyle = getAndRemoveAttr(el, 'style').val
      oldStyle = oldStyle ? oldStyle + ';' : ''
      addAttrs(el, [{
        name: 'style',
        value: `${oldStyle}{{${showExp}||${showExp}===undefined?'':'display:none;'}}`
      }])
      el.showStyle = `${showExp}||${showExp}===undefined?{}:{display:"none"}`
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

const isValidMode = makeMap('wx,ali,swan,tt,qq,web,qa,jd,dd')

const wrapRE = /^\((.*)\)$/

function processAtMode (el) {
  if (el.parent && el.parent._atModeStatus) {
    el._atModeStatus = el.parent._atModeStatus
  }

  const attrsListClone = cloneAttrsList(el.attrsList)
  attrsListClone.forEach(item => {
    const attrName = item.name || ''
    if (!attrName || attrName.indexOf('@') === -1) {
      return
    }
    // @wx|ali
    // hello@wx|ali
    // hello@:didi
    // hello@wx:didi:qingju:chengxin|ali
    // hello@(wx:didi:qingju:chengxin|ali)
    // @click@ali
    // @click:qingju:didi
    const attrArr = attrName.split('@')
    let modeStr = attrArr.pop()
    if (wrapRE.test(modeStr)) {
      modeStr = wrapRE.exec(modeStr)[1]
    }

    if (!modeStr) {
      return
    }

    const conditionMap = {}

    modeStr.split('|').forEach(item => {
      const arr = item.split(':')
      const key = arr[0] || mode
      conditionMap[key] = arr.slice(1)
    })

    const modeArr = Object.keys(conditionMap)

    if (modeArr.every(i => isValidMode(i))) {
      const attrValue = getAndRemoveAttr(el, attrName).val
      const replacedAttrName = attrArr.join('@')

      const processedAttr = { name: replacedAttrName, value: attrValue }
      if (modeArr.includes(mode) && (!conditionMap[mode].length || conditionMap[mode].includes(env))) {
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
  const attrsMap = el.attrsMap
  const attrsList = []
  Object.keys(attrsMap).forEach((name) => {
    const value = attrsMap[name]
    attrsList.push({
      name,
      value
    })
  })
  el.attrsList = attrsList
}

function processBindProps (el) {
  const { has, val } = getAndRemoveAttr(el, config[mode].directive.bind)
  if (has) {
    const { hasBinding, result } = parseMustache(val)
    el.bigAttrs = hasBinding ? result : val
    addAttrs(el, [{
      name: 'big-attrs',
      value: val
    }])
  }
}

// isRuntimeComponent -> 运行时组件
// innerRuntimeComponent -> 被运行时组件节点所包含的运行时组件节点
// inRuntimeCompileWrapper -> 被运行时组件节点包含的 slot 节点(普通自定义节点 & 普通节点)
// runtimeComponents 都需要将 slots 作为属性传递下去
function processRuntime (el, options) {
  el.runtimeCompile = !!options.runtimeCompile

  // 如果是运行时组件
  if (el.isRuntimeComponent) {
    // 如果是运行时组件a嵌套了运行时组件b，即b作为a的slot，那么将b标记为 innerRuntimeComponent
    // 一旦b也有slot，那么b的所有的slot单独生成slot并作为其属性
    if (hasRuntimeCompileWrapper(el)) {
      el.innerRuntimeComponent = true
    } else {
      el.slotAlias = hash(`${++hashIndex}${el.tag}`)
      if (!options.runtimeCompile) {
        addAttrs(el, [{
          name: 'slots',
          value: `{{ runtimeSlots["${el.slotAlias}"] }}`
        }])
      } else {
        el.slots = `runtimeSlot["${el.slotAlias}"]`
      }
    }
  } else if (hasRuntimeCompileWrapper(el)) { // 针对不是运行时组件里面的运行时组件 slots 标签的处理(这里的标签即包括自定义组件也包括普通的节点)
    el.inRuntimeCompileWrapper = true
  }

  // 搜集需要注入到 mpx-custom-element.json 模块里面的自定义组件路径
  // 运行组件 || 非运行组件里面使用了运行组件里面嵌套了自定义组件 || 运行时组件嵌套了运行时组件
  if (el.isCustomComponent) {
    if (options.runtimeCompile || el.inRuntimeCompileWrapper || el.innerRuntimeComponent) {
      const tag = el.tag
      const componentAbsolutePath = options.componentsAbsolutePath[tag]
      if (componentAbsolutePath) {
        const pathAndTagMap = getAliasTag()[componentAbsolutePath] || {}
        if (pathAndTagMap.aliasTag) {
          el.aliasTag = pathAndTagMap.aliasTag
        }
        collectInjectedPath(componentAbsolutePath)
      }
    }
  }
}

// 处理wxs注入逻辑
function processInjectWxs (meta, el) {
  if (el.injectWxsProps && el.injectWxsProps.length) {
    el.injectWxsProps.forEach((injectWxsProp) => {
      const { injectWxsPath, injectWxsModuleName } = injectWxsProp
      injectWxs(meta, injectWxsModuleName, injectWxsPath)
    })
  }
}

function processNoTransAttrs (el) {
  // 转换完成，把不需要处理的attr挂回去
  if (el.noTransAttrs) {
    addAttrs(el, el.noTransAttrs)
    delete el.noTransAttrs
  }
}

function processElement (el, root, options, meta) {
  processBindProps(el, options)
  processRuntime(el, options, meta)
  processAtMode(el)
  // 如果已经标记了这个元素要被清除，直接return跳过后续处理步骤
  if (el._atModeStatus === 'mismatch') {
    return
  }

  if (rulesRunner && el._atModeStatus !== 'match') {
    currentEl = el
    rulesRunner(el)
  }

  processInjectWxs(meta, el)

  processNoTransAttrs(el)

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
    processClass(el, options, meta)
    processStyle(el, options, meta)
    processShow(el, options, root)
    processHidden(el)
  }

  processSlotContent(el)
  processSlotOutlet(el)

  // 当mode为ali不管是不是跨平台都需要进行此处理，以保障ali当中的refs相关增强能力正常运行
  if (mode === 'ali') {
    processAliStyleClassHack(el, options, root)
  }

  if (!pass) {
    processBindEvent(el, options)
    if (mode !== 'ali') {
      processPageStatus(el, options)
    }
    processComponentIs(el, options)
  }

  processAttrs(el, options)
}

function closeElement (el, options, meta, currentParent) {
  postProcessAtMode(el)
  if (mode === 'web') {
    postProcessWxs(el, meta)
    // 处理代码维度条件编译移除死分支
    postProcessIf(el)
    return
  }
  const pass = isNative || postProcessTemplate(el) || processingTemplate
  postProcessWxs(el, meta)
  if (!pass) {
    el = postProcessComponentIs(el, options)
  }
  postProcessFor(el)
  postProcessIf(el, options, currentParent)
  postProcessHashComponent(el, meta)
}

function postProcessHashComponent (el, meta) {
  if (el.aliasTag) {
    if (!meta.hashComponent) {
      meta.hashComponent = {}
    }
    meta.hashComponent[el.aliasTag] = el
  }
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

function postProcessComponentIs (el, options) {
  // 运行时组件的 component is 指令
  if ((el.is && options.runtimeCompile) || el.inRuntimeCompileWrapper) {
    el.mpxPageStatus = true
    return el
  }
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
    // 手动创建新的需要动态渲染的 node 出来
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

function serialize (root, meta = {}) {
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
      if (node.tag === 'wxs' && mode === 'web') {
        return result
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
            // 运行时组件的子节点都不需要被渲染出来，统一交给外部生成 slot render fn
            if (!node.isRuntimeComponent) {
              node.children.forEach(function (child) {
                result += walk(child)
              })
            } else {
              if (!meta.slotElements) {
                meta.slotElements = {}
              }
              meta.slotElements[node.slotAlias] = node.children
            }
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

function addIfCondition (el, condition) {
  if (!el.ifConditions) {
    el.ifConditions = []
  }
  el.ifConditions.push(condition)
}

// TODO: 添加 trimEndingWhitespace 去除尾部 node 的函数
function genElement (node) {
  // 收集需要注入到 mpx-render-base.wxml 的节点 (只要被 hash 过的节点都需要被注入)
  if (node.aliasTag) {
    setTemplateNodes(node)
  }

  let code = ''
  if (node.type === 1) {
    if (node.tag !== 'temp-node' && node.tag !== 'import') {
      if (node.for && !node.forProcessed) {
        return _genFor(node)
      } else if (node.if && !node.ifProcessed) {
        return _genIf(node)
      } else if (node.tag === 'slot') {
        return _genSlot(node)
      } else {
        // <component is="{{ xxx }}">
        if (node.is) {
          code = _genComponent(node.is, node)
        } else {
          let data = _genData(node)
          const children = _genChildren(node)
          code = `__c('${node.aliasTag || node.tag}' ${data ? `,${data}` : ''} ${
            children ? `,${children}` : ''
          })`
        }

        return code
      }
    } else if (node.tag === 'temp-node') {
      // 临时节点最终通过 block 来承接渲染
      return _genBlock(node)
    } else {
      return _genChildren(node)
    }
  } else if (node.type === 3) {
    return _genNode(node)
  }
}

// rawTag -> aliasTag
function _genComponent (componentName, node) {
  const children = _genChildren(node)
  return `__c(__a(${componentName}), ${_genData(node)}${
    children ? `,${children}` : ''
  })`
}

const filterKeys = [
  'wx:for',
  'wx:for-index',
  'wx:for-item',
  'wx:if',
  'is',
  'data',
  'mpxPageStatus'
]

function genHandlers (events) {
  const bindeventsKey = 'mpxbindevents:'
  let staticHandlers = ``

  Object.keys(events).map(name => {
    const { funcName } = events[name]
    staticHandlers += `${funcName}: this.${funcName.slice(1, -1)}.bind(this),`
  })

  return bindeventsKey + `{${staticHandlers}}`
}

function _genData (node) {
  let bigAttrs = 'bigAttrs: __b('
  let data = '{'
  // 自定义组件节点 wx:show，需要将 mpxShow 作为属性传递到自定义组件内部，原生的元素节点通过 style 来进行控制 node.showStyle
  if (node.show) {
    data += `mpxShow: ${node.show},`
  }
  if (node.hidden) {
    data += `hidden: ${node.hidden},`
  }
  // 默认插槽不添加 slot 属性，这个 slot 属性主要是用于非运行组件的插槽来使用。具体见 mpx-render-base.wxml 里面动态生成非运行时组件的内容
  if (node.slotTarget && node.slotTarget !== '"default"') {
    data += `slot: ${node.slotTarget},`
  }
  if (node.slotName) {
    data += `slotName: ${node.slotName},`
  }
  if (node.slots) {
    data += `slots: runtimeSlots["${node.slotAlias}"],`
  }
  // 运行时组件的 slots 都是通过 properties 传递，单独在这里生产 slots render 函数
  if (node.innerRuntimeComponent) {
    if (node.children.length > 0) {
      data += `slots: ${transformSlotsToString(genSlots(node.children, genElement))},`
      // 这里直接清空所有运行时组件的子节点，slots 统一从注入的 runtimeSlots 当中获取，避免生成重复代码
      node.children = []
    }
  }
  if (node.style || node.staticStyle || node.showStyle) {
    const staticStyle = node.staticStyle ? node.staticStyle : stringify('')
    const style = node.style ? node.style : stringify({})
    data += `style: __ss(${staticStyle}, ${style}, ${node.showStyle}),`
    getAndRemoveAttr(node, 'style', true)
  }
  if (node.class || node.staticClass) {
    const staticClass = node.staticClass || stringify('')
    data += `class: __sc(${staticClass}, ${node.class}),`
    getAndRemoveAttr(node, 'class', true)
  }
  if (node.mpxPageStatus) {
    data += `mpxPageStatus: mpxPageStatus,`
  }
  // if (node.dataset) {
  //   data += 'dataset: {'
  //   Object.keys(node.dataset).map(key => {
  //     data += `${key}: '${node.dataset[key]}',`
  //   })
  //   data += '},'
  // }
  if (node.events) {
    node.attrsList.forEach(attr => {
      if (config[mode].event.parseEvent(attr.name)) {
        getAndRemoveAttr(node, attr.name)
      }
    })
    data += `${genHandlers(node.events)},`
  }
  if (node.eventconfigs) {
    data += `eventconfigs: ${node.eventconfigs},`
    getAndRemoveAttr(node, 'data-eventconfigs', true)
  }
  if (node.model) {
    const modelProp = node.model.prop
    if (modelProp.length > 0) {
      data += `${modelProp[0]}: ${modelProp[1]},`

      // model-props 需要被合并到 bigAttrs 当中
      bigAttrs += `{${modelProp[0]}: ${modelProp[1]}},`

      // 删除 model-prop 配置，避免生成 vnode 出现重复属性
      if (node.isRuntimeComponent) {
        getAndRemoveAttr(node, modelProp[0], true)
      }
    }
  }
  if (node.refs) {
    data += `refs: ${node.refs},`
  }
  /**
   *
   * wx:bind={{ { attr1: 'xx' } }} / wx:bind={{ bigAttrs }}
   *
   * case1: 使用 bigAttrs 透传属性
   * case2: 枚举属性透传
   * case3: 混写，有个合并属性的流程
   */
  function stringifyAttrsMap () {
    let res = ''
    Object.keys(node.attrsMap).map(key => {
      if (!filterKeys.includes(key)) {
        const parsed = parseMustache(node.attrsMap[key])
        res += `'${key}': ${parsed.hasBinding ? parsed.result : `'${parsed.val}'`},`
      }
    })
    return res
  }

  function stringifyBigAttrs () {
    if (node.bigAttrs) {
      bigAttrs += `${node.bigAttrs},`
      getAndRemoveAttr(node, 'big-attrs')
    }
    bigAttrs += `{${stringifyAttrsMap()}}`
    data += `${bigAttrs}),`
  }

  if (process.env.NODE_ENV === 'production') {
    if (node.isRuntimeComponent) {
      stringifyBigAttrs()
    } else {
      data += `${stringifyAttrsMap()}`
    }
  } else {
    // 非生产环境同时输出 bigAttrs 和 单个的属性值，主要是为了解决编译依赖的属性注入问题
    stringifyBigAttrs()
    data += `${stringifyAttrsMap()}`
  }

  if (data === '{') {
    data = ''
  } else {
    data = data.replace(/,$/, '') + '}'
  }

  return data
}

function _genBlock (node) {
  return `__c('block', ${_genChildren(node)})`
}

function _genFor (node) {
  node.forProcessed = true
  const index = node.for.index || 'index'
  const item = node.for.item || 'item'

  return `_i(${node.for.exp}, function(${item}, ${index}) {
    return ${genElement(node)}
  })`
}

function _genIf (node) {
  node.ifProcessed = true
  return _genIfConfitions(node.ifConditions.slice())
}

function _genChildren (node) {
  const children = node.children
  if (children.length) {
    return `[${children.map(c => _genNode(c)).filter(t => !!t).join(',')}]`
  }
}

// 目前仅考虑最简单的情况
function _genSlot (node) {
  const slotName = node.slotName
  const children = _genChildren(node)
  let res = `__t(${slotName}${children ? `,${children}` : ''})`
  return res
}

function _genIfConfitions (conditions) {
  if (!conditions.length) {
    return '__e()'
  }

  const condition = conditions.shift()
  if (condition.exp) {
    return `(${condition.exp})?${genElement(condition.block)}:${_genIfConfitions(conditions)}`
  } else {
    return genElement(condition.block)
  }
}

function _genNode (node) {
  if (node.type === 1) {
    return genElement(node)
  } else if (node.type === 3 && node.isComment) {
    return ''
    // TODO: 注释暂不处理
    // return _genComment(node)
  } else {
    return _genText(node) // 文本节点统一通过 _genText 来生成，type = 2(带有表达式的文本，在 mpx 统一处理为了3) || type = 3(纯文本，非注释)
  }
}

function _genText (node) {
  // TODO: trimEndingWhitespace 方法
  // mpx 对于纯文本节点的处理和带有表达式的文本节点的处理存放字段不同
  let exp = ''
  if (node.exps && node.exps[0]) {
    exp = node.exps[0].exp
    return `__v(${exp})`
  } else if (node.text && node.text !== ' ') {
    exp = node.text
    return `__v("${exp}")`
  } else {
    return ''
  }
  // return exp === ' ' ? '' : `__v(${exp})`
}

function genNode (node) {
  let exp = ''
  if (node) {
    // type=3 为文本节点，可能为文本注释节点，也可能为非注释节点，通过 isComment 来标识
    if (node.type === 3) {
      if (node.exps && !node.isComment) {
        exp += genExps(node)
      }
    }
    // type=1 为元素节点
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
  genElement,
  makeAttrsMap,
  stringifyAttr,
  parseMustache,
  stringifyWithResolveComputed
}
