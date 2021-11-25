import path from 'path'

export default function normalizePath(filename: string): string {
  return filename.split(path.win32.sep).join(path.posix.sep)
}
