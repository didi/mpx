import mpx from '@mpxjs/core'

export async function fetchTrendingKeywords () {
  const { data } = await mpx.request({
    url: '/api/search/trending'
  })
  return data
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
