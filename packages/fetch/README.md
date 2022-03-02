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
