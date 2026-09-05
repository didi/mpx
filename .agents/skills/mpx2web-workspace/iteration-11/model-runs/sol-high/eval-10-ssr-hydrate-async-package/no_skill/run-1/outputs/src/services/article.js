function firstForwardedValue (value) {
  return value ? String(value).split(',')[0].trim() : ''
}

function readHeader (headers, name) {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  return headers[name] || headers[name.toLowerCase()] || ''
}

function getServerOrigin (requestContext) {
  if (requestContext && requestContext.origin) {
    return String(requestContext.origin).replace(/\/+$/, '')
  }

  const request = requestContext && (requestContext.req || requestContext.request)
  const headers = request && request.headers
  const forwardedProtocol = firstForwardedValue(readHeader(headers, 'x-forwarded-proto'))
  const forwardedHost = firstForwardedValue(readHeader(headers, 'x-forwarded-host'))
  const protocol = forwardedProtocol || (request && request.protocol) || 'http'
  const host = forwardedHost || firstForwardedValue(readHeader(headers, 'host'))

  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

export function fetchArticle (articleId, requestContext) {
  const origin = typeof window === 'undefined'
    ? getServerOrigin(requestContext)
    : window.location.origin
  const url = `${origin}/api/articles/${encodeURIComponent(articleId)}`

  return fetch(url).then((response) => {
    if (response.ok === false) throw new Error(`Failed to load article: ${response.status}`)
    return response.json()
  })
}
