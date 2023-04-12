import {isObject, isFunction, error} from '@mpxjs/utils'

export default function setDataMixin() {
  return {
    methods: {
      setData(data, callback) {
        if (!isObject(data)) {
          error(`The data entry type of the setData method must be object, The type of data ${data} is incorrect`)
          return
        }
        Object.keys(data).forEach(key => {
          this[key] = data[key]
        })
        if (callback && isFunction(callback)) {
          this.$nextTick(callback.bind(this))
        }
      }
    }
  }
}

