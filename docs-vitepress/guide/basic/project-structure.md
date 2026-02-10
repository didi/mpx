# 项目结构

一个标准的 Mpx 项目由app、pages和components组成，其中app描述整体应用的行为，pages描述应用中的各个页面，components描述构成各个页面的可复用组件。

```text
├── src
│   ├── app.mpx             # 应用入口
│   ├── pages               # 页面目录
│   │   └── index.mpx
│   └── components          # 组件目录
│       └── list.mpx
```
## 页面注册

页面需要在 `app.mpx` 的 json 配置中通过 `pages` 字段进行注册。

```json
<script type="application/json">
  {
    "pages": [
      "./pages/index"
    ]
  }
</script>
```

## 组件注册

组件需要在页面或组件的 json 配置中通过 `usingComponents` 字段进行注册。

```json
<script type="application/json">
  {
    "usingComponents": {
      "list": "../components/list"
    }
  }
</script>
```
