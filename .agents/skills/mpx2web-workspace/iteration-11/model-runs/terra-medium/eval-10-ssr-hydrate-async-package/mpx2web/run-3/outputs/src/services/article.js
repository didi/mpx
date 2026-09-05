export function fetchArticle (articleId, requestContext) {
  const request = requestContext && requestContext.fetch
    ? requestContext.fetch
    : fetch

  return request(`/api/articles/${encodeURIComponent(articleId)}`)
    .then((response) => response.json())
}
