export function fetchArticle (articleId, requestContext = {}) {
  const isServer = typeof window === 'undefined'
  const origin = isServer
    ? (requestContext.origin || 'http://localhost:3000')
    : window.location.origin
  const headers = requestContext.headers || undefined
  const options = headers ? { headers } : undefined

  return fetch(`${origin}/api/articles/${encodeURIComponent(articleId)}`, options).then((response) => {
    if (response.ok === false) throw new Error(`Failed to load article: ${response.status}`)
    return response.json()
  })
}
