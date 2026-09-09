import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return new Promise((resolve, reject) => {
    request({
      url: '/api/search/trending',
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function requestSuggestions (keyword, callbacks) {
  return request({
    url: '/api/search/suggest',
    data: { keyword },
    success: callbacks.success,
    fail: callbacks.fail
  })
}
