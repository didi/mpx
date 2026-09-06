function getServerOrigin (requestContext) {
  const request = requestContext && (requestContext.req || requestContext.request)
  const headers = request && request.headers
  const host = headers && (headers.host || (typeof headers.get === 'function' && headers.get('host')))
  const protocol = (request && request.protocol) || 'http'
  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

export function fetchArticle (articleId, requestContext) {
  const origin = typeof window === 'undefined'
    ? getServerOrigin(requestContext)
    : window.location.origin
  const encodedId = encodeURIComponent(articleId)
  return fetch(`${origin}/api/articles/${encodedId}`).then((response) => {
    if (response.ok === false) throw new Error(`Failed to fetch article: ${response.status}`)
    return response.json()
  })
}
