export default function directiveHelperMixin () {
  return {
    methods: {
      __getWxKey (item, key) {
        const value = key === '*this' ? item : item[key]
        if (typeof value === 'string' || typeof value === 'number') {
          return value
        } else {
          console.warn('The type of [wx:key]\'s value is not string or number, this only supports string or number in React Native environment!');
          return
        }
      }
    }
  }
}
