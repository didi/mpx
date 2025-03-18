export default function pageIdMixin (mixinType) {
  if (__mpx_mode__ === 'ali') {
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
}
