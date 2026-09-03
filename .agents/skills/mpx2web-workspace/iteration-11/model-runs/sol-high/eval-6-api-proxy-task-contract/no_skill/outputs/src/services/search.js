import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  // 直接返回 API Proxy 的 Promise，保留其 request task 上的 abort 能力。
  return request({
    url: '/api/search/suggest',
    data: { keyword }
  })
}
