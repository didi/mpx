const http = require('http')
const internalIp = require("internal-ip")
const portfinder = require("portfinder")
const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const SpecifiedPathname = '/report-page'
const FallbackPort = 3154

const prepareServerOptions = () => {
  let resolved
  // host
  const host = internalIp.v4.sync()
  // port
  portfinder.getPortPromise().then((port) => {
    resolved({
      host,
      port
    })
  }).catch(() => {
    // fallback port，应该不会走到这里
    resolved({
      host,
      port: FallbackPort
    })
  })
  return new Promise((resolve) =>{
    resolved = resolve
  })
}

class MessageServerPlugin {
  constructor (partialCompilePlugin, runtimeEntryPath) {
    this.partialCompilePlugin = partialCompilePlugin
    this.reportPageURI = undefined // 小程序侧上报未打包的页面的接口
    this.serverStarted = false // watch 模式下只需要起一次服务即可
    this.runtimeEntryPath = runtimeEntryPath
  }
  apply (compiler) {
    compiler.hooks.watchRun.tapAsync('MessageServerPlugin', (compiler, callback) => {
      if (this.serverStarted) {
        callback()
      } else {
        this.startServer(callback, compiler)
      }
    })

    // 注入运行时上报小程序页面路径的 API
    compiler.hooks.compile.tap('MessageServerPlugin', ({ normalModuleFactory }) => {
      normalModuleFactory.hooks.parser.for('javascript/auto').tap('MessageServerPlugin', (parser) => {
        parser.hooks.expression.for('COMPILE_PAGE_URI').tap('MessageServerPlugin', (expr) => {
          const dep = new ConstDependency(JSON.stringify(this.reportPageURI), expr.range)
          dep.loc = expr.loc
          parser.state.current.addPresentationalDependency(dep)
          return true
        })
      })
    })
  }
  setReportPageURI ({ host, port }) {
    this.reportPageURI = `http://${host}:${port}${SpecifiedPathname}`
  }
  startServer (callback, compiler) {
    prepareServerOptions().then((options) => {
      this.setReportPageURI(options)
      const server = http.createServer((req, res) => {
        const { pathname: userRequestPathname, searchParams } = new URL(req.url, `http://${req.headers.host}`)
        const urlSearchParams = new URLSearchParams(searchParams)
        const pagePath = urlSearchParams.get('pagePath')
        if (
          userRequestPathname === SpecifiedPathname &&
          pagePath &&
          this.partialCompilePlugin.tryCompilePage(pagePath)
        ) {
          this.makeWebpackRecompile(compiler)
          res.writeHead(200)
          res.write(JSON.stringify({
            ok: true
          }))
          res.end()
        }  else {
          res.writeHead(200, { 'Content-Type': 'text/html;charset=utf8' })
          res.end('无效访问')
        }
      })

      server.listen(options, () => {
        const { address, port } = server.address()
        console.log(`\nMessage Server running at http://${address}:${port}`)
        this.serverStarted = true
        callback()
      })
    })
  }

  makeWebpackRecompile (compiler) {
    let content = compiler.inputFileSystem.readFileSync(this.runtimeEntryPath, 'utf-8')
    content = content.replace(/^(\/\/ recompileComment: )\d+/gm, (match, p1) => {
      return `${p1}${Date.now()}`
    })
    compiler.outputFileSystem.writeFileSync(this.runtimeEntryPath, content)
  }
}

module.exports = MessageServerPlugin
