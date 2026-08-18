import mpx from '@mpxjs/api-proxy'

function request (options, requestContext) {
  const requestClient = requestContext && (requestContext.request || requestContext.requestClient)

  if (typeof requestClient === 'function') {
    return Promise.resolve(requestClient(options)).then(response => response && response.data !== undefined ? response.data : response)
  }

  return new Promise((resolve, reject) => {
    mpx.request(Object.assign({}, options, {
      success: ({ data }) => resolve(data),
      fail: reject
    }))
  })
}

export function fetchProduct (productId, requestContext) {
  return request({
    url: `/api/products/${encodeURIComponent(productId)}`
  }, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return request({
    url: `/api/products/${encodeURIComponent(productId)}/recommendations`
  }, requestContext)
}
