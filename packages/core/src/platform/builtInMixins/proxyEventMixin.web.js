import {hasOwn, setByPath} from '@mpxjs/utils'
const datasetReg = /^data-(.+)$/

function collectDataset (props) {
  const dataset = {}
  for (const key in props) {
    if (hasOwn(props, key)) {
      const matched = datasetReg.exec(key)
      if (matched) {
        dataset[matched[1]] = props[key]
      }
    }
  }
  return dataset
}

export default function proxyEventMixin () {
  return {
    beforeCreate () {
      const modelEvent = this.$attrs.mpxModelEvent
      if (modelEvent) {
        this.$on(modelEvent, (e) => {
          this.$emit('mpxModel', e)
        })
      }
    },
    methods: {
      __model (expr, $event, valuePath = ['value'], filterMethod) {
        const innerFilter = {
          trim: val => typeof val === 'string' && val.trim()
        }
        const originValue = valuePath.reduce((acc, cur) => acc[cur], $event.detail)
        const value = filterMethod ? (innerFilter[filterMethod] ? innerFilter[filterMethod](originValue) : typeof this[filterMethod] === 'function' && this[filterMethod]) : originValue
        setByPath(this, expr, value)
      },
      getOpenerEventChannel () {
        const router = global.__mpxRouter
        const eventChannel = router && router.__mpxAction && router.__mpxAction.eventChannel
        return eventChannel
      },
      __proxyEvent (e) {
        const getHandler = (eventName, props) => {
          return props && props[eventName]
        }
        const type = e.type
        const handler = getHandler(type, this.$listeners)

        if (handler && typeof handler === 'function') {
          const dataset = collectDataset(this.$attrs)
          const id = this.$attrs.id || ''
          const targetData = Object.assign({}, e.target || {}, {
            id,
            dataset
          })

          const currentTargetData = Object.assign({}, e.currentTarget || {}, {
            id,
            dataset
          })

          const eventObj = Object.assign({}, e, {
            target: targetData,
            currentTarget: currentTargetData
          })

          handler.call(this, eventObj)
        }
      }
    }
  }
}
