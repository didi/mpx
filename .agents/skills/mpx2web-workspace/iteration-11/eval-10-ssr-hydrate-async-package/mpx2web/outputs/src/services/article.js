function getRequestOrigin (requestContext) {
  if (!requestContext) return ''
  if (requestContext.origin) return requestContext.origin.replace(/\/$/, '')
  if (/^https?:\/\//.test(requestContext.url || '')) {
    return new URL(requestContext.url).origin
  }

  const request = requestContext.req || requestContext.request
  if (!request || typeof request === 'function') return ''

  const headers = request.headers || {}
  const getHeader = (name) => typeof headers.get === 'function' ? headers.get(name) : headers[name]
  const forwardedProtocol = getHeader('x-forwarded-proto')
  const forwardedHost = getHeader('x-forwarded-host')
  const protocol = (forwardedProtocol && forwardedProtocol.split(',')[0]) ||
    request.protocol ||
    (request.socket && request.socket.encrypted ? 'https' : 'http')
  const host = (forwardedHost && forwardedHost.split(',')[0]) || getHeader('host')
  return host ? `${protocol}://${host}` : ''
}

function getRequestHeaders (requestContext) {
  const request = requestContext && (requestContext.req || requestContext.request)
  if (!request || typeof request === 'function' || !request.headers) return undefined

  const getHeader = (name) => typeof request.headers.get === 'function'
    ? request.headers.get(name)
    : request.headers[name]
  const headers = {}
  const cookie = getHeader('cookie')
  const authorization = getHeader('authorization')
  if (cookie) headers.cookie = cookie
  if (authorization) headers.authorization = authorization
  return Object.keys(headers).length ? headers : undefined
}

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`
  const origin = getRequestOrigin(requestContext)
  const request = requestContext && (requestContext.fetch ||
    (typeof requestContext.request === 'function' && requestContext.request)) || fetch
  const headers = getRequestHeaders(requestContext)

  return request(`${origin}${path}`, headers ? { headers } : undefined)
    .then((response) => typeof response.json === 'function' ? response.json() : response)
}
