# 生命周期钩子

> 本指南假定你已经阅读了 [组合式 API 简介](composition-api-introduction.html),。如果你不熟悉组合式 API，请先阅读这部分文档。

你可以通过在生命周期钩子前面加上 “on” 来访问组件的生命周期钩子。

下表包含如何在 [setup ()](composition-api-setup.html) 内部调用生命周期钩子：

新版本的生命周期钩子我们基本上和 Vue 中的生命周期钩子对齐，下方表格我们列出微信中生命周期
和我们 **setup()** 中新的生命周期对应关系以及变化
<table>
	<tr>
	    <th>微信生命周期</th>
	    <th>setup 中生命周期</th>
	</tr >
	<tr >
	    <td>无对应</td>
	    <td>onBeforeCreate</td>
	</tr>
	<tr>
	    <td>created</td>
	    <td rowspan="2">onCreated</td>
	</tr>
	<tr>
	    <td>attached</td>
	</tr>
	<tr>
	    <td>无对应</td>
	    <td>onBeforeMount</td>
	</tr>
	<tr>
        <td>ready</td>
	    <td>onMounted</td>
	</tr>
    <tr>
	    <td>无对应</td>
	    <td>onUpdated</td>
	</tr>
    <tr>
        <td>无对应</td>
	    <td>onBeforeUnmount</td>
	</tr>
    <tr>
        <td>moved</td>
	    <td>无对应</td>
	</tr>
    <tr>
        <td>detached</td>
	    <td>onUnmounted</td>
	</tr>
    <tr>
	    <td>onLoad</td>
	    <td>onLoad</td>
	</tr>
	<tr>
	    <td>onShow</td>
	    <td>onShow</td>
	</tr>
	<tr>
	    <td>onReady</td>
        <td>onMounted</td>
	</tr>
	<tr>
	    <td>onHide</td>
	    <td>onHide</td>
	</tr>
	<tr>
        <td>onUnload</td>
	    <td>onUnmounted</td>
	</tr>
</table>

这些函数接受一个回调函数，当钩子被组件调用时将会被执行:

```js
// list.mpc
import mpx, { createComponent, onCreated } from '@mpxjs/core'

createComponent({
    setup() {
        onCreated(() => {
            console.log('组件实例创建完成')
        })
    }
})
```
