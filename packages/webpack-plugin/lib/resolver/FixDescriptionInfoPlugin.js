const path = require('path')

module.exports = class FixDescriptionInfoPlugin {
  apply (resolver) {
    resolver.hooks.result.tap('FixDescriptionInfoPlugin', (request) => {
      const { path: resourcePath } = request
      const segments = resourcePath.split(path.sep)
      let rootIndex = -1
      for (let i = segments.length - 1; i >= 0; i--) {
        const segment = segments[i]
        if (segment === 'node_modules') {
          rootIndex = segments[i + 1].startsWith('@') ? i + 2 : i + 1
          break
        }
      }
      if (rootIndex !== -1) {
        const descriptionFileRoot = segments.slice(0, rootIndex + 1).join(path.sep)
        const descriptionFilePath = path.join(descriptionFileRoot, 'package.json')
        if (descriptionFilePath !== request.descriptionFilePath) {
          Object.assign(request, {
            descriptionFileRoot,
            descriptionFilePath
          })
        }
      }
    })
  }
}
