## Config

```json
{
    "lang": "css",
    "resourcePath": "index.css",
    "defs": {
        "isMobile": true,
        "hasFeature": true
    }
}
```

## Result

```css
body { margin: 0; }

.mobile {
  display: block;
  
  .feature { color: red; }
  
}

header { color: red }
```