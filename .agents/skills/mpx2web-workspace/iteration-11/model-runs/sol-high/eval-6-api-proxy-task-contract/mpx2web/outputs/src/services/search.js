import mpx from '@mpxjs/core'

export async function fetchTrendingKeywords () {
  const { data } = await mpx.request({
    url: '/api/search/trending'
  })
  return data
}

export function requestSuggestions (keyword) {
  return mpx.request({
    url: '/api/search/suggest',
    data: { keyword }
  })
}
