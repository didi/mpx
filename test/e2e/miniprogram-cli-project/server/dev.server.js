const express = require('express')
const { getServerBundle } = require('@mpxjs/mpx-cli-service')
const fs = require('fs')
const path = require('path')

// 创建渲染器 获得一个createBundleRenderer
const { createBundleRenderer } = require('vue-server-renderer')

const axios = require('axios')

const favicon = require('serve-favicon')

const template = fs.readFileSync(path.resolve('public/index.ssr.html'), 'utf-8')

const mpxConfig = require('../mpx.config.js')

const app = express()

app.use(favicon(path.resolve('public/favicon.ico')))

const getRenderer = async () => {
  const clientPort = mpxConfig.pluginOptions?.SSR?.devClientPort || 3000
  const clientManifest = await axios.get(
    `http://localhost:${clientPort}/vue-ssr-client-manifest.json`
  )
  const serverManifest = getServerBundle()

  return {
    clientManifest: clientManifest.data,
    serverManifest: serverManifest
  }
}

const startServer = async () => {
  app.get('*', async (req, res) => {
    try {
      const { clientManifest, serverManifest } = await getRenderer()
      const renderer = createBundleRenderer(serverManifest, {
        runInNewContext: false,
        template,
        clientManifest
      })
      const context = { url: req.url }
      renderer.renderToString(context, (err, html) => {
        if (err) {
          res.status(500).end('Internal Server Error')
          return
        }
        res.end(html)
      })
    } catch (error) {
      console.log(error)
      res.status(500).send('服务器内部错误')
    }
  })

  /* 服务启动 */
  const port = 8091
  app.listen(port, () => {
    console.log(`server started at localhost:${port}`)
  })
}
startServer()
