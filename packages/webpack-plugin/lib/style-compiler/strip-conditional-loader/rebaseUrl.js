const path = require('node:path')
/**
 * @typedef {(id: string, importer?: string, aliasOnly?: boolean) => Promise<string | undefined>} ResolveIdFn
 */
/**
 * @typedef {(unquotedUrl: string, rawUrl: string) => Promise<string | false> | string | false} CssUrlReplacer
 */

// https://drafts.csswg.org/css-syntax-3/#identifier-code-point
const cssUrlRE = /(?<!@import\s+)(?<=^|[^\w\-\u0080-\uffff])url\((\s*('[^']+'|"[^"]+")\s*|(?:\\.|[^'")\\])+)\)/
const cssDataUriRE = /(?<=^|[^\w\-\u0080-\uffff])data-uri\((\s*('[^']+'|"[^"]+")\s*|[^'")]+)\)/
const importCssRE = /@import\s+(?:url\()?('[^']+\.css'|"[^"]+\.css"|[^'"\s)]+\.css)/
const nonEscapedDoubleQuoteRe = /(?<!\\)"/g
const externalRE = /^([a-z]+:)?\/\//
const isExternalUrl = url => externalRE.test(url)

const dataUrlRE = /^\s*data:/i
const isDataUrl = url => dataUrlRE.test(url)
const functionCallRE = /^[A-Z_][.\w-]*\(/i

function skipUrlReplacer(unquotedUrl) {
  return isExternalUrl(unquotedUrl) || isDataUrl(unquotedUrl) || unquotedUrl[0] === '#' || unquotedUrl[0] === '@' || functionCallRE.test(unquotedUrl)
}

/**
 *
 * @param {string} rawUrl
 * @param {string} matched
 * @param {CssUrlReplacer} replacer
 * @param {string} funcName
 * @returns {Promise<string>}
 */
async function doUrlReplace(rawUrl, matched, replacer, funcName = 'url') {
  let wrap = ''
  const first = rawUrl[0]
  let unquotedUrl = rawUrl
  if (first === '"' || first === "'") {
    wrap = first
    unquotedUrl = rawUrl.slice(1, -1)
  }
  if (skipUrlReplacer(unquotedUrl)) {
    return matched
  }
  //  Remove escape sequences to get the actual file name before resolving.
  unquotedUrl = unquotedUrl.replace(/\\(\W)/g, '$1')

  let newUrl = await replacer(unquotedUrl, rawUrl)
  if (newUrl === false) {
    return matched
  }

  // The new url might need wrapping even if the original did not have it, e.g.
  // if a space was added during replacement or the URL contains ")"
  if (wrap === '' && (newUrl !== encodeURI(newUrl) || newUrl.includes(')'))) {
    wrap = '"'
  }
  // If wrapping in single quotes and newUrl also contains single quotes, switch to double quotes.
  // Give preference to double quotes since SVG inlining converts double quotes to single quotes.
  if (wrap === "'" && newUrl.includes("'")) {
    wrap = '"'
  }
  // Escape double quotes if they exist (they also tend to be rarer than single quotes)
  if (wrap === '"' && newUrl.includes('"')) {
    newUrl = newUrl.replace(nonEscapedDoubleQuoteRe, '\\"')
  }
  return `${funcName}(${wrap}${newUrl}${wrap})`
}

/**
 *
 * @param {string} rawUrl
 * @param {string} matched
 * @param {CssUrlReplacer} replacer
 * @returns
 */
async function doImportCSSReplace(rawUrl, matched, replacer) {
  let wrap = ''
  const first = rawUrl[0]
  let unquotedUrl = rawUrl
  if (first === '"' || first === "'") {
    wrap = first
    unquotedUrl = rawUrl.slice(1, -1)
  }
  if (skipUrlReplacer(unquotedUrl)) {
    return matched
  }

  const newUrl = await replacer(unquotedUrl, rawUrl)
  if (newUrl === false) {
    return matched
  }

  const prefix = matched.includes('url(') ? 'url(' : ''
  return `@import ${prefix}${wrap}${newUrl}${wrap}`
}

/**
 *
 * @param {string} input
 * @param {RegExp} re
 * @param {(match: RegExpMatchArray) => string | Promise<string>} replacer
 * @returns {Promise<string>}
 */
async function asyncReplace(input, re, replacer) {
  let match = null
  let remaining = input
  let rewritten = ''
  while ((match = re.exec(remaining))) {
    rewritten += remaining.slice(0, match.index)
    rewritten += await replacer(match)
    remaining = remaining.slice(match.index + match[0].length)
  }
  rewritten += remaining
  return rewritten
}
module.exports.asyncReplace = asyncReplace

/**
 *
 * @param {string} css
 * @param {CssUrlReplacer} replacer
 * @returns
 */
function rewriteCssUrls(css, replacer) {
  return asyncReplace(css, cssUrlRE, async match => {
    const [matched, rawUrl] = match
    return await doUrlReplace(rawUrl.trim(), matched, replacer)
  })
}

/**
 *
 * @param {string} css
 * @param {CssUrlReplacer} replacer
 * @returns
 */
function rewriteCssDataUris(css, replacer) {
  return asyncReplace(css, cssDataUriRE, async match => {
    const [matched, rawUrl] = match
    return await doUrlReplace(rawUrl.trim(), matched, replacer, 'data-uri')
  })
}
/**
 *
 * @param {string} css
 * @param {CssUrlReplacer} replacer
 * @returns
 */
function rewriteImportCss(css, replacer) {
  return asyncReplace(css, importCssRE, async match => {
    const [matched, rawUrl] = match
    return await doImportCSSReplace(rawUrl, matched, replacer)
  })
}

const windowsSlashRE = /\\/g
function slash(p) {
  return p.replace(windowsSlashRE, '/')
}

const isWindows = typeof process !== 'undefined' && process.platform === 'win32'
/**
 *
 * @param {string} id
 * @returns {string}
 */
function normalizePath(id) {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

/**
 *
 * @param {string} file
 * @param {string} rootFile
 * @param {string} content
 * @param {ResolveIdFn} resolver
 * @param {(unquotedUrl: string, rawUrl: string) => boolean} [ignoreUrl]
 * @returns {Promise<{ file: string, contents?: string }>}
 */
async function rebaseUrls(file, rootFile, content, resolver, ignoreUrl) {
  //   file = path.resolve(file) // ensure os-specific flashes
  // in the same dir, no need to rebase
  const fileDir = path.dirname(file)
  const rootDir = path.dirname(rootFile)

  // no url()
  const hasUrls = cssUrlRE.test(content)
  // data-uri() calls
  const hasDataUris = cssDataUriRE.test(content)
  // no @import xxx.css
  const hasImportCss = importCssRE.test(content)

  if (!hasUrls && !hasDataUris && !hasImportCss) {
    return { file }
  }

  let rebased
  const rebaseFn = async (unquotedUrl, rawUrl) => {
    if (ignoreUrl?.(unquotedUrl, rawUrl)) return false
    if (unquotedUrl[0] === '/') return unquotedUrl
    const absolute = (await resolver(unquotedUrl, file)) || path.resolve(fileDir, unquotedUrl)
    const relative = path.relative(rootDir, absolute)
    return normalizePath(relative)
  }

  // fix css imports in less such as `@import "foo.css"`
  if (hasImportCss) {
    rebased = await rewriteImportCss(content, rebaseFn)
  }

  if (hasUrls) {
    rebased = await rewriteCssUrls(rebased || content, rebaseFn)
  }

  if (hasDataUris) {
    rebased = await rewriteCssDataUris(rebased || content, rebaseFn)
  }

  return {
    file,
    contents: rebased
  }
}

module.exports.rebaseUrls = rebaseUrls
