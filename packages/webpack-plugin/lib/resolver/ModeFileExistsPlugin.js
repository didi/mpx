const path = require('path')

module.exports = class ModeFileExistsPlugin {
  constructor (source, mode, target) {
    this.source = source
    this.target = target
    this.mode = mode
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    const fs = resolver.fileSystem
    const mode = this.mode
    resolver.getHook(this.source).tapAsync('FileExistsPlugin', (request, resolveContext, callback) => {
      let file = request.path
      const ext = path.extname(file)
      file = file.substring(0, file.length - ext.length) + '.' + mode + ext
      fs.stat(file, (err, stat) => {
        if (err || !stat) {
          if (resolveContext.missing) resolveContext.missing.add(file)
          if (resolveContext.log) resolveContext.log(file + ' doesn\'t exist')
          return callback()
        }
        if (!stat.isFile()) {
          if (resolveContext.missing) resolveContext.missing.add(file)
          if (resolveContext.log) resolveContext.log(file + ' is not a file')
          return callback()
        }
        if (request.query) {
          request.query += `&mode=${mode}`
        } else {
          request.query = `?mode=${mode}`
        }
        request.path = file
        resolver.doResolve(target, request, 'existing file: ' + file, resolveContext, callback)
      })
    })
  }
}
