function requestOrigin (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProtocol = String(headers['x-forwarded-proto'] || '').split(',')[0].trim()
  const forwardedHost = String(headers['x-forwarded-host'] || '').split(',')[0].trim()
  const protocol = forwardedProtocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = forwardedHost || headers.host

  if (!host) throw new Error('SSR request host is missing')
  return `${protocol}://${host}`
}

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`
  const origin = requestOrigin(requestContext)

  return fetch(`${origin}${path}`).then((response) => response.json())
}
