import SelectQuery from './SelectQuery'
import { isBrowser, throwSSRWarning } from '../../../common/js'

function createSelectorQuery () {
  if (!isBrowser) {
    throwSSRWarning('createSelectorQuery API is running in non browser environments')
    return
  }
  return new SelectQuery()
}

export {
  createSelectorQuery
}
