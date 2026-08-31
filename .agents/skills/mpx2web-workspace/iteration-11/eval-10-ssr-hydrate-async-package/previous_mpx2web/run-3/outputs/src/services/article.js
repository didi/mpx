import mpx from '@mpxjs/core'

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${articleId}`
  const req = requestContext && requestContext.req
  const headers = req && req.headers
  const host = headers && (headers['x-forwarded-host'] || headers.host)
  let protocol = 'http'
  if (headers && headers['x-forwarded-proto']) protocol = headers['x-forwarded-proto']
  else if (req && req.protocol) protocol = req.protocol
  else if (req && req.socket && req.socket.encrypted) protocol = 'https'
  const origin = req ? `${protocol}://${host}` : ''
  return mpx.request({ url: `${origin}${path}` }).then((response) => response.data)
}
