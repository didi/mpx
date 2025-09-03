## mpx.setNavigationBarColor(Object object)

设置页面导航条颜色

支持情况：微信、支付宝、RN、web、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarColor.html)

### 参数
**Object object**

<table>
	<thead>
		<tr>
			<th>属性</th>
			<th>类型</th>
			<th>默认值</th>
			<th>必填</th>
			<th>说明</th>
			<th>支付宝</th>
			<th>RN/harmony</th>
			<th>web</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>frontColor</td>
			<td>string</td>
			<td></td>
			<td>是</td>
			<td>前景颜色值，包括按钮、标题、状态栏的颜色，仅支持 #ffffff 和 #000000</td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
		</tr>
		<tr>
			<td>backgroundColor</td>
			<td>string</td>
			<td></td>
			<td>是</td>
			<td>背景颜色值，有效值为十六进制颜色</td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
		</tr>
		<tr>
			<td>animation</td>
			<td>Object</td>
			<td></td>
			<td>否</td>
			<td>动画效果</td>
			<td><span style="color: red; font-weight: bold;">✗</span></td>
			<td><span style="color: red; font-weight: bold;">✗</span></td>
			<td><span style="color: red; font-weight: bold;">✗</span></td>
		</tr>
		<tr>
			<td colspan="8">
				<table style="width:100%">
					<thead>
						<tr>
							<th>结构属性</th>
							<th>类型</th>
							<th>默认值</th>
							<th>必填</th>
							<th>说明</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>duration</td><td>number</td><td>0</td><td>否</td><td>动画变化时间，单位 ms</td></tr>
						<tr><td>timingFunc</td><td>string</td><td>'linear'</td><td>否</td><td>动画变化方式</td></tr>
						<tr><td colspan="5">
							<table style="width:100%">
								<thead>
									<tr>
										<th>合法值</th>
										<th>说明</th>
									</tr>
								</thead>
								<tbody>
									<tr><td>'linear'</td><td>动画从头到尾的速度是相同的</td></tr>
									<tr><td>'easeIn'</td><td>动画以低速开始</td></tr>
									<tr><td>'easeOut'</td><td>动画以低速结束</td></tr>
									<tr><td>'easeInOut'</td><td>动画以低速开始和结束</td></tr>
								</tbody>
							</table>
						</td></tr>
					</tbody>
				</table>
			</td>
		</tr>
		<tr>
			<td>success</td>
			<td>function</td>
			<td></td>
			<td>否</td>
			<td>接口调用成功的回调函数</td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
		</tr>
		<tr>
			<td>fail</td>
			<td>function</td>
			<td></td>
			<td>否</td>
			<td>接口调用失败的回调函数</td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
		</tr>
		<tr>
			<td>complete</td>
			<td>function</td>
			<td></td>
			<td>否</td>
			<td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
		</tr>
	</tbody>
</table>

### 示例代码

```js
mpx.setNavigationBarColor({
  frontColor: '#ffffff',
  backgroundColor: '#ff0000',
  animation: {
    duration: 400,
    timingFunc: 'easeIn'
  }
})
```
