export function fetchArticle (articleId, requestContext) {
  const req = requestContext && requestContext.req
  let origin = ''
  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http')
    const host = req.headers['x-forwarded-host'] || req.headers.host
    origin = `${protocol}://${host}`
  }
  return fetch(`${origin}/api/articles/${articleId}`).then((response) => response.json())
}
