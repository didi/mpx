<template>
  <iframe ref="mpxIframe" class="mpx-iframe" :src="src"></iframe>
</template>

<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import { redirectTo, navigateTo, navigateBack, reLaunch, switchTab} from '@mpxjs/api-proxy/src/web/api/index'

  const eventLoad = 'load'
  const eventError = 'error'
  const eventMessage = 'message'
  export default {
    data: function () {
      return {
        origin: '',
        messageList: [],
        Loaded: false,
        isActived: false,
        mpxIframe: null,
        isPostMessage: false
      }
    },
    props: {
      src: {
        type: String
      }
    },
    computed: {
      mainDomain () {
        let domain
        const src = location.href
        let index = src.indexOf('?')
        if (index > -1) {
          domain = src.substr(0, index)
          return domain
        }
        domain = src.split('/')
        if (domain[2]) {
          domain = domain[0] + '//' + domain[2]
        } else {
          domain = ''
        }
        return domain
      }
    },
    created () {
      setTimeout(() => {
        if (!this.Loaded) {
          const loadData = {
            src: this.src
          }
          this.$emit(eventError, getCustomEvent(eventError, loadData))
        }
      }, 1000)
    },
    mounted () {
      this.mpxIframe = this.$refs.mpxIframe
      this.mpxIframe.addEventListener('load', (event) => {
        event.currentTarget.contentWindow.postMessage(this.mainDomain, '*')
      })
      window.addEventListener('message', (event) => {
        const data = event.data
        const value = data.detail && data.detail.data && data.detail.data
        if (!this.isActived) {
          return
        }
        switch (data.type) {
          case eventMessage:
            this.isPostMessage = true
            this.messageList.push(value.data)
            break
          case 'navigateTo':
            this.isActived = false
            navigateTo(value)
            break
          case 'navigateBack':
            this.isActived = false
            value ? navigateBack(value) : navigateBack()
            break
          case 'redirectTo':
            this.isActived = false
            redirectTo(value)
            break
          case 'switchTab':
            this.isActived = false
            switchTab(value)
            break
          case 'reLaunch':
            this.isActived = false
            reLaunch(value)
            break
          case 'load':
            this.Loaded = true
            const loadData = {
              src: this.src
            }
            this.$emit(eventLoad, getCustomEvent(eventLoad, loadData))
        }
      })
    },
    activated () {
      this.isActived = true
      this.isPostMessage = false
    },
    deactivated () {
      if (!this.isPostMessage) {
        return
      }
      let data = {
        type: 'message',
        data: this.messageList
      }
      this.$emit(eventMessage, getCustomEvent(eventMessage, data))
    },
    destroyed () {
      if (!this.isPostMessage) {
        return
      }
      let data = {
        type: 'message',
        data: this.messageList
      }
      this.$emit(eventMessage, getCustomEvent(eventMessage, data))
    }
  }
</script>

<style>
  .mpx-iframe {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
</style>
