function getRequest (requestContext) {
  if (requestContext && typeof requestContext.fetch === 'function') {
    return requestContext.fetch.bind(requestContext)
  }
  if (requestContext && typeof requestContext.request === 'function') {
    return requestContext.request.bind(requestContext)
  }
  return fetch
}

export function fetchArticle (articleId, requestContext) {
  const request = getRequest(requestContext)
  return request(`/api/articles/${encodeURIComponent(articleId)}`).then((response) => response.json())
}
