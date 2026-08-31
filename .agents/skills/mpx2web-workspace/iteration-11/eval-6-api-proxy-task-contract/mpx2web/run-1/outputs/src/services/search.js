import mpx from '@mpxjs/core'

export function fetchTrendingKeywords () {
  return mpx.request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword, callbacks) {
  return mpx.request({
    url: '/api/search/suggest',
    data: { keyword },
    usePromise: false,
    success: callbacks.success,
    fail: callbacks.fail
  })
}
