<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'

const needRefresh = ref(false)

let updateServiceWorker: (() => Promise<void>) | undefined

function onNeedRefresh() {
  needRefresh.value = true
}
async function close() {
  needRefresh.value = false
}

onBeforeMount(async () => {
  // @ts-ignore
  const { registerSW } = await import('virtual:pwa-register')
  console.log('[SW] onBeforeMount')
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh,
    onRegistered() {
      console.info('Service Worker registered')
    },
    onRegisterError(e) {
      console.error('Service Worker registration error!', e)
    },
  })
})
</script>

<template>
  <template v-if="needRefresh">
    <div
      class="pwa-toast"
      role="alertdialog"
      aria-labelledby="pwa-message"
    >
      <div id="pwa-message" class="mb-3">
        有新内容可用，请单击重新加载按钮进行更新。
      </div>
      <button
        v-if="needRefresh"
        type="button"
        class="pwa-refresh"
        @click="updateServiceWorker?.()"
      >
        重新加载
      </button>
      <button
        type="button"
        class="pwa-cancel"
        @click="close"
      >
        关闭
      </button>
    </div>
  </template>
</template>

<style>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 100;
  text-align: left;
  box-shadow: 3px 4px 5px 0 #8885;
  background-color: white;
}
.pwa-toast #pwa-message {
  margin-bottom: 8px;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
  border-radius: 4px;
  width: 80px;
}
.pwa-toast .pwa-refresh {
  color: white;
  background-image: linear-gradient(-45deg, #50be97 30%, #31bc7f 70%);
  margin-right: 10px;
}
.pwa-toast .pwa-refresh:hover {
  background-image: none; /* 新增hover颜色 */
  background-color: #45a76d;
}
.pwa-toast .pwa-cancel:hover {
  background-color: #8885;
}
</style>
