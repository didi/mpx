function readHeader (headers, name) {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  return headers[name] || headers[name.toLowerCase()] || ''
}

function firstHeaderValue (value) {
  return String(value || '').split(',')[0].trim()
}

function getRequest (requestContext) {
  if (!requestContext) return null
  return requestContext.req || requestContext.request || null
}

function getRequestHeaders (requestContext) {
  const request = getRequest(requestContext)
  return (request && request.headers) || (requestContext && requestContext.headers) || null
}

function getOrigin (requestContext) {
  if (typeof window !== 'undefined') return window.location.origin

  if (requestContext && requestContext.origin) {
    return String(requestContext.origin).replace(/\/$/, '')
  }

  const request = getRequest(requestContext)
  const headers = getRequestHeaders(requestContext)
  const host = firstHeaderValue(readHeader(headers, 'x-forwarded-host')) ||
    firstHeaderValue(readHeader(headers, 'host'))
  const protocol = firstHeaderValue(readHeader(headers, 'x-forwarded-proto')) ||
    (request && request.protocol) ||
    (requestContext && requestContext.protocol) ||
    'http'

  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

function getRequestOptions (requestContext) {
  if (typeof window !== 'undefined') return undefined

  const sourceHeaders = getRequestHeaders(requestContext)
  const cookie = readHeader(sourceHeaders, 'cookie')
  const authorization = readHeader(sourceHeaders, 'authorization')
  const headers = {}

  if (cookie) headers.cookie = cookie
  if (authorization) headers.authorization = authorization

  return Object.keys(headers).length ? { headers } : undefined
}

export function fetchArticle (articleId, requestContext) {
  const origin = getOrigin(requestContext)
  const url = `${origin}/api/articles/${encodeURIComponent(String(articleId))}`
  const requestFetch = requestContext && typeof requestContext.fetch === 'function'
    ? requestContext.fetch.bind(requestContext)
    : fetch

  return requestFetch(url, getRequestOptions(requestContext)).then((response) => {
    if (typeof response.ok === 'boolean' && !response.ok) {
      throw new Error(`Failed to load article ${articleId}: ${response.status}`)
    }
    return response.json()
  })
}
