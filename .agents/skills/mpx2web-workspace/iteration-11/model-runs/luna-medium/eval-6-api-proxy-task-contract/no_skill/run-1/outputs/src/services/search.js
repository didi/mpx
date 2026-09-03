import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword, signal) {
  return request({
    url: '/api/search/suggest',
    data: { keyword },
    signal
  }).then(({ data }) => data.list)
}
