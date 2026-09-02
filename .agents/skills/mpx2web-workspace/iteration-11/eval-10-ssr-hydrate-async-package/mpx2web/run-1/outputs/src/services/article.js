function readResponse (response) {
  if (response && typeof response.json === 'function') return response.json()
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) return response.data
  return response
}

function getHeader (headers, name) {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  return headers[name] || headers[name.toLowerCase()] || ''
}

function getRequestOrigin (requestContext) {
  if (!requestContext) return ''
  if (requestContext.origin) return requestContext.origin.replace(/\/$/, '')

  const request = requestContext.req || requestContext.request
  if (!request || typeof request === 'function') return ''

  const host = getHeader(request.headers, 'x-forwarded-host') || getHeader(request.headers, 'host')
  if (!host) return ''

  const forwardedProtocol = getHeader(request.headers, 'x-forwarded-proto').split(',')[0]
  const protocol = forwardedProtocol || request.protocol || (request.socket && request.socket.encrypted ? 'https' : 'http')
  return `${protocol}://${host}`
}

function getRequestHeaders (requestContext) {
  const request = requestContext && (requestContext.req || requestContext.request)
  if (!request || typeof request === 'function') return undefined

  const cookie = getHeader(request.headers, 'cookie')
  const authorization = getHeader(request.headers, 'authorization')
  const headers = {}
  if (cookie) headers.cookie = cookie
  if (authorization) headers.authorization = authorization
  return Object.keys(headers).length ? headers : undefined
}

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`
  const requestClient = requestContext && (
    typeof requestContext.fetch === 'function'
      ? requestContext.fetch.bind(requestContext)
      : typeof requestContext.request === 'function'
        ? requestContext.request.bind(requestContext)
        : null
  )

  if (requestClient) return Promise.resolve(requestClient(path)).then(readResponse)

  const origin = getRequestOrigin(requestContext)
  const headers = getRequestHeaders(requestContext)
  const options = headers ? { headers } : undefined
  return fetch(`${origin}${path}`, options).then(readResponse)
}
