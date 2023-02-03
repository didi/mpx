# `@mpxjs/web-plugin`

> a plugin for mpx web compile

## Usage

```js
const mpxWebWebpackPlugin = require('@mpxjs/web-plugin/webpack');
// webpack.conf.js
module.exports = {
  plugins: [
    new mpxWebpackPlugin({
      mode: 'wx'
    })
  ],
}
```

```js
const mpxWebVitePlugin = require('@mpxjs/web-plugin/vite');
// vite.config.js
module.exports = {
  plugins: [
    new vitePlugin({
      mode: 'wx'
    })
  ],
}
```

