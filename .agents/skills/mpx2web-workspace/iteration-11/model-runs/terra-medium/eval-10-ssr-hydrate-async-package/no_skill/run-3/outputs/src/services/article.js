function getServerOrigin (requestContext) {
  const request = requestContext && (requestContext.req || requestContext.request)
  const headers = (request && request.headers) || {}
  const host = headers['x-forwarded-host'] || headers.host
  const protocol = headers['x-forwarded-proto'] || 'http'

  return host ? `${String(protocol).split(',')[0]}://${host}` : 'http://localhost:3000'
}

export function fetchArticle (articleId, requestContext) {
  const origin = typeof window === 'undefined'
    ? getServerOrigin(requestContext)
    : window.location.origin
  const id = encodeURIComponent(String(articleId))

  return fetch(`${origin}/api/articles/${id}`).then((response) => {
    if (!response.ok) throw new Error(`Unable to load article ${id}`)
    return response.json()
  })
}
