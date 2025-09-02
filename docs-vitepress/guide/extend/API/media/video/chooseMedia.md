## mpx.chooseMedia(Object object)

拍摄或从手机相册中选择图片或视频。

支持情况： 微信

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html)

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
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>count</td>
      <td>number</td>
      <td>9</td>
      <td>否</td>
      <td>最多可以选择的文件个数，基础库2.25.0前，最多可支持9个文件，2.25.0及以后最多可支持20个文件</td>
    </tr>
    <tr>
      <td>mediaType</td>
      <td>Array&lt;string&gt;</td>
      <td>['image', 'video']</td>
      <td>否</td>
      <td>文件类型</td>
    </tr>
    <tr>
      <td colspan="5">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>image</td><td>只能拍摄图片或从相册选择图片</td></tr>
            <tr><td>video</td><td>只能拍摄视频或从相册选择视频</td></tr>
            <tr><td>mix</td><td>可同时选择图片和视频</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>sourceType</td>
      <td>Array&lt;string&gt;</td>
      <td>['album', 'camera']</td>
      <td>否</td>
      <td>图片和视频选择的来源</td>
    </tr>
    <tr>
      <td colspan="5">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>album</td><td>从相册选择</td></tr>
            <tr><td>camera</td><td>使用相机拍摄</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>maxDuration</td>
      <td>number</td>
      <td>10</td>
      <td>否</td>
      <td>拍摄视频最长拍摄时间，单位秒。时间范围为 3s 至 60s 之间。不限制相册。</td>
    </tr>
    <tr>
      <td>sizeType</td>
      <td>Array&lt;string&gt;</td>
      <td>['original', 'compressed']</td>
      <td>否</td>
      <td>是否压缩所选文件，基础库2.25.0前仅对 mediaType 为 image 时有效，2.25.0及以后对全量 mediaType 有效</td>
    </tr>
    <tr>
      <td>camera</td>
      <td>string</td>
      <td>'back'</td>
      <td>否</td>
      <td>仅在 sourceType 为 camera 时生效，使用前置或后置摄像头</td>
    </tr>
    <tr>
      <td colspan="5">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>back</td><td>使用后置摄像头</td></tr>
            <tr><td>front</td><td>使用前置摄像头</td></tr>
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
    </tr>
    <tr>
      <td>fail</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用失败的回调函数</td>
    </tr>
    <tr>
      <td>complete</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
    </tr>
  </tbody>
</table>

**object.success 回调函数**

**参数**

**Object res**



<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>tempFiles</td>
      <td>Array&lt;Object&gt;</td>
      <td>本地临时文件列表</td>
    </tr>
    <tr>
      <td colspan="3">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>结构属性</th><th>类型</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>tempFilePath</td><td>string</td><td>本地临时文件路径 (本地路径)</td></tr>
            <tr><td>size</td><td>number</td><td>本地临时文件大小，单位 B</td></tr>
            <tr><td>duration</td><td>number</td><td>视频的时间长度</td></tr>
            <tr><td>height</td><td>number</td><td>视频的高度</td></tr>
            <tr><td>width</td><td>number</td><td>视频的宽度</td></tr>
            <tr><td>thumbTempFilePath</td><td>string</td><td>视频缩略图临时文件路径</td></tr>
            <tr>
              <td>fileType</td>
              <td>string</td>
              <td>文件类型</td>
            </tr>
            <tr>
              <td colspan="3">
                <table style="width:100%;margin-top:8px;">
                  <thead>
                    <tr><th>合法值</th><th>说明</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>image</td><td>图片</td></tr>
                    <tr><td>video</td><td>视频</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>type</td>
      <td>string</td>
      <td>文件类型，有效值有 image 、video、mix</td>
    </tr>
  </tbody>
</table>



### 示例代码
```js
mpx.chooseMedia({
  count: 9,
  mediaType: ['image','video'],
  sourceType: ['album', 'camera'],
  maxDuration: 30,
  camera: 'back',
  success(res) {
    console.log(res.tempFiles[0].tempFilePath)
    console.log(res.tempFiles[0].size)
  }
})
```