import stringify from './stringify'

export const genImport = (importer: string, name?: string): string => {
  return `import ${name ? `${name} from` : ''} ${stringify(importer)}`
}

export const genAsyncImport = (
  importer: string,
  name?: string,
  callback?: string
): string => {
  return `import(${importer})${name ? `.then((${name}) => ${callback})` : ''}`
}
