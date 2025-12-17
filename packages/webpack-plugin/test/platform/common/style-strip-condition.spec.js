const { fixture } = require('../../util/testing')
const { stripByPostcss } = require('../../../lib/style-compiler/strip-conditional-loader')
const fs = require('node:fs/promises')
const path = require('path')
function formatResult(result, config) {
  return `

## Config

\`\`\`json
${JSON.stringify(config, null, 4)}
\`\`\`

## Result

\`\`\`${config.lang}
${result}
\`\`\`

    `.trim()
}

const getLangFromExtension = filename => {
  const ext = path.extname(filename)
  switch (ext) {
    case '.styl':
      return 'stylus'
    case '.less':
      return 'less'
    case '.scss':
      return 'scss'
    default:
      return 'css'
  }
}

describe('strip-conditional-loader', () => {
  fixture(
    // './fixtures/css-condition/at-import/index.styl',
    './fixtures/css-condition/**/index.{styl,less,css,scss}',
    async ({ filename, config = {}, cwd }) => {
      const { lang = getLangFromExtension(filename), defs = {} } = config

      const content = await fs.readFile(filename, 'utf-8')

      let result
      let dependencies = []

      try {
        const output = await stripByPostcss({
          css: content,
          lang,
          resourcePath: filename,
          defs,
          resolve: (base, id, callback) => {
            callback(null, path.join(base, id))
          }
        })
        result = output.css
        dependencies = output.dependencies || []
      } catch (error) {
        console.log(error)
        result = `Error: ${error?.message.trim() || error}`
      }

      return formatResult(result, {
        lang,
        resourcePath: path.relative(cwd, filename),
        defs,
        dependencies: dependencies.map(dep => path.relative(cwd, dep))
      })
    },
    {
      cwd: __dirname,
      runner: (fn, config) => {
        const name = path.basename(config.cwd)
        test(`${name}`, async () => {
          await fn(config)
        })
      }
    }
  )
})
