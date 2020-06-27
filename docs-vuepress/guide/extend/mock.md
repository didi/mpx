# 数据mock

mock数据生成规则同[mockjs](https://github.com/nuysoft/Mock/wiki)

### 使用说明

```js
import mock from '@mpxjs/mock'
// rule 为字符串或正则表达式
mock([{
  url: 'http://api.example.com',
  rule: {
		'list|1-10': [{
			'id|+1': 1
		}]
	}
}])
```
