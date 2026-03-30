import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(CURRENT_DIR, '..')
const LOCAL_NPM_CACHE = path.join(PROJECT_ROOT, '.npm-cache')

function log(message) {
  console.log(`[midscene:prepare] ${message}`)
}

function fail(message) {
  console.error(`[midscene:prepare] ${message}`)
  process.exit(1)
}

function detectRuntimeSuffix() {
  const { platform, arch } = process

  if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64'
  if (platform === 'darwin' && arch === 'x64') return 'darwin-x64'
  if (platform === 'win32' && arch === 'arm64') return 'win32-arm64'
  if (platform === 'win32' && arch === 'x64') return 'win32-x64'
  if (platform === 'win32' && arch === 'ia32') return 'win32-ia32'

  if (platform === 'linux') {
    const isMusl = fs.existsSync('/etc/alpine-release')
    if (arch === 'arm64') return isMusl ? 'linuxmusl-arm64' : 'linux-arm64'
    if (arch === 'x64') return isMusl ? 'linuxmusl-x64' : 'linux-x64'
    if (arch === 'arm') return 'linux-arm'
    if (arch === 'ppc64') return 'linux-ppc64'
    if (arch === 's390x') return 'linux-s390x'
    if (arch === 'riscv64') return 'linux-riscv64'
  }

  return null
}

function loadSharpPackage() {
  try {
    const sharpPackagePath = require.resolve('sharp/package.json', {
      paths: [PROJECT_ROOT]
    })
    const packageJson = JSON.parse(fs.readFileSync(sharpPackagePath, 'utf8'))
    return {
      packagePath: sharpPackagePath,
      packageJson
    }
  } catch (error) {
    fail(
      `Unable to resolve "sharp" from this project. Run "npm install" in ${PROJECT_ROOT} first.`
    )
  }
}

function verifySharpRuntime() {
  try {
    require('sharp')
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`sharp runtime check failed: ${message}`)
    return false
  }
}

function installSharpRuntime(packageNames) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(
    npmCommand,
    ['install', '--no-save', '--cache', LOCAL_NPM_CACHE, ...packageNames],
    {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_cache: LOCAL_NPM_CACHE
      }
    }
  )

  if (result.status !== 0) {
    fail(
      `Failed to install Midscene image runtime packages: ${packageNames.join(', ')}.`
    )
  }
}

function main() {
  if (verifySharpRuntime()) {
    log('sharp runtime is ready.')
    return
  }

  const runtimeSuffix = detectRuntimeSuffix()
  if (!runtimeSuffix) {
    fail(`Unsupported platform/runtime combination: ${process.platform}/${process.arch}.`)
  }

  const { packageJson } = loadSharpPackage()
  const optionalDependencies = packageJson.optionalDependencies || {}
  const sharpPackageName = `@img/sharp-${runtimeSuffix}`
  const libvipsPackageName = `@img/sharp-libvips-${runtimeSuffix}`
  const sharpVersion = optionalDependencies[sharpPackageName]
  const libvipsVersion = optionalDependencies[libvipsPackageName]

  if (!sharpVersion || !libvipsVersion) {
    fail(
      `The installed sharp version ${packageJson.version} does not expose runtime packages for ${runtimeSuffix}.`
    )
  }

  log(`Installing sharp runtime for ${runtimeSuffix}.`)
  installSharpRuntime([
    `${sharpPackageName}@${sharpVersion}`,
    `${libvipsPackageName}@${libvipsVersion}`
  ])

  if (!verifySharpRuntime()) {
    fail('sharp runtime is still unavailable after installation.')
  }

  log('sharp runtime repaired successfully.')
}

main()
