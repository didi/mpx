export default function pageIdMixin (mixinType) {
  return {
    methods: {
      getPageId () {
        if (mixinType === 'component') {
          return this.$page.$id
        } else {
          return this.$id
        }
      }
    }
  }
}
