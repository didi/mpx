export function fetchArticle (articleId, requestContext) {
  const origin = typeof window === 'undefined'
    ? (requestContext && requestContext.origin) || 'http://localhost:3000'
    : window.location.origin
  const url = `${origin}/api/articles/${encodeURIComponent(articleId)}`
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`Failed to load article: ${response.status}`)
    return response.json()
  })
}
