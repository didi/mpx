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

### 使用参数校验功能

::: warning
参数校验功能会阻断xfetch发送请求,建议在测试阶段使用
:::
#### setValidator
> 配置校验规则，可以自定义，也可以根据以下规则传入一个数组

- **参数：**
    
    类型  `Array`
  
    - **test**
  
    - 类型：`{object | function}`

        - url

            类型：`string`

            详细：全路径匹配，规则可以参考[path-to-regexp](https://www.npmjs.com/package/path-to-regexp)，也可参考下面的简单示例。

            ::: warning
            如果设置了此项，则 protocol、host、port、path 规则不再生效。此项支持 path-to-regexp 匹配，protocol、host、port、path 为全等匹配。
            :::

        - protocol

            类型：`string`

            详细：待匹配的协议头

        - host

            类型：`string`

            详细：不包含端口的 host

        - port

            类型：`string`

            详细：待匹配的端口

        - path

            类型：`string`

            详细：待匹配的路径

        - params

            类型：`object`

            详细：同时匹配请求中的 `params` 和 `query`

        - data

            类型：`object`

            详细：匹配请求中的 `data`

        - header

            类型：`object`

            详细：匹配请求中的 `header`

        - method

            类型：`Method | Method[]`

            详细：匹配请求方法，不区分大小写，可以传一个方法，也可以传一个方法数组

        - custom

            类型：`function`

            详细：自定义匹配规则，参数会注入原始请求配置，结果需返回 `true` 或 `false`

            ::: warning
            如果设置了此项，匹配结果以此项为准，以上规则均不再生效。
            :::
    - **validator**
    - 类型: `{object}`
        ::: warning
        object类型有两种配置方式，第一种是区分params(一般对应get请求)和data(一般对应post/put请求)分别配置，第二种不区分两种请求配置，如果不分开配置所有参数不区分请求方式全部校验，详情请看以下示例。
        function类型为自定义配置,第一个参数是接口请求的参数以及url,请求方法等
        注：post请求会校验params和data get请求会校验params 
        :::
        - params
            类型：`object`
            详细：参数对象
            - type
            类型:  `{ Array | string }`
            详细：Array类型时支持多种类型校验，type支持的类型有基本类型、enum(枚举值)、any(默认不校验)
            - require
            类型：`boolean`
            详细：参数是否必须
            - include
            类型：`Array`
            详细： 枚举类型校验时提供
        - data
            类型：`object`
            详细：参数对象
            - type
            类型:  `{ Array | string }`
            详细：Array类型时支持多种类型校验，type支持的类型有基本类型、enum(枚举值)、any(默认不校验)
            - require
            类型：`boolean`
            详细：参数是否必须
            - include
            类型：`Array`
            详细： 枚举类型校验时提供
        - custom

            类型：`function`

            详细：自定义校验规则，会注入一个参数，是上一个匹配规则处理后的请求配置

            ::: warning
            如果设置了此项，最终代理配置将以此项为准，其他配置规则均不再生效。
            :::
            - **自定义校验规则返回数据的格式**

            ```js
            interface ValidatorRes {
              valid: boolean,
              message: Array<string>
            }
            
            const validatorCustom = (config:Config) => boolean｜ValidatorRes
            ```
    - **greedy**
        是否默认校验所有参数 没有这个属性或者属性值为true时校验所有参数，否则校验填写校验规则的参数值
#### getValidator
> 返回所有校验规则

- **示例**
```js

mpx.xfetch.setValidator([
  {
    test: {
      protocol: 'https:',// 配置协议
      host: 'xxx.com',// 配置域名
      port: '',// 配置端口
      path: '/app',// 配置路径
      method: 'GET'// 配置请求方法
    },
    validator: { // validator直接配置参数 无论是post请求还是get请求校验所有参数
      lang: {
        type: 'string'
      },
      project_id: {
        type: 'number'
      },
      phone: {
        type: ['string', 'number'] //支持多个类型
        require:true // 属性是否必须
      },
      platform_type: {
        type: 'enum',//支持枚举类型校验
        include: [1, 2, 3]
      }
    },
    greedy:false // 是否校验所有参数 不写这个属性或属性值为true校验所有参数
  },
  {
    test: {
      protocol: 'https:',
      host: 'xxxx.com',
      port: '',
      path: '/app',
      method: 'POST'
    },
    validator: { // validator配置不同请求的参数 post校验params和data get校验params
      params: {
      },
      data: {
      }
    }
  },
  {
    test: {
      custom: testCustom // 自定义匹配规则 必须是方法
    },
    validator: {
      custom: validatorCustom // 自定义校验规则 必须是方法
    }
  }
])
```

### 支持缓存请求
xfetch 支持配置 usePre=true 来缓存请求结果。设置 usePre=true 并发出首次请求后，在有效时间内的下一次请求，若参数和请求方法一致，则会直接返回上次请求的结果。参数或者请求方法不一致，以及不在有效时间内，都会重新请求并返回。默认缓存有效时间为 3000ms
```js
mpx.xfetch.fetch({
    url: 'http://xxx.com',
    method: 'POST',
    data: {
        name: 'test'
    },
    // 是否缓存请求
    usePre: true
})
```

usePre: true 是 usePre 的简写方式，用默认的 usePre.ignorePreParamKeys 和 usePre.cacheInvalidationTime，下面代码与上面的代码等价
可通过 usePre.cacheInvalidationTime 参数配置缓存有效时间, 默认值为 3000
可通过 usePre.ignorePreParamKeys 来制定参数对比时忽略的key, 默认值为 []
可通过 usePre.equals 来自定义判定命中缓存的逻辑

```js
mpx.xfetch.fetch({
    url: 'http://xxx.com',
    method: 'POST',
    data: {
        name: 'test'
    },
    usePre: {
        // 是否缓存请求
        enable: true,
        // 忽略对比的参数key，仅Object类型参数支持忽略不对比这些key的值
        ignorePreParamKeys: [],
        // 或者使用 equals，覆盖 ignorePreParamKeys
        equals(selfConfig, cacheConfig) {
          // return true 表示命中缓存
          return JSON.stringify(selfConfig.params) === JSON.stringify(cacheConfig.params)
        },
        // 缓存有效时长
        cacheInvalidationTime: 3000
    }
})
```

**更加倾向于请求实时性的预先请求**

在某些场景下（如耗时较长的页面跳转）我们期望能在提前发起请求作为缓存来加速进入页面的首次渲染，有需要能尽量保证数据的实时性时，可以传入 usePre.onUpdate 回调方法来获取最新的请求内容

usePre.onUpdate 开启后，如果本次请求命中的请求缓存，依然会再次发起请求，fetch 方法返回内容变为 Promise.race([缓存请求, 实时请求])，如果 缓存请求 先完成，则等待 实时请求 完成后，会将 实时请求 的返回内容作为 usePre.onUpdate 的参数进行回调。

```js
mpx.xfetch.fetch({
    url: 'http://xxx.com',
    method: 'POST',
    usePre: {
        // 是否缓存请求
        enable: true,
        onUpdate(response) {
            // 使用实时请求数据，这里的 response 依然会经过 interceptors.response 处理
        }
    }
}).then(response => {
    // 使用数据，可以通过 response.isCache 标识判断该结果是否来源于缓存
})
```

> tips: onUpdate 中的 response 也会经过 interceptors.response 处理，所以以上代码可能会触发两次 interceptors.response

**精细的控制缓存**

默认开启 usePre 后，如果命中缓存则会将缓存清空，否则将会覆盖缓存。但有时我们希望本次usePre仅使用/产生缓存，此时可通过 usePre.mode 参数控制缓存的生产/消费模式

usePre.mode: 可选值 'auto','consumer','producer'， 默认为'auto'

+ auto: 存在缓存时消费缓存，不存在时生产缓存
+ consumer: 仅消费缓存，不存在缓存时发起网络请求，且不产生新的缓存
+ producer: 仅生产缓存，一定会发起网络请求，并覆盖已有缓存


```js
mpx.xfetch.fetch({
    url: 'http://xxx.com',
    method: 'POST',
    data: {
        name: 'test'
    },
    usePre: {
        // 是否缓存请求
        enable: true,
        // 仅生产缓存，用于提前请求达到加速效果
        mode: 'producer'
    }
})
```