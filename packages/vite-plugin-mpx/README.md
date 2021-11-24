# vite-plugin-mpx

[![NPM version](https://img.shields.io/npm/v/vite-plugin-mpx?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-mpx)

## Install

```bash
npm install vite-plugin-mpx -D
```

```js
// vite.config.js
import mpx from 'vite-plugin-mpx'

export default {
  plugins: [mpx()],
  resolve: {
    extensions: ['.mpx', '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  // If you used `swiper`, please include lodash/throttle
  // https://vitejs.dev/config/#optimizedeps-exclude
  optimizeDeps: {
    include: ['lodash/throttle']
  }
}
```

```js
import Vue from 'vue'
import App from './app.mpx'

new Vue({
  el: '#app',
  render: function (h) {
    return h(App)
  }
})
```

## Todo

- Sourcemap
- Packages
