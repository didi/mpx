import path from 'path'

export function evalJSONJS(
  source: string,
  filename: string,
  defs: Record<string, any>,
  fs: any,
  callback: (filename: string) => void
): Record<string, { exports: any }> {
  const defKeys = Object.keys(defs)
  const defValues = defKeys.map(key => {
    return defs[key]
  })
  const dirname = path.dirname(filename)
  // eslint-disable-next-line no-new-func
  const func = new Function(
    'module',
    'exports',
    'require',
    '__filename',
    '__dirname',
    ...defKeys,
    source
  )
  const module = {
    exports: {}
  }
  // 此处采用readFileSync+evalJSONJS而不直接使用require获取依赖内容有两个原因：
  // 1. 支持依赖中正常访问defs变量
  // 2. 避免对应的依赖文件被作为buildDependencies
  func(
    module,
    module.exports,
    function (request: string) {
      if (request.startsWith('.')) {
        request = path.join(dirname, request)
      }
      const filename = require.resolve(request)
      callback(filename)
      const source = fs.readFileSync(filename).toString('utf-8')
      return evalJSONJS(source, filename, fs, defs, callback)
    },
    filename,
    dirname,
    ...defValues
  )

  return module.exports
}
