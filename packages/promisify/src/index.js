import promisifyList from './promisify'
export default function install (DDMP) {
  Object.assign(DDMP, promisifyList)
}
