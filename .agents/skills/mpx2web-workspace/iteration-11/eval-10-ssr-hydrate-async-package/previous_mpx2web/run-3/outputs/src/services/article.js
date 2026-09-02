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
  const url = `/api/articles/${encodeURIComponent(articleId)}`

  return Promise.resolve(request(url)).then((response) => {
    return response && typeof response.json === 'function' ? response.json() : response
  })
}
