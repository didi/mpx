# 数据 Mock

## 安装

Mpx 提供了对请求响应数据进行拦截的 mock 插件，可通过如下命令进行安装：

```sh
npm i @mpxjs/mock
```

## 使用说明

新建 mock 文件目录及文件(例如：`src/mock/index.js` )：

```js
// src/mock/index.js
import mock from "@mpxjs/mock";
mock([
  {
    url: "http://api.example.com",
    rule: {
      "list|1-10": [
        {
          "id|+1": 1
        }
      ]
    }
  }
]);
```

在入口文件( `app.mpx` )中引入：

```html
<script type="text/javascript">
  import "mock/index"; // 引入mock即可
</script>
<!-- 其他配置 -->
<script type="application/json">
  {
    "pages": ["./pages/index"],
    "window": {
      "backgroundTextStyle": "light",
      "navigationBarBackgroundColor": "#fff",
      "navigationBarTitleText": "WeChat",
      "navigationBarTextStyle": "black"
    }
  }
</script>
```

> 由于 mock 为全局自动代理，执行`@mpxjs/mock`所暴露的方法之后会立即拦截小程序的原生请求，如果需要根据不同环境变量等去控制是否使用 mock 数据，可以参考如下方法：

```js
// src/mock/index.js
import mock from "@mpxjs/mock";
export default () => mock([
  {
    url: "http://api.example.com",
    rule: {
      "list|1-10": [
        {
          "id|+1": 1
        }
      ]
    }
  }
]);
```

```html
<!-- app.mpx -->
<script type="text/javascript">
  import mockSetup from "mock/index";
  // 当为开发环境时才启用mock
  process.env.NODE_ENV === "development" && mockSetup();
</script>
```

## Mock 入参

`@mpxjs/mock` 所暴露的函数仅接收一个类型为 `mockRequstList` 的参数，该类型定义如下：

```ts
type mockItem = {
  url: string,
  rule: object
}
type mockRequstList = Array<mockItem>

//示例:
let mockList: mockRequstList = [
  {
    url: "http://api.example.com", // 请求触发后匹配到该链接时其响应数据会被mock拦截
    rule: { // mock生成返回数据的规则
      'number|1-10': 1
    }
  }
]
```

## Mock 规则示例

- 基本类型数据生成

```js
import mock from "@mpxjs/mock";
mock([
  {
    url: "http://api.example.com",
    rule: {
      "number|1-10": 1, // 随机生成1-10中的任意整数
      "string|6": /[0-9a-f]/, // 值支持正则表达式,随机生成6位的16进制值
      "boolean|1": true // 随机生成一个布尔值,值为 true 的概率是 1/2
    }
  }
]);
// 请求 http://api.example.com 后返回值为:
// {
//   number: 2,
//   string: "e1e6dc",
//   boolean: false
// }
```

- 生成随机长度id自增的列表

:::details 查看示例

```js
import mock from "@mpxjs/mock";
mock([
  {
    url: "http://api.example.com",
    rule: {
      "list|2-5": [ // 生成长度范围在2-5的数组
        {
          "id|+1": 0 // id每次自增1
        }
      ]
    }
  }
]);
// 请求 http://api.example.com 后返回
// {
//   "list": [{
//     "id": 0
//   },{
//     "id": 1
//   },{
//     "id": 2
//   }]
// }
```

:::


- pick对象中的随机个值

:::details 查看示例

```js
import mock from "@mpxjs/mock";
mock([
  {
    url: "http://api.example.com",
    rule: {
      "object|2": { // 随机选取object中的两条数据作为返回
        "310000": "上海市",
        "320000": "江苏省",
        "330000": "浙江省",
        "340000": "安徽省"
      }
    }
  }
]);
// 请求 http://api.example.com 后返回
// {
//   "object": {
//     "330000": "浙江省",
//     "340000": "安徽省"
//   }
// }
```

:::

更多生成规则可查阅 [Mock官方文档-Syntax Specification](https://github.com/nuysoft/Mock/wiki/Syntax-Specification)

更多示例可查看 [Mock示例](http://mockjs.com/examples.html)

::: warning
由于小程序环境的局限性，mockjs 依赖 eval 函数实现的相关能力(如：占位符)无法正确运行
:::
