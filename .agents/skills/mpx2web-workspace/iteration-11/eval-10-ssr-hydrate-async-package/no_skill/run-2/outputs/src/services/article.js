import mpx from '@mpxjs/core'

function firstHeaderValue (value) {
  if (Array.isArray(value)) return value[0]
  return value ? String(value).split(',')[0].trim() : ''
}

function getRequestHeaders (requestContext) {
  if (!requestContext) return null
  const request = requestContext.req || requestContext.request
  return (request && request.headers) || requestContext.headers || null
}

function readHeader (headers, name) {
  if (!headers) return ''
  if (typeof headers.get === 'function') {
    return firstHeaderValue(headers.get(name))
  }
  return firstHeaderValue(headers[name] || headers[name.toLowerCase()])
}

function getServerOrigin (requestContext) {
  if (requestContext && requestContext.origin) {
    return String(requestContext.origin).replace(/\/$/, '')
  }

  const headers = getRequestHeaders(requestContext)
  const host = readHeader(headers, 'x-forwarded-host') || readHeader(headers, 'host')
  const protocol = readHeader(headers, 'x-forwarded-proto') || 'http'
  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

function requestInMiniProgram (url) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url,
      method: 'GET',
      success (response) {
        const statusCode = response.statusCode || 200
        if (statusCode >= 200 && statusCode < 300) {
          resolve(response.data)
          return
        }
        reject(new Error(`Failed to fetch article: ${statusCode}`))
      },
      fail: reject
    })
  })
}

export function fetchArticle (articleId, requestContext) {
  const articlePath = `/api/articles/${encodeURIComponent(String(articleId))}`
  const isBrowser = typeof window !== 'undefined'
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node
  const origin = isBrowser ? window.location.origin : getServerOrigin(requestContext)
  const url = `${origin.replace(/\/$/, '')}${articlePath}`

  if (!isBrowser && !isNode) {
    return requestInMiniProgram(url)
  }

  const headers = {}
  if (!isBrowser) {
    const cookie = readHeader(getRequestHeaders(requestContext), 'cookie')
    if (cookie) headers.cookie = cookie
  }

  return fetch(url, { headers }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`)
    }
    return response.json()
  })
}
