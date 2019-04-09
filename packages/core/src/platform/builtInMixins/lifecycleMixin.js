import { is } from '../../helper/env'

export default function lifecycleMixin (type) {
  let options
  if (type === 'page') {
    options = {
      data: {
        mpxDepth: 0
      }
    }
  } else {
    options = is('ali') ? {
      props: {
        mpxDepth: 0
      }
    } : {
      properties: {
        mpxDepth: Number
      }
    }
  }
  return options
}
