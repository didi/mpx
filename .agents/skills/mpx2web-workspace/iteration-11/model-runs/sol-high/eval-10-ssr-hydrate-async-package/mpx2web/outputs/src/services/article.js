function readHeader (headers, name) {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''

  const value = headers[name] || headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

function firstHeaderValue (value) {
  return String(value || '').split(',')[0].trim()
}

function getRequest (requestContext) {
  if (!requestContext) return null
  return requestContext.req || requestContext.request || null
}

function getOrigin (requestContext) {
  if (!requestContext) return ''
  if (requestContext.origin) return String(requestContext.origin).replace(/\/$/, '')

  const request = getRequest(requestContext)
  if (request && request.origin) return String(request.origin).replace(/\/$/, '')

  const headers = (request && request.headers) || requestContext.headers
  const host = firstHeaderValue(readHeader(headers, 'x-forwarded-host') || readHeader(headers, 'host'))
  if (!host) return ''

  const protocol = firstHeaderValue(
    readHeader(headers, 'x-forwarded-proto') ||
    (request && request.protocol) ||
    (request && request.socket && request.socket.encrypted ? 'https' : 'http')
  )
  return `${protocol}://${host}`
}

function getForwardHeaders (requestContext) {
  const request = getRequest(requestContext)
  const headers = (request && request.headers) || (requestContext && requestContext.headers)
  const cookie = readHeader(headers, 'cookie')
  const authorization = readHeader(headers, 'authorization')
  const forwardHeaders = {}

  if (cookie) forwardHeaders.cookie = cookie
  if (authorization) forwardHeaders.authorization = authorization

  return forwardHeaders
}

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`
  const origin = getOrigin(requestContext)
  const requestFetch = requestContext && requestContext.fetch
  const fetcher = typeof requestFetch === 'function' ? requestFetch.bind(requestContext) : fetch
  const options = requestContext ? { headers: getForwardHeaders(requestContext) } : undefined

  return fetcher(`${origin}${path}`, options).then((response) => response.json())
}
