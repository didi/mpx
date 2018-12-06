# `mpx-fetch`

> a http request lib for mpx framework.

## Usage

```js
import mpx from '@mpxjs/core'
import fetch from '@mpxjs/fetch'

mpx.use(fetch)

mpx.xfetch.fetch({
  url,
  data: {},
  header: {'content-type': 'application/x-www-form-urlencoded'},
  method: 'GET'
}).then(res => {
  console.log(res)
})
```
