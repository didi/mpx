import mpx from '@mpxjs/core'

export async function fetchTrendingKeywords () {
  const { data } = await mpx.request({
    url: '/api/search/trending'
  })
  return data
}

export function requestSuggestions (keyword) {
  let requestTask

  const requestPromise = new Promise((resolve, reject) => {
    requestTask = mpx.request({
      url: '/api/search/suggest',
      data: { keyword },
      usePromise: false,
      success: resolve,
      fail: reject
    })
  })

  requestPromise.abort = () => {
    if (requestTask) requestTask.abort()
  }

  return requestPromise
}
