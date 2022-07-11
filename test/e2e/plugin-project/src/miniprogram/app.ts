import mpx, { createApp } from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, { usePromise: true })

createApp({
})
