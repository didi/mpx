## Config

```json
{
    "lang": "css",
    "resourcePath": "index.css",
    "defs": {},
    "dependencies": [
        "nested/bar.css"
    ]
}
```

## Result

```css
@import url('https://www.baidu.com/style.css');
@import url('data://www.baidu.com/style.css');
@import url('http://www.baidu.com/style.css');

@import "nested/foo.css";

```