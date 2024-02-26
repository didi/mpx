const path = require('path')
const http = require('http')

const express = require('express')
const opener = require('opener')

const projectRoot = path.resolve(__dirname, '..')

module.exports = function startServer (reportData, {
  host,
  port,
  autoOpenBrowser = true,
  logger
} = {}) {
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

  const listen = (port, host) => {
    server.listen(port, host, (err) => {
      if (err) {
        if (port === 0) {
          logger && logger.error(err)
        } else {
          listen(0, host)
        }
      } else {
        port = server.address().port
        logger && logger.info('Mpx size report 体积平台本地服务已开启:', `http://${host}:${port}/`)
        const url = `http://${host}:${port}/`
        if (autoOpenBrowser) {
          opener(url)
        }
      }
    })
  }

  listen(port, host)
}
