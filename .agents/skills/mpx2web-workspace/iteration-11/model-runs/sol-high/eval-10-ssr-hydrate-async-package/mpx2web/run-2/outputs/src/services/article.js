export function fetchArticle (articleId, requestContext) {
  const request = requestContext && typeof requestContext.fetch === 'function'
    ? requestContext.fetch.bind(requestContext)
    : fetch

  return request(`/api/articles/${encodeURIComponent(articleId)}`)
    .then((response) => response.json())
}
