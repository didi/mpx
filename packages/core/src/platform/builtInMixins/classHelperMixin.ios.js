import stringify from '@mpxjs/webpack-plugin/lib/runtime/stringify.wxs'

export default function classHelperMixin () {
  return {
    methods: {
      __getClass (...args) {
        return stringify.stringifyClass(...args)
      }
    }
  }
}
