# `mpx-url-loader`

> solve url in mpx

## Usage

```js
// webpack.conf.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        loader: '@mpxjs/url-loader',
        options: {
          autoBase64: true,
          name: 'img/[name].[ext]'
        }
      }
    ]
  },
  // ...
}

```
