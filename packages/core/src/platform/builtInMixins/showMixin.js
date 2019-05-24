import { is } from '../../helper/env'

export default function pageStatusMixin (mixinType) {
  if (mixinType === 'component') {
    if (is('ali')) {
      return {
        props: {
          mpxShow: true,
          mpxClass: '',
          mpxStyle: ''
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
