export function fetchArticle (articleId, requestContext) {
  const origin = typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin
  const fetcher = requestContext && requestContext.fetch ? requestContext.fetch : fetch
  return fetcher(`${origin}/api/articles/${encodeURIComponent(articleId)}`).then((response) => {
    if (response.ok === false) throw new Error(`Failed to load article: ${response.status}`)
    return response.json()
  })
}
