import mpx from '@mpxjs/core'

export function fetchTrendingKeywords () {
  return mpx.request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  let requestTask
  const promise = new Promise((resolve, reject) => {
    requestTask = mpx.request({
      url: '/api/search/suggest',
      data: { keyword },
      usePromise: false,
      success: resolve,
      fail: reject
    })
  })
  return {
    promise,
    abort () {
      requestTask.abort()
    }
  }
}
