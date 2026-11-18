# 无障碍访问{#accessibility}

使用 `aria-role` 描述元素的角色，使用 `aria-label` 提供读屏文案：

```html
<view aria-role="button" aria-label="提交" bindtap="submit">提交</view>
```

微信语法模板输出 Web 时，`aria-role` 会自动转换为浏览器标准的 `role`，`aria-label` 保持原名。两者均支持 Mustache 动态绑定：

```html
<view aria-role="{{role}}" aria-label="{{label}}"></view>
```

同时声明 `aria-role` 和 `role`（包括 `role@web`）或 `:role` 时，Web 输出优先使用显式声明的 `role` 或 `:role`，不受属性书写顺序影响。
