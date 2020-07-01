# IDE 高亮配置

- [IntelliJ](single-file.md#IntelliJ)
- [vscode](single-file.md#vscode)

## IntelliJ

如果使用 IntelliJ 系 IDE 开发，可将`.mpx`后缀文件关联到`vue`模板类型，按`vue`模板解析。

![关联文件类型](../../assets/images/start-tips2.png)

但会报一个`warning`提示有重复的`script`标签，关闭该警告即可。

![关闭警告](../../assets/images/start-tips1.png)

## vscode

目前 VS Code 中实现语法高亮，有以下两种方式：

1. 使用`mpx`插件可直接实现`.mpx`文件语法高亮提示。

> 目前 mpx 插件支持的功能有限，支持语法高亮、javascript 路径跳转。其他更完善的功能正在进一步的筹备中，敬请期待！

2. `.mpx`采用类似于`.vue`的单文件语法风格，在 Visual Studio Marketplace 中获取[vue 语法高亮插件](https://marketplace.visualstudio.com/items?itemName=liuji-jim.vue)然后通过[配置 vscode 扩展语言](https://code.visualstudio.com/docs/languages/overview#_adding-a-file-extension-to-a-language)，将`.mpx`绑定到`.vue`语法的支持，获得语法高亮提示。

```json
  "files.associations": {
    "*.mpx": "vue",
  },
```

> 下方的方案为社区同学贡献，通过更多的插件使用，可能在某些功能上有所增强，但也可能遇到一些其他问题，请个人判断是否需要！

### vscode 插件

**更新**: `minapp`最新版已经支持了 mpx，所以对`minapp`的使用加以修改。

1. `minapp`此插件主要功能是给`template`加上`wxml`的`snippet`功能，只要在 template 标签中添加属性`minapp='mpx' xlang='wxml'`就可以使用。
2. `Auto CLose Tag`，这个插件主要是用来自闭合标签。
3. `wechat-snippet`，主要是使用里面的`wx.xxx`的 snippet。
4. `vetur`主要使用其高亮和格式化功能，配套安装有`prettier`，新版配置为

```json
  "vetur.format.defaultFormatterOptions": {
    "prettyhtml": {
      "printWidth": 100, // No line exceeds 100 characters
      "singleQuote": false // Prefer double quotes over single quotes
    },
    "prettier": {
      // Prettier option here
      "semi": false,
      "singleQuote": true,
      "eslintIntegration": true
    }
  },
  // 保存代码时自动格式化(格式化方式依选择而定)
  "editor.formatOnSave": true,
  // 关闭 vetur 本身的语法检查
  "vetur.validation.script": false,
  "vetur.validation.style": false,
  "vetur.validation.template": false
```

**注意**:

1. 当添加了`xlang="wxml"`后，可以使用`vetur`配置的`template`的格式化，但是会存在 vue 插件的`snippet`。
2. **在改成`xlang="wxml"`后，虽然能格式化了，但是`image`和`input`标签的格式化会出问题，所以最好在最后完成的时候，改回`lang="wxml"`关闭格式化。**
3. 注意使用 vscode 的工作区功能，最好把`vue`插件相关提示先关闭了，因为`mpx`单文件具有两个 script 标签，直接格式化会出问题，需要

```json
<script  type='application/json' lang='json'>
{
  "navigationBarTitleText": "",
  "usingComponents": {
    // 组件引入
  }
}
</script>
```

如上，在 json 的 script 中，加上`lang="json"`，这样就不会对这个标签进行格式化。

### vscode 代码片段

此功能主要是为了新建文件后快速生成一些代码，只要在设置里，选择`用户代码片段`，在选择`vue.json`，将以下代码复制进去。之后只要输出写好的`prefix`，就能自动提示生成。
如此你也可以对`javascript.json`做一些自定义的代码片段

```json
"Print to weapp page": {
 "prefix": "page",
 "body": [
   "<template minapp='mpx' xlang='wxml'>",
   "  <view class='container'>\n",
   "  </view>",
   "</template>\n",
   "<script>",
   "import { createPage } from '@mpxjs/core'",
   "  createPage({",
   "    data: {",
   "    },",
   "    onShow() {",
   "      // 所在页面显示之后就会执行一次",
   "      console.log('page show')\n",
   "    },",
   "    onHide() {",
   "      // 页面切入后台执行",
   "     console.log('page hide')\n",
   "    },",
   "    /**",
   "     * 页面相关事件处理函数--监听用户下拉动作",
   "    */",
   "    onPullDownRefresh() {},",
   "    /**",
   "     * 页面上拉触底事件的处理函数",
   "    */",
   "    onReachBottom() {},",
   "     /**",
   "       * 用户点击右上角分享",
   "     */",
   "    onShareAppMessage() {},"
   "  })",
   "</script>\n",
   "<style lang='scss'>\n",
   " .container {} ",
   "</style>",
   "<script  type='application/json' lang='json'>",
   "{",
   " \"navigationBarTitleText\": \"搜索\",",
   " \"usingComponents\": {}",
   "}",
   "</script>\n",
   "$2"
 ],
 "description": "weapp page"
},
"Print to weapp components": {
 "prefix": "components",
 "body": [
   "<template minapp='mpx' xlang='wxml'>",
   "  <view class='container'>\n",
   "  </view>",
   "</template>\n",
   "<script>",
   "import { createComponent } from '@mpxjs/core'",
   "  createComponent({",
   "    properties: {\n},",
   "    data: {",
   "    },",
   "    pageShow() {",
   "      // 所在页面显示之后就会执行一次",
   "      console.log('page show')\n",
   "    },",
   "    pageHide() {",
   "      // 页面切入后台执行",
   "     console.log('page hide')\n",
   "    },",
   "    methods: {\n",
   "    }",
   "  })",
   "</script>\n",
   "<style lang='scss'>\n",
   " .container {} ",
   "</style>",
   "<script  type='application/json' lang='json'>",
   "{ ",
   " \"component\": true",
   "}",
   "</script>\n",
   "$2"
 ],
 "description": "weapp components"
}
```
