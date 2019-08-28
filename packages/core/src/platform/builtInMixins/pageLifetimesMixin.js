import { is } from '../../helper/env'

export default function pageLifetimesMixin (mixinType) {
  if (is('ali') && mixinType === 'component') {
    return {
      onResize (e) {
        const pageLifetimes = this.$rawOptions.pageLifetimes
        if (pageLifetimes && typeof pageLifetimes.resize === 'function') pageLifetimes.resize.call(this, e)
      },
      watch: {
        '$page.mpxPageStatus': {
          handler (val) {
            const pageLifetimes = this.$rawOptions.pageLifetimes
            if (pageLifetimes) {
              if (val === 'show' && typeof pageLifetimes.show === 'function') pageLifetimes.show.call(this)
              if (val === 'hide' && typeof pageLifetimes.hide === 'function') pageLifetimes.hide.call(this)
            }
          },
          immediate: true
        }
      }
    }
  }
}
