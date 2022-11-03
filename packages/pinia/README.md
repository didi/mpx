# `mpx-pinia`

> A pinia style store for mpx framework

## Usage

# `app.mpx`

```js
import mpx from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

const pinia = createPinia()
mpx.use(pinia)
```

# `store.js`

```js
import { defineStore } from '@mpxjs/pinia'

// 选项式
export const useOptionsStore = defineStore('options', {
  state: () => {},
  getters: {},
  actions: {}
})

// 组合式
export const useSetupStore = defineStore('setup', () => {
  let storeObj = {
    name: ''
  }
  return {...storeObj} 
})
```