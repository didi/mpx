import mpx from '@mpxjs/core'

export function fetchTrendingKeywords () {
  return mpx.request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  return mpx.request({
    url: '/api/search/suggest',
    data: { keyword }
  })
}
