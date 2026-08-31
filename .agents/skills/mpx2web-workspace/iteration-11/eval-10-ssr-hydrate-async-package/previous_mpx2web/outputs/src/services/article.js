function getRequestOrigin (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return ''

  const protocol = req.headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http')
  return `${protocol}://${req.headers.host}`
}

export function fetchArticle (articleId, requestContext) {
  return fetch(`${getRequestOrigin(requestContext)}/api/articles/${articleId}`).then((response) => response.json())
}
