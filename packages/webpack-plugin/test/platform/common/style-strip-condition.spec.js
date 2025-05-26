const { fixture } = require('../../util/testing')
const {
  stripByPostcss
} = require('../../../lib/style-compiler/strip-conditional-loader')
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

const getLangFromExtension = (filename) => {
  const ext = path.extname(filename)
  const lang = ext === '.styl' ? 'stylus' : 'css'
  return lang
}

// 为什么不用 jest 本身的 test
// 1. jest 的 test/it 不能异步定义
// 2. jest 使用单个 test/it 无法处理一次处理多个 fixtures 文件（postcss 引用会出问题）

describe('strip-conditional-loader', () => {
  fixture(
    './fixtures/**/index.{styl,css}',
    async ({ filename, config = {}, cwd }) => {
      const { lang = getLangFromExtension(filename), defs = {} } = config

      const content = await fs.readFile(filename, 'utf-8')

      let result

      try {
        result = await stripByPostcss({
          css: content,
          lang,
          resourcePath: filename,
          defs,
          resolve: (base, id, callback) => {
            callback(null, path.join(base, id))
          }
        })
      } catch (error) {
        result = `Error: ${error?.message ?? error.toString()}`
      }

      return formatResult(result, {
        lang,
        resourcePath: path.relative(cwd, filename),
        defs
      })
    },
    {
      cwd: __dirname,
      runner: async (fn, config) => {
        const name = path.basename(config.cwd)
        test(`${name}`, async () => {
          await fn(config)
        })
      }
    }
  )
})
