export default function pageStatusMixin () {
  if (__mpx_mode__ === 'ali') {
      return {
        methods: {
          getPageId () {
            if (this.__mpxProxy.options.__type__ === 'component') {
              return this.$page.$id
            } else {
              return this.$id
            }
          }
        }
      }
  }
}
