export default function directiveHelperMixin () {
  return {
    methods: {
      __getWxKey (item, key) {
        return key === '*this' ? item : item[key]
      }
    }
  }
}
