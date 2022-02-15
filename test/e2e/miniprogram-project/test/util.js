import path from 'path'

export function resolveDist (dir, mode) {
  return path.join(__dirname, `../dist/${mode}`, dir)
}

export function resolve (file) {
  return path.join(__dirname, '..', file || '')
}
