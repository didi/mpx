## [InnerAudioContext](https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/InnerAudioContext.html) mpx.createInnerAudioContext(Object object)

创建内部 audio 上下文 InnerAudioContext 对象。

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.createInnerAudioContext.html)

### 参数
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 | 最低版本 | 支付宝 | web |
| --- | --- | --- | --- | --- | --- | --- | --- |
| useWebAudioImplement | boolean | false | 否 | 是否使用 WebAudio 作为底层音频驱动，默认关闭。对于短音频、播放频繁的音频建议开启此选项，开启后将获得更优的性能表现。由于开启此选项后也会带来一定的内存增长，因此对于长音频建议关闭此选项。 | 2.19.0 | **<span style="color: red;">✗</span>** | **<span style="color: red;">✗</span>** |

### 返回值
[InnerAudioContext](https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/InnerAudioContext.html)

### 注意事项
InnerAudioContext 音频资源不会自动释放，因此如果不再需要使用音频，请及时调用 InnerAudioContext.destroy() 释放资源，避免内存泄漏。
