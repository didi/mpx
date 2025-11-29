const { fixture } = require('../../util/testing')
const { stripByPostcss } = require('../../../lib/style-compiler/strip-conditional-loader')
const fs = require('node:fs/promises')
const path = require('path')
const { existsSync } = require('node:fs')
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
    // './fixtures/css-condition/at-import-resolve/**/index.{styl,less,css,scss}',
    './fixtures/css-condition/**/index.{styl,less,css,scss}',
    async ({ filename, config = {}, cwd }) => {
      const { lang = getLangFromExtension(filename), defs = {}, exclude = [], legacy } = config

      const content = await fs.readFile(filename, 'utf-8')

      let result

      try {
        result = (
          await stripByPostcss({
            legacy,
            css: content,
            lang,
            resourcePath: filename,
            defs,
            root: process.cwd(),
            filter: (resourcePath) => {
              if (exclude && exclude.length && exclude.some(excludePath => resourcePath.includes(excludePath))) {
                return false
              }

              return true
            },
            langContext: {
              resolve: (base, id, callback) => {
                const filename = path.join(base, id)
                if (!existsSync(filename)) {
                  console.log('file not found', filename)
                  return callback(new Error(`File not found: ${filename}`), null)
                }

                callback(null, filename)
              }
            }
          })
        ).css
      } catch (error) {
        result = `Error: ${error?.message.trim() || error}`
        console.warn(error)
      }

      return formatResult(result, {
        lang,
        resourcePath: path.relative(cwd, filename),
        defs
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
