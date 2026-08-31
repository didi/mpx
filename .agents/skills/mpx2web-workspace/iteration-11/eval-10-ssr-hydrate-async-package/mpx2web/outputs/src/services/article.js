export function fetchArticle (articleId, requestContext) {
  const req = requestContext && requestContext.req
  const protocol = req && (req.protocol || req.headers['x-forwarded-proto'] || 'http')
  const host = req && (req.headers['x-forwarded-host'] || req.headers.host)
  const origin = req ? `${protocol}://${host}` : ''
  return fetch(`${origin}/api/articles/${articleId}`).then((response) => response.json())
}
