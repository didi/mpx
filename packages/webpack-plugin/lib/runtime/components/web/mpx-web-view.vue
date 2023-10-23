<template>
  <iframe ref="mpxIframe" class="mpx-iframe" :src="currentUrl" :key="currentUrl"></iframe>
</template>

<script>
  import { getCustomEvent } from './getInnerListeners'
  import { redirectTo, navigateTo, navigateBack, reLaunch, switchTab } from '@mpxjs/api-proxy/src/web/api/index'

  const eventLoad = 'load'
  const eventError = 'error'
  const eventMessage = 'message'
  const mpx = global.__mpx
  export default {
    data: function () {
      return {
        origin: '',
        messageList: [],
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
      host () {
        let host = this.src.split('/')
        if (host[2]) {
          host = host[0] + '//' + host[2]
        } else {
          host = ''
        }
        return host
      },
      currentUrl () {
        if (!this.src) return ''
        const hostValidate = this.hostValidate(this.host)
        if (!hostValidate) {
          console.error('访问页面域名不符合domainWhiteLists白名单配置，请确认是否正确配置该域名白名单')
          return ''
        }
        return this.src
      },
      loadData () {
        return {
          src: this.host,
          fullUrl: this.src
        }
      }
    },
    watch: {
      currentUrl: {
        handler (value) {
          this.mpxIframe = null
          if (!value) {
            this.$emit(eventError, getCustomEvent(eventError, {
              ...this.loadData,
              errMsg: 'web-view load failed due to not in domain list'
            }, this))
          } else {
            this.$nextTick(() => {
              this.mpxIframe = this.$refs.mpxIframe
              if (this.mpxIframe) {
                this.mpxIframe.addEventListener('load', (event) => {
                  this.$emit(eventLoad, getCustomEvent(eventLoad, this.loadData, this))
                })
              }
            })
          }
        },
        immediate: true
      }
    },
    mounted () {
      window.addEventListener('message', (event) => {
        const hostValidate = this.hostValidate(event.origin)
        const hasPostMessage = this.mpxIframe.contentWindow && this.mpxIframe.contentWindow.postMessage
        const data = event.data
        const value = data.payload
        if (!this.isActived || !hostValidate) {
          return
        }
        let asyncCallback = null
        switch (data.type) {
          case 'postMessage':
            this.isPostMessage = true
            this.messageList.push(value.data)
            asyncCallback = Promise.resolve({
              errMsg: 'invokeWebappApi:ok'
            })
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
          case 'getLocation':
            const getLocation = mpx.config.webviewConfig.apiImplementations && mpx.config.webviewConfig.apiImplementations.getLocation
            if (getLocation) {
              asyncCallback = getLocation()
            } else {
              asyncCallback = Promise.reject({
                errMsg: '未在apiImplementations中配置getLocation方法'
              })
            }
            break
        }
        asyncCallback && asyncCallback.then((res) => {
          hasPostMessage && this.mpxIframe.contentWindow.postMessage({
            type: data.type,
            callbackId: data.callbackId,
            result: res
          }, event.origin)
        }).catch((error) => {
          hasPostMessage && this.mpxIframe.contentWindow.postMessage({
            type: data.type,
            callbackId: data.callbackId,
            error
          }, event.origin)
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
      hostValidate (host) {
        const hostWhitelists = mpx.config.webviewConfig && mpx.config.webviewConfig.hostWhitelists || []
        if (hostWhitelists.length) {
          return hostWhitelists.some((item) => {
            return host.endsWith(item)
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
