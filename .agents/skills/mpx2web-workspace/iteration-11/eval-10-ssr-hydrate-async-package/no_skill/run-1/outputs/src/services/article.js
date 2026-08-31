function getServerOrigin (requestContext) {
  const request = requestContext.req
  const headers = request.headers
  const forwardedProtocol = headers['x-forwarded-proto']
  const forwardedHost = headers['x-forwarded-host']
  const protocol = forwardedProtocol
    ? forwardedProtocol.split(',')[0].trim()
    : request.socket.encrypted ? 'https' : 'http'
  const host = forwardedHost ? forwardedHost.split(',')[0].trim() : headers.host
  return `${protocol}://${host}`
}

export function fetchArticle (articleId, requestContext) {
  const origin = requestContext && requestContext.req
    ? getServerOrigin(requestContext)
    : typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin
  return fetch(`${origin}/api/articles/${encodeURIComponent(articleId)}`).then((response) => response.json())
}
