function getHeader (headers, name) {
  if (!headers) return ''

  if (typeof headers.get === 'function') {
    return headers.get(name) || ''
  }

  const value = headers[name] || headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : (value || '')
}

function firstHeaderValue (value) {
  return String(value || '').split(',')[0].trim()
}

function getServerRequest (requestContext) {
  if (!requestContext) return null
  return requestContext.req || requestContext.request || requestContext
}

function getServerOrigin (requestContext) {
  if (requestContext && requestContext.origin) {
    return String(requestContext.origin).replace(/\/$/, '')
  }

  if (requestContext && /^https?:\/\//.test(requestContext.url || '')) {
    return new URL(requestContext.url).origin
  }

  const request = getServerRequest(requestContext)
  const headers = request && request.headers
  const protocol = firstHeaderValue(getHeader(headers, 'x-forwarded-proto')) ||
    (request && request.protocol) ||
    'http'
  const host = firstHeaderValue(getHeader(headers, 'x-forwarded-host')) ||
    firstHeaderValue(getHeader(headers, 'host'))

  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

function getServerHeaders (requestContext) {
  const request = getServerRequest(requestContext)
  const requestHeaders = request && request.headers
  const headers = {}
  const cookie = getHeader(requestHeaders, 'cookie')
  const authorization = getHeader(requestHeaders, 'authorization')

  if (cookie) headers.cookie = cookie
  if (authorization) headers.authorization = authorization

  return headers
}

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(String(articleId))}`

  if (typeof window !== 'undefined') {
    return fetch(path).then((response) => response.json())
  }

  const origin = getServerOrigin(requestContext)
  return fetch(`${origin}${path}`, {
    headers: getServerHeaders(requestContext)
  }).then((response) => response.json())
}
