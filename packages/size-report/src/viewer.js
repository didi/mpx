const path = require('path')
const http = require('http')

const express = require('express')
const opener = require('opener')

const projectRoot = path.resolve(__dirname, '..')

async function startServer (reportData, opts) {
  const {
    port = opts.port || 9999,
    host = opts.host || '127.0.0.1',
    autoOpenBrowser = true
  } = opts || {}

  const app = express()

  app.set('views', path.join(__dirname, '../views'))
  app.set('view engine', 'ejs')
  app.use(express.static(`${projectRoot}/public`))

  app.use('/', (req, res) => {
    res.render('index.ejs', {
      mode: 'server',
      title: 'Mpx Size Report',
      sizeReportInfo: reportData
    })
  })

  const server = http.createServer(app)

  await new Promise(resolve => {
    server.listen(port, host, (err) => {
      if (!err) {
        resolve()
        setTimeout(() => {
          console.log('mpx size report 体积平台本地服务已开启:', `http://${host}:${server.address().port}/`)
        }, 0)
        const url = `http://${host}:${server.address().port}/`
        if (autoOpenBrowser) {
          opener(url)
        }
      }
    })
    server.on('error', (e) => {
      console.log('listen error', e)
      setTimeout(() => {
        server.close()
        server.listen(0, host, () => {
          resolve()
          const url = `http://${host}:${server.address().port}/`
          if (autoOpenBrowser) {
            opener(url)
          }
        })
      }, 1000)
    })
  })
}

module.exports = {
  startServer,
  start: startServer
}
