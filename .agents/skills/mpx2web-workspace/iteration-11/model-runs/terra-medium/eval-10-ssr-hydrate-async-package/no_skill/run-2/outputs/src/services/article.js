function getServerOrigin (requestContext) {
  const request = requestContext && (requestContext.req || requestContext.request)
  const headers = request && request.headers
  const host = headers && headers.host
  if (!host) return 'http://localhost:3000'

  const forwardedProtocol = headers['x-forwarded-proto']
  const protocol = (forwardedProtocol && forwardedProtocol.split(',')[0]) || request.protocol || 'http'
  return `${protocol}://${host}`
}

export function fetchArticle (articleId, requestContext) {
  const id = encodeURIComponent(String(articleId))
  const isBrowser = typeof window !== 'undefined'
  const origin = isBrowser ? window.location.origin : getServerOrigin(requestContext)
  const request = requestContext && (requestContext.req || requestContext.request)
  const cookie = !isBrowser && request && request.headers && request.headers.cookie
  const options = cookie ? { headers: { cookie } } : undefined

  return fetch(`${origin}/api/articles/${id}`, options).then((response) => {
    if (!response.ok) throw new Error(`Unable to load article ${id}`)
    return response.json()
  })
}
