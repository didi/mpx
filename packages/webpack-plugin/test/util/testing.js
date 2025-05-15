const fs = require('node:fs/promises')
const path = require('node:path')
const { glob } = require('glob')

async function findConfigFiles(cwd) {
  const files = await fs.readdir(cwd)

  const result = (
    await Promise.all(
      files.map(async (name) => {
        if ((await fs.stat(path.join(cwd, name))).isDirectory()) {
          return
        }

        if (name.startsWith('config.') && name.endsWith('.json')) {
          return name
        }
      })
    )
  ).filter(Boolean)

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

async function loadConfig(filename) {
  if (!(await fs.stat(filename).catch(() => false))) {
    return
  }

  const content = await fs.readFile(filename, 'utf-8')
  return JSON.parse(content)
}

async function testFactor(options, callback) {
  const { cwd } = options
  const configFiles = await findConfigFiles(cwd)

  return Promise.all(
    configFiles.map(async (item) => {
      const configPath = path.join(cwd, item)
      callback({ config: await loadConfig(configPath), configPath })
    })
  )
}

async function updateDiskSnapshot(outputPath, result, filename) {
  if (isUpdateSnapshot() || !(await fs.stat(outputPath).catch(() => false))) {
    await fs.writeFile(outputPath, result)
  } else {
    const content = await fs.readFile(outputPath, 'utf-8')
    if (result !== content) {
      throw new Error(
        `Snapshot mismatch for ${filename}. (If you want to update snapshot, add "UPDATE_SNAPSHOT=1" before your command)\nExpected:\n${content}\nGot:\n${result}`
      )
    }
  }
}

module.exports.fixture = async function fixture(
  pattern,
  callback,
  options = {}
) {
  const cwd = options.cwd ?? process.cwd()
  const filenames = await glob(pattern, { cwd, absolute: true })
  return Promise.all(
    filenames.map(async (item) => {
      const parent = path.dirname(item)
      testFactor({ cwd: parent }, async ({ config, configPath }) => {
        const outputPath = path.join(
          parent,
          getOutputNameFromFilename(configPath)
        )

        const result = await callback({ filename: item, cwd: parent, config })

        await updateDiskSnapshot(outputPath, result, item)
      })
    })
  )
}
