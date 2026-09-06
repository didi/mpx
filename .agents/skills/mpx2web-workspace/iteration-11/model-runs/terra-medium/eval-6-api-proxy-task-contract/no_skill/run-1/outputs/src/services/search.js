import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  // API Proxy returns a Promise-compatible request task. Its abort method is
  // kept intact so callers can cancel an in-flight suggestion request.
  return request({
    url: '/api/search/suggest',
    data: { keyword }
  })
}
