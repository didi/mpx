function getServerOrigin (requestContext) {
  if (requestContext && requestContext.origin) return requestContext.origin

  const request = requestContext && (requestContext.req || requestContext.request)
  if (request) {
    const headers = request.headers || {}
    const forwardedProtocol = headers['x-forwarded-proto']
    const forwardedHost = headers['x-forwarded-host']
    const protocol = (forwardedProtocol && forwardedProtocol.split(',')[0]) || request.protocol || 'http'
    const host = (forwardedHost && forwardedHost.split(',')[0]) || headers.host
    if (host) return `${protocol}://${host}`
  }

  return 'http://localhost:3000'
}

export function fetchArticle (articleId, requestContext) {
  const origin = typeof window === 'undefined' ? getServerOrigin(requestContext) : window.location.origin
  return fetch(`${origin}/api/articles/${encodeURIComponent(articleId)}`).then((response) => response.json())
}
