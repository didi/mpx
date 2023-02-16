import { Bridge } from '@didi/driver-biz-mp-sdk'
import { isRainbow, isWebBundle } from './env'
import { PROJECT_URL, SHARE_INFO, CAR_TYPE, MINIPROGRAM_URL } from './constants'
import { buildUrl } from './pageJump'
import mpx from '@mpxjs/core'

export const handleCornerButton = () => {
  if (isRainbow) {
    // Bridge.addCornerButton({
    //   btnName: '...'
    // }, () => {})
    const cb = () => {}
    // 司机部落Android，底层使用的是fusion，需要将传入的cb挂载在window上，才可调用成功
    window.addCornerButton = cb
    Bridge.addCornerButton({
      btnName: ' ',
      // 增加jsCallback是为了避免连续调两个bridge，都需要返回值的话，会有取错值的情况。但司机部落上的Android是必传的
      jsCallback: 'addCornerButton'
    }, cb)
  } else if (!isWebBundle) {
    // 禁止小程序右上角分享
    mpx.hideShareMenu()
    // 禁止点击小房子回到司机注册
    mpx.hideHomeButton && mpx.hideHomeButton()
  }
}

// 主会场分享
export const aggregatePageShare = (shareConfig = {}, urlParams = {}) => {
  const { content, title, carType, dchn, mini_content: miniProgramContent, mini_img_url: miniProgramImageUrl, icon_url: iconUrl } = shareConfig
  const url = (() => {
    const hash = '#/pages/index'
    const hashIndex = PROJECT_URL.indexOf(hash)
    const res = buildUrl(PROJECT_URL.slice(0, hashIndex), urlParams)
    console.log('主会场 司机部落或者车主端分享 的参数：', res, hash)
    return `${res}${hash}`
  })()
  const urlQQ = buildUrl('https://v.didi.cn/623Lxql', {
    ...urlParams
  })
  // 浏览器中
  if (!Bridge) return
  if (isRainbow) {
    Bridge.addCornerButton({
      btnName: '分享'
    }, () => {
      Bridge.initEntrance({
        buttons: [
          {
            type: 'shareDriverTribeIM', // 分享到的 app
            data: {
              title,
              url,
              content,
              icon: iconUrl
            }
          }
        ]
      })
      Bridge.invokeEntrance()
    })
  } else if (!isWebBundle) {
    // 开启小程序右上角分享
    mpx.showShareMenu()
  } else {
    // 司机端
    let buttons = [
      {
        type: 'shareWeixinAppmsg',
        data: {
          url,
          type: 'miniApp',
          title: miniProgramContent,
          icon: miniProgramImageUrl,
          ext: {
            appId: 'gh_9de0a48dbd86', // 注册小程序的原始appid
            path: `${MINIPROGRAM_URL}?dchn=${dchn}`,
            miniprogramType: '0' // TODO 0:正式版；1:开发板；2: 体验版
          }
        }
      }
    ]
    // 涅槃没有司机部落
    if (carType !== CAR_TYPE.UNIONE) {
      buttons.push({
        type: 'shareDidiTribe',
        data: {
          title,
          url,
          content,
          icon: iconUrl
        }
      })
    }
    const qqChannel = [
      {
        type: 'shareQqAppmsg',
        data: {
          title,
          url: urlQQ,
          content,
          icon: miniProgramImageUrl
        }
      },
      {
        type: 'shareQzone',
        data: {
          title,
          url: urlQQ,
          content,
          icon: miniProgramImageUrl
        }
      }]
    buttons.push(...qqChannel)
    const buttonList = { buttons }
    Bridge.addCornerButton({
      btnName: '分享'
    }, () => {
      Bridge.initEntrance(buttonList)
      Bridge.invokeEntrance()
    })
  }
}

// 跑跑预约礼司机部落或者车主端分享
export const invokeShare = (dsi, shareConfig = {}, urlParams = {}) => {
  const { content, title, carType, dchn } = shareConfig
  const url = (() => {
    const hash = '#/pages/index'
    const hashIndex = PROJECT_URL.indexOf(hash)
    // 一般情况下不可能出现没有 dsi 的情况
    if (!dsi) {
      return PROJECT_URL
    }
    const res = buildUrl(PROJECT_URL.slice(0, hashIndex), {
      dsi,
      ...urlParams
    })
    return `${res}${hash}`
  })()
  const urlQQ = buildUrl('https://v.didi.cn/623Lxql', {
    dsi,
    ...urlParams
  })
  // 司机部落直接拉起会话列表
  if (isRainbow) {
    console.log('pp司机部落 分享数据：', title, SHARE_INFO.iconUrl, content, url)
    Bridge.share({
      title,
      url,
      description: content,
      imageUrl: SHARE_INFO.iconUrl
    })
  } else {
    // 司机端
    let buttons = [
      {
        type: 'shareWeixinAppmsg',
        data: {
          url,
          type: 'miniApp',
          title: content,
          icon: SHARE_INFO.miniProgramImageUrl,
          ext: {
            appId: 'gh_9de0a48dbd86', // 注册小程序的原始appid
            path: `${MINIPROGRAM_URL}?dchn=${dchn}&dsi=${dsi}`,
            miniprogramType: '0' // TODO 0:正式版；1:开发板；2: 体验版
          }
        }
      }
    ]
    // 涅槃没有司机部落
    if (carType !== CAR_TYPE.UNIONE) {
      buttons.push({
        type: 'shareDidiTribe',
        data: {
          title,
          url: url,
          content,
          icon: SHARE_INFO.iconUrl
        }
      })
    }
    const qqChannel = [
      // {
      //   'type': 'shareWeixinTimeline', // 朋友圈
      //   'data': {
      //     'icon': 'https://dpubstatic.udache.com/static/dpubimg/aR0V7X10gp/1.png'
      //   }
      // },
      {
        type: 'shareQqAppmsg',
        data: {
          title,
          url: urlQQ,
          content,
          icon: 'https://dpubstatic.udache.com/static/dpubimg/aR0V7X10gp/1.png'
        }
      },
      {
        type: 'shareQzone',
        data: {
          title,
          url: urlQQ,
          content,
          icon: 'https://dpubstatic.udache.com/static/dpubimg/aR0V7X10gp/1.png'
        }
      }]
    buttons.push(...qqChannel)
    const buttonList = { buttons }
    Bridge.initEntrance(buttonList)
    Bridge.invokeEntrance()
    console.log('pp司机端 分享数据：', buttons)
  }
}

export const setTitle = (title) => {
  if (isWebBundle) {
    if (isRainbow) {
      Bridge.setTitle({
        navi_title: title
      })
    } else {
      // 方便浏览器调试
      Bridge && Bridge.setTitle({
        vctitle: title
      })
    }
  } else {
    mpx.setNavigationBarTitle({
      title
    })
  }
}

export const saveImage = (url, cb) => {
  // 司机端才能保存二维码，方便浏览器调试
  Bridge && Bridge.saveImage({
    type: 1,
    data: url
  }, (res) => {
    cb && cb(res)
  })
}
export function getLocationInfo () {
  const normaliseData = (info = {}) => {
    let res
    if (isRainbow) {
      const ret = info.data || {}
      const { lat, lng, city_id } = ret
      res = {
        cityId: city_id,
        lat,
        lng
      }
    } else {
      const { cityId, lat, lng } = info
      res = {
        cityId,
        lat,
        lng
      }
    }
    return res
  }
  return new Promise(resolve => {
    if (isWebBundle) {
      Bridge && Bridge.getLocationInfo({}, (res) => {
        // 司机部落和司机车主端数据格式不一样
        resolve(normaliseData(res))
      })
      // 保证浏览器测试
      if (!Bridge) {
        resolve({
          cityId: '1' // fakeCityId ，主要为了浏览器调试
        })
      }
    }
  })
}

export function getSystemInfo () {
  const normaliseData = (info = {}) => {
    console.log('getSystemInfo ', info)
    const { imei = '', model = '', appversion = '', deviceid = '' } = info
    const res = {
      deviceId: deviceid,
      appVersion: appversion,
      model,
      ddfp: imei
    }
    return res
  }
  return new Promise(resolve => {
    if (isWebBundle) {
      Bridge && Bridge.getSystemInfo({}, (res) => {
        resolve(normaliseData(res))
      })
      // 保证浏览器测试
      if (!Bridge) {
        resolve({})
      }
    }
  })
}
