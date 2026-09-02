import mpx from '@mpxjs/core'

export async function fetchTrendingKeywords () {
  const { data } = await mpx.request({
    url: '/api/search/trending'
  })

  return data
}

export function requestSuggestions (keyword) {
  let requestTask = null

  const promise = new Promise((resolve, reject) => {
    requestTask = mpx.request({
      url: '/api/search/suggest',
      data: { keyword },
      usePromise: false,
      success: resolve,
      fail: reject
    })
  })

  return Object.assign(promise, {
    abort () {
      if (!requestTask) return

      const task = requestTask
      requestTask = null
      task.abort()
    }
  })
}
