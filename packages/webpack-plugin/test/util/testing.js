const fs = require('node:fs')
const path = require('node:path')
const glob = require('glob')

function findConfigFiles(cwd) {
  const files = fs.readdirSync(cwd)

  const result = files
    .map((name) => {
      if (fs.statSync(path.join(cwd, name)).isDirectory()) {
        return undefined
      }

      if (name.startsWith('config.') && name.endsWith('.json')) {
        return name
      }

      return undefined
    })
    .filter(Boolean)

  if (!result.length) {
    result.push('config.json')
  }

  return result
}

function getOutputNameFromFilename(filename) {
  const basename = path.basename(filename)

  if (basename === 'config.json') {
    return 'output.md'
  }

  return basename.replace(/^config/, 'output').replace(/\.?json$/, '.md')
}

function isUpdateSnapshot() {
  const args = process.argv.slice(2)
  return (
    args.includes('--update-snapshot') ||
    args.includes('-u') ||
    process.env.UPDATE_SNAPSHOT
  )
}

function loadConfig(filename) {
  if (!fs.existsSync(filename)) {
    return
  }

  const content = fs.readFileSync(filename, 'utf-8')
  return JSON.parse(content)
}

function testFactor(options, callback) {
  const { cwd } = options
  const configFiles = findConfigFiles(cwd)

  return Promise.all(
    configFiles.map((item) => {
      const configPath = path.join(cwd, item)
      return callback({ config: loadConfig(configPath), configPath })
    })
  )
}

async function updateDiskSnapshot(outputPath, result, filename) {
  if (isUpdateSnapshot() || !fs.existsSync(outputPath)) {
    fs.writeFileSync(outputPath, result)
  } else {
    const content = fs.readFileSync(outputPath, 'utf-8')
    if (result !== content) {
      throw new Error(
        `Snapshot mismatch for ${filename}. (If you want to update snapshot, add "UPDATE_SNAPSHOT=1" before your command)\nExpected:\n${content}\nGot:\n${result}`
      )
    }
  }
}

module.exports.fixture = function fixture(pattern, callback, options = {}) {
  const cwd = options.cwd ?? process.cwd()

  let filenameList = []
  try {
    filenameList = glob.globSync(pattern, { cwd, absolute: true })
  } catch (e) {
    console.error(e)
  }

  const runner = options.runner ?? ((fn, ...args) => fn(...args))
  return Promise.all(filenameList.map((item) => {
    const parent = path.dirname(item)
    return testFactor({ cwd: parent }, ({ config, configPath }) => {
      return runner(
        async () => {
          const outputPath = path.join(
            parent,
            getOutputNameFromFilename(configPath)
          )

          const result = await callback({ filename: item, cwd: parent, config })

          updateDiskSnapshot(outputPath, result, item)
        },
        { cwd: parent, filename: item, config }
      )
    })
  }))
}
