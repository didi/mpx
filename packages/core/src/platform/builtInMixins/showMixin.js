import { is } from '../../helper/env'

export default function pageStatusMixin (mixinType) {
  if (mixinType === 'component') {
    if (is('ali')) {
      return {
        props: {
          mpxShow: true
        }
      }
    } else {
      return {
        properties: {
          mpxShow: {
            type: Boolean,
            value: true
          }
        }
      }
    }
  }
}
