<template>
  <iframe id="mpxIframe" class="mpx-iframe" :src="src"></iframe>
</template>

<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import { redirectTo, navigateTo, navigateBack, reLaunch } from '@mpxjs/api-proxy/src/web/api/index'

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
        mpxIframe: null
      }
    },
    props: {
      src: {
        type: String
      }
    },
    computed: {
      getOrigin () {
        let domain
        let index = this.src.indexOf('?')
        if (index > -1) {
          domain = this.src.substr(0, index)
          return domain
        }
        domain = this.src.split('/')
        if (domain[2]) {
          domain = domain[0] + '//' + domain[2]
        } else {
          domain = ''
        }
        return domain
      },
      getMainOrigin () {
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
      let src = this.getOrigin
      setTimeout(() => {
        if (!this.Loaded) {
          const loadData = {
            src: this.src
          }
          this.$emit(eventError, getCustomEvent(eventError, loadData))
        }
      }, 1500)
    },
    mounted () {
      this.mpxIframe = document.querySelector('#mpxIframe')
      this.mpxIframe.addEventListener('load', (event) => {
        event.currentTarget.contentWindow.postMessage(this.getMainOrigin, '*')
      })
      window.addEventListener('message', (event) => {
        const data = event.data
        const value = data.detail && data.detail.data && data.detail.data
        if (!this.isActived) {
          return
        }
        switch (data.type) {
          case eventMessage:
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
      // this.eventHandle =
      // this.mpxIframe = document.querySelector('#mpxIframe')
      // this.mpxIframe.addEventListener('load', this.eventHandle)
    },
    destroyed () {
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
