<template>
  <iframe ref="mpxIframe" class="mpx-iframe" :src="currentUrl"></iframe>
</template>

<script>
  import { getCustomEvent } from './getInnerListeners'
  import mpx from '@mpxjs/core'
  import { redirectTo, navigateTo, navigateBack, reLaunch, switchTab } from '@mpxjs/api-proxy/src/web/api/index'

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
        isPostMessage: false,
        isMpxWeb: true,
        currentUrl: ''
      }
    },
    props: {
      src: {
        type: String
      }
    },
    watch: {
      src (value) {
        let domain
        domain = value.split('/')
        if (domain[2]) {
          domain = domain[0] + '//' + domain[2]
        } else {
          domain = ''
        }
        const originValidity = this.originValidity(domain)
        if (!originValidity) {
          console.log('该域名不在域名白名单范围')
          return
        }
        this.currentUrl = value
        this.mpxIframe = this.$refs.mpxIframe
        this.mpxIframe.addEventListener('load', (event) => {
          event.currentTarget.contentWindow.postMessage({
            isMpxWebview: true
          }, '*')
        })
      }
    },
    mounted () {
      setTimeout(() => {
        if (!this.Loaded) {
          const loadData = {
            src: this.src
          }
          this.$emit(eventError, getCustomEvent(eventError, loadData, this))
        }
      }, 1000)
      window.addEventListener('message', (event) => {
        const originValidity = this.originValidity(event.origin)
        const data = event.data
        const value = data.detail && data.detail.data && data.detail.data
        if (!this.isActived || !originValidity) {
          return
        }
        let asyncCallback = null
        switch (data.type) {
          case 'postMessage':
            this.isPostMessage = true
            this.messageList.push(value.data)
            break
          case 'navigateTo':
            this.isActived = false
            asyncCallback = navigateTo(value)
            break
          case 'navigateBack':
            this.isActived = false
            asyncCallback = value ? navigateBack(value) : navigateBack()
            break
          case 'redirectTo':
            this.isActived = false
            asyncCallback = redirectTo(value)
            break
          case 'switchTab':
            this.isActived = false
            asyncCallback = switchTab(value)
            break
          case 'reLaunch':
            this.isActived = false
            asyncCallback = reLaunch(value)
            break
          case 'load':
            this.Loaded = true
            const loadData = {
              src: this.src
            }
            this.$emit(eventLoad, getCustomEvent(eventLoad, loadData, this))
            break
          case 'getLocation':
            const getLocation = mpx.config.webviewConfig.apiImplementations && mpx.config.webviewConfig.apiImplementations.getLocation
            asyncCallback = getLocation && getLocation()
            break
        }
        const hasPostMessage = this.mpxIframe.contentWindow && this.mpxIframe.contentWindow.postMessage
        asyncCallback && asyncCallback.then((res) => {
          hasPostMessage && this.mpxIframe.contentWindow.postMessage({
            type: data.type,
            callbackId: data.callbackId,
            result: res
          }, '*')
        }).catch((error) => {
          hasPostMessage && this.mpxIframe.contentWindow.postMessage({
            type: data.type,
            callbackId: data.callbackId,
            error
          }, '*')
        })
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
      this.$emit(eventMessage, getCustomEvent(eventMessage, data, this))
    },
    destroyed () {
      if (!this.isPostMessage) {
        return
      }
      let data = {
        type: 'message',
        data: this.messageList
      }
      this.$emit(eventMessage, getCustomEvent(eventMessage, data, this))
    },
    methods: {
      originValidity (host) {
        const domainWhiteLists = mpx.config.webviewConfig && mpx.config.webviewConfig.domainWhiteLists || []
        if (domainWhiteLists.length) {
          return domainWhiteLists.some((item) => {
            const origin = host.substr(host.length - item.length)
            return origin === item
          })
        } else {
          return true
        }
      }
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
