# Typescript支持

## 使用方式

### .mpx中编写ts

.mpx文件中script标签声明lang为ts，在编译时会自动这部分script中的内容进行ts类型检查

```html
<script lang="ts">
// 内联编写ts代码
</script>
```

由于大部分IDE对ts的语法提示支持都只对.ts和.d.ts文件生效，上述在.mpx文件中编写ts代码虽然能在编译时进行ts类型检查，但是无法享受IDE中编写ts时的代码提示和实时报错等优秀体验，所以，我们更建议大家创建一个.ts文件进行ts代码编写，通过src的方式引入到.mpx当中

```html
<script lang="ts" src="./index.ts"></script>
```

### 为.ts文件添加loader

在webpack配置中添加如下rules以配置ts-loader

```js
{
  test: /\.ts$/,
  use: [
    'babel-loader',
    'ts-loader'
  ]
}
```

### 编写tsconfig.json文件

对相关配置不熟悉的同学可以直接采用下面配置，能够最大限度发挥mpx中强大的ts类型推导能力

```json
{
  "compilerOptions": {
    "target": "es6",
    "allowJs": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "moduleResolution": "node",
    "lib": [
      "dom",
      "es6",
      "dom.iterable"
    ]
  }
}
```

## 类型推导

Mpx基于泛型函数提供了非常方便用户使用的反向类型推导能力，简单来说，就是用户可以用非常接近于js的方式调用Mpx提供的api，

```typescript
createComponent({
  data: {
    a: 3,
    b: '2'
  },
  computed: {
    c() {
      return this.a + this.b
    }
  },
  methods: {
    addA() {
      this.a++
    }
  }
})
```


