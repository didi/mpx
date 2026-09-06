export function fetchArticle (articleId, requestContext) {
  const request = requestContext && typeof requestContext.fetch === 'function'
    ? requestContext.fetch.bind(requestContext)
    : fetch
  const origin = requestContext && requestContext.origin ? requestContext.origin : ''
  const url = `${origin}/api/articles/${encodeURIComponent(articleId)}`

  return request(url).then((response) => response.json())
}
