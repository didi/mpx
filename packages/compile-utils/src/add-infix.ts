import path from 'path'

export function addInfix (
  resourcePath: string,
  infix: string,
  extname: string | any[]
) {
  extname = extname || path.extname(resourcePath)
  return (
    resourcePath.substring(0, resourcePath.length - extname.length) +
    '.' +
    infix +
    extname
  )
}
