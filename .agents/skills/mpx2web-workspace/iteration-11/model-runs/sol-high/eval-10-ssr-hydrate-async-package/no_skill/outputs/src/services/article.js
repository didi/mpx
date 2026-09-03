function firstHeaderValue (value) {
  return Array.isArray(value) ? value[0] : String(value || '').split(',')[0].trim()
}

function getRequestHeaders (requestContext) {
  const request = requestContext && (requestContext.req || requestContext.request)
  return (request && request.headers) || (requestContext && requestContext.headers) || {}
}

function getServerOrigin (requestContext) {
  if (requestContext && requestContext.origin) return requestContext.origin

  const request = requestContext && (requestContext.req || requestContext.request)
  const headers = getRequestHeaders(requestContext)
  const protocol = firstHeaderValue(headers['x-forwarded-proto']) ||
    (request && request.protocol) ||
    (request && request.socket && request.socket.encrypted ? 'https' : 'http')
  const host = firstHeaderValue(headers['x-forwarded-host']) || firstHeaderValue(headers.host)

  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

function getForwardHeaders (requestContext) {
  const requestHeaders = getRequestHeaders(requestContext)
  const headers = {}

  if (requestHeaders.cookie) headers.cookie = requestHeaders.cookie
  if (requestHeaders.authorization) headers.authorization = requestHeaders.authorization
  if (requestHeaders['accept-language']) headers['accept-language'] = requestHeaders['accept-language']

  return headers
}

export function fetchArticle (articleId, requestContext) {
  const origin = typeof window === 'undefined' ? getServerOrigin(requestContext) : window.location.origin
  const options = typeof window === 'undefined'
    ? { headers: getForwardHeaders(requestContext) }
    : { credentials: 'same-origin' }

  return fetch(`${origin}/api/articles/${encodeURIComponent(articleId)}`, options)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load article: ${response.status}`)
      return response.json()
    })
}
