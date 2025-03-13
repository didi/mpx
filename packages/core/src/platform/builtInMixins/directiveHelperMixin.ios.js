export default function directiveHelperMixin () {
  return {
    methods: {
      __getWxKey (item, key, index) {
        if (key === 'index') {
          return index
        }
        return key === '*this' ? item : item[key]
      }
    }
  }
}
