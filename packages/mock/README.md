# `mpx-mock`

> a http request lib for mpx framework.

## Usage

```js
import mpx from '@mpxjs/core'
import fetch from '@mpxjs/fetch'
import mock from '@mpxjs/mock'

mpx.use(fetch).use(mock)

mpx.xmock(mpx.xfetch, [{
  url,
  rule
}])
```
