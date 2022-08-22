# `mpx-web-plugin`

> a plugin for mpx compile

## Usage

```js
const mpxWebWebpackPlugin = require('@mpxjs/webpack-plugin/webpack');
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
const mpxWebVitePlugin = require('@mpxjs/webpack-plugin/vite');
// vite.config.js
module.exports = {
  plugins: [
    new vitePlugin({
      mode: 'wx'
    })
  ],
}
```

